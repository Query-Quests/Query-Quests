#!/usr/bin/env node
/**
 * Cheating-detection CLI for Query Quest.
 *
 *   Usage:
 *     node scripts/cheating-heuristics.js              # last 24 hours
 *     node scripts/cheating-heuristics.js --hours 168  # last week
 *     node scripts/cheating-heuristics.js --json
 *
 * Three heuristics, each over passing submissions in the window:
 *
 *   1. identical-query clusters
 *      Same exact SQL submitted by ≥3 different users in the window.
 *      Catches copy-paste rings.
 *
 *   2. exact-solution copies
 *      Submission text equals the challenge's `solution` field
 *      (whitespace-normalized). Not always cheating — sometimes the
 *      solution is the obvious answer — but a useful signal in
 *      combination with #1.
 *
 *   3. suspiciously-fast first-time correct
 *      A user's first attempt on a challenge they hadn't seen before
 *      passes within the first second of opening the page (proxied
 *      here as: very small executionTimeMs and ≤2 prior failed
 *      attempts on the same challenge).
 *
 * Output: a human-readable table by default, --json for piping into
 * jq / spreadsheets. Read-only — never writes to the DB.
 */

const { PrismaClient } = require('@prisma/client');

const args = parseArgs(process.argv.slice(2));
const hours = parseInt(args.hours || '24', 10);
const asJson = !!args.json;
const since = new Date(Date.now() - hours * 60 * 60 * 1000);

const prisma = new PrismaClient();

async function main() {
  const [identicalClusters, exactCopies, fastFirst] = await Promise.all([
    findIdenticalQueryClusters(),
    findExactSolutionCopies(),
    findSuspiciouslyFastFirstSolves(),
  ]);

  if (asJson) {
    process.stdout.write(
      JSON.stringify(
        { hours, since: since.toISOString(), identicalClusters, exactCopies, fastFirst },
        null,
        2,
      ) + '\n',
    );
    return;
  }

  printSection(
    `Identical-query clusters (>=3 users, last ${hours}h)`,
    identicalClusters,
    (c) => [
      `users=${c.userCount}`,
      `attempts=${c.attemptCount}`,
      `challenge=${c.challengeName}`,
      truncate(c.query, 80),
    ],
  );

  printSection(
    `Exact-solution copies (last ${hours}h)`,
    exactCopies,
    (e) => [
      `user=${e.userName}`,
      `challenge=${e.challengeName}`,
      `submitted_at=${e.timestamp.toISOString()}`,
    ],
  );

  printSection(
    `Suspiciously-fast first solves (last ${hours}h)`,
    fastFirst,
    (f) => [
      `user=${f.userName}`,
      `challenge=${f.challengeName}`,
      `prior_failed=${f.priorFailures}`,
      `exec_ms=${f.executionTimeMs}`,
    ],
  );
}

async function findIdenticalQueryClusters() {
  const rows = await prisma.queryAttempt.findMany({
    where: { isCorrect: true, timestamp: { gte: since } },
    select: {
      query: true,
      user_id: true,
      challenge_id: true,
      challenge: { select: { name: true } },
    },
  });

  const groups = new Map();
  for (const r of rows) {
    const key = `${r.challenge_id}:${normalize(r.query)}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        challengeId: r.challenge_id,
        challengeName: r.challenge?.name || '?',
        query: r.query,
        userIds: new Set(),
        attemptCount: 0,
      };
      groups.set(key, g);
    }
    g.userIds.add(r.user_id);
    g.attemptCount += 1;
  }

  return [...groups.values()]
    .filter((g) => g.userIds.size >= 3)
    .map((g) => ({
      challengeId: g.challengeId,
      challengeName: g.challengeName,
      query: g.query,
      userCount: g.userIds.size,
      attemptCount: g.attemptCount,
    }))
    .sort((a, b) => b.userCount - a.userCount);
}

async function findExactSolutionCopies() {
  const rows = await prisma.queryAttempt.findMany({
    where: { isCorrect: true, timestamp: { gte: since } },
    select: {
      query: true,
      timestamp: true,
      user: { select: { name: true } },
      challenge: { select: { name: true, solution: true } },
    },
  });
  return rows
    .filter((r) =>
      r.challenge?.solution && normalize(r.query) === normalize(r.challenge.solution),
    )
    .map((r) => ({
      userName: r.user?.name || '?',
      challengeName: r.challenge?.name || '?',
      timestamp: r.timestamp,
    }));
}

async function findSuspiciouslyFastFirstSolves() {
  const passes = await prisma.queryAttempt.findMany({
    where: { isCorrect: true, timestamp: { gte: since } },
    orderBy: { timestamp: 'asc' },
    select: {
      id: true,
      user_id: true,
      challenge_id: true,
      executionTimeMs: true,
      timestamp: true,
      user: { select: { name: true } },
      challenge: { select: { name: true } },
    },
  });

  const out = [];
  for (const p of passes) {
    if (p.executionTimeMs == null || p.executionTimeMs > 200) continue;
    const priorFailures = await prisma.queryAttempt.count({
      where: {
        user_id: p.user_id,
        challenge_id: p.challenge_id,
        isCorrect: false,
        timestamp: { lt: p.timestamp },
      },
    });
    if (priorFailures <= 2) {
      out.push({
        userName: p.user?.name || '?',
        challengeName: p.challenge?.name || '?',
        priorFailures,
        executionTimeMs: p.executionTimeMs,
      });
    }
  }
  return out;
}

function normalize(s) {
  return s.replace(/\s+/g, ' ').replace(/;\s*$/, '').trim().toLowerCase();
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function printSection(title, rows, format) {
  process.stdout.write('\n' + title + '\n' + '─'.repeat(title.length) + '\n');
  if (rows.length === 0) {
    process.stdout.write('  (none)\n');
    return;
  }
  for (const r of rows) {
    process.stdout.write('  ' + format(r).join('  ') + '\n');
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') { out.json = true; continue; }
    if (a === '--hours') { out.hours = argv[++i]; continue; }
  }
  return out;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
