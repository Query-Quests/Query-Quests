/**
 * Run the achievement evaluator against every user once. Idempotent:
 * users who already have a row for a given code are skipped via the
 * unique constraint.
 */
import { PrismaClient } from "@prisma/client";
import { evaluateAchievements } from "../lib/achievements-rules.js";

const prisma = new PrismaClient();

const users = await prisma.user.findMany({ select: { id: true, name: true } });
console.log(`Evaluating achievements for ${users.length} users…`);

let totalNew = 0;
for (const u of users) {
  const newly = await evaluateAchievements({ prisma, userId: u.id });
  if (newly.length > 0) {
    console.log(`  + ${u.name}: ${newly.join(", ")}`);
    totalNew += newly.length;
  }
}
console.log(`✅ ${totalNew} new Achievement rows`);
await prisma.$disconnect();
