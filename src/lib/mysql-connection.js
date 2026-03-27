/**
 * MySQL Connection Pool Manager
 * Manages connections to the challenge database server
 */

import mysql from 'mysql2/promise';

// Connection pool for admin operations (database creation, schema extraction)
let adminPool = null;

// Connection pool for student queries (read-only)
let studentPool = null;

// Connection pool for teacher preview queries
let teacherPool = null;

/**
 * Get the admin connection pool (for database management)
 */
export function getAdminPool() {
  if (!adminPool) {
    adminPool = mysql.createPool({
      host: process.env.CHALLENGE_DB_HOST || 'localhost',
      port: parseInt(process.env.CHALLENGE_DB_PORT || '3306'),
      user: process.env.CHALLENGE_DB_ADMIN_USER || 'db_admin',
      password: process.env.CHALLENGE_DB_ADMIN_PASSWORD || 'db_admin_pass',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
    });
  }
  return adminPool;
}

/**
 * Get the student connection pool (read-only, for challenge execution)
 */
export function getStudentPool() {
  if (!studentPool) {
    studentPool = mysql.createPool({
      host: process.env.CHALLENGE_DB_HOST || 'localhost',
      port: parseInt(process.env.CHALLENGE_DB_PORT || '3306'),
      user: process.env.CHALLENGE_DB_STUDENT_USER || 'student_readonly',
      password: process.env.CHALLENGE_DB_STUDENT_PASSWORD || 'student_readonly_pass',
      waitForConnections: true,
      connectionLimit: 50,
      queueLimit: 0,
      multipleStatements: false,
    });
  }
  return studentPool;
}

/**
 * Get the teacher connection pool (for preview queries)
 */
export function getTeacherPool() {
  if (!teacherPool) {
    teacherPool = mysql.createPool({
      host: process.env.CHALLENGE_DB_HOST || 'localhost',
      port: parseInt(process.env.CHALLENGE_DB_PORT || '3306'),
      user: process.env.CHALLENGE_DB_ADMIN_USER || 'db_admin',
      password: process.env.CHALLENGE_DB_ADMIN_PASSWORD || 'db_admin_pass',
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
      multipleStatements: false,
    });
  }
  return teacherPool;
}

/**
 * Get a connection to a specific database for student queries
 */
export async function getStudentConnection(databaseName) {
  const pool = getStudentPool();
  const connection = await pool.getConnection();

  // Switch to the specific database
  await connection.query(`USE \`${databaseName}\``);

  return connection;
}

/**
 * Get a connection to a specific database for admin operations
 */
export async function getAdminConnection(databaseName = null) {
  const pool = getAdminPool();
  const connection = await pool.getConnection();

  if (databaseName) {
    await connection.query(`USE \`${databaseName}\``);
  }

  return connection;
}

/**
 * Execute a query with a timeout
 */
export async function executeWithTimeout(connection, query, params = [], timeoutMs = 30000) {
  return new Promise(async (resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Query execution timed out'));
    }, timeoutMs);

    try {
      const result = await connection.query(query, params);
      clearTimeout(timer);
      resolve(result);
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

/**
 * Close all connection pools
 */
export async function closeAllPools() {
  const promises = [];

  if (adminPool) {
    promises.push(adminPool.end());
    adminPool = null;
  }

  if (studentPool) {
    promises.push(studentPool.end());
    studentPool = null;
  }

  if (teacherPool) {
    promises.push(teacherPool.end());
    teacherPool = null;
  }

  await Promise.all(promises);
}

/**
 * Test database connectivity
 */
export async function testConnection() {
  try {
    const pool = getAdminPool();
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
