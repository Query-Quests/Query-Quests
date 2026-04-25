/**
 * Legacy compatibility shim.
 *
 * The validator was rewritten under `src/lib/sql-runner/`. This file
 * re-exports the new surface under the old names so existing imports
 * keep working for one release. New code should import from
 * `@/lib/sql-runner/...` directly.
 */

import { inspect } from './sql-runner/guard';
import { executeAst } from './sql-runner/sandbox';
import { compare, hash } from './sql-runner/comparator';
import { checkKeywords as checkKeywordsImpl } from './sql-runner/keywords';
import { gradeSubmission, captureExpectedResult } from './sql-runner/runner';

export function validateCommand(query) {
  const r = inspect(query, { mode: 'graded' });
  return r.ok ? { valid: true } : { valid: false, error: r.error };
}

export async function executeQuery(dbName, query, limit = 100) {
  const r = inspect(query, { mode: 'graded' });
  if (!r.ok) throw new Error(r.error);
  const out = await executeAst({ ast: r.ast, dbName, maxRows: limit });
  return {
    rows: out.rows,
    rowCount: out.rowCount,
    executionTimeMs: out.executionTimeMs,
    truncated: out.truncated,
  };
}

export function hashResult(rows) {
  return hash(rows);
}

export function normalizeResultSet() {
  // The new comparator does normalization internally per ComparatorOptions;
  // there is no longer a public "normalized form". Kept for import-compat.
  throw new Error('normalizeResultSet is no longer exported; use compare()');
}

export function compareResults(actual, expected) {
  const expectedArr = typeof expected === 'string'
    ? safeParse(expected)
    : expected;
  if (!Array.isArray(expectedArr)) {
    return { match: false, details: 'Invalid expected result format' };
  }
  const r = compare(actual, expectedArr);
  return r.match ? { match: true } : { match: false, details: r.message };
}

export function checkKeywords(query, required) {
  return checkKeywordsImpl(query, required);
}

export async function validateQueryAgainstChallenge({
  query,
  databaseName,
  expectedResult,
  requiredKeywords,
}) {
  const result = await gradeSubmission({
    sql: query,
    databaseName,
    expectedResult,
    requiredKeywords,
  });
  return {
    success: result.verdict !== 'errored' && result.verdict !== 'timeout',
    isCorrect: result.isCorrect,
    query,
    rowCount: result.rowCount,
    executionTimeMs: result.executionTimeMs,
    truncated: result.truncated,
    resultHash: result.resultHash,
    resultMatch: result.comparison?.match ?? false,
    resultDetails: result.comparison?.message,
    keywordsMatched: result.keywords?.matched ?? [],
    keywordsMissing: result.keywords?.missing ?? [],
    rows: result.rows,
    error: result.error,
  };
}

export async function generateExpectedResult(dbName, query) {
  return captureExpectedResult({ sql: query, databaseName: dbName });
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
