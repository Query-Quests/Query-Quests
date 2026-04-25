/**
 * Required-keyword check.
 *
 * The previous implementation regex-matched against the raw query, so
 * `SELECT 'I love GROUP BY' FROM t` would falsely satisfy a "must use
 * GROUP BY" requirement. We strip comments and string literals first,
 * then word-boundary match.
 */

/**
 * @param {string} query
 * @param {string|string[]|null|undefined} required
 * @returns {{ allMatched: boolean, matched: string[], missing: string[] }}
 */
export function checkKeywords(query, required) {
  const keywords = parseKeywords(required);
  if (keywords.length === 0) {
    return { allMatched: true, matched: [], missing: [] };
  }

  const stripped = stripCommentsAndStrings(query).toUpperCase();
  const matched = [];
  const missing = [];

  for (const kw of keywords) {
    if (matchKeyword(stripped, kw)) matched.push(kw);
    else missing.push(kw);
  }

  return { allMatched: missing.length === 0, matched, missing };
}

function parseKeywords(input) {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : String(input).split(',');
  return arr.map((k) => k.trim().toUpperCase()).filter(Boolean);
}

/**
 * Strip:
 *   - line comments  -- ... \n
 *   - block comments /* ... *\/
 *   - single-quoted, double-quoted, and backtick-quoted strings
 *     (with escapes via doubled quote or backslash).
 *
 * A small state machine — regex alone can't cope with nested escapes.
 */
function stripCommentsAndStrings(sql) {
  let out = '';
  let i = 0;
  const n = sql.length;

  while (i < n) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (ch === '-' && next === '-') {
      while (i < n && sql[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      i++;
      while (i < n) {
        if (sql[i] === '\\' && i + 1 < n) {
          i += 2;
          continue;
        }
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      out += ' ';
      continue;
    }

    out += ch;
    i++;
  }

  return out;
}

/**
 * Word-boundary match against the stripped SQL. Multi-word keywords
 * (e.g. "GROUP BY") match across any whitespace.
 */
function matchKeyword(stripped, keyword) {
  const parts = keyword.split(/\s+/).map(escapeRegex);
  const pattern = `\\b${parts.join('\\s+')}\\b`;
  return new RegExp(pattern).test(stripped);
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
