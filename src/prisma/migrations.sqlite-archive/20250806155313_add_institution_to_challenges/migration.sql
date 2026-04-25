-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Challenge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "statement" TEXT NOT NULL,
    "help" TEXT,
    "solution" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "score_base" INTEGER NOT NULL,
    "score_min" INTEGER NOT NULL,
    "solves" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "institution_id" INTEGER,
    CONSTRAINT "Challenge_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Challenge" ("created_at", "help", "id", "level", "score", "score_base", "score_min", "solution", "solves", "statement", "updated_at") SELECT "created_at", "help", "id", "level", "score", "score_base", "score_min", "solution", "solves", "statement", "updated_at" FROM "Challenge";
DROP TABLE "Challenge";
ALTER TABLE "new_Challenge" RENAME TO "Challenge";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
