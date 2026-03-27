/**
 * Query Validator Service
 * Validates student queries against challenge requirements
 */

import crypto from 'crypto';
import { getStudentConnection, executeWithTimeout } from './mysql-connection';

// Maximum rows to return from a query
const MAX_RESULT_ROWS = 100;

// Query execution timeout in milliseconds
const QUERY_TIMEOUT = 30000;

/**
 * Blocked SQL patterns - commands students cannot execute
 */
const BLOCKED_PATTERNS = [
  { pattern: /\b(INSERT)\s+INTO\b/i, message: 'INSERT statements are not allowed' },
  { pattern: /\b(UPDATE)\s+\w+\s+SET\b/i, message: 'UPDATE statements are not allowed' },
  { pattern: /\b(DELETE)\s+FROM\b/i, message: 'DELETE statements are not allowed' },
  { pattern: /\b(DROP)\s+(TABLE|DATABASE|INDEX|VIEW)\b/i, message: 'DROP statements are not allowed' },
  { pattern: /\b(TRUNCATE)\s+TABLE\b/i, message: 'TRUNCATE statements are not allowed' },
  { pattern: /\b(ALTER)\s+(TABLE|DATABASE)\b/i, message: 'ALTER statements are not allowed' },
  { pattern: /\b(CREATE)\s+(TABLE|DATABASE|INDEX|VIEW|USER)\b/i, message: 'CREATE statements are not allowed' },
  { pattern: /\b(GRANT)\b/i, message: 'GRANT statements are not allowed' },
  { pattern: /\b(REVOKE)\b/i, message: 'REVOKE statements are not allowed' },
  { pattern: /\bINTO\s+OUTFILE\b/i, message: 'INTO OUTFILE is not allowed' },
  { pattern: /\bINTO\s+DUMPFILE\b/i, message: 'INTO DUMPFILE is not allowed' },
  { pattern: /\bLOAD\s+DATA\b/i, message: 'LOAD DATA is not allowed' },
  { pattern: /\bSOURCE\b/i, message: 'SOURCE command is not allowed' },
  { pattern: /\\!/g, message: 'Shell escape is not allowed' },
  { pattern: /\bSHOW\s+DATABASES\b/i, message: 'SHOW DATABASES is not allowed' },
  { pattern: /\bUSE\s+\w+/i, message: 'USE statement is not allowed - database is pre-selected' },
];

/**
 * Validate that a query doesn't contain blocked commands
 * @param {string} query - The SQL query to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCommand(query) {
  const normalizedQuery = query.trim();

  // Check if query is empty
  if (!normalizedQuery) {
    return { valid: false, error: 'Query cannot be empty' };
  }

  // Check against blocked patterns
  for (const { pattern, message } of BLOCKED_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return { valid: false, error: message };
    }
  }

  // Ensure it starts with SELECT (or allowed commands)
  const allowedPrefixes = ['SELECT', 'SHOW', 'DESCRIBE', 'DESC', 'EXPLAIN'];
  const upperQuery = normalizedQuery.toUpperCase();
  const startsWithAllowed = allowedPrefixes.some(prefix =>
    upperQuery.startsWith(prefix)
  );

  if (!startsWithAllowed) {
    return {
      valid: false,
      error: 'Only SELECT, SHOW, DESCRIBE, and EXPLAIN queries are allowed'
    };
  }

  return { valid: true };
}

/**
 * Execute a query against a challenge database
 * @param {string} dbName - The database name
 * @param {string} query - The SQL query
 * @param {number} limit - Maximum rows to return
 * @returns {Promise<{ rows: any[], rowCount: number, executionTimeMs: number }>}
 */
export async function executeQuery(dbName, query, limit = MAX_RESULT_ROWS) {
  // First validate the command
  const validation = validateCommand(query);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const connection = await getStudentConnection(dbName);
  const startTime = Date.now();

  try {
    // Add LIMIT clause if not present (for SELECT queries)
    let limitedQuery = query.trim();
    if (limitedQuery.toUpperCase().startsWith('SELECT') &&
        !limitedQuery.toUpperCase().includes('LIMIT')) {
      // Remove trailing semicolon if present
      limitedQuery = limitedQuery.replace(/;$/, '');
      limitedQuery = `${limitedQuery} LIMIT ${limit}`;
    }

    const [rows] = await executeWithTimeout(connection, limitedQuery, [], QUERY_TIMEOUT);
    const executionTimeMs = Date.now() - startTime;

    // Handle different result types
    let resultRows = Array.isArray(rows) ? rows : [];

    // Limit rows if still exceeds
    if (resultRows.length > limit) {
      resultRows = resultRows.slice(0, limit);
    }

    return {
      rows: resultRows,
      rowCount: resultRows.length,
      executionTimeMs,
      truncated: resultRows.length >= limit
    };
  } finally {
    connection.release();
  }
}

/**
 * Generate a hash of query results for comparison
 * @param {any[]} rows - The query result rows
 * @returns {string}
 */
export function hashResult(rows) {
  // Sort rows and columns to ensure consistent hashing
  const normalized = normalizeResultSet(rows);
  const jsonString = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

/**
 * Normalize a result set for consistent comparison
 * @param {any[]} rows - The query result rows
 * @returns {any[]}
 */
export function normalizeResultSet(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  // Get column names from first row and sort them
  const columns = Object.keys(rows[0]).sort();

  // Map rows to arrays of values in sorted column order
  const normalized = rows.map(row => {
    return columns.map(col => {
      const value = row[col];
      // Normalize values for comparison
      if (value === null || value === undefined) {
        return null;
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === 'number') {
        // Round to avoid floating point issues
        return Math.round(value * 1000000) / 1000000;
      }
      if (typeof value === 'string') {
        return value.trim().toLowerCase();
      }
      return String(value);
    });
  });

  // Sort rows for order-independent comparison
  normalized.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

  return { columns, rows: normalized };
}

/**
 * Compare user result with expected result
 * @param {any[]} userResult - User's query result
 * @param {string|any[]} expectedResult - Expected result (JSON string or array)
 * @returns {{ match: boolean, details?: string }}
 */
export function compareResults(userResult, expectedResult) {
  // Parse expected result if it's a string
  let expected;
  try {
    expected = typeof expectedResult === 'string'
      ? JSON.parse(expectedResult)
      : expectedResult;
  } catch (e) {
    return { match: false, details: 'Invalid expected result format' };
  }

  // Normalize both result sets
  const normalizedUser = normalizeResultSet(userResult);
  const normalizedExpected = normalizeResultSet(expected);

  // Compare
  const userHash = hashResult(userResult);
  const expectedHash = typeof expected === 'string'
    ? expected
    : hashResult(expected);

  if (userHash === expectedHash) {
    return { match: true };
  }

  // Provide detailed comparison feedback
  if (normalizedUser.columns?.length !== normalizedExpected.columns?.length) {
    return {
      match: false,
      details: `Column count mismatch: got ${normalizedUser.columns?.length || 0}, expected ${normalizedExpected.columns?.length || 0}`
    };
  }

  if (normalizedUser.rows?.length !== normalizedExpected.rows?.length) {
    return {
      match: false,
      details: `Row count mismatch: got ${normalizedUser.rows?.length || 0}, expected ${normalizedExpected.rows?.length || 0}`
    };
  }

  return {
    match: false,
    details: 'Result values do not match the expected output'
  };
}

/**
 * Check if query contains required SQL keywords
 * @param {string} query - The SQL query
 * @param {string|string[]} requiredKeywords - Required keywords (comma-separated string or array)
 * @returns {{ allMatched: boolean, matched: string[], missing: string[] }}
 */
export function checkKeywords(query, requiredKeywords) {
  // Parse keywords
  let keywords;
  if (typeof requiredKeywords === 'string') {
    keywords = requiredKeywords.split(',').map(k => k.trim().toUpperCase()).filter(k => k);
  } else if (Array.isArray(requiredKeywords)) {
    keywords = requiredKeywords.map(k => k.trim().toUpperCase()).filter(k => k);
  } else {
    return { allMatched: true, matched: [], missing: [] };
  }

  if (keywords.length === 0) {
    return { allMatched: true, matched: [], missing: [] };
  }

  const upperQuery = query.toUpperCase();
  const matched = [];
  const missing = [];

  for (const keyword of keywords) {
    // Create a word-boundary regex for accurate matching
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(upperQuery)) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  return {
    allMatched: missing.length === 0,
    matched,
    missing
  };
}

/**
 * Full validation of a query against a challenge
 * @param {object} params - Validation parameters
 * @returns {Promise<object>}
 */
export async function validateQueryAgainstChallenge({
  query,
  databaseName,
  expectedResult,
  requiredKeywords,
  userId,
  challengeId
}) {
  const startTime = Date.now();

  // Step 1: Validate command syntax
  const commandValidation = validateCommand(query);
  if (!commandValidation.valid) {
    return {
      success: false,
      error: commandValidation.error,
      query,
      executionTimeMs: Date.now() - startTime
    };
  }

  try {
    // Step 2: Execute the query
    const { rows, rowCount, executionTimeMs, truncated } = await executeQuery(databaseName, query);

    // Step 3: Check required keywords
    const keywordCheck = checkKeywords(query, requiredKeywords);

    // Step 4: Compare results
    const resultComparison = expectedResult
      ? compareResults(rows, expectedResult)
      : { match: true };

    // Calculate final result
    const isCorrect = resultComparison.match && keywordCheck.allMatched;

    return {
      success: true,
      isCorrect,
      query,
      rowCount,
      executionTimeMs,
      truncated,
      resultHash: hashResult(rows),
      resultMatch: resultComparison.match,
      resultDetails: resultComparison.details,
      keywordsMatched: keywordCheck.matched,
      keywordsMissing: keywordCheck.missing,
      rows: isCorrect ? rows : undefined // Only return rows if correct
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      query,
      executionTimeMs: Date.now() - startTime
    };
  }
}

/**
 * Execute teacher's expected query and store result
 * @param {string} dbName - Database name
 * @param {string} expectedQuery - The expected query
 * @returns {Promise<{ rows: any[], hash: string }>}
 */
export async function generateExpectedResult(dbName, expectedQuery) {
  // Validate the query first
  const validation = validateCommand(expectedQuery);
  if (!validation.valid) {
    throw new Error(`Invalid expected query: ${validation.error}`);
  }

  const { rows, rowCount, executionTimeMs } = await executeQuery(dbName, expectedQuery, MAX_RESULT_ROWS);

  return {
    rows,
    rowCount,
    executionTimeMs,
    hash: hashResult(rows),
    resultJson: JSON.stringify(rows)
  };
}
