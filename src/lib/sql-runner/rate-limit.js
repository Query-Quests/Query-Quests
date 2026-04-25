/**
 * Per-user rate limit on `/validate`.
 *
 * MySQL-backed (no Redis dep) — counts the user's QueryAttempt rows
 * within a sliding window and rejects if over budget. The QueryAttempt
 * table already has a (timestamp) index plus (user_id, challenge_id),
 * which is enough for this query to stay cheap.
 *
 * Defaults are sized for university workloads: 60 submissions per
 * 5-minute window means a student can iterate fast but not run a
 * brute-force enumeration. Tunable via env, with a per-call override.
 */

import { prisma } from '../prisma.js';

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_MS = 5 * 60 * 1000;

const limitFromEnv = parseInt(process.env.VALIDATE_RATE_LIMIT || '', 10);
const windowFromEnv = parseInt(process.env.VALIDATE_RATE_WINDOW_MS || '', 10);

/**
 * @param {{ userId: string, limit?: number, windowMs?: number }} input
 * @returns {Promise<{
 *   allowed: boolean,
 *   used: number,
 *   limit: number,
 *   retryAfterSeconds: number,
 * }>}
 */
export async function checkRateLimit({ userId, limit, windowMs }) {
  const effectiveLimit =
    limit ?? (Number.isFinite(limitFromEnv) && limitFromEnv > 0
      ? limitFromEnv
      : DEFAULT_LIMIT);
  const effectiveWindowMs =
    windowMs ?? (Number.isFinite(windowFromEnv) && windowFromEnv > 0
      ? windowFromEnv
      : DEFAULT_WINDOW_MS);

  const since = new Date(Date.now() - effectiveWindowMs);
  const used = await prisma.queryAttempt.count({
    where: {
      user_id: userId,
      timestamp: { gte: since },
    },
  });

  const allowed = used < effectiveLimit;
  return {
    allowed,
    used,
    limit: effectiveLimit,
    retryAfterSeconds: allowed ? 0 : Math.ceil(effectiveWindowMs / 1000),
  };
}
