/**
 * Configurable result-set comparator.
 *
 * Replaces `normalizeResultSet` and `compareResults` from
 * `src/lib/query-validator.js`. The previous implementation always
 * lowercased and trimmed strings and globally sorted rows — fine for
 * "find all employees with salary > 50000", wrong for case-sensitive
 * answers and ORDER BY challenges.
 *
 * Defaults preserve the previous behaviour so already-seeded
 * challenges keep grading the same way; per-challenge overrides come
 * from `Challenge.comparator` (JSON column).
 *
 * @typedef {Object} ComparatorOptions
 * @property {boolean} [ordered]              row order matters; default false
 * @property {boolean} [ignoreColumnOrder]    match by column name; default true
 * @property {boolean} [nullEqualsNull]       NULL == NULL; default true
 * @property {number}  [floatPrecision]       decimal places; default 6
 * @property {boolean} [caseSensitiveStrings] default false (matches v1)
 * @property {boolean} [trimStrings]          default true (matches v1)
 * @property {'iso'|'epoch'|'raw'} [dateNormalization] default 'iso'
 *
 * @typedef {Object} ComparisonResult
 * @property {boolean} match
 * @property {'row_count'|'column_count'|'column_names'|'row_diff'|'type_mismatch'|null} reason
 * @property {string} [message]               human-readable summary
 * @property {object} [diff]                  structured diff payload
 */

import crypto from 'crypto';

const DEFAULTS = {
  ordered: false,
  ignoreColumnOrder: true,
  nullEqualsNull: true,
  floatPrecision: 6,
  caseSensitiveStrings: false,
  trimStrings: true,
  dateNormalization: 'iso',
};

/**
 * @param {any[]} actual
 * @param {any[]} expected
 * @param {ComparatorOptions} [options]
 * @returns {ComparisonResult}
 */
export function compare(actual, expected, options = {}) {
  const opts = { ...DEFAULTS, ...options };

  const a = Array.isArray(actual) ? actual : [];
  const e = Array.isArray(expected) ? expected : [];

  // Both empty → trivially match.
  if (a.length === 0 && e.length === 0) {
    return { match: true, reason: null };
  }

  const aCols = a.length > 0 ? Object.keys(a[0]) : [];
  const eCols = e.length > 0 ? Object.keys(e[0]) : [];

  if (aCols.length !== eCols.length) {
    return {
      match: false,
      reason: 'column_count',
      message: `Column count mismatch: got ${aCols.length}, expected ${eCols.length}`,
      diff: { actualColumns: aCols, expectedColumns: eCols },
    };
  }

  if (!opts.ignoreColumnOrder) {
    for (let i = 0; i < aCols.length; i++) {
      if (aCols[i] !== eCols[i]) {
        return {
          match: false,
          reason: 'column_names',
          message: `Column ${i} name mismatch: got "${aCols[i]}", expected "${eCols[i]}"`,
          diff: { actualColumns: aCols, expectedColumns: eCols },
        };
      }
    }
  } else {
    const aSet = new Set(aCols);
    for (const c of eCols) {
      if (!aSet.has(c)) {
        return {
          match: false,
          reason: 'column_names',
          message: `Missing column "${c}"`,
          diff: { actualColumns: aCols, expectedColumns: eCols },
        };
      }
    }
  }

  if (a.length !== e.length) {
    return {
      match: false,
      reason: 'row_count',
      message: `Row count mismatch: got ${a.length}, expected ${e.length}`,
      diff: { actualRows: a.length, expectedRows: e.length },
    };
  }

  const aRows = a.map((r) => normalizeRow(r, eCols, opts));
  const eRows = e.map((r) => normalizeRow(r, eCols, opts));

  if (!opts.ordered) {
    aRows.sort(rowComparator);
    eRows.sort(rowComparator);
  }

  for (let i = 0; i < aRows.length; i++) {
    const diff = diffRow(aRows[i], eRows[i], eCols);
    if (diff) {
      return {
        match: false,
        reason: 'row_diff',
        message: `Row ${i} differs: column "${diff.column}" — got ${formatValue(diff.actual)}, expected ${formatValue(diff.expected)}`,
        diff: { rowIndex: i, ...diff },
      };
    }
  }

  return { match: true, reason: null };
}

/**
 * Stable hash of a result set after normalization.
 * Used for caching expected results and as a fast equality check.
 */
export function hash(rows, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const arr = Array.isArray(rows) ? rows : [];
  const cols = arr.length > 0 ? Object.keys(arr[0]).slice().sort() : [];
  const normalized = arr.map((r) => normalizeRow(r, cols, opts));
  if (!opts.ordered) normalized.sort(rowComparator);
  const json = JSON.stringify({ cols, rows: normalized });
  return crypto.createHash('sha256').update(json).digest('hex');
}

/**
 * Normalize a row into an array of values aligned with `cols`,
 * applying numeric/string/date normalization per options.
 */
function normalizeRow(row, cols, opts) {
  return cols.map((col) => normalizeValue(row[col], opts));
}

function normalizeValue(value, opts) {
  if (value === null || value === undefined) {
    return opts.nullEqualsNull ? null : value;
  }
  if (value instanceof Date) {
    const normalized = normalizeDate(value, opts);
    // If the date is normalized to an ISO string, fall through to the
    // string path so trim/case normalization runs symmetrically with
    // the expected side (which arrives as a JSON-parsed string after
    // round-tripping through Challenge.expectedResult).
    if (typeof normalized === 'string') {
      value = normalized;
    } else {
      return normalized;
    }
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return value;
    const factor = Math.pow(10, opts.floatPrecision);
    return Math.round(value * factor) / factor;
  }
  if (typeof value === 'string') {
    let s = value;
    if (opts.trimStrings) s = s.trim();
    if (!opts.caseSensitiveStrings) s = s.toLowerCase();
    return s;
  }
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'object') {
    // Buffer, Uint8Array, decimal-as-object — fall through to string form.
    return String(value);
  }
  return value;
}

function normalizeDate(d, opts) {
  switch (opts.dateNormalization) {
    case 'epoch':
      return d.getTime();
    case 'raw':
      return d;
    case 'iso':
    default:
      return d.toISOString();
  }
}

function rowComparator(a, b) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

function diffRow(actual, expected, cols) {
  for (let i = 0; i < cols.length; i++) {
    if (!eqValue(actual[i], expected[i])) {
      return { column: cols[i], actual: actual[i], expected: expected[i] };
    }
  }
  return null;
}

function eqValue(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function formatValue(v) {
  if (v === null) return 'NULL';
  if (typeof v === 'string') return JSON.stringify(v);
  return String(v);
}
