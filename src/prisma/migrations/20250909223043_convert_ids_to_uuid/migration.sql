/*
  Warnings:

  - The primary key for the `Challenge` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ContactRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Institution` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Lesson` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Log` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `alias` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `User` table. All the data in the column will be lost.
  - The primary key for the `UserChallenge` table will be changed. If it partially fails, the table could be left without primary key constraint.

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
    "score" INTEGER NOT NULL,
    "score_base" INTEGER NOT NULL,
    "score_min" INTEGER NOT NULL,
    "solves" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "institution_id" TEXT,
    CONSTRAINT "Challenge_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Challenge" ("created_at", "help", "id", "institution_id", "level", "score", "score_base", "score_min", "solution", "solves", "statement", "updated_at") SELECT "created_at", "help", "id", "institution_id", "level", "score", "score_base", "score_min", "solution", "solves", "statement", "updated_at" FROM "Challenge";
DROP TABLE "Challenge";
ALTER TABLE "new_Challenge" RENAME TO "Challenge";
CREATE TABLE "new_ContactRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "website" TEXT,
    "studentEmailSuffix" TEXT NOT NULL,
    "teacherEmailSuffix" TEXT NOT NULL,
    "message" TEXT,
    "estimatedStudents" INTEGER,
    "estimatedTeachers" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_ContactRequest" ("contactEmail", "contactName", "contactPhone", "created_at", "estimatedStudents", "estimatedTeachers", "id", "institutionName", "message", "status", "studentEmailSuffix", "teacherEmailSuffix", "updated_at", "website") SELECT "contactEmail", "contactName", "contactPhone", "created_at", "estimatedStudents", "estimatedTeachers", "id", "institutionName", "message", "status", "studentEmailSuffix", "teacherEmailSuffix", "updated_at", "website" FROM "ContactRequest";
DROP TABLE "ContactRequest";
ALTER TABLE "new_ContactRequest" RENAME TO "ContactRequest";
CREATE TABLE "new_Institution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "studentEmailSuffix" TEXT,
    "teacherEmailSuffix" TEXT
);
INSERT INTO "new_Institution" ("address", "id", "name", "studentEmailSuffix", "teacherEmailSuffix") SELECT "address", "id", "name", "studentEmailSuffix", "teacherEmailSuffix" FROM "Institution";
DROP TABLE "Institution";
ALTER TABLE "new_Institution" RENAME TO "Institution";
CREATE TABLE "new_Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "institution_id" TEXT,
    "creator_id" TEXT NOT NULL,
    CONSTRAINT "Lesson_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lesson_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Lesson" ("content", "created_at", "creator_id", "description", "id", "institution_id", "isPublished", "order", "title", "updated_at") SELECT "content", "created_at", "creator_id", "description", "id", "institution_id", "isPublished", "order", "title", "updated_at" FROM "Lesson";
DROP TABLE "Lesson";
ALTER TABLE "new_Lesson" RENAME TO "Lesson";
CREATE TABLE "new_Log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uuidTrial" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "response" TEXT,
    "error_code" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "challenge_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    CONSTRAINT "Log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Log_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "Challenge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Log" ("challenge_id", "error_code", "id", "isCompleted", "request", "response", "timestamp", "user_id", "uuidTrial") SELECT "challenge_id", "error_code", "id", "isCompleted", "request", "response", "timestamp", "user_id", "uuidTrial" FROM "Log";
DROP TABLE "Log";
ALTER TABLE "new_Log" RENAME TO "Log";
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
    "trials" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    CONSTRAINT "UserChallenge_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "Challenge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserChallenge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserChallenge" ("challenge_id", "created_at", "id", "score", "trials", "user_id") SELECT "challenge_id", "created_at", "id", "score", "trials", "user_id" FROM "UserChallenge";
DROP TABLE "UserChallenge";
ALTER TABLE "new_UserChallenge" RENAME TO "UserChallenge";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
