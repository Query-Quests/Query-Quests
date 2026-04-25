-- Phase B schema additions: multi-dataset hidden testing.
--
-- See docs/migrations/phase-a-schema.sql for the working-flow context
-- (project uses `prisma db push`; this file is for manual review and
-- production application).
--
-- Apply order:
--   1. phase-a-schema.sql (must be applied first — Phase B does not
--      depend on Phase A schema, but we ship them sequentially).
--   2. phase-b-schema.sql (this file).
--   3. node src/scripts/backfill-datasets.js   (optional — converts
--      existing single-dataset challenges into ChallengeDataset rows).

-- ── ChallengeDataset table ──────────────────────────────────────────
CREATE TABLE `ChallengeDataset` (
  `id`              VARCHAR(191) NOT NULL,
  `challenge_id`    VARCHAR(191) NOT NULL,
  `database_id`     VARCHAR(191) NOT NULL,
  `is_public`       TINYINT(1)   NOT NULL DEFAULT 0,
  `expectedResult`  LONGTEXT     NOT NULL,
  `expectedHash`    VARCHAR(191) NOT NULL,
  `dataset_version` INT          NOT NULL DEFAULT 1,
  `display_order`   INT          NOT NULL DEFAULT 0,
  `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)  NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `ChallengeDataset_challenge_id_idx` (`challenge_id`),
  INDEX `ChallengeDataset_database_id_idx`  (`database_id`),

  CONSTRAINT `ChallengeDataset_challenge_id_fkey`
    FOREIGN KEY (`challenge_id`) REFERENCES `Challenge`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `ChallengeDataset_database_id_fkey`
    FOREIGN KEY (`database_id`) REFERENCES `ChallengeDatabase`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci;
