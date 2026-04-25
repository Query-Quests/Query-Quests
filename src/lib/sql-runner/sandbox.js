/**
 * Sandboxed execution against the challenge MySQL server.
 *
 * Replaces `executeQuery` in `src/lib/query-validator.js`. Differences:
 *   - Uses MySQL's `MAX_EXECUTION_TIME` session setting so the server
 *     actually kills overrunning SELECTs (the previous JS-side
 *     setTimeout only rejected the Promise — the query kept running).
 *   - Caps row output by injecting LIMIT into the AST, not by appending
 *     " LIMIT N" via regex.
 *   - The JS-side timer is kept as a defensive fallback at 8s.
 */

import { getStudentConnection } from '../mysql-connection.js';
import { sqlify } from './guard.js';

const DEFAULT_MAX_ROWS = 100;
const SERVER_TIMEOUT_MS = 5_000;
const CLIENT_TIMEOUT_MS = 8_000;

/**
 * @param {{
 *   ast: object,
 *   dbName: string,
 *   maxRows?: number,
 *   serverTimeoutMs?: number,
 *   clientTimeoutMs?: number,
 * }} opts
 * @returns {Promise<{
 *   rows: any[],
 *   fields: any[],
 *   columns: string[],
 *   rowCount: number,
 *   truncated: boolean,
 *   executionTimeMs: number,
 * }>}
 */
export async function executeAst({
  ast,
  dbName,
  maxRows = DEFAULT_MAX_ROWS,
  serverTimeoutMs = SERVER_TIMEOUT_MS,
  clientTimeoutMs = CLIENT_TIMEOUT_MS,
}) {
  if (!ast) throw new Error('executeAst: ast is required');
  if (!dbName) throw new Error('executeAst: dbName is required');

  const limitedAst = withLimit(ast, maxRows + 1);
  const sql = sqlify(limitedAst);

  const connection = await getStudentConnection(dbName);
  const start = Date.now();
  let timer;

  try {
    // Server-side cutoff. MAX_EXECUTION_TIME applies to SELECT in MySQL 8;
    // it's a no-op for SHOW/DESCRIBE/EXPLAIN, which is fine — those are cheap.
    await connection.query('SET SESSION MAX_EXECUTION_TIME = ?', [serverTimeoutMs]);

    const queryPromise = connection.query(sql);
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Query execution timed out')),
        clientTimeoutMs,
      );
    });

    const [rows, fields] = await Promise.race([queryPromise, timeoutPromise]);
    clearTimeout(timer);

    const rowsArr = Array.isArray(rows) ? rows : [];
    const truncated = rowsArr.length > maxRows;
    const finalRows = truncated ? rowsArr.slice(0, maxRows) : rowsArr;
    const columns = Array.isArray(fields) ? fields.map((f) => f.name) : [];

    return {
      rows: finalRows,
      fields: fields || [],
      columns,
      rowCount: finalRows.length,
      truncated,
      executionTimeMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timer);
    connection.release();
  }
}

/**
 * Return an AST with a LIMIT applied (only if no LIMIT is already set
 * at the top level). Mutates a shallow clone, never the input.
 */
function withLimit(ast, n) {
  if (ast.type !== 'select') return ast;
  if (ast.limit && Array.isArray(ast.limit.value) && ast.limit.value.length) {
    return ast;
  }
  return {
    ...ast,
    limit: {
      seperator: '',
      value: [{ type: 'number', value: n }],
    },
  };
}
