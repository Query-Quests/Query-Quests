/**
 * Database Processor Service
 * Handles SQL file upload processing, MySQL database creation, and schema extraction
 */

import { promises as fs } from 'fs';
import path from 'path';
import { getAdminPool, getAdminConnection } from './mysql-connection';
import { prisma } from './prisma';

/**
 * Generate a safe MySQL database name from the file name
 */
export function generateDbName(filename, uniqueId) {
  // Remove extension and special characters
  const baseName = path.basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 40);

  // Add unique suffix
  const suffix = uniqueId.substring(0, 8);
  return `challenge_${baseName}_${suffix}`;
}

/**
 * Create a new MySQL database
 */
export async function createMySqlDatabase(dbName) {
  const pool = getAdminPool();
  const connection = await pool.getConnection();

  try {
    // Create the database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    return { success: true, dbName };
  } finally {
    connection.release();
  }
}

/**
 * Import SQL file into a database
 */
export async function importSqlFile(dbName, filepath) {
  const pool = getAdminPool();
  const connection = await pool.getConnection();

  try {
    // Read the SQL file
    const sqlContent = await fs.readFile(filepath, 'utf-8');

    // Switch to the target database
    await connection.query(`USE \`${dbName}\``);

    // Split the SQL file into individual statements
    // Handle different statement delimiters
    const statements = splitSqlStatements(sqlContent);

    // Execute each statement
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('/*')) {
        try {
          await connection.query(trimmed);
        } catch (error) {
          // Log but continue with other statements
          console.warn(`Warning executing statement: ${error.message}`);
          // Re-throw if it's a critical error
          if (error.code === 'ER_SYNTAX_ERROR') {
            throw error;
          }
        }
      }
    }

    return { success: true };
  } finally {
    connection.release();
  }
}

/**
 * Split SQL content into individual statements
 */
function splitSqlStatements(sqlContent) {
  const statements = [];
  let currentStatement = '';
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sqlContent.length; i++) {
    const char = sqlContent[i];
    const nextChar = sqlContent[i + 1];

    // Handle block comments
    if (!inString && char === '/' && nextChar === '*') {
      inBlockComment = true;
      currentStatement += char;
      continue;
    }
    if (inBlockComment && char === '*' && nextChar === '/') {
      inBlockComment = false;
      currentStatement += char + nextChar;
      i++;
      continue;
    }
    if (inBlockComment) {
      currentStatement += char;
      continue;
    }

    // Handle line comments
    if (!inString && char === '-' && nextChar === '-') {
      inComment = true;
    }
    if (inComment && (char === '\n' || char === '\r')) {
      inComment = false;
    }
    if (inComment) {
      currentStatement += char;
      continue;
    }

    // Handle strings
    if ((char === "'" || char === '"' || char === '`') && !inString) {
      inString = true;
      stringChar = char;
    } else if (char === stringChar && inString) {
      // Check for escaped quote
      if (nextChar === stringChar) {
        currentStatement += char + nextChar;
        i++;
        continue;
      }
      inString = false;
      stringChar = '';
    }

    // Handle statement delimiter
    if (char === ';' && !inString) {
      currentStatement += char;
      statements.push(currentStatement.trim());
      currentStatement = '';
      continue;
    }

    currentStatement += char;
  }

  // Add the last statement if any
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

/**
 * Extract database schema information
 */
export async function extractSchema(dbName) {
  const connection = await getAdminConnection(dbName);

  try {
    // Get all tables
    const [tables] = await connection.query(
      `SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, CREATE_TIME
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ?`,
      [dbName]
    );

    const schema = {
      tables: [],
      totalTables: tables.length,
      totalRows: 0
    };

    for (const table of tables) {
      // Get columns for each table
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
        [dbName, table.TABLE_NAME]
      );

      // Get accurate row count
      const [countResult] = await connection.query(
        `SELECT COUNT(*) as count FROM \`${table.TABLE_NAME}\``
      );
      const rowCount = countResult[0]?.count || 0;

      schema.tables.push({
        name: table.TABLE_NAME,
        rowCount: rowCount,
        columns: columns.map(col => ({
          name: col.COLUMN_NAME,
          type: col.DATA_TYPE,
          nullable: col.IS_NULLABLE === 'YES',
          key: col.COLUMN_KEY,
          default: col.COLUMN_DEFAULT,
          extra: col.EXTRA
        }))
      });

      schema.totalRows += rowCount;
    }

    return schema;
  } finally {
    connection.release();
  }
}

/**
 * Grant read-only access to student user for a database
 */
export async function grantReadOnlyAccess(dbName) {
  const pool = getAdminPool();
  const connection = await pool.getConnection();

  try {
    const studentUser = process.env.CHALLENGE_DB_STUDENT_USER || 'student_readonly';
    const teacherUser = process.env.CHALLENGE_DB_TEACHER_USER || 'teacher_preview';

    // Grant SELECT privilege to student user
    await connection.query(`GRANT SELECT ON \`${dbName}\`.* TO '${studentUser}'@'%'`);

    // Grant SELECT privilege to teacher user
    await connection.query(`GRANT SELECT ON \`${dbName}\`.* TO '${teacherUser}'@'%'`);

    // Apply the grants
    await connection.query('FLUSH PRIVILEGES');

    return { success: true };
  } finally {
    connection.release();
  }
}

/**
 * Drop a challenge database
 */
export async function dropDatabase(dbName) {
  const pool = getAdminPool();
  const connection = await pool.getConnection();

  try {
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    return { success: true };
  } finally {
    connection.release();
  }
}

/**
 * Process an uploaded database file
 * Main entry point for database processing
 */
export async function processUploadedDatabase(databaseId) {
  // Get the database record
  const dbRecord = await prisma.challengeDatabase.findUnique({
    where: { id: databaseId }
  });

  if (!dbRecord) {
    throw new Error('Database record not found');
  }

  try {
    // Update status to processing
    await updateDatabaseStatus(databaseId, 'processing', {});

    // Step 1: Create the MySQL database
    await createMySqlDatabase(dbRecord.mysqlDbName);

    // Step 2: Import the SQL file
    await importSqlFile(dbRecord.mysqlDbName, dbRecord.filepath);

    // Step 3: Extract schema information
    const schema = await extractSchema(dbRecord.mysqlDbName);

    // Step 4: Grant read-only access
    await grantReadOnlyAccess(dbRecord.mysqlDbName);

    // Step 5: Update the record with success status
    await updateDatabaseStatus(databaseId, 'ready', {
      tableCount: schema.totalTables,
      rowCount: schema.totalRows,
      schemaPreview: JSON.stringify(schema)
    });

    return { success: true, schema };
  } catch (error) {
    console.error('Error processing database:', error);

    // Update status to error
    await updateDatabaseStatus(databaseId, 'error', {
      errorMessage: error.message
    });

    // Clean up: try to drop the database if it was created
    try {
      await dropDatabase(dbRecord.mysqlDbName);
    } catch (cleanupError) {
      console.error('Error cleaning up database:', cleanupError);
    }

    throw error;
  }
}

/**
 * Update database record status
 */
export async function updateDatabaseStatus(databaseId, status, metadata = {}) {
  return prisma.challengeDatabase.update({
    where: { id: databaseId },
    data: {
      status,
      ...metadata,
      updated_at: new Date()
    }
  });
}

/**
 * Get sample data from a table
 */
export async function getSampleData(dbName, tableName, limit = 5) {
  const connection = await getAdminConnection(dbName);

  try {
    const [rows] = await connection.query(
      `SELECT * FROM \`${tableName}\` LIMIT ?`,
      [limit]
    );
    return rows;
  } finally {
    connection.release();
  }
}

/**
 * Validate SQL file before processing
 */
export async function validateSqlFile(filepath) {
  try {
    const content = await fs.readFile(filepath, 'utf-8');

    // Check file is not empty
    if (!content.trim()) {
      return { valid: false, error: 'SQL file is empty' };
    }

    // Check for dangerous operations (we'll block these)
    const dangerousPatterns = [
      /\bDROP\s+DATABASE\b/i,
      /\bSHUTDOWN\b/i,
      /\bGRANT\b/i,
      /\bREVOKE\b/i,
      /\bCREATE\s+USER\b/i,
      /\bDROP\s+USER\b/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        return {
          valid: false,
          error: 'SQL file contains prohibited commands (DROP DATABASE, GRANT, REVOKE, etc.)'
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Could not read SQL file: ${error.message}` };
  }
}
