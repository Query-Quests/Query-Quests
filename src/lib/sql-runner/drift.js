/**
 * Expected-result drift detector.
 *
 * Pre-computed expected results live on ChallengeDataset rows and
 * are valid only as long as the underlying ChallengeDatabase schema
 * and rows haven't changed. Admins can mutate those databases out
 * of band (re-uploading, manual edits in phpMyAdmin, …), which
 * silently invalidates every dataset that references them.
 *
 * Strategy: on a configurable sample of *passing* submissions,
 * re-run the dataset's reference query and compare its hash to the
 * stored `expectedHash`. A mismatch means the expectation is stale,
 * not that the student got the wrong answer — emit a structured
 * warning so an operator can re-capture the dataset.
 *
 * Cost: one extra MySQL round-trip per N successful grades, where N
 * is the inverse of the sample rate. Default 1/50 ≈ 2% overhead on
 * the happy path.
 */

import { captureExpectedResult } from './runner.js';
import { prisma } from '../prisma.js';

// 2% of passing submissions, env-overridable. Set
// `DRIFT_SAMPLE_RATE=1` to force a check on every passing submission
// (useful during testing); `DRIFT_SAMPLE_RATE=0` disables checks
// without removing the call site.
const DEFAULT_SAMPLE_RATE = (() => {
  const raw = parseFloat(process.env.DRIFT_SAMPLE_RATE);
  if (Number.isFinite(raw) && raw >= 0 && raw <= 1) return raw;
  return 0.02;
})();

/**
 * Probabilistically check whether each dataset's stored expectedHash
 * still matches a fresh capture of the reference query. Mutates
 * nothing — drift is reported via console.error (structured) and
 * may be surfaced by log forwarders.
 *
 * @param {{
 *   challengeId: string,
 *   datasetIds: string[],
 *   sampleRate?: number,
 * }} input
 */
export async function maybeCheckDrift({
  challengeId,
  datasetIds,
  sampleRate = DEFAULT_SAMPLE_RATE,
}) {
  if (!datasetIds || datasetIds.length === 0) return;
  if (Math.random() >= sampleRate) return;

  // Pick one dataset at random rather than re-running them all — the
  // goal is sampled, low-cost telemetry, not full revalidation.
  const datasetId = datasetIds[Math.floor(Math.random() * datasetIds.length)];

  let dataset;
  try {
    dataset = await prisma.challengeDataset.findUnique({
      where: { id: datasetId },
      include: {
        database: { select: { mysqlDbName: true, status: true } },
        challenge: { select: { solution: true } },
      },
    });
  } catch (err) {
    emit({
      type: 'drift_check_error',
      challengeId,
      datasetId,
      error: err.message,
    });
    return;
  }

  if (!dataset || !dataset.database || dataset.database.status !== 'ready') {
    return;
  }
  if (!dataset.challenge?.solution) return;

  let captured;
  try {
    captured = await captureExpectedResult({
      sql: dataset.challenge.solution,
      databaseName: dataset.database.mysqlDbName,
    });
  } catch (err) {
    emit({
      type: 'drift_check_error',
      challengeId,
      datasetId,
      error: err.message,
    });
    return;
  }

  if (captured.hash !== dataset.expectedHash) {
    emit({
      type: 'dataset_drift',
      challengeId,
      datasetId,
      datasetVersion: dataset.dataset_version,
      expectedHash: dataset.expectedHash,
      actualHash: captured.hash,
      hint: 'Re-capture this dataset (PATCH /datasets/:id { recapture: true })',
    });
  }
}

function emit(event) {
  try {
    process.stderr.write(
      JSON.stringify({ ts: new Date().toISOString(), ...event }) + '\n',
    );
  } catch {
    // Drift telemetry must never throw.
  }
}
