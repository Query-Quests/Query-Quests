-- Phase D — runtime-configurable application settings
--
-- Adds a small key/value table used to persist admin-configurable settings
-- such as the Anthropic API key, so they no longer require a redeploy
-- to change. Pure additive change, no data migration required.

CREATE TABLE IF NOT EXISTS `AppSetting` (
  `key`        VARCHAR(191) NOT NULL,
  `value`      TEXT         NOT NULL,
  `updated_at` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
