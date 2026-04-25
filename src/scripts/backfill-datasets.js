#!/usr/bin/env node
/**
 * Backfill ChallengeDataset rows from the legacy single-dataset shape.
 *
 *   Usage:  node scripts/backfill-datasets.js [--dry]
 *
 * For every Challenge with a `database_id` and a non-empty
 * `expectedResult`, insert one ChallengeDataset row marked
 * `is_public = true`. The runner falls back to the legacy path when no
 * datasets exist, so this backfill is non-blocking — but it is
 * required before Phase B's hidden-test anti-cheating is meaningful.
 *
 * Idempotent: skips challenges that already have any ChallengeDataset
 * rows.
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry');

async function main() {
  const challenges = await prisma.challenge.findMany({
    where: {
      database_id: { not: null },
      expectedResult: { not: null },
    },
    include: {
      datasets: { select: { id: true } },
    },
  });

  let inserted = 0;
  let skipped = 0;

  for (const c of challenges) {
    if (c.datasets.length > 0) {
      skipped++;
      continue;
    }
    const expectedHash = sha256(c.expectedResult);

    if (dryRun) {
      console.log(
        `would insert ChallengeDataset for challenge ${c.id} (${c.name})`,
      );
      inserted++;
      continue;
    }

    await prisma.challengeDataset.create({
      data: {
        challenge_id: c.id,
        database_id: c.database_id,
        is_public: true,
        expectedResult: c.expectedResult,
        expectedHash,
        dataset_version: 1,
        display_order: 0,
      },
    });
    inserted++;
  }

  console.log(
    `Backfill ${dryRun ? '(dry run) ' : ''}done. ` +
      `inserted=${inserted} skipped=${skipped} total=${challenges.length}`,
  );
}

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
