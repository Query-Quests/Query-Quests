/**
 * Integration tests against a real MySQL challenge server.
 *
 * Skipped by default — set RUN_INTEGRATION=1 to run. Before running:
 *
 *   docker compose up -d mysql-challenges
 *
 * The tests use the seeded `practice` database (mysql-init/02-init.sql)
 * with the `student_readonly` role.
 *
 * Run from `src/`:
 *
 *   RUN_INTEGRATION=1 node --test lib/sql-runner/__tests__/sandbox.integration.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

const SHOULD_RUN = process.env.RUN_INTEGRATION === '1';

if (!SHOULD_RUN) {
  test('sandbox integration tests (skipped: set RUN_INTEGRATION=1 to enable)', () => {});
} else {
  // Dynamic imports so the unit-test run never touches mysql2.
  const { inspect } = await import('../guard.js');
  const { executeAst } = await import('../sandbox.js');
  const { gradeSubmission, captureExpectedResult } = await import('../runner.js');
  const { closeAllPools } = await import('../../mysql-connection.js');

  const DB = process.env.INTEGRATION_DB || 'practice';

  test.after(async () => {
    await closeAllPools();
  });

  test('sandbox: SELECT against practice DB returns rows', async () => {
    const guard = inspect('SELECT id, first_name FROM employees', {
      mode: 'graded',
    });
    assert.equal(guard.ok, true);

    const out = await executeAst({ ast: guard.ast, dbName: DB });
    assert.ok(out.rows.length > 0, 'expected at least one row');
    assert.ok(out.executionTimeMs >= 0);
    assert.equal(out.truncated, false);
  });

  test('sandbox: LIMIT injection caps rows and flags truncation', async () => {
    // employees seed has 10 rows; ask for 5.
    const guard = inspect('SELECT * FROM employees', { mode: 'graded' });
    const out = await executeAst({ ast: guard.ast, dbName: DB, maxRows: 3 });
    assert.equal(out.rowCount, 3);
    assert.equal(out.truncated, true);
  });

  test('runner: gradeSubmission returns passed for a matching query', async () => {
    const captured = await captureExpectedResult({
      sql: 'SELECT department, COUNT(*) AS n FROM employees GROUP BY department',
      databaseName: DB,
    });

    const result = await gradeSubmission({
      sql: 'SELECT department, COUNT(*) AS n FROM employees GROUP BY department',
      databaseName: DB,
      expectedResult: captured.resultJson,
    });

    assert.equal(result.verdict, 'passed');
    assert.equal(result.isCorrect, true);
  });

  test('runner: gradeSubmission returns failed when results differ', async () => {
    // Reference has 10 rows; student query restricted to one department.
    const captured = await captureExpectedResult({
      sql: 'SELECT first_name FROM employees',
      databaseName: DB,
    });

    const result = await gradeSubmission({
      sql: "SELECT first_name FROM employees WHERE department = 'Engineering'",
      databaseName: DB,
      expectedResult: captured.resultJson,
    });

    assert.equal(result.verdict, 'failed');
    assert.equal(result.isCorrect, false);
    assert.ok(result.comparison?.message, 'should include diff message');
  });

  test('runner: errored verdict when student SQL hits banned function', async () => {
    const result = await gradeSubmission({
      sql: 'SELECT SLEEP(1)',
      databaseName: DB,
      expectedResult: '[]',
    });
    assert.equal(result.verdict, 'errored');
    assert.equal(result.errorCode, 'banned_function');
  });
}
