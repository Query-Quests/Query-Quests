/**
 * Structured grading logger.
 *
 * Emits a single JSON-line per grade decision so production logs are
 * grep-able and forwardable to any log sink (Railway plain logs,
 * Logtail, Datadog, …) without an additional pipeline.
 *
 * The schema is deliberately small and stable — adding fields is
 * fine; removing or renaming requires a coordinated change with any
 * downstream parser.
 *
 * @typedef {Object} GradeEvent
 * @property {string}   type             always 'grade'
 * @property {string}   ts               ISO 8601 timestamp
 * @property {string}   challengeId
 * @property {string}   userId
 * @property {string}   verdict          passed|failed|errored|timeout
 * @property {boolean}  isCorrect
 * @property {number}   executionTimeMs
 * @property {number}   [rowCount]
 * @property {string}   [errorCode]
 * @property {string[]} [datasetIds]     multi-dataset path only
 * @property {boolean}  [hadHiddenFailure]
 * @property {string}   queryHash        sha256(sql) prefix; never the raw SQL
 */

import crypto from 'crypto';

let sink = (line) => process.stdout.write(line + '\n');

/**
 * Test-only sink override. Pass a function `(line: string) => void` to
 * capture; pass `null`/`undefined` to restore the default.
 */
export function _setSinkForTests(fn) {
  sink = fn || ((line) => process.stdout.write(line + '\n'));
}

/**
 * @param {Omit<GradeEvent, 'type' | 'ts' | 'queryHash'> & { sql: string }} input
 */
export function logGrade(input) {
  const { sql, ...rest } = input;
  /** @type {GradeEvent} */
  const event = {
    type: 'grade',
    ts: new Date().toISOString(),
    queryHash: hashSql(sql),
    ...rest,
  };
  try {
    sink(JSON.stringify(event));
  } catch {
    // Logging must never break grading.
  }
}

function hashSql(sql) {
  if (typeof sql !== 'string') return '';
  return crypto.createHash('sha256').update(sql).digest('hex').slice(0, 16);
}
