/**
 * Unit tests for the structured grade logger.
 *
 * Sink injection lets us assert the exact wire shape without writing
 * to stdout during the test run.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { logGrade, _setSinkForTests } from '../logger.js';

test('logger: emits a single JSON line with required fields', () => {
  const lines = [];
  _setSinkForTests((line) => lines.push(line));

  logGrade({
    challengeId: 'c1',
    userId: 'u1',
    verdict: 'passed',
    isCorrect: true,
    executionTimeMs: 42,
    rowCount: 7,
    sql: 'SELECT 1',
  });

  assert.equal(lines.length, 1);
  const event = JSON.parse(lines[0]);
  assert.equal(event.type, 'grade');
  assert.equal(event.challengeId, 'c1');
  assert.equal(event.userId, 'u1');
  assert.equal(event.verdict, 'passed');
  assert.equal(event.isCorrect, true);
  assert.equal(event.executionTimeMs, 42);
  assert.equal(event.rowCount, 7);
  assert.match(event.ts, /^\d{4}-\d{2}-\d{2}T/);
  // queryHash is a 16-char hex prefix; never the raw SQL.
  assert.match(event.queryHash, /^[0-9a-f]{16}$/);
  assert.equal(event.sql, undefined);

  _setSinkForTests(null);
});

test('logger: queryHash is stable for the same SQL', () => {
  const lines = [];
  _setSinkForTests((line) => lines.push(line));

  logGrade({
    challengeId: 'c1', userId: 'u1', verdict: 'failed',
    isCorrect: false, executionTimeMs: 1, sql: 'SELECT 1',
  });
  logGrade({
    challengeId: 'c1', userId: 'u2', verdict: 'failed',
    isCorrect: false, executionTimeMs: 1, sql: 'SELECT 1',
  });

  const a = JSON.parse(lines[0]);
  const b = JSON.parse(lines[1]);
  assert.equal(a.queryHash, b.queryHash);
  assert.notEqual(a.userId, b.userId);

  _setSinkForTests(null);
});

test('logger: includes optional dataset fields when provided', () => {
  const lines = [];
  _setSinkForTests((line) => lines.push(line));

  logGrade({
    challengeId: 'c1',
    userId: 'u1',
    verdict: 'failed',
    isCorrect: false,
    executionTimeMs: 5,
    datasetIds: ['ds1', 'ds2'],
    hadHiddenFailure: true,
    sql: 'SELECT 1',
  });

  const e = JSON.parse(lines[0]);
  assert.deepEqual(e.datasetIds, ['ds1', 'ds2']);
  assert.equal(e.hadHiddenFailure, true);

  _setSinkForTests(null);
});

test('logger: never throws on broken sink', () => {
  _setSinkForTests(() => {
    throw new Error('boom');
  });
  // Should not raise.
  logGrade({
    challengeId: 'c1', userId: 'u1', verdict: 'passed',
    isCorrect: true, executionTimeMs: 1, sql: 'SELECT 1',
  });
  _setSinkForTests(null);
});
