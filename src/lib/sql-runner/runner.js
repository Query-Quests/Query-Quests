/**
 * Submission grader — orchestrates guard → execute → compare → keywords.
 *
 * Two entry points:
 *   - `gradeSubmission`  — single-dataset (legacy Challenge.database_id).
 *   - `gradeAcrossDatasets` — fan out over N ChallengeDataset rows
 *     (Phase B). All datasets must match for a pass.
 *
 * The validate route prefers the multi-dataset path when datasets
 * exist; the single-dataset path stays as a non-blocking fallback for
 * un-backfilled challenges.
 *
 * @typedef {import('./comparator').ComparatorOptions} ComparatorOptions
 * @typedef {import('./comparator').ComparisonResult} ComparisonResult
 *
 * @typedef {Object} GradeInput
 * @property {string} sql
 * @property {string} databaseName
 * @property {string|any[]|null} expectedResult     stored as JSON string or array
 * @property {string|string[]|null} requiredKeywords
 * @property {ComparatorOptions} [comparator]
 *
 * @typedef {Object} GradeOutput
 * @property {'passed'|'failed'|'errored'|'timeout'} verdict
 * @property {boolean} isCorrect                     convenience flag (verdict === 'passed')
 * @property {ComparisonResult} [comparison]
 * @property {{ allMatched: boolean, matched: string[], missing: string[] }} [keywords]
 * @property {string} [error]
 * @property {string} [errorCode]
 * @property {number} [rowCount]
 * @property {number} [executionTimeMs]
 * @property {boolean} [truncated]
 * @property {string} [resultHash]
 * @property {any[]} [rows]                          included only on pass
 *
 * @typedef {Object} DatasetSpec
 * @property {string} id
 * @property {string} databaseName
 * @property {string|any[]|null} expectedResult
 * @property {boolean} isPublic
 * @property {ComparatorOptions} [comparator]
 *
 * @typedef {Object} DatasetResult
 * @property {string} datasetId
 * @property {boolean} isPublic
 * @property {'passed'|'failed'|'errored'|'timeout'} verdict
 * @property {ComparisonResult} [comparison]
 * @property {number} [rowCount]
 * @property {number} [executionTimeMs]
 * @property {string} [error]
 * @property {string} [errorCode]
 *
 * @typedef {Object} MultiGradeOutput
 * @property {'passed'|'failed'|'errored'|'timeout'} verdict
 * @property {boolean} isCorrect
 * @property {DatasetResult[]} datasets
 * @property {{ allMatched: boolean, matched: string[], missing: string[] }} keywords
 * @property {string} [error]
 * @property {string} [errorCode]
 * @property {number} totalExecutionMs
 */

import { inspect } from './guard.js';
import { executeAst } from './sandbox.js';
import { compare, hash } from './comparator.js';
import { checkKeywords } from './keywords.js';

/**
 * @param {GradeInput} input
 * @returns {Promise<GradeOutput>}
 */
export async function gradeSubmission(input) {
  const { sql, databaseName, expectedResult, requiredKeywords, comparator } = input;

  const start = Date.now();

  const guard = inspect(sql, { mode: 'graded' });
  if (!guard.ok) {
    return {
      verdict: 'errored',
      isCorrect: false,
      error: guard.error,
      errorCode: guard.code,
      executionTimeMs: Date.now() - start,
    };
  }

  let exec;
  try {
    exec = await executeAst({ ast: guard.ast, dbName: databaseName });
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    const isTimeout =
      /timed out/i.test(msg) ||
      /max_execution_time/i.test(msg) ||
      err?.code === 'ER_QUERY_TIMEOUT';
    return {
      verdict: isTimeout ? 'timeout' : 'errored',
      isCorrect: false,
      error: msg,
      errorCode: err?.code || (isTimeout ? 'timeout' : 'execution_error'),
      executionTimeMs: Date.now() - start,
    };
  }

  const expected = parseExpected(expectedResult);
  const comparison = expected != null
    ? compare(exec.rows, expected, comparator)
    : { match: true, reason: null };

  const keywords = checkKeywords(sql, requiredKeywords);
  const isCorrect = comparison.match && keywords.allMatched;
  const resultHash = hash(exec.rows, comparator);

  return {
    verdict: isCorrect ? 'passed' : 'failed',
    isCorrect,
    comparison,
    keywords,
    rowCount: exec.rowCount,
    executionTimeMs: exec.executionTimeMs,
    truncated: exec.truncated,
    resultHash,
    rows: isCorrect ? exec.rows : undefined,
  };
}

/**
 * Run a teacher's reference query and capture its output for storage as
 * the expected result. Used by `/api/challenges/[id]/preview-result`.
 *
 * @param {{ sql: string, databaseName: string, comparator?: ComparatorOptions }} input
 */
export async function captureExpectedResult({ sql, databaseName, comparator }) {
  const guard = inspect(sql, { mode: 'graded' });
  if (!guard.ok) {
    const err = new Error(guard.error);
    err.code = guard.code;
    throw err;
  }
  const exec = await executeAst({ ast: guard.ast, dbName: databaseName });
  return {
    rows: exec.rows,
    rowCount: exec.rowCount,
    executionTimeMs: exec.executionTimeMs,
    columns: exec.columns,
    hash: hash(exec.rows, comparator),
    resultJson: JSON.stringify(exec.rows),
  };
}

function parseExpected(value) {
  if (value == null) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Multi-dataset grader. The submission must match the expected
 * result on every attached dataset for a `passed` verdict.
 *
 * Datasets are run in the order supplied. Callers should put
 * `is_public = true` datasets first, so a failure on the public
 * sample produces a real diff for the student; failures only on
 * hidden datasets get the generic-shape feedback that the validate
 * route returns.
 *
 * Short-circuits on first failure to save resources.
 *
 * `exec` is injected so the orchestrator is unit-testable without a
 * live MySQL — production callers should pass `executeAst`.
 *
 * @param {{
 *   sql: string,
 *   datasets: DatasetSpec[],
 *   requiredKeywords?: string|string[]|null,
 *   exec?: (input: { ast: object, dbName: string }) =>
 *     Promise<{ rows: any[], rowCount: number, executionTimeMs: number, truncated: boolean }>,
 * }} input
 * @returns {Promise<MultiGradeOutput>}
 */
export async function gradeAcrossDatasets(input) {
  const { sql, datasets, requiredKeywords } = input;
  const exec = input.exec || ((args) => executeAst(args));

  const guard = inspect(sql, { mode: 'graded' });
  if (!guard.ok) {
    return {
      verdict: 'errored',
      isCorrect: false,
      datasets: [],
      keywords: { allMatched: true, matched: [], missing: [] },
      error: guard.error,
      errorCode: guard.code,
      totalExecutionMs: 0,
    };
  }

  const keywords = checkKeywords(sql, requiredKeywords);

  // Keyword failure short-circuits before we run anything.
  if (!keywords.allMatched) {
    return {
      verdict: 'failed',
      isCorrect: false,
      datasets: [],
      keywords,
      totalExecutionMs: 0,
    };
  }

  const results = [];
  let totalExec = 0;
  let aggregate = 'passed';
  let firstError;

  for (const ds of datasets) {
    let exOut;
    try {
      exOut = await exec({ ast: guard.ast, dbName: ds.databaseName });
      totalExec += exOut.executionTimeMs || 0;
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      const isTimeout =
        /timed out/i.test(msg) ||
        /max_execution_time/i.test(msg) ||
        err?.code === 'ER_QUERY_TIMEOUT';
      const verdict = isTimeout ? 'timeout' : 'errored';
      results.push({
        datasetId: ds.id,
        isPublic: ds.isPublic,
        verdict,
        error: msg,
        errorCode: err?.code || verdict,
      });
      aggregate = verdict;
      firstError = { error: msg, errorCode: err?.code || verdict };
      break; // Errors short-circuit (fail-fast).
    }

    const expected = parseExpected(ds.expectedResult);
    const comparison = expected != null
      ? compare(exOut.rows, expected, ds.comparator)
      : { match: true, reason: null };

    results.push({
      datasetId: ds.id,
      isPublic: ds.isPublic,
      verdict: comparison.match ? 'passed' : 'failed',
      comparison,
      rowCount: exOut.rowCount,
      executionTimeMs: exOut.executionTimeMs,
    });

    if (!comparison.match) {
      aggregate = 'failed';
      break; // Mismatch on this dataset → student already failed.
    }
  }

  return {
    verdict: aggregate,
    isCorrect: aggregate === 'passed',
    datasets: results,
    keywords,
    totalExecutionMs: totalExec,
    ...(firstError || {}),
  };
}
