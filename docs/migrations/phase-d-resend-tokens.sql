-- Phase D — Resend integration: email verification expiry + password reset tokens
--
-- Adds expiry tracking for email verification tokens and a password reset
-- token pair to the User table. Verification tokens expire after 24h, reset
-- tokens after 1h (enforced in application code).
--
-- Apply with:
--   mysql -u <user> -p <db> < docs/migrations/phase-d-resend-tokens.sql

ALTER TABLE `User`
  ADD COLUMN `verificationTokenExpiresAt` DATETIME(3) NULL,
  ADD COLUMN `resetToken`                 VARCHAR(191) NULL,
  ADD COLUMN `resetTokenExpiresAt`        DATETIME(3) NULL;

-- Make the existing verificationToken unique (was just String? before) and
-- add a unique index on resetToken so lookups are O(1) and tokens can't
-- collide across users.
ALTER TABLE `User`
  ADD UNIQUE INDEX `User_verificationToken_key` (`verificationToken`),
  ADD UNIQUE INDEX `User_resetToken_key`         (`resetToken`);
