/**
 * One-shot: simulate ~3 weeks of realistic activity for a single user
 * so their profile page (heat-map, streak, points, recent activity)
 * has something to show.
 *
 * Usage:
 *   node scripts/seed-activity-for-user.js <email>
 *   node scripts/seed-activity-for-user.js al.orellanaserrano@alum.uca.es
 *
 * Idempotent: deletes the user's existing UserChallenge / QueryAttempt /
 * LessonProgress rows first, recomputes totalScore + solvedChallenges
 * to match. Safe to re-run.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function daysAgo(n, hourOffset = 0, minuteOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + hourOffset, minuteOffset, 0, 0);
  return d;
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/seed-activity-for-user.js <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`❌ No user with email ${email}`);
    process.exit(1);
  }

  console.log(`👤 Seeding activity for ${user.name} (${user.email})`);

  // Wipe their existing activity so the seed is deterministic.
  const [delA, delB, delC] = await Promise.all([
    prisma.userChallenge.deleteMany({ where: { user_id: user.id } }),
    prisma.queryAttempt.deleteMany({ where: { user_id: user.id } }),
    prisma.lessonProgress.deleteMany({ where: { user_id: user.id } }),
  ]);
  console.log(`🧹 cleared ${delA.count} solves, ${delB.count} attempts, ${delC.count} lesson progress`);

  // Pull a pool of resources scoped to the user's institution (or unscoped).
  const [challenges, lessons] = await Promise.all([
    prisma.challenge.findMany({
      where: {
        OR: [
          { institution_id: user.institution_id },
          { institution_id: null },
        ],
      },
      orderBy: [{ level: "asc" }, { initial_score: "asc" }],
      take: 12,
    }),
    prisma.lesson.findMany({
      where: {
        OR: [
          { institution_id: user.institution_id },
          { institution_id: null },
        ],
      },
      orderBy: { order: "asc" },
      take: 8,
    }),
  ]);

  if (challenges.length === 0) {
    console.error("❌ No challenges available to seed against");
    process.exit(1);
  }

  // -- Solves: 7 challenges over the last 18 days, mostly stacked on
  //    weekday afternoons so the heat-map looks like a real student.
  const solvePlan = [
    { challenge: challenges[0],  daysAgo: 18, hour: 1 },
    { challenge: challenges[1],  daysAgo: 16, hour: 2 },
    { challenge: challenges[2],  daysAgo: 13, hour: 3 },
    { challenge: challenges[3],  daysAgo: 11, hour: 1 },
    { challenge: challenges[4],  daysAgo: 8,  hour: 5 },
    { challenge: challenges[5] || challenges[4], daysAgo: 5, hour: 2 },
    { challenge: challenges[6] || challenges[5] || challenges[4], daysAgo: 2, hour: 4 },
  ].filter((p) => p.challenge);

  let totalScore = 0;
  for (let i = 0; i < solvePlan.length; i++) {
    const { challenge, daysAgo: d, hour } = solvePlan[i];
    const ts = daysAgo(d, hour, (i * 7) % 60);
    const points = challenge.current_score || challenge.initial_score || 100;
    await prisma.userChallenge.create({
      data: {
        user_id: user.id,
        challenge_id: challenge.id,
        score: points,
        created_at: ts,
      },
    });
    totalScore += points;
  }
  console.log(`✅ ${solvePlan.length} solves, +${totalScore} pts`);

  // -- QueryAttempts: ~25 events. Some pass (matching the solves), a
  //    bunch fail with realistic feedback. Spread over the same window.
  const attempts = [];
  for (const { challenge, daysAgo: d, hour } of solvePlan) {
    // 1-3 failed attempts before the passing one, same day.
    const failsBefore = 1 + (challenge.id.charCodeAt(0) % 3);
    for (let k = 0; k < failsBefore; k++) {
      attempts.push({
        user_id: user.id,
        challenge_id: challenge.id,
        query: `SELECT * FROM ${challenge.id.slice(0, 4)}_table; -- attempt ${k + 1}`,
        isCorrect: false,
        verdict: "failed",
        rowCount: Math.floor(Math.random() * 20),
        executionTimeMs: 3 + Math.floor(Math.random() * 80),
        errorMessage: k === 0 ? "Column count mismatch: got 1, expected 3" : "Row count mismatch: got 4, expected 7",
        timestamp: daysAgo(d, hour, k * 3),
      });
    }
    // The passing attempt.
    attempts.push({
      user_id: user.id,
      challenge_id: challenge.id,
      query: challenge.solution || "SELECT * FROM employees;",
      isCorrect: true,
      verdict: "passed",
      rowCount: 5 + Math.floor(Math.random() * 10),
      executionTimeMs: 2 + Math.floor(Math.random() * 30),
      timestamp: daysAgo(d, hour, failsBefore * 3 + 5),
    });
  }
  // A couple of orphan exploration attempts (no challenge_id) — exercise the activity feed
  // edge case where students just experimented without a passing solve.
  for (const day of [14, 9, 6, 3]) {
    attempts.push({
      user_id: user.id,
      challenge_id: challenges[0].id,
      query: `SELECT COUNT(*) FROM employees WHERE department = 'Engineering';`,
      isCorrect: false,
      verdict: "failed",
      rowCount: 1,
      executionTimeMs: 4,
      errorMessage: "Column count mismatch: got 1, expected 2",
      timestamp: daysAgo(day, 0, 30),
    });
  }
  await prisma.queryAttempt.createMany({ data: attempts });
  console.log(`📝 ${attempts.length} query attempts`);

  // -- LessonProgress: a couple of completed + one in-progress lesson on
  //    different days, so the lesson side of the streak/active-day set
  //    is also populated.
  if (lessons.length > 0) {
    const lessonPlan = [
      { lesson: lessons[0], daysAgo: 19, status: "COMPLETED" },
      { lesson: lessons[1] || lessons[0], daysAgo: 12, status: "COMPLETED" },
      { lesson: lessons[2] || lessons[0], daysAgo: 4,  status: "COMPLETED" },
      { lesson: lessons[3] || lessons[0], daysAgo: 1,  status: "IN_PROGRESS" },
    ];
    for (const lp of lessonPlan) {
      const startedAt = daysAgo(lp.daysAgo, 6);
      await prisma.lessonProgress.create({
        data: {
          user_id: user.id,
          lesson_id: lp.lesson.id,
          status: lp.status,
          started_at: startedAt,
          completed_at: lp.status === "COMPLETED" ? new Date(startedAt.getTime() + 25 * 60 * 1000) : null,
          last_viewed_at: startedAt,
        },
      });
    }
    console.log(`📚 ${lessonPlan.length} lesson progress rows`);
  }

  // Make user counters consistent with what we wrote.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      totalScore,
      solvedChallenges: solvePlan.length,
    },
  });

  console.log(`\n🎉 Done. ${user.name} now has ${totalScore} pts / ${solvePlan.length} solves.`);
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
