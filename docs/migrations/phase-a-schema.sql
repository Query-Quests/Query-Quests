-- Phase A schema additions for Query Quest's SQL validator rewrite.
--
-- Why this file exists:
--   The repo's `src/prisma/migrations/` folder is from when the project
--   targeted SQLite (see `migration_lock.toml: provider = "sqlite"`),
--   while `schema.prisma` now targets MySQL (post commit 2949df8 —
--   "Switch to Railway MySQL"). The existing migration history is
--   therefore unrunnable against MySQL, and the project's effective
--   workflow is `prisma db push`.
--
-- For local dev:
--   The simplest path is `cd src && npx prisma db push`. Prisma will
--   diff the updated `schema.prisma` against your MySQL DB and apply
--   these same changes (the column types may differ slightly — Prisma
--   uses VARCHAR(191) by default for String fields).
--
-- For production (Railway):
--   Apply this file directly against the `mysql-app` database, OR run
--   `npx prisma db push --skip-generate --accept-data-loss=false`.
--   Take a backup first.
--
-- Idempotency:
--   The statements use IF NOT EXISTS / IF EXISTS where MySQL supports
--   it. ADD COLUMN does NOT support IF NOT EXISTS in MySQL 8 (it does
--   in 8.0.29+ via dynamic SQL); the safest pattern in 8.0 is to
--   wrap each ADD in a stored procedure or to inspect
--   information_schema first. For brevity, this file assumes a clean
--   apply on a database that does not yet have these columns.

-- ── Challenge: per-challenge comparator config + future-proofing ─────
ALTER TABLE `Challenge`
  ADD COLUMN `comparator` JSON NULL,
  ADD COLUMN `guard_mode` VARCHAR(191) NOT NULL DEFAULT 'graded';

-- ── QueryAttempt: richer verdict + composite index for solve hot path ─
ALTER TABLE `QueryAttempt`
  ADD COLUMN `verdict` VARCHAR(191) NOT NULL DEFAULT 'failed';

CREATE INDEX `QueryAttempt_challenge_id_isCorrect_timestamp_idx`
  ON `QueryAttempt` (`challenge_id`, `isCorrect`, `timestamp`);

-- ── Backfill ────────────────────────────────────────────────────────
-- Existing QueryAttempt rows get verdict='passed' or 'failed' based on
-- the legacy isCorrect flag. New rows get the full vocabulary
-- (passed | failed | errored | timeout) from the runner.
UPDATE `QueryAttempt`
SET `verdict` = CASE WHEN `isCorrect` = 1 THEN 'passed' ELSE 'failed' END;
