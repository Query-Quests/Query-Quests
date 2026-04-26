/**
 * Achievement rule evaluator.
 *
 * Each rule is an async predicate `({ prisma, userId }) => boolean`.
 * `evaluateAchievements` runs the rules for codes the user hasn't earned
 * yet, inserts an `Achievement` row for any newly-met rule, and returns
 * the list of newly-earned codes (so the caller can fire a notification
 * if it wants to).
 *
 * Idempotent via the `(user_id, code)` unique constraint — concurrent
 * evaluations from the same /solve transaction can't double-insert.
 */

import { prisma as defaultPrisma } from "./prisma.js";

const RULES = {
  FIRST_10: async ({ prisma, userId }) => {
    const count = await prisma.userChallenge.count({ where: { user_id: userId } });
    return count >= 10;
  },

  HUNDRED_SOLVED: async ({ prisma, userId }) => {
    const count = await prisma.userChallenge.count({ where: { user_id: userId } });
    return count >= 100;
  },

  STREAK_7: async ({ prisma, userId }) => {
    const [solves, lessons] = await Promise.all([
      prisma.userChallenge.findMany({
        where: { user_id: userId },
        select: { created_at: true },
      }),
      prisma.lessonProgress.findMany({
        where: { user_id: userId, status: "COMPLETED" },
        select: { completed_at: true },
      }),
    ]);
    const days = new Set();
    for (const r of solves) {
      if (r.created_at) days.add(r.created_at.toISOString().slice(0, 10));
    }
    for (const r of lessons) {
      if (r.completed_at) days.add(r.completed_at.toISOString().slice(0, 10));
    }
    if (days.size === 0) return false;

    // Walk back from today (or yesterday if no activity today).
    const cursor = new Date();
    cursor.setUTCHours(0, 0, 0, 0);
    if (!days.has(toKey(cursor))) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    let streak = 0;
    while (days.has(toKey(cursor))) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return streak >= 7;
  },

  FIRST_TRY: async ({ prisma, userId }) => {
    // Earned the first time the user solves a challenge with no prior
    // failed attempts on that challenge. Cheap query: any UserChallenge
    // for whom the count of failing QueryAttempts before its created_at
    // is zero.
    const solves = await prisma.userChallenge.findMany({
      where: { user_id: userId },
      select: { challenge_id: true, created_at: true },
    });
    for (const s of solves) {
      const priorFails = await prisma.queryAttempt.count({
        where: {
          user_id: userId,
          challenge_id: s.challenge_id,
          isCorrect: false,
          timestamp: { lt: s.created_at },
        },
      });
      if (priorFails === 0) return true;
    }
    return false;
  },
};

function toKey(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * @param {{ prisma?: any, userId: string }} input
 * @returns {Promise<string[]>} newly-earned codes
 */
export async function evaluateAchievements({ prisma = defaultPrisma, userId }) {
  if (!userId) return [];

  const earned = await prisma.achievement.findMany({
    where: { user_id: userId },
    select: { code: true },
  });
  const earnedSet = new Set(earned.map((a) => a.code));

  const newlyEarned = [];
  for (const [code, rule] of Object.entries(RULES)) {
    if (earnedSet.has(code)) continue;
    let passed = false;
    try {
      passed = await rule({ prisma, userId });
    } catch (err) {
      // A broken rule must never block the parent /solve transaction.
      console.error(`achievement rule '${code}' threw:`, err.message);
      continue;
    }
    if (!passed) continue;
    try {
      await prisma.achievement.create({
        data: { user_id: userId, code },
      });
      newlyEarned.push(code);
    } catch (err) {
      // Unique-constraint race — already earned in another concurrent eval.
      if (err?.code !== "P2002") {
        console.error(`achievement insert '${code}' failed:`, err.message);
      }
    }
  }
  return newlyEarned;
}

export const ACHIEVEMENT_CODES = Object.keys(RULES);
