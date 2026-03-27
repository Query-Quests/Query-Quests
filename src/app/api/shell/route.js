import { NextResponse } from "next/server";
import { getStudentPool } from "@/lib/mysql-connection";

/**
 * POST /api/shell
 * Execute a read-only SQL query against the challenge database
 * Used by the XTerminal component as an alternative to WebSocket
 */
export async function POST(request) {
  try {
    const { query, database } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    const trimmed = query.trim().toUpperCase();

    // Block dangerous commands
    const blocked = [
      "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE",
      "TRUNCATE", "GRANT", "REVOKE", "LOAD", "INTO OUTFILE",
      "INTO DUMPFILE", "SOURCE"
    ];
    for (const cmd of blocked) {
      if (trimmed.startsWith(cmd) || trimmed.includes(cmd)) {
        return NextResponse.json({
          error: `Command '${cmd}' is not allowed. Only SELECT, SHOW, DESCRIBE, and EXPLAIN are permitted.`
        }, { status: 403 });
      }
    }

    // Only allow safe commands
    const allowed = ["SELECT", "SHOW", "DESCRIBE", "DESC", "EXPLAIN", "USE", "HELP"];
    const isAllowed = allowed.some(cmd => trimmed.startsWith(cmd));
    if (!isAllowed) {
      return NextResponse.json({
        error: "Only SELECT, SHOW, DESCRIBE, and EXPLAIN queries are allowed."
      }, { status: 403 });
    }

    const pool = getStudentPool();
    const db = database || "practice";

    // Execute with timeout
    const connection = await pool.getConnection();
    try {
      await connection.query(`USE \`${db.replace(/`/g, "")}\``);
      const [rows, fields] = await connection.query({
        sql: query.trim(),
        timeout: 30000,
      });

      // Format columns
      const columns = fields ? fields.map(f => f.name) : [];

      return NextResponse.json({
        columns,
        rows: Array.isArray(rows) ? rows.slice(0, 100) : rows,
        rowCount: Array.isArray(rows) ? rows.length : 0,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Query execution failed" },
      { status: 500 }
    );
  }
}
