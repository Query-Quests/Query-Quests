/**
 * One-shot seeder: spins up a `library_catalog` MySQL database on the
 * challenge server and registers it as a `ChallengeDatabase` with four
 * fully-wired challenges.
 *
 * Mirrors the pattern in `prisma/wire-practice-db.js` — runs the canonical
 * solution against the live data to capture deterministic expectedResult
 * + expectedHash, so the existing validator path Just Works.
 *
 * Idempotent: re-running drops + re-creates the schema and re-captures.
 */

const { PrismaClient } = require("@prisma/client");
const mysql = require("mysql2/promise");
const crypto = require("crypto");

const prisma = new PrismaClient();
const DB_NAME = "library_catalog";

// ---------- Schema + seed data ----------------------------------------------

const SCHEMA_STATEMENTS = [
  `DROP TABLE IF EXISTS loans`,
  `DROP TABLE IF EXISTS books`,
  `DROP TABLE IF EXISTS members`,
  `DROP TABLE IF EXISTS authors`,
  `CREATE TABLE authors (
     id INT PRIMARY KEY AUTO_INCREMENT,
     name VARCHAR(120) NOT NULL,
     country VARCHAR(60) NOT NULL,
     birth_year INT NOT NULL
   )`,
  `CREATE TABLE books (
     id INT PRIMARY KEY AUTO_INCREMENT,
     title VARCHAR(180) NOT NULL,
     author_id INT NOT NULL,
     genre VARCHAR(60) NOT NULL,
     published_year INT NOT NULL,
     copies_total INT NOT NULL,
     copies_available INT NOT NULL,
     FOREIGN KEY (author_id) REFERENCES authors(id)
   )`,
  `CREATE TABLE members (
     id INT PRIMARY KEY AUTO_INCREMENT,
     name VARCHAR(120) NOT NULL,
     email VARCHAR(180) NOT NULL UNIQUE,
     joined_at DATE NOT NULL
   )`,
  `CREATE TABLE loans (
     id INT PRIMARY KEY AUTO_INCREMENT,
     book_id INT NOT NULL,
     member_id INT NOT NULL,
     loaned_at DATE NOT NULL,
     due_at DATE NOT NULL,
     returned_at DATE,
     FOREIGN KEY (book_id) REFERENCES books(id),
     FOREIGN KEY (member_id) REFERENCES members(id)
   )`,
];

const AUTHORS = [
  // id, name, country, birth_year
  [1, "Gabriel García Márquez", "Colombia", 1927],
  [2, "Jane Austen",            "United Kingdom", 1775],
  [3, "Haruki Murakami",        "Japan", 1949],
  [4, "Chimamanda Ngozi Adichie", "Nigeria", 1977],
  [5, "Isabel Allende",         "Chile", 1942],
  [6, "George Orwell",          "United Kingdom", 1903],
];

const BOOKS = [
  // id, title, author_id, genre, published_year, copies_total, copies_available
  [1,  "Cien años de soledad",              1, "Fiction", 1967, 4, 1],
  [2,  "El amor en los tiempos del cólera", 1, "Fiction", 1985, 3, 3],
  [3,  "Pride and Prejudice",               2, "Fiction", 1813, 5, 2],
  [4,  "Emma",                              2, "Fiction", 1815, 2, 2],
  [5,  "Norwegian Wood",                    3, "Fiction", 1987, 3, 0],
  [6,  "Kafka on the Shore",                3, "Fiction", 2002, 2, 1],
  [7,  "Half of a Yellow Sun",              4, "Fiction", 2006, 3, 3],
  [8,  "Americanah",                        4, "Fiction", 2013, 4, 2],
  [9,  "La casa de los espíritus",          5, "Fiction", 1982, 3, 2],
  [10, "1984",                              6, "Dystopian", 1949, 5, 1],
  [11, "Animal Farm",                       6, "Satire", 1945, 4, 4],
  [12, "Homage to Catalonia",               6, "Memoir", 1938, 2, 2],
];

const MEMBERS = [
  [1, "Ana Pérez",     "ana@example.com",    "2024-01-12"],
  [2, "Luis Gómez",    "luis@example.com",   "2024-03-04"],
  [3, "Marta Sánchez", "marta@example.com",  "2024-06-21"],
  [4, "Carlos Ruiz",   "carlos@example.com", "2025-02-15"],
  [5, "Sofia Núñez",   "sofia@example.com",  "2025-09-30"],
];

// `today` reference for "currently overdue" challenge — fixed seed date so
// the result set is deterministic. Using 2026-04-25 (today's date) so the
// math is intuitive.
const SEED_TODAY = "2026-04-25";

const LOANS = [
  // id, book_id, member_id, loaned_at, due_at, returned_at
  [1,  1,  1, "2026-01-10", "2026-01-31", "2026-01-28"], // returned on time
  [2,  1,  2, "2026-02-05", "2026-02-26", "2026-02-22"], // returned on time
  [3,  1,  3, "2026-03-01", "2026-03-22", null],         // OVERDUE
  [4,  3,  1, "2026-02-14", "2026-03-07", "2026-03-05"], // returned
  [5,  3,  4, "2026-03-20", "2026-04-10", null],         // OVERDUE
  [6,  3,  5, "2026-04-15", "2026-05-06", null],         // not yet overdue
  [7,  5,  2, "2026-01-20", "2026-02-10", "2026-02-08"],
  [8,  5,  3, "2026-02-15", "2026-03-08", "2026-03-04"],
  [9,  5,  4, "2026-04-01", "2026-04-22", null],         // OVERDUE
  [10, 6,  1, "2026-03-15", "2026-04-05", "2026-04-03"],
  [11, 8,  3, "2026-02-28", "2026-03-21", "2026-03-19"],
  [12, 8,  5, "2026-04-10", "2026-05-01", null],         // not yet overdue
  [13, 9,  2, "2026-03-05", "2026-03-26", "2026-03-25"],
  [14, 10, 1, "2026-01-08", "2026-01-29", "2026-01-25"],
  [15, 10, 2, "2026-02-12", "2026-03-05", "2026-03-04"],
  [16, 10, 3, "2026-03-18", "2026-04-08", null],         // OVERDUE
  [17, 10, 4, "2026-04-08", "2026-04-29", null],         // not overdue yet
];
// Books never borrowed in the seed: 2 (Cólera), 4 (Emma), 7 (Half of...), 11 (Animal Farm), 12 (Homage)

// ---------- Challenges (canonical solutions are deterministic) ---------------

const CHALLENGES = [
  {
    name: "Catálogo de ficción",
    statement: "List all books in the 'Fiction' genre. Return title and published_year, ordered by title ascending.",
    level: 1,
    score_base: 100,
    score_min: 50,
    solution: "SELECT title, published_year FROM books WHERE genre = 'Fiction' ORDER BY title ASC;",
    help: "Use a WHERE clause on `genre`, then ORDER BY title.",
  },
  {
    name: "Autores prolíficos",
    statement: "For each author, return their name and the number of books they have written. Alias the count as `book_count`. Order by `book_count` descending, then by name ascending.",
    level: 2,
    score_base: 200,
    score_min: 100,
    solution: "SELECT a.name, COUNT(b.id) AS book_count FROM authors a LEFT JOIN books b ON b.author_id = a.id GROUP BY a.id, a.name ORDER BY book_count DESC, a.name ASC;",
    help: "GROUP BY the author and COUNT the books. Use LEFT JOIN so every author appears even if no books exist.",
  },
  {
    name: "Libros nunca prestados",
    statement: "Find every book that has never been loaned. Return title and genre, ordered by title.",
    level: 3,
    score_base: 250,
    score_min: 125,
    solution: "SELECT b.title, b.genre FROM books b WHERE NOT EXISTS (SELECT 1 FROM loans l WHERE l.book_id = b.id) ORDER BY b.title ASC;",
    help: "Try a LEFT JOIN with IS NULL on the loans side, or a NOT EXISTS subquery.",
  },
  {
    name: "Préstamos vencidos",
    statement: "Find every loan that is currently overdue — not yet returned and whose due date is before 2026-04-25. Return the member name, the book title, and the due_at date, ordered by due_at ascending.",
    level: 4,
    score_base: 300,
    score_min: 150,
    solution: "SELECT m.name, b.title, l.due_at FROM loans l JOIN members m ON m.id = l.member_id JOIN books b ON b.id = l.book_id WHERE l.returned_at IS NULL AND l.due_at < '2026-04-25' ORDER BY l.due_at ASC;",
    help: "Join loans → members and loans → books. Filter to NULL returned_at and a fixed cutoff date.",
  },
];

// ---------- Connection / DB management --------------------------------------

function adminPool(database = null) {
  return mysql.createPool({
    host: process.env.CHALLENGE_DB_HOST || "127.0.0.1",
    port: parseInt(process.env.CHALLENGE_DB_PORT || "3306", 10),
    user: process.env.CHALLENGE_DB_ADMIN_USER || "db_admin",
    password: process.env.CHALLENGE_DB_ADMIN_PASSWORD || "db_admin_pass",
    database: database || undefined,
    connectionLimit: 4,
    multipleStatements: false,
  });
}

async function rebuildSchema() {
  // Step 1 — connect without a default DB so we can CREATE DATABASE.
  const root = adminPool();
  try {
    await root.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    // Make sure the read-only student user can SELECT here too.
    const studentUser = process.env.CHALLENGE_DB_STUDENT_USER || "student_readonly";
    try {
      await root.query(`GRANT SELECT ON \`${DB_NAME}\`.* TO '${studentUser}'@'%'`);
      await root.query(`FLUSH PRIVILEGES`);
    } catch (e) {
      console.log(`⚠ Could not grant SELECT to ${studentUser}: ${e.message}`);
    }
  } finally {
    await root.end();
  }

  // Step 2 — apply schema + seed inside the new DB.
  const pool = adminPool(DB_NAME);
  try {
    for (const sql of SCHEMA_STATEMENTS) await pool.query(sql);

    await pool.query(
      "INSERT INTO authors (id, name, country, birth_year) VALUES ?",
      [AUTHORS],
    );
    await pool.query(
      "INSERT INTO books (id, title, author_id, genre, published_year, copies_total, copies_available) VALUES ?",
      [BOOKS],
    );
    await pool.query(
      "INSERT INTO members (id, name, email, joined_at) VALUES ?",
      [MEMBERS],
    );
    await pool.query(
      "INSERT INTO loans (id, book_id, member_id, loaned_at, due_at, returned_at) VALUES ?",
      [LOANS],
    );
  } finally {
    await pool.end();
  }
}

// ---------- ChallengeDatabase + Challenge wiring ----------------------------

function hashRows(rows) {
  return crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

async function captureExpected(sql) {
  const pool = adminPool(DB_NAME);
  try {
    const [rows] = await pool.query(sql);
    return Array.isArray(rows) ? rows : [];
  } finally {
    await pool.end();
  }
}

async function ensureChallengeDatabase() {
  const creator =
    (await prisma.user.findFirst({ where: { isAdmin: true } })) ||
    (await prisma.user.findFirst({ where: { isTeacher: true } }));
  if (!creator) throw new Error("Need an admin/teacher user to own the database row");

  const data = {
    name: "Library catalog (authors / books / members / loans)",
    description:
      "A library lending domain — Phase B challenges around joins, aggregation, anti-joins, and date filtering.",
    filename: "library_catalog.sql",
    filepath: "/data/library_catalog.sql",
    filesize: 0,
    mysqlDbName: DB_NAME,
    tableCount: 4,
    rowCount: AUTHORS.length + BOOKS.length + MEMBERS.length + LOANS.length,
    schemaPreview: [
      "authors(id, name, country, birth_year)",
      "books(id, title, author_id, genre, published_year, copies_total, copies_available)",
      "members(id, name, email, joined_at)",
      "loans(id, book_id, member_id, loaned_at, due_at, returned_at)",
    ].join("\n"),
    status: "ready",
    creator_id: creator.id,
  };

  const existing = await prisma.challengeDatabase.findUnique({
    where: { mysqlDbName: DB_NAME },
  });
  if (existing) {
    return prisma.challengeDatabase.update({ where: { id: existing.id }, data });
  }
  return prisma.challengeDatabase.create({ data });
}

async function wireChallenges(challengeDb) {
  for (const c of CHALLENGES) {
    let rows;
    try {
      rows = await captureExpected(c.solution);
    } catch (e) {
      console.log(`! "${c.name}" — solution failed: ${e.message}`);
      continue;
    }
    const expectedJson = JSON.stringify(rows);
    const expectedHash = hashRows(rows);

    // Upsert by (name, database_id) so re-runs are idempotent.
    const existing = await prisma.challenge.findFirst({
      where: { name: c.name, database_id: challengeDb.id },
    });

    const challenge = existing
      ? await prisma.challenge.update({
          where: { id: existing.id },
          data: {
            statement: c.statement,
            level: c.level,
            initial_score: c.score_base,
            current_score: c.score_base,
            solution: c.solution,
            help: c.help,
            database_id: challengeDb.id,
            expectedResult: expectedJson,
          },
        })
      : await prisma.challenge.create({
          data: {
            name: c.name,
            statement: c.statement,
            level: c.level,
            initial_score: c.score_base,
            current_score: c.score_base,
            solution: c.solution,
            help: c.help,
            database_id: challengeDb.id,
            expectedResult: expectedJson,
          },
        });

    const ds = await prisma.challengeDataset.findFirst({
      where: { challenge_id: challenge.id, database_id: challengeDb.id },
    });
    if (ds) {
      await prisma.challengeDataset.update({
        where: { id: ds.id },
        data: { expectedResult: expectedJson, expectedHash },
      });
    } else {
      await prisma.challengeDataset.create({
        data: {
          challenge_id: challenge.id,
          database_id: challengeDb.id,
          is_public: true,
          expectedResult: expectedJson,
          expectedHash,
          dataset_version: 1,
          display_order: 0,
        },
      });
    }
    console.log(`+ "${c.name}" — ${rows.length} rows captured (id=${challenge.id})`);
  }
}

async function main() {
  console.log(`📚 Seeding library_catalog → MySQL …`);
  await rebuildSchema();
  console.log(`✓ schema rebuilt + ${AUTHORS.length}/${BOOKS.length}/${MEMBERS.length}/${LOANS.length} rows inserted`);

  console.log(`🧷 Registering ChallengeDatabase + wiring challenges …`);
  const challengeDb = await ensureChallengeDatabase();
  await wireChallenges(challengeDb);
  console.log(`✅ Done. mysqlDbName=${DB_NAME} (id=${challengeDb.id})`);
  console.log(`   Seed cutoff date for overdue challenge: ${SEED_TODAY}`);
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
