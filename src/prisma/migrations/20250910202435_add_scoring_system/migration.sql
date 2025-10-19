/*
  Warnings:

  - You are about to drop the column `score` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `score_base` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `score_min` on the `Challenge` table. All the data in the column will be lost.
  - You are about to drop the column `trials` on the `UserChallenge` table. All the data in the column will be lost.
  - Added the required column `current_score` to the `Challenge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `initial_score` to the `Challenge` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "statement" TEXT NOT NULL,
    "help" TEXT,
    "solution" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "initial_score" INTEGER NOT NULL,
    "current_score" INTEGER NOT NULL,
    "solves" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "institution_id" TEXT,
    CONSTRAINT "Challenge_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Challenge" ("created_at", "help", "id", "institution_id", "level", "solution", "solves", "statement", "updated_at") SELECT "created_at", "help", "id", "institution_id", "level", "solution", "solves", "statement", "updated_at" FROM "Challenge";
DROP TABLE "Challenge";
ALTER TABLE "new_Challenge" RENAME TO "Challenge";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "password" TEXT NOT NULL,
    "isTeacher" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "solvedChallenges" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "last_login" DATETIME,
    "institution_id" TEXT,
    CONSTRAINT "User_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("email", "id", "institution_id", "isAdmin", "isEmailVerified", "isTeacher", "last_login", "name", "password", "solvedChallenges", "verificationToken") SELECT "email", "id", "institution_id", "isAdmin", "isEmailVerified", "isTeacher", "last_login", "name", "password", "solvedChallenges", "verificationToken" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_UserChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "score" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    CONSTRAINT "UserChallenge_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "Challenge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserChallenge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserChallenge" ("challenge_id", "created_at", "id", "score", "user_id") SELECT "challenge_id", "created_at", "id", "score", "user_id" FROM "UserChallenge";
DROP TABLE "UserChallenge";
ALTER TABLE "new_UserChallenge" RENAME TO "UserChallenge";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
