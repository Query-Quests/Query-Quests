/*
  Warnings:

  - Added the required column `name` to the `Challenge` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
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
INSERT INTO "new_Challenge" ("created_at", "current_score", "help", "id", "initial_score", "institution_id", "level", "name", "solution", "solves", "statement", "updated_at") SELECT "created_at", "current_score", "help", "id", "initial_score", "institution_id", "level", CASE 
  WHEN "statement" LIKE 'Write a function to reverse a string%' THEN 'String Reversal Challenge'
  WHEN "statement" LIKE 'Implement a binary search algorithm%' THEN 'Binary Search Algorithm'
  WHEN "statement" LIKE 'Create a REST API endpoint%' THEN 'REST API Authentication'
  WHEN "statement" LIKE 'Design a database schema%' THEN 'Database Schema Design'
  WHEN "statement" LIKE 'Implement a sorting algorithm%' THEN 'Quicksort Implementation'
  ELSE SUBSTR("statement", 1, 50) || '...'
END as "name", "solution", "solves", "statement", "updated_at" FROM "Challenge";

DROP TABLE "Challenge";
ALTER TABLE "new_Challenge" RENAME TO "Challenge";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
