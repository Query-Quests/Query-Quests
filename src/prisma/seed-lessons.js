const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const modulesSpec = [
  {
    title: 'SQL Fundamentals',
    description:
      'The essentials: SELECT, FROM, WHERE, ORDER BY. Build your first queries against real-looking schemas.',
    order: 1,
    lessons: [
      {
        title: 'Introduction to SQL',
        description:
          'What SQL is, why relational databases use it, and the building blocks you will meet in every query.',
        content: `SQL (Structured Query Language) is the standard language for talking to relational databases. Every query you write asks the database for rows from one or more **tables** — collections of data organised into columns and rows.

## Why relational databases

Relational databases solve three problems at once:

- **Avoid duplication** — store each fact in exactly one place.
- **Stay consistent** — foreign keys and constraints catch bad data before it lands.
- **Answer ad-hoc questions** — the same data powers reports, dashboards, and APIs.

A single \`users\` table holds every user; their orders live in \`orders\`; their reviews live in \`reviews\`. SQL is how you stitch them back together.

## What a query looks like

\`\`\`sql
SELECT name, email
FROM users
WHERE last_login > '2026-01-01';
\`\`\`

The \`SELECT\` clause picks columns. \`FROM\` picks the table. \`WHERE\` filters rows. SQL is **declarative** — you describe the result you want, the database engine figures out how to build it.

## Conventions

- Keywords (\`SELECT\`, \`FROM\`, \`WHERE\`) are case-insensitive but conventionally written in uppercase.
- Identifiers (\`users\`, \`name\`) are usually lowercase with underscores.
- Statements end with a semicolon \`;\`.
- Inline comments use \`-- like this\`; block comments use \`/* … */\`.

You will spend the rest of this course refining these four lines. Everything else — joins, aggregates, subqueries — is a variation on \`SELECT … FROM … WHERE\`.`,
      },
      {
        title: 'SELECT statement basics',
        description:
          'Retrieve rows from a table. The most common SQL operation and the foundation of every query.',
        content: `The \`SELECT\` statement retrieves rows from one or more tables. It is the most common SQL operation and forms the foundation of every query.

## Basic syntax

\`\`\`sql
SELECT column1, column2
FROM table_name;
\`\`\`

You list the columns you want, separated by commas. The database returns one row per matching row in the table.

## Selecting every column

\`\`\`sql
SELECT * FROM products;
\`\`\`

\`*\` is convenient for ad-hoc inspection but **avoid it in production** — explicit column lists are clearer, faster, and survive table changes (a new column won't silently appear in your app).

## Computed columns and aliases

You can compute new values inline and rename them with \`AS\`:

\`\`\`sql
SELECT
  name,
  price,
  price * 1.21 AS price_with_vat
FROM products;
\`\`\`

The \`AS\` keyword is optional (\`price * 1.21 price_with_vat\` works too) but always use it — it makes intent obvious.

## Practical recipe

When in doubt, build queries left-to-right:

1. Which **table** has the data? → \`FROM\`
2. Which **rows** do I want? → \`WHERE\`
3. Which **columns**? → \`SELECT\`
4. **Sorted** how? → \`ORDER BY\`

Writing the \`SELECT\` last (even though it appears first) keeps you focused on the data, not the presentation.`,
      },
      {
        title: 'WHERE & comparison operators',
        description:
          'Filter rows with predicates. Combine conditions with AND, OR, NOT — and watch out for NULL.',
        content: `The \`WHERE\` clause filters rows so you only get the ones you care about. The database checks every row against your predicate and returns the ones that evaluate to **true**.

## Comparison operators

\`\`\`sql
SELECT name, age
FROM users
WHERE age >= 18
  AND age < 65;
\`\`\`

The operators you'll use every day:

- \`=\`, \`<>\` (or \`!=\`) — equal, not equal
- \`<\`, \`<=\`, \`>\`, \`>=\` — ordering
- \`BETWEEN a AND b\` — inclusive range
- \`IN (…)\` — membership in a small list
- \`LIKE 'pat%'\` — text pattern (\`%\` = any string, \`_\` = single char)

## Combining conditions

Use \`AND\`, \`OR\`, and parentheses to compose predicates. **Always** parenthesise mixed \`AND\`/\`OR\` — operator precedence is a footgun.

\`\`\`sql
SELECT *
FROM products
WHERE (category = 'books' OR category = 'music')
  AND price < 30;
\`\`\`

## NULL is not a value

\`NULL\` means "unknown". \`column = NULL\` is **never true** — even \`NULL = NULL\` is unknown. Use \`IS NULL\` and \`IS NOT NULL\` instead:

\`\`\`sql
SELECT name
FROM users
WHERE last_login IS NOT NULL;
\`\`\`

This trips up every SQL beginner. When a query "returns nothing and I don't know why", check for \`NULL\`.

## Negation

\`NOT IN\` and \`NOT LIKE\` work the same way:

\`\`\`sql
SELECT name FROM products WHERE category NOT IN ('books', 'music');
\`\`\`

But \`NOT IN\` with a list that contains \`NULL\` returns nothing — another classic surprise. If in doubt, prefer \`NOT EXISTS\` (covered in a later module).`,
      },
      {
        title: 'ORDER BY and LIMIT',
        description:
          'Sort the result set, cap how many rows come back, and paginate.',
        content: `\`ORDER BY\` sorts rows by one or more columns. \`LIMIT\` (and its companion \`OFFSET\`) caps how many rows the database returns — useful for top-N queries and pagination.

## Basic sorting

\`\`\`sql
SELECT name, price
FROM products
ORDER BY price DESC;
\`\`\`

Default order is ascending (\`ASC\`); add \`DESC\` for descending. You can sort by multiple columns — the second column breaks ties on the first:

\`\`\`sql
SELECT name, category, price
FROM products
ORDER BY category ASC, price DESC;
\`\`\`

## Top-N queries

Combine with \`LIMIT\` for "top X" reports:

\`\`\`sql
SELECT name, price
FROM products
ORDER BY price DESC
LIMIT 5;
\`\`\`

The database first orders the full result, then takes the first \`N\` rows. With no \`ORDER BY\`, \`LIMIT\` returns an arbitrary slice — almost never what you want.

## Pagination

Use \`OFFSET\` to skip rows. For page 3 of a 20-per-page list:

\`\`\`sql
SELECT name, price
FROM products
ORDER BY id
LIMIT 20 OFFSET 40;
\`\`\`

Two warnings about offset-based pagination on large tables:

- The database still scans every skipped row, so deep pages get slow.
- New inserts shift every page after them. For stable pagination, use **keyset pagination** (\`WHERE id > :last_id\`).

## Sort by an expression

You can sort by a computed value too:

\`\`\`sql
SELECT name, price, stock
FROM products
ORDER BY price * stock DESC;
\`\`\`

Some engines also let you sort by a column **alias** defined in \`SELECT\` — handy for keeping the expression in one place.`,
      },
      {
        title: 'DISTINCT and column aliases',
        description:
          'De-duplicate result rows and rename columns for cleaner output.',
        content: `Two small but useful tools that show up in nearly every real query.

## DISTINCT — remove duplicate rows

When the column list isn't unique on its own, you'll see duplicates. \`DISTINCT\` removes them:

\`\`\`sql
SELECT DISTINCT category
FROM products;
\`\`\`

\`DISTINCT\` applies to the **whole row** (every column you selected), not to a single column. \`SELECT DISTINCT category, supplier\` returns each (category, supplier) pair once.

### When DISTINCT is a smell

If you find yourself sprinkling \`DISTINCT\` to "fix" duplicates, you usually have a join or filter problem upstream. Investigate before papering over it — the duplicates are often telling you the join is wrong.

## Column aliases

Rename a column in the result with \`AS\`:

\`\`\`sql
SELECT
  name        AS product_name,
  price * 1.21 AS price_with_vat
FROM products;
\`\`\`

Aliases make output friendly (your CSV exports won't say \`COUNT(*)\` anymore) and let you reference the new name in \`ORDER BY\` (engine-dependent).

## Table aliases

Tables can be aliased too — essential when joining:

\`\`\`sql
SELECT u.name, o.total
FROM users u
JOIN orders o ON o.user_id = u.id;
\`\`\`

Short aliases (\`u\`, \`o\`) keep queries readable and prevent ambiguous-column errors when two tables share a column name.`,
      },
    ],
  },
  {
    title: 'Joins & Relationships',
    description:
      'Combine data across tables with INNER, LEFT, RIGHT, self-joins, and multi-table joins.',
    order: 2,
    lessons: [
      {
        title: 'Why we need joins',
        description:
          'Relational data is split across tables. Joins put it back together along shared keys.',
        content: `Real schemas split data across many tables to avoid duplication. Each table holds one kind of thing — \`users\`, \`orders\`, \`products\` — connected by **foreign keys**. To answer questions that span tables ("which users placed an order last week?") you need a **join**.

## A schema in two tables

\`\`\`sql
-- users
-- ┌────┬────────────┬──────────────────────┐
-- │ id │ name       │ email                │
-- └────┴────────────┴──────────────────────┘

-- orders
-- ┌────┬─────────┬───────┬────────────┐
-- │ id │ user_id │ total │ created_at │
-- └────┴─────────┴───────┴────────────┘
\`\`\`

\`orders.user_id\` is a **foreign key** pointing at \`users.id\`. It says "this order belongs to this user." A join walks that relationship to pair each order row with the user who placed it.

## Without a join (don't do this)

You could fetch users, then loop in app code calling \`SELECT * FROM orders WHERE user_id = ?\` for each one. That's the classic **N+1 problem** — one query becomes hundreds of round trips.

## With a join (do this)

\`\`\`sql
SELECT o.id, u.name, o.total
FROM orders o
INNER JOIN users u ON u.id = o.user_id;
\`\`\`

The database walks the relationship for you in one query. The next four lessons cover the join types you'll actually use.`,
      },
      {
        title: 'INNER JOIN',
        description:
          'Return only rows that match in both tables. The default and most common join.',
        content: `\`INNER JOIN\` returns rows where the join condition is true in **both** tables. Rows with no match on either side are dropped.

## Anatomy of a join

\`\`\`sql
SELECT o.id, u.name, o.total
FROM orders o
INNER JOIN users u
  ON u.id = o.user_id;
\`\`\`

Read it left to right:

1. Start from \`orders\` (alias \`o\`).
2. Match each order against \`users\` (alias \`u\`) where \`u.id = o.user_id\`.
3. Pick the columns you want from either side.

The keyword \`INNER\` is optional — \`JOIN\` alone means inner join.

## Multiple conditions

The \`ON\` clause can carry compound predicates:

\`\`\`sql
SELECT *
FROM orders o
JOIN order_items oi
  ON oi.order_id = o.id
 AND oi.deleted_at IS NULL;
\`\`\`

Predicates that filter the **right side** belong in the \`ON\` clause, not in \`WHERE\` — it makes the intent clearer and behaves correctly when you later switch to \`LEFT JOIN\`.

## Joining on more than one column

Composite keys are joined with multiple equalities:

\`\`\`sql
SELECT *
FROM events e
JOIN tickets t
  ON t.event_id = e.id
 AND t.tier_id = e.tier_id;
\`\`\`

## Performance note

Inner joins use indexes on the join columns. If \`users.id\` and \`orders.user_id\` are indexed (they usually are — primary key + foreign key), the engine pulls matches with little effort.`,
      },
      {
        title: 'LEFT and RIGHT JOIN',
        description:
          "Keep all rows from one side, even if there's no match on the other.",
        content: `\`LEFT JOIN\` returns every row from the left table, plus the matching row from the right table when one exists. Unmatched right-side columns come back as \`NULL\`.

## Users and their order count, including users with zero orders

\`\`\`sql
SELECT
  u.name,
  COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.name;
\`\`\`

Without \`LEFT JOIN\`, users who never ordered would vanish from the result. With \`LEFT JOIN\`, they appear with \`order_count = 0\`.

\`COUNT(o.id)\` is intentional — \`COUNT(*)\` would count the row even when \`o.id\` is \`NULL\`, giving every user a count of at least 1. Counting a column from the right side handles the \`NULL\` correctly.

## Finding rows with no match

\`LEFT JOIN ... WHERE right.id IS NULL\` is the canonical "anti-join" — find left-side rows with no right-side match:

\`\`\`sql
SELECT u.name
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;
\`\`\`

Reads as: "users who have no orders."

## RIGHT JOIN

\`RIGHT JOIN\` is the mirror image — keep every row from the right side. In practice, almost nobody writes them: it's clearer to swap the table order and use \`LEFT JOIN\`. Stick to \`LEFT JOIN\` and your queries will read consistently.

## Filtering left vs filtering joined rows

Predicates in \`WHERE\` filter **after** the join, which can accidentally turn a \`LEFT JOIN\` back into an inner join:

\`\`\`sql
-- Wrong: drops users with no completed orders entirely.
SELECT u.name, COUNT(o.id) AS done
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
GROUP BY u.name;

-- Right: predicate moved into ON.
SELECT u.name, COUNT(o.id) AS done
FROM users u
LEFT JOIN orders o
  ON o.user_id = u.id
 AND o.status = 'completed'
GROUP BY u.name;
\`\`\`

A handy rule: predicates about the **outer** (right-side) table belong in \`ON\`. Predicates about the **driving** (left-side) table belong in \`WHERE\`.`,
      },
      {
        title: 'Self-joins and aliases',
        description:
          'Join a table to itself to compare rows within the same table.',
        content: `Sometimes the relationship you need is **inside** a single table — employees who report to other employees, products replacing other products, messages replying to messages. A self-join joins a table to itself, using aliases to tell the two copies apart.

## Employees and their manager

\`\`\`sql
SELECT
  e.name AS employee,
  m.name AS manager
FROM employees e
LEFT JOIN employees m
  ON m.id = e.manager_id;
\`\`\`

\`LEFT JOIN\` keeps top-level employees (those with no manager — \`manager_id IS NULL\`) in the result. With \`INNER JOIN\` they'd disappear.

## Why aliases are mandatory

Without aliases, the two copies share the same name (\`employees\`) and every column reference is ambiguous. Aliases give each copy a distinct identity:

\`\`\`sql
SELECT a.name, b.name
FROM users a
JOIN users b ON b.referred_by = a.id;
\`\`\`

This is the canonical "people referring other people" query — \`a\` is the referrer, \`b\` is the referred user.

## Pattern: rows compared to neighbours

Self-joins are the manual way to compare a row with another row in the same table — for example, "products cheaper than their successor in price":

\`\`\`sql
SELECT a.name, a.price AS a_price, b.price AS b_price
FROM products a
JOIN products b ON b.id = a.id + 1
WHERE a.price < b.price;
\`\`\`

Modern SQL gives you **window functions** (\`LAG\`, \`LEAD\`) for this kind of comparison — they're cleaner and don't depend on \`id\` being contiguous. We'll meet them in the aggregations module.`,
      },
      {
        title: 'Multi-table joins',
        description:
          'Chain joins across three or more tables. Watch the row multiplication.',
        content: `Real questions often span three or more tables. The mechanics are the same as a two-table join — just keep adding \`JOIN ... ON ...\` clauses.

## Order details with customer and product

\`\`\`sql
SELECT
  o.id        AS order_id,
  u.name      AS customer,
  p.name      AS product,
  oi.quantity,
  oi.quantity * p.price AS line_total
FROM orders o
JOIN users        u  ON u.id  = o.user_id
JOIN order_items  oi ON oi.order_id = o.id
JOIN products     p  ON p.id  = oi.product_id
WHERE o.created_at >= '2026-01-01';
\`\`\`

Each \`JOIN\` extends the working result one table at a time. Read top-to-bottom: orders, then their customer, then their items, then the product for each item.

## Watch the cardinality

If \`orders 1—N order_items\` and \`order_items 1—1 products\`, the join multiplies rows: a customer with three orders, each containing two items, returns six rows. That's correct — but if you then \`COUNT(DISTINCT o.id)\` to count orders, the de-duplication has to happen explicitly.

## Mixing \`LEFT\` and \`INNER\`

You can mix join types — just keep the \`LEFT JOIN\`s on the left of any \`INNER JOIN\` or use parentheses:

\`\`\`sql
SELECT u.name, COUNT(oi.id) AS items_bought
FROM users u
LEFT JOIN orders      o  ON o.user_id  = u.id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY u.name;
\`\`\`

Once any \`LEFT JOIN\` is followed by an \`INNER JOIN\` on the right side, the \`LEFT JOIN\` collapses back to inner — the inner join filters out the \`NULL\` rows the left join kept.

## Performance reality check

Multi-table joins still rely on indexes. Make sure every \`ON\` column is indexed on at least one side (usually the foreign-key side). Run \`EXPLAIN\` to see the plan when something feels slow.`,
      },
    ],
  },
  {
    title: 'Aggregations',
    description:
      'Group rows, summarise data, filter aggregates with HAVING, and meet window functions.',
    order: 3,
    lessons: [
      {
        title: 'COUNT, SUM, AVG',
        description:
          'Reduce many rows to one number. The starter aggregate functions.',
        content: `Aggregate functions take many rows and return one value. The three you'll use most are \`COUNT\` (how many), \`SUM\` (total), and \`AVG\` (mean).

## Order totals at a glance

\`\`\`sql
SELECT
  COUNT(*)        AS order_count,
  SUM(total)      AS revenue,
  AVG(total)      AS avg_order_value
FROM orders;
\`\`\`

With no \`GROUP BY\`, aggregates collapse the entire table to a single row.

## COUNT(*) vs COUNT(column)

- \`COUNT(*)\` counts every row, including ones where every column is \`NULL\`.
- \`COUNT(column)\` counts rows where \`column IS NOT NULL\`.
- \`COUNT(DISTINCT column)\` counts unique non-null values.

\`\`\`sql
SELECT
  COUNT(*)               AS rows_total,
  COUNT(refund_id)       AS rows_with_refund,
  COUNT(DISTINCT user_id) AS unique_customers
FROM orders;
\`\`\`

## Aggregates ignore NULLs

\`SUM\`, \`AVG\`, \`MIN\`, \`MAX\` skip \`NULL\` values silently. \`AVG\` divides by the count of **non-null** rows, not the row count. To penalise nulls (treat them as zero), wrap with \`COALESCE\`:

\`\`\`sql
SELECT AVG(COALESCE(rating, 0)) AS adjusted_avg
FROM reviews;
\`\`\`

## Watch types and overflow

\`SUM(integer_column)\` on a long table can overflow on some engines. Cast to a wider type if you're aggregating over millions of rows:

\`\`\`sql
SELECT SUM(price::bigint) FROM order_items;
\`\`\``,
      },
      {
        title: 'MIN and MAX',
        description: 'Pick the smallest or largest value in a column.',
        content: `\`MIN\` and \`MAX\` return the smallest and largest values. They work on numbers, dates, and strings (lexicographic order).

## Cheapest and most expensive product

\`\`\`sql
SELECT
  MIN(price) AS cheapest,
  MAX(price) AS most_expensive
FROM products;
\`\`\`

## With dates

\`\`\`sql
SELECT
  MIN(created_at) AS first_signup,
  MAX(created_at) AS most_recent_signup
FROM users;
\`\`\`

## Finding the row, not just the value

\`MIN(price)\` returns the price, not the product. To get the **whole row**, combine with a subquery or \`ORDER BY ... LIMIT 1\`:

\`\`\`sql
SELECT *
FROM products
ORDER BY price ASC
LIMIT 1;
\`\`\`

Or use a subquery (works even on engines without \`LIMIT\`):

\`\`\`sql
SELECT *
FROM products
WHERE price = (SELECT MIN(price) FROM products);
\`\`\`

The subquery version returns multiple rows on ties; \`LIMIT 1\` arbitrarily picks one. Pick the behaviour that matches your need.

## With GROUP BY

The real power shows up when you group — "cheapest product per category":

\`\`\`sql
SELECT category, MIN(price) AS cheapest
FROM products
GROUP BY category;
\`\`\`

That pattern leads us to \`GROUP BY\`, in the next lesson.`,
      },
      {
        title: 'GROUP BY',
        description:
          'Compute aggregates per group: per category, per day, per user.',
        content: `\`GROUP BY\` partitions rows into groups so each aggregate is computed per group instead of for the whole table.

## Revenue per product category

\`\`\`sql
SELECT
  category,
  SUM(price * quantity) AS revenue
FROM order_items
GROUP BY category
ORDER BY revenue DESC;
\`\`\`

Every non-aggregated column in the \`SELECT\` list must appear in \`GROUP BY\` (or be wrapped in an aggregate). Most engines enforce this.

## Grouping by multiple columns

\`\`\`sql
SELECT
  category,
  supplier,
  COUNT(*) AS items
FROM products
GROUP BY category, supplier;
\`\`\`

You get one row per distinct \`(category, supplier)\` pair.

## Grouping by an expression

You can group by computed values — useful for time bucketing:

\`\`\`sql
SELECT
  DATE(created_at) AS day,
  COUNT(*)         AS signups
FROM users
GROUP BY DATE(created_at)
ORDER BY day;
\`\`\`

Same trick works for "by month": \`DATE_TRUNC('month', created_at)\` (Postgres) or \`DATE_FORMAT(created_at, '%Y-%m')\` (MySQL).

## Empty groups

\`GROUP BY\` returns one row per group **that has data**. If you need every category to appear (even with zero rows), \`LEFT JOIN\` from a categories table:

\`\`\`sql
SELECT
  c.name,
  COUNT(p.id) AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.name;
\`\`\`

Use \`COUNT(p.id)\` not \`COUNT(*)\` — same trick as the LEFT JOIN lesson.`,
      },
      {
        title: 'HAVING vs WHERE',
        description:
          'Filter individual rows with WHERE; filter groups with HAVING.',
        content: `\`WHERE\` filters rows **before** they're grouped. \`HAVING\` filters groups **after** the aggregate is computed. Mixing them up is one of the most common SQL mistakes.

## Categories with more than 10 orders

\`\`\`sql
SELECT
  category,
  COUNT(*) AS order_count
FROM order_items
GROUP BY category
HAVING COUNT(*) > 10;
\`\`\`

\`COUNT(*) > 10\` in \`WHERE\` would error — \`COUNT\` doesn't exist until grouping happens.

## Combining WHERE and HAVING

Use both: \`WHERE\` to scope the rows you aggregate, \`HAVING\` to scope the groups.

\`\`\`sql
SELECT
  category,
  AVG(price) AS avg_price
FROM products
WHERE created_at >= '2026-01-01'
GROUP BY category
HAVING AVG(price) > 50;
\`\`\`

Reads as: "Of products created this year, show categories whose average price is above 50."

## Rule of thumb

If the predicate references an **aggregate**, it belongs in \`HAVING\`. If it references a **plain column** of an individual row, put it in \`WHERE\` — both because it's clearer and because \`WHERE\` runs first, so fewer rows reach the aggregation.

## Performance corollary

Filtering early with \`WHERE\` reduces the amount of data the engine has to group. Don't push every condition to \`HAVING\` — only the genuinely aggregate-dependent ones.`,
      },
      {
        title: 'Window functions, briefly',
        description:
          'Aggregates that keep individual rows. Running totals, ranks, and over-time comparisons.',
        content: `Aggregates collapse rows into one. **Window functions** compute the same things — sums, ranks, averages — but **without** collapsing: each row gets a value computed over a "window" of related rows.

## Running total of revenue

\`\`\`sql
SELECT
  created_at,
  total,
  SUM(total) OVER (ORDER BY created_at) AS running_total
FROM orders;
\`\`\`

\`OVER (ORDER BY created_at)\` defines the window — for each row, sum every order up to and including this one. You still get one row per order, with a new column attached.

## Ranking inside a partition

\`\`\`sql
SELECT
  category,
  name,
  price,
  RANK() OVER (PARTITION BY category ORDER BY price DESC) AS rk
FROM products;
\`\`\`

\`PARTITION BY\` is "group by" for the window: ranking restarts per category. Filter \`WHERE rk = 1\` to get the top product per category.

## LAG and LEAD

Compare a row to the previous (or next) row in the window:

\`\`\`sql
SELECT
  day,
  signups,
  signups - LAG(signups) OVER (ORDER BY day) AS delta
FROM daily_signups;
\`\`\`

Yesterday's signups subtracted from today's, no self-join required.

## When to reach for them

Window functions handle running totals, moving averages, ranking-within-a-group, and row-vs-neighbour comparisons. They're the idiomatic SQL solution for any "for each row, compute something using nearby rows" problem.

This lesson is a teaser — the full topic is its own deep dive. The four functions above (\`SUM\`, \`RANK\`, \`LAG\`, \`LEAD\`) cover most real-world needs.`,
      },
    ],
  },
  {
    title: 'Modifying Data',
    description:
      'INSERT, UPDATE, DELETE, and the transactions that keep them honest.',
    order: 4,
    lessons: [
      {
        title: 'INSERT',
        description: 'Add new rows to a table — one at a time or in bulk.',
        content: `\`INSERT\` adds rows. Two flavours: explicit values and "from a query".

## Single row

\`\`\`sql
INSERT INTO users (name, email)
VALUES ('Alice', 'alice@example.com');
\`\`\`

Always list the columns. Skipping the column list (\`INSERT INTO users VALUES (...)\`) is positional and breaks silently when the table changes.

## Multi-row

\`\`\`sql
INSERT INTO products (name, price, category)
VALUES
  ('Pen',  2.50, 'office'),
  ('Pad',  4.00, 'office'),
  ('Mug', 12.00, 'home');
\`\`\`

Multi-row inserts are dramatically faster than a loop of single-row inserts — fewer round trips, one transaction.

## INSERT ... SELECT

Copy rows from another query:

\`\`\`sql
INSERT INTO archived_orders (id, user_id, total)
SELECT id, user_id, total
FROM orders
WHERE created_at < '2025-01-01';
\`\`\`

Useful for archiving, materialising a report into a table, or seeding test data.

## Defaults and auto-generated columns

Columns with \`DEFAULT\` (timestamps, UUID generators, auto-increment IDs) can be omitted — the database fills them in:

\`\`\`sql
INSERT INTO orders (user_id, total)
VALUES (42, 99.99);
-- id and created_at populated by the database
\`\`\`

## Returning the inserted row

Postgres and MySQL both let you return the row you just inserted:

\`\`\`sql
-- Postgres
INSERT INTO users (name, email) VALUES ('Alice', 'a@x.com')
RETURNING id, created_at;
\`\`\`

Saves a follow-up \`SELECT\` round trip.`,
      },
      {
        title: 'UPDATE',
        description: 'Change values in existing rows. Always with a WHERE clause.',
        content: `\`UPDATE\` modifies rows in place. The \`WHERE\` clause is **load-bearing** — without it, every row in the table changes.

## Basic update

\`\`\`sql
UPDATE users
SET email_verified = true
WHERE id = 42;
\`\`\`

Multiple columns at once:

\`\`\`sql
UPDATE products
SET price = price * 1.10,
    updated_at = NOW()
WHERE category = 'books';
\`\`\`

## Always run a SELECT first

Before any \`UPDATE\` against production data, run the same predicate as a \`SELECT\` to count what you're about to change:

\`\`\`sql
-- 1. Verify
SELECT COUNT(*) FROM users WHERE id = 42;

-- 2. Then update
UPDATE users SET email_verified = true WHERE id = 42;
\`\`\`

Or — even better — wrap in a transaction (next lesson) so you can roll back if the count looks wrong.

## UPDATE with a join

Set values from another table:

\`\`\`sql
-- Postgres
UPDATE products p
SET   price = s.new_price
FROM  sale_prices s
WHERE s.product_id = p.id;
\`\`\`

\`\`\`sql
-- MySQL
UPDATE products p
JOIN   sale_prices s ON s.product_id = p.id
SET    p.price = s.new_price;
\`\`\`

Different syntaxes per engine, same idea — pull the new value from a related row.

## Idempotency

Idempotent updates can be re-run without changing the result a second time. \`SET status = 'active'\` is idempotent; \`SET counter = counter + 1\` is **not**. Idempotent updates are safer in retry-prone environments (queue workers, webhook handlers).`,
      },
      {
        title: 'DELETE',
        description:
          'Remove rows. The most dangerous statement in SQL — read this lesson twice.',
        content: `\`DELETE\` removes rows. As with \`UPDATE\`, the \`WHERE\` clause is everything: \`DELETE FROM users\` (no filter) empties the table.

## Basic delete

\`\`\`sql
DELETE FROM sessions
WHERE expires_at < NOW();
\`\`\`

## Soft deletes

Production systems often **don't** delete — they mark rows as inactive:

\`\`\`sql
UPDATE users
SET deleted_at = NOW()
WHERE id = 42;
\`\`\`

Then queries filter on \`WHERE deleted_at IS NULL\`. This preserves audit history, makes restores trivial, and avoids cascading foreign-key surprises. Most modern apps soft-delete by default and only physically delete via a scheduled cleanup job.

## Foreign-key cascades

A schema with \`ON DELETE CASCADE\` will delete dependent rows automatically:

\`\`\`sql
DELETE FROM users WHERE id = 42;
-- if orders.user_id has ON DELETE CASCADE, the user's orders go too.
\`\`\`

This is convenient but dangerous — review the cascade rules before deleting parent rows.

## Always verify the predicate

Same advice as \`UPDATE\`:

\`\`\`sql
-- 1. See what would go.
SELECT COUNT(*) FROM sessions WHERE expires_at < NOW();

-- 2. Delete it.
DELETE FROM sessions WHERE expires_at < NOW();
\`\`\`

## TRUNCATE vs DELETE

\`TRUNCATE TABLE foo\` empties a table much faster than \`DELETE FROM foo\` — but it bypasses triggers, can't be filtered, and on some engines can't be rolled back. Use it for test fixtures, never for production data.`,
      },
      {
        title: 'Transactions',
        description: 'Group several statements into one atomic unit. All or nothing.',
        content: `A **transaction** wraps multiple statements so they either all succeed or all roll back. It's how you keep a database consistent across multi-step operations: transfer money, place an order, accept a signup.

## The basic shape

\`\`\`sql
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

COMMIT;
\`\`\`

If either \`UPDATE\` fails, you \`ROLLBACK\` instead and neither change persists. Without the transaction, a crash between the two updates leaves money missing.

## ACID, briefly

- **Atomic** — all or nothing.
- **Consistent** — invariants (foreign keys, checks) hold before and after.
- **Isolated** — concurrent transactions don't see each other's intermediate state.
- **Durable** — once committed, it survives a crash.

## When to use one

Use a transaction whenever **two or more** writes need to succeed together. A single \`UPDATE\` is already atomic at the row level; you only need an explicit transaction when you have multiple statements.

## Rollback as a safety net

In a SQL shell, you can wrap risky writes in \`BEGIN ... ROLLBACK\`:

\`\`\`sql
BEGIN;

DELETE FROM users WHERE created_at < '2020-01-01';

-- Inspect the result count, see what's gone, then either:
COMMIT;     -- keep the changes
ROLLBACK;   -- undo them as if it never happened
\`\`\`

## Isolation levels (briefly)

The default is usually fine. Pull this lever only when you understand the trade-off:

- **READ COMMITTED** (Postgres/MySQL default) — see committed rows, may see different snapshots in successive queries.
- **REPEATABLE READ** — same snapshot for the whole transaction.
- **SERIALIZABLE** — strictest, behaves as if transactions ran one at a time.

Higher isolation = stronger guarantees, more locking, lower throughput. Reach for it only when you've reproduced a real anomaly.`,
      },
    ],
  },
];

async function main() {
  console.log('🌱 Re-seeding modules and lessons (extended content)…');

  await prisma.lessonProgress.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.module.deleteMany({});

  const creator =
    (await prisma.user.findFirst({ where: { isAdmin: true } })) ||
    (await prisma.user.findFirst({ where: { isTeacher: true } }));

  if (!creator) {
    throw new Error('No admin/teacher user found to use as lesson creator.');
  }

  let totalLessons = 0;
  for (const m of modulesSpec) {
    const created = await prisma.module.create({
      data: {
        title: m.title,
        description: m.description,
        order: m.order,
        isPublished: true,
      },
    });
    for (let i = 0; i < m.lessons.length; i++) {
      const l = m.lessons[i];
      await prisma.lesson.create({
        data: {
          title: l.title,
          content: l.content,
          description: l.description,
          order: i + 1,
          isPublished: true,
          creator_id: creator.id,
          module_id: created.id,
        },
      });
      totalLessons++;
    }
    console.log(`  · Module ${m.order}: ${m.title} (${m.lessons.length} lessons)`);
  }

  console.log(`✅ Done — ${modulesSpec.length} modules, ${totalLessons} atomic lessons`);
}

main()
  .catch((e) => {
    console.error('❌ Re-seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
