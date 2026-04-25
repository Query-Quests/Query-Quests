/**
 * AST-based SQL guard.
 *
 * Replaces the regex blocklist in `src/lib/query-validator.js`. Uses
 * node-sql-parser to parse the user submission against MySQL grammar,
 * then walks the AST to enforce a *whitelist* of allowed shapes.
 *
 * Two modes:
 *   - 'graded'     — only a single SELECT, no system schema access,
 *                    no non-deterministic functions. Used by the
 *                    challenge validator.
 *   - 'playground' — single SELECT/SHOW/DESCRIBE/EXPLAIN. Used by the
 *                    in-browser terminal (`/api/shell`).
 *
 * Returns { ok: true, ast, statementType } or
 *         { ok: false, code, error }.
 */

import sqlParser from 'node-sql-parser';

const { Parser } = sqlParser;
const parser = new Parser();

const MAX_QUERY_LENGTH = 10_000;
const MAX_SUBQUERY_DEPTH = 8;

const BANNED_FUNCTIONS = new Set([
  'sleep',
  'benchmark',
  'load_file',
  'get_lock',
  'release_lock',
  'is_free_lock',
  'is_used_lock',
  'master_pos_wait',
  'master_gtid_wait',
  'source_pos_wait',
  'pg_sleep',
]);

const NON_DETERMINISTIC_FUNCTIONS = new Set([
  'now',
  'current_timestamp',
  'curdate',
  'curtime',
  'sysdate',
  'rand',
  'uuid',
  'uuid_short',
  'connection_id',
  'last_insert_id',
]);

const BANNED_SCHEMAS = new Set([
  'information_schema',
  'mysql',
  'performance_schema',
  'sys',
]);

const PLAYGROUND_TYPES = new Set(['select', 'show', 'desc', 'describe', 'explain']);
const GRADED_TYPES = new Set(['select']);

/**
 * @param {string} sql
 * @param {{ mode?: 'graded' | 'playground' }} [opts]
 * @returns {{ ok: true, ast: object, statementType: string } |
 *           { ok: false, code: string, error: string }}
 */
export function inspect(sql, opts = {}) {
  const mode = opts.mode ?? 'graded';

  if (typeof sql !== 'string' || !sql.trim()) {
    return { ok: false, code: 'empty', error: 'Query cannot be empty' };
  }
  if (sql.length > MAX_QUERY_LENGTH) {
    return {
      ok: false,
      code: 'too_long',
      error: `Query exceeds ${MAX_QUERY_LENGTH} characters`,
    };
  }

  let astResult;
  try {
    astResult = parser.astify(sql, { database: 'mysql' });
  } catch (err) {
    return {
      ok: false,
      code: 'parse_error',
      error: `SQL parse error: ${err.message}`,
    };
  }

  if (Array.isArray(astResult)) {
    if (astResult.length !== 1) {
      return {
        ok: false,
        code: 'multi_statement',
        error: 'Only a single SQL statement is allowed',
      };
    }
    astResult = astResult[0];
  }

  const stmtType = String(astResult?.type || '').toLowerCase();
  const allowed = mode === 'graded' ? GRADED_TYPES : PLAYGROUND_TYPES;
  if (!allowed.has(stmtType)) {
    return {
      ok: false,
      code: 'wrong_type',
      error: mode === 'graded'
        ? 'Only SELECT statements are allowed in graded challenges'
        : 'Only SELECT, SHOW, DESCRIBE, and EXPLAIN are allowed',
    };
  }

  const violation = walk(astResult, { mode, depth: 0 });
  if (violation) return violation;

  return { ok: true, ast: astResult, statementType: stmtType };
}

/**
 * Recursively walk the AST and reject banned constructs.
 * Returns a violation object on the first hit, or null on success.
 */
function walk(node, ctx) {
  if (node == null || typeof node !== 'object') return null;

  if (ctx.depth > MAX_SUBQUERY_DEPTH) {
    return {
      ok: false,
      code: 'too_deep',
      error: `Subquery nesting exceeds limit of ${MAX_SUBQUERY_DEPTH}`,
    };
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const v = walk(child, ctx);
      if (v) return v;
    }
    return null;
  }

  // Function calls — node-sql-parser uses { type: 'function', name: { name: [{ value }] } }
  // or older shape { type: 'function', name: '...' }. Handle both.
  if (node.type === 'function' || node.type === 'aggr_func') {
    const fnName = extractFunctionName(node);
    if (fnName) {
      const lower = fnName.toLowerCase();
      if (BANNED_FUNCTIONS.has(lower)) {
        return {
          ok: false,
          code: 'banned_function',
          error: `Function ${fnName.toUpperCase()} is not allowed`,
        };
      }
      if (ctx.mode === 'graded' && NON_DETERMINISTIC_FUNCTIONS.has(lower)) {
        return {
          ok: false,
          code: 'nondeterministic_function',
          error: `Function ${fnName.toUpperCase()} is not allowed in graded challenges (non-deterministic)`,
        };
      }
    }
  }

  // Variable assignment: `@x := …`
  if (node.type === 'var' && node.assigned_to) {
    return {
      ok: false,
      code: 'user_variable',
      error: 'User-variable assignments are not allowed',
    };
  }

  // Table references — block system schemas in graded mode.
  // Shape: { db: 'information_schema', table: 'tables' }.
  if (typeof node.db === 'string' && node.db) {
    if (BANNED_SCHEMAS.has(node.db.toLowerCase())) {
      return {
        ok: false,
        code: 'system_schema',
        error: `Access to ${node.db} is not allowed`,
      };
    }
  }

  // Subquery / nested SELECT — increment depth.
  const isSubquery = node.type === 'select' && ctx.depth > 0;
  const childDepth = isSubquery ? ctx.depth + 1 : ctx.depth;

  for (const key of Object.keys(node)) {
    const v = walk(node[key], { mode: ctx.mode, depth: childDepth });
    if (v) return v;
  }

  // The top-level SELECT counts as depth 1 for subquery counting.
  if (node.type === 'select' && ctx.depth === 0) {
    // No-op; we only count *nested* selects against MAX_SUBQUERY_DEPTH.
  }

  return null;
}

function extractFunctionName(node) {
  // node-sql-parser v5 shape: name is { name: [{ value: 'fn' }] }
  if (node.name && typeof node.name === 'object') {
    if (Array.isArray(node.name.name)) {
      const first = node.name.name[0];
      if (first && typeof first.value === 'string') return first.value;
    }
    if (typeof node.name.value === 'string') return node.name.value;
  }
  if (typeof node.name === 'string') return node.name;
  return null;
}

/**
 * Re-emit the AST as SQL (used after rewriting, e.g. injecting LIMIT).
 * Always runs through the MySQL emitter.
 */
export function sqlify(ast) {
  return parser.sqlify(ast, { database: 'mysql' });
}
