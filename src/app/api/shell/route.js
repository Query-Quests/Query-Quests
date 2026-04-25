import { NextResponse } from "next/server";
import { getStudentPool } from "@/lib/mysql-connection";
import { inspect, sqlify } from "@/lib/sql-runner/guard";
import { prisma } from "@/lib/prisma";

const SERVER_TIMEOUT_MS = 5_000;
const CLIENT_TIMEOUT_MS = 8_000;
const MAX_ROWS = 100;

// Always allowed: the seeded playground sandbox. Everything else must be
// a `ChallengeDatabase` that reached `status='ready'`. Students never
// reach the platform DB — `getStudentPool()` connects to a separate
// challenge MySQL server with a read-only user — but without this
// whitelist a student could `?database=<other_challenge>` to peek at
// hidden datasets on the same challenge server.
const ALWAYS_ALLOWED = new Set(["practice"]);

async function isAllowedDatabase(name) {
  if (ALWAYS_ALLOWED.has(name)) return true;
  const row = await prisma.challengeDatabase.findUnique({
    where: { mysqlDbName: name },
    select: { status: true },
  });
  return row?.status === "ready";
}

/**
 * POST /api/shell
 * Execute a read-only SQL query against the challenge database server.
 * Used by the in-browser terminal as a fallback to the WebSocket transport.
 */
export async function POST(request) {
  try {
    const { query, database } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    const guard = inspect(query, { mode: "playground" });
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: 403 });
    }

    const requested = (database || "practice").trim();
    if (!/^[a-zA-Z0-9_]+$/.test(requested)) {
      return NextResponse.json(
        { error: "Invalid database name" },
        { status: 400 },
      );
    }
    if (!(await isAllowedDatabase(requested))) {
      return NextResponse.json(
        { error: `Database '${requested}' is not available` },
        { status: 403 },
      );
    }

    const pool = getStudentPool();
    const db = requested;

    const connection = await pool.getConnection();
    let timer;
    try {
      await connection.query(`USE \`${db}\``);
      await connection.query(
        "SET SESSION MAX_EXECUTION_TIME = ?",
        [SERVER_TIMEOUT_MS],
      );

      const sql = sqlify(guard.ast);

      const queryPromise = connection.query(sql);
      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Query execution timed out")),
          CLIENT_TIMEOUT_MS,
        );
      });

      const [rows, fields] = await Promise.race([queryPromise, timeoutPromise]);
      clearTimeout(timer);

      const columns = fields ? fields.map((f) => f.name) : [];
      const rowsArr = Array.isArray(rows) ? rows : [];

      return NextResponse.json({
        columns,
        rows: rowsArr.slice(0, MAX_ROWS),
        rowCount: rowsArr.length,
        truncated: rowsArr.length > MAX_ROWS,
      });
    } finally {
      clearTimeout(timer);
      connection.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Query execution failed" },
      { status: 500 },
    );
  }
}
