/**
 * Unit tests for `gradeAcrossDatasets` — the Phase B orchestrator that
 * fans grading across N ChallengeDataset rows.
 *
 * These tests inject a stub `exec` so no live DB is needed.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { gradeAcrossDatasets } from '../runner.js';

/**
 * Build a stub exec function from a map of dbName → rows.
 * Records calls so tests can assert on short-circuit behaviour.
 */
function makeExec(map) {
  const calls = [];
  const fn = async ({ dbName }) => {
    calls.push(dbName);
    if (map[dbName] instanceof Error) throw map[dbName];
    return {
      rows: map[dbName] ?? [],
      rowCount: (map[dbName] ?? []).length,
      executionTimeMs: 1,
      truncated: false,
    };
  };
  fn.calls = calls;
  return fn;
}

const SQL = 'SELECT id, name FROM users';
const ROWS = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
];
const EXPECTED = JSON.stringify(ROWS);

test('multi: passes when all datasets match', async () => {
  const exec = makeExec({ db_pub: ROWS, db_hid: ROWS });
  const r = await gradeAcrossDatasets({
    sql: SQL,
    datasets: [
      { id: 'p', databaseName: 'db_pub', expectedResult: EXPECTED, isPublic: true },
      { id: 'h', databaseName: 'db_hid', expectedResult: EXPECTED, isPublic: false },
    ],
    exec,
  });
  assert.equal(r.verdict, 'passed');
  assert.equal(r.isCorrect, true);
  assert.equal(r.datasets.length, 2);
  assert.deepEqual(exec.calls, ['db_pub', 'db_hid']);
});

test('multi: fails on public dataset, short-circuits before hidden', async () => {
  const exec = makeExec({
    db_pub: [{ id: 1, name: 'Alice' }], // wrong (one row)
    db_hid: ROWS,
  });
  const r = await gradeAcrossDatasets({
    sql: SQL,
    datasets: [
      { id: 'p', databaseName: 'db_pub', expectedResult: EXPECTED, isPublic: true },
      { id: 'h', databaseName: 'db_hid', expectedResult: EXPECTED, isPublic: false },
    ],
    exec,
  });
  assert.equal(r.verdict, 'failed');
  assert.equal(r.datasets.length, 1);
  assert.equal(r.datasets[0].verdict, 'failed');
  assert.equal(r.datasets[0].isPublic, true);
  // Hidden dataset must not have been touched after a public failure.
  assert.deepEqual(exec.calls, ['db_pub']);
});

test('multi: passes public, fails hidden — student gets no public diff', async () => {
  const exec = makeExec({
    db_pub: ROWS,
    db_hid: [{ id: 1, name: 'Alice' }], // hardcoded answer would do this
  });
  const r = await gradeAcrossDatasets({
    sql: SQL,
    datasets: [
      { id: 'p', databaseName: 'db_pub', expectedResult: EXPECTED, isPublic: true },
      { id: 'h', databaseName: 'db_hid', expectedResult: EXPECTED, isPublic: false },
    ],
    exec,
  });
  assert.equal(r.verdict, 'failed');
  assert.equal(r.datasets.length, 2);
  assert.equal(r.datasets[0].verdict, 'passed');
  assert.equal(r.datasets[0].isPublic, true);
  assert.equal(r.datasets[1].verdict, 'failed');
  assert.equal(r.datasets[1].isPublic, false);
});

test('multi: missing required keyword fails before hitting any DB', async () => {
  const exec = makeExec({ db_pub: ROWS });
  const r = await gradeAcrossDatasets({
    sql: 'SELECT * FROM users',
    requiredKeywords: 'JOIN',
    datasets: [
      { id: 'p', databaseName: 'db_pub', expectedResult: EXPECTED, isPublic: true },
    ],
    exec,
  });
  assert.equal(r.verdict, 'failed');
  assert.equal(r.keywords.allMatched, false);
  assert.deepEqual(exec.calls, []);
});

test('multi: guard rejection short-circuits with errored verdict', async () => {
  const exec = makeExec({ db_pub: ROWS });
  const r = await gradeAcrossDatasets({
    sql: 'SELECT SLEEP(10)',
    datasets: [
      { id: 'p', databaseName: 'db_pub', expectedResult: EXPECTED, isPublic: true },
    ],
    exec,
  });
  assert.equal(r.verdict, 'errored');
  assert.equal(r.errorCode, 'banned_function');
  assert.deepEqual(exec.calls, []);
});

test('multi: timeout propagates as verdict=timeout', async () => {
  const err = new Error('Query execution timed out');
  const exec = makeExec({ db_pub: err });
  const r = await gradeAcrossDatasets({
    sql: SQL,
    datasets: [
      { id: 'p', databaseName: 'db_pub', expectedResult: EXPECTED, isPublic: true },
    ],
    exec,
  });
  assert.equal(r.verdict, 'timeout');
  assert.equal(r.datasets[0].verdict, 'timeout');
});

test('multi: empty dataset list produces a trivial pass', async () => {
  // Edge case: a challenge with no datasets attached. Validate route
  // should fall back to legacy path *before* calling this, but if it
  // doesn't, behaviour is "no expectations to violate".
  const exec = makeExec({});
  const r = await gradeAcrossDatasets({
    sql: SQL,
    datasets: [],
    exec,
  });
  assert.equal(r.verdict, 'passed');
  assert.equal(r.isCorrect, true);
  assert.deepEqual(r.datasets, []);
});

test('multi: per-dataset comparator override', async () => {
  // Public dataset uses the strict (case-sensitive) comparator,
  // hidden uses the default (lossy). Confirms each dataset's own
  // comparator option flows through.
  const exec = makeExec({
    db_strict: [{ name: 'Alice' }],
    db_loose: [{ name: 'Alice' }],
  });
  const r = await gradeAcrossDatasets({
    sql: SQL,
    datasets: [
      {
        id: 's',
        databaseName: 'db_strict',
        expectedResult: JSON.stringify([{ name: 'alice' }]),
        comparator: { caseSensitiveStrings: true },
        isPublic: true,
      },
      {
        id: 'l',
        databaseName: 'db_loose',
        expectedResult: JSON.stringify([{ name: 'alice' }]),
        isPublic: false,
      },
    ],
    exec,
  });
  assert.equal(r.verdict, 'failed');
  assert.equal(r.datasets[0].comparison.match, false);
  // Short-circuited before db_loose.
  assert.deepEqual(exec.calls, ['db_strict']);
});
