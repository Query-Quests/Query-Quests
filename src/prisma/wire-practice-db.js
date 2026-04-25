/**
 * One-shot script to wire the existing `practice` MySQL database
 * (already populated on mysql-challenges) into the app.
 *
 * Steps:
 *   1. Upsert a ChallengeDatabase row with mysqlDbName='practice'.
 *   2. For every Challenge with database_id=NULL, run its `solution`
 *      query against `practice` to capture deterministic
 *      expectedResult JSON, then link database_id + expectedResult.
 *   3. Create a single public ChallengeDataset row per challenge so
 *      the Phase B validator can fan out (otherwise the legacy path
 *      handles it; either is fine).
 *
 * Idempotent — safe to re-run.
 */

const { PrismaClient } = require("@prisma/client");
const mysql = require("mysql2/promise");
const crypto = require("crypto");

const prisma = new PrismaClient();

const CHALLENGE_DB_NAME = "practice";

async function getChallengePool() {
  const url = new URL(
    process.env.CHALLENGE_DB_URL ||
      `mysql://root:rootpassword@127.0.0.1:3306/${CHALLENGE_DB_NAME}`,
  );
  return mysql.createPool({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: CHALLENGE_DB_NAME,
    connectionLimit: 4,
    multipleStatements: false,
  });
}

function hashRows(rows) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(rows))
    .digest("hex");
}

async function ensureChallengeDatabase() {
  const existing = await prisma.challengeDatabase.findUnique({
    where: { mysqlDbName: CHALLENGE_DB_NAME },
  });
  if (existing) {
    console.log(`✓ ChallengeDatabase already exists: ${existing.id}`);
    return existing;
  }

  const creator =
    (await prisma.user.findFirst({ where: { isAdmin: true } })) ||
    (await prisma.user.findFirst({ where: { isTeacher: true } }));
  if (!creator) throw new Error("Need at least one admin/teacher to own the database row");

  const created = await prisma.challengeDatabase.create({
    data: {
      name: "Practice (employees / orders)",
      description:
        "Sandbox database for SQL practice. Includes departments, employees, products, and orders.",
      filename: "practice.sql",
      filepath: "/data/practice.sql",
      filesize: 0,
      mysqlDbName: CHALLENGE_DB_NAME,
      tableCount: 4,
      rowCount: 35,
      schemaPreview: [
        "departments(id, name, budget, manager_id, created_at)",
        "employees(id, first_name, last_name, email, department, salary, hire_date, created_at)",
        "products(id, name, category, price, stock_quantity, created_at)",
        "orders(id, customer_name, product_id, quantity, total_amount, order_date, status, created_at)",
      ].join("\n"),
      status: "ready",
      creator_id: creator.id,
    },
  });
  console.log(`+ Created ChallengeDatabase: ${created.id}`);
  return created;
}

async function captureExpected(pool, sql) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`USE \`${CHALLENGE_DB_NAME}\``);
    const [rows] = await conn.query(sql);
    return Array.isArray(rows) ? rows : [];
  } finally {
    conn.release();
  }
}

async function wireChallenges(challengeDb, pool) {
  const challenges = await prisma.challenge.findMany({
    orderBy: { level: "asc" },
  });

  console.log(`Found ${challenges.length} challenges.`);

  for (const c of challenges) {
    let rows;
    try {
      rows = await captureExpected(pool, c.solution);
    } catch (e) {
      console.log(`! "${c.name}" — failed to run solution: ${e.message}`);
      continue;
    }
    const expectedJson = JSON.stringify(rows);
    const expectedHash = hashRows(rows);

    await prisma.challenge.update({
      where: { id: c.id },
      data: {
        database_id: challengeDb.id,
        expectedResult: expectedJson,
      },
    });

    // Upsert dataset by (challenge, database) so re-runs after data
    // changes refresh the captured rows + hash.
    const existingDs = await prisma.challengeDataset.findFirst({
      where: { challenge_id: c.id, database_id: challengeDb.id },
    });
    if (existingDs) {
      await prisma.challengeDataset.update({
        where: { id: existingDs.id },
        data: { expectedResult: expectedJson, expectedHash },
      });
    } else {
      await prisma.challengeDataset.create({
        data: {
          challenge_id: c.id,
          database_id: challengeDb.id,
          is_public: true,
          expectedResult: expectedJson,
          expectedHash,
          dataset_version: 1,
          display_order: 0,
        },
      });
    }
    console.log(`+ wired "${c.name}" — ${rows.length} rows captured`);
  }
}

async function main() {
  console.log("🔌 Wiring practice DB → challenges …");
  const challengeDb = await ensureChallengeDatabase();
  const pool = await getChallengePool();
  try {
    await wireChallenges(challengeDb, pool);
  } finally {
    await pool.end();
  }
  console.log("✅ Done.");
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
