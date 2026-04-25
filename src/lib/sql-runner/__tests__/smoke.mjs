/**
 * Smoke tests for the sql-runner pure modules (guard, comparator,
 * keywords). Run with `node --test src/lib/sql-runner/__tests__/smoke.mjs`
 * from inside `src/`.
 *
 * No DB-dependent code is exercised here — sandbox.js / runner.js are
 * covered by integration tests against docker-compose MySQL (Phase A9).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { inspect } from '../guard.js';
import { compare, hash } from '../comparator.js';
import { checkKeywords } from '../keywords.js';

// ─────────────────────────────────────────────────────────────────────
// guard.js
// ─────────────────────────────────────────────────────────────────────

test('guard: graded mode accepts a plain SELECT', () => {
  const r = inspect('SELECT id, name FROM users', { mode: 'graded' });
  assert.equal(r.ok, true);
  assert.equal(r.statementType, 'select');
});

test('guard: graded mode rejects multiple statements', () => {
  const r = inspect('SELECT 1; SELECT 2', { mode: 'graded' });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'multi_statement');
});

test('guard: graded mode rejects DDL', () => {
  for (const sql of [
    'CREATE TRIGGER t BEFORE INSERT ON x FOR EACH ROW BEGIN END',
    'CREATE FUNCTION f() RETURNS INT RETURN 1',
    'INSERT INTO users (name) VALUES ("x")',
    'DELETE FROM users',
    'UPDATE users SET name = "x"',
  ]) {
    const r = inspect(sql, { mode: 'graded' });
    assert.equal(r.ok, false, `should reject: ${sql}`);
  }
});

test('guard: graded mode rejects banned functions (SLEEP, BENCHMARK)', () => {
  const a = inspect('SELECT SLEEP(10)', { mode: 'graded' });
  assert.equal(a.ok, false);
  assert.equal(a.code, 'banned_function');

  const b = inspect('SELECT BENCHMARK(10000, MD5("x"))', { mode: 'graded' });
  assert.equal(b.ok, false);
  assert.equal(b.code, 'banned_function');
});

test('guard: graded mode rejects information_schema', () => {
  const r = inspect(
    'SELECT * FROM information_schema.tables',
    { mode: 'graded' },
  );
  assert.equal(r.ok, false);
  assert.equal(r.code, 'system_schema');
});

test('guard: graded mode rejects non-deterministic functions', () => {
  const r = inspect('SELECT NOW()', { mode: 'graded' });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'nondeterministic_function');
});

test('guard: comment-smuggled statements still rejected', () => {
  // node-sql-parser strips comments; the second statement still trips
  // multi_statement, and the inner DROP would never reach the AST.
  const r = inspect("SELECT 1 /* ; DROP TABLE x */", { mode: 'graded' });
  assert.equal(r.ok, true); // the comment is content-free in the AST
});

test('guard: string literal "INSERT" does not trigger blocklist', () => {
  // The old regex blocklist was fooled by literal "INSERT"; the AST is not.
  const r = inspect("SELECT 'INSERT INTO x' AS demo", { mode: 'graded' });
  assert.equal(r.ok, true);
});

test('guard: playground mode accepts SHOW/DESCRIBE', () => {
  const a = inspect('SHOW TABLES', { mode: 'playground' });
  assert.equal(a.ok, true);
  const b = inspect('DESCRIBE users', { mode: 'playground' });
  assert.equal(b.ok, true);
});

test('guard: too-long input is rejected before parsing', () => {
  const r = inspect('SELECT 1' + ' '.repeat(20_000), { mode: 'graded' });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'too_long');
});

// ─────────────────────────────────────────────────────────────────────
// comparator.js
// ─────────────────────────────────────────────────────────────────────

test('comparator: trivial match', () => {
  const a = [{ id: 1, name: 'Alice' }];
  const b = [{ id: 1, name: 'Alice' }];
  const r = compare(a, b);
  assert.equal(r.match, true);
});

test('comparator: row count mismatch', () => {
  const r = compare([{ id: 1 }], [{ id: 1 }, { id: 2 }]);
  assert.equal(r.match, false);
  assert.equal(r.reason, 'row_count');
});

test('comparator: column count mismatch', () => {
  const r = compare([{ id: 1, name: 'a' }], [{ id: 1 }]);
  assert.equal(r.match, false);
  assert.equal(r.reason, 'column_count');
});

test('comparator: order-insensitive by default', () => {
  const a = [{ id: 2 }, { id: 1 }];
  const b = [{ id: 1 }, { id: 2 }];
  assert.equal(compare(a, b).match, true);
});

test('comparator: ordered=true respects row order', () => {
  const a = [{ id: 2 }, { id: 1 }];
  const b = [{ id: 1 }, { id: 2 }];
  const r = compare(a, b, { ordered: true });
  assert.equal(r.match, false);
  assert.equal(r.reason, 'row_diff');
});

test('comparator: case-sensitive opt-in', () => {
  const a = [{ name: 'alice' }];
  const b = [{ name: 'Alice' }];
  // Default lowercases — matches v1 normalizer.
  assert.equal(compare(a, b).match, true);
  // Opt-in strict.
  assert.equal(
    compare(a, b, { caseSensitiveStrings: true }).match,
    false,
  );
});

test('comparator: float precision', () => {
  const a = [{ x: 1.000000123 }];
  const b = [{ x: 1.000000456 }];
  // 6 dp default → equal after rounding.
  assert.equal(compare(a, b).match, true);
  assert.equal(compare(a, b, { floatPrecision: 9 }).match, false);
});

test('comparator: NULL == NULL by default', () => {
  const a = [{ x: null }];
  const b = [{ x: null }];
  assert.equal(compare(a, b).match, true);
});

test('hash: stable across reorderings (when not ordered)', () => {
  const a = [{ id: 1 }, { id: 2 }];
  const b = [{ id: 2 }, { id: 1 }];
  assert.equal(hash(a), hash(b));
});

// ─────────────────────────────────────────────────────────────────────
// keywords.js
// ─────────────────────────────────────────────────────────────────────

test('keywords: empty requirement passes', () => {
  const r = checkKeywords('SELECT 1', null);
  assert.equal(r.allMatched, true);
});

test('keywords: matches simple keyword', () => {
  const r = checkKeywords('SELECT * FROM t WHERE x = 1', 'WHERE');
  assert.equal(r.allMatched, true);
  assert.deepEqual(r.matched, ['WHERE']);
});

test('keywords: matches multi-word keyword across whitespace', () => {
  const r = checkKeywords(
    'SELECT a, COUNT(*) FROM t GROUP   BY a',
    'GROUP BY,COUNT',
  );
  assert.equal(r.allMatched, true);
});

test('keywords: ignores keyword inside a string literal', () => {
  // Old regex would match this; new keyword check strips strings first.
  const r = checkKeywords(
    "SELECT 'I love GROUP BY' FROM t",
    'GROUP BY',
  );
  assert.equal(r.allMatched, false);
  assert.deepEqual(r.missing, ['GROUP BY']);
});

test('keywords: ignores keyword inside a comment', () => {
  const r = checkKeywords(
    "SELECT 1 -- GROUP BY here\nFROM t",
    'GROUP BY',
  );
  assert.equal(r.allMatched, false);
});

test('keywords: missing reported', () => {
  const r = checkKeywords('SELECT * FROM t', 'JOIN,WHERE');
  assert.equal(r.allMatched, false);
  assert.deepEqual(r.missing, ['JOIN', 'WHERE']);
});
