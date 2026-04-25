# SQL Challenge Validation System — Design

> Status: **Design proposal**, not yet implemented.
> Author: investigation pass on `main` @ `c659b4d` (2026-04-25).
> Scope: how Query Quest should programmatically determine whether a student's SQL query "passes" a challenge.

---

## 1. Executive Summary

- **The stack already supports this.** Next.js 15 (App Router) + Prisma 6 + MySQL 8 with a *separate* `mysql-challenges` database server, three pre-provisioned MySQL roles (`db_admin`, `student_readonly`, `teacher_preview`), and per-challenge databases that students execute against. The recon is short because most plumbing exists.
- **A first-cut validator is already written.** `src/lib/query-validator.js` does regex blocklisting → execute → normalize → SHA-256 hash → compare against `Challenge.expectedResult`. `src/app/api/challenges/[id]/validate/route.js` orchestrates it. We are not designing from scratch; we are designing the **next version**.
- **The current validator has correctness, security, and anti-cheating gaps** that block production use (see §10). A regex blocklist is brittle; the JS-side `setTimeout` is not a real query timeout; result normalization is destructive (lowercases all strings); only one dataset per challenge → trivial to hardcode answers; `user_id` is read from the request body without auth.
- **Recommended primary sandbox:** *one* MySQL server (already running in `docker-compose.yml` / Railway), one isolated *schema* (database) per challenge, a strict read-only role, MySQL-level `MAX_EXECUTION_TIME` and per-user resource limits. **Not** ephemeral containers, **not** SQLite — both lose the MySQL dialect parity the platform is built on.
- **Validate by execution + result-set comparison**, never by query-text comparison. Add a configurable `ResultComparator` (ordered, null-equality, float precision, column-order, string normalization) — store the comparator config on the challenge.
- **Defeat hardcoded answers with multi-dataset testing.** Introduce `ChallengeDataset` (N per challenge), each with its own dataset and pre-computed expected output. A submission must pass *every* dataset.
- **Pre-compute expected output at challenge save time** (already done by the `preview-result` route). Re-compute when the dataset changes (track a `dataset_version` and gate solves on it).
- **No queue today; add one in Phase C.** Most challenges return in <500ms on the existing pool. The async machinery (BullMQ + Redis or a Node worker process) is needed for hardening — not for MVP. Submissions stay request/response for now; we just need to avoid Vercel and stay on Railway, which we already do (`nixpacks.toml`).
- **Replace regex-based command filtering with an AST parser** (`node-sql-parser`). It catches `CREATE TRIGGER`, `CREATE FUNCTION`, comment-smuggled `INSERT` etc. that the current regex misses, and lets us *whitelist* statement types instead of blacklisting.
- **Fix auth on the validate endpoint** — read `user_id` from the auth cookie, not the request body. Currently anyone can submit attempts as anyone.
- **Phasing.** Phase A (≈1–2 weeks): tighten the existing single-dataset path. Phase B (≈1 week): multi-dataset / comparator config. Phase C (ongoing): queue, observability, anti-cheating telemetry.

---

## 2. Repository Findings

All paths are repo-relative. Line numbers are from the inspected revision.

### 2.1 Stack & framework

- **Next.js 15.x, App Router.** `src/package.json:56` (`"next": "^15.0.0"`). API routes live under `src/app/api/**/route.js`.
- **JavaScript, not TypeScript.** No `.ts(x)` source files; `src/jsconfig.json` exists; `typescript` is in `devDependencies` only for type hints in editors. *Implication: no compile-time type safety on the validator boundary; we should at least JSDoc-type the new modules.*
- **Node 20.** `package.json:9–11`, `src/package.json:5–7`, `nixpacks.toml:1`. Server-side things assumed compatible with Node 20.
- **Deployment target: Railway via Nixpacks.** `nixpacks.toml`. `package.json` has `postinstall`/`build`/`start` shims that `cd src && ...`. Recent commits explicitly added Railway plumbing (`5125106`, `2949df8`, `c659b4d`). **We are not on Vercel** and we have a long-running Node process — that matters for sandboxing and queues (§3.1).
- **Custom cookie auth, not NextAuth/Clerk.** `src/app/api/auth/route.js` does bcrypt-compare → sets `user` (JSON) and `auth-token` (`user-${id}`) cookies. `src/middleware.js` only handles `/ → /home` redirect; **API routes do no server-side auth checks**. `user_id` is currently passed in request bodies. *Critical issue, see §10.*

### 2.2 Database layer

- **Two MySQL 8 instances.** `docker-compose.yml`:
  - `mysql-app` (port 3307) — Prisma/app metadata.
  - `mysql-challenges` (port 3306) — student SQL execution.
- **Three MySQL users on the challenge server**, provisioned by `mysql-init/01-create-users.sql`:
  - `db_admin` — `ALL PRIVILEGES` (used by Node admin pool to create/drop/grant per challenge).
  - `student_readonly` — `SELECT` only on per-challenge databases.
  - `teacher_preview` — `SELECT` only (currently the teacher pool actually uses `db_admin` creds; see `src/lib/mysql-connection.js:58–72` — *bug*).
- **mysql2 driver, three pools.** `src/lib/mysql-connection.js`. `multipleStatements: false` for student & teacher pools (good — defeats `;DROP DATABASE`). `multipleStatements: true` on the admin pool (used for SQL file ingestion in `src/lib/database-processor.js`).
- **Prisma 6 against `mysql-app`.** `src/prisma/schema.prisma`. Models: `User`, `Institution`, `Challenge`, `ChallengeDatabase`, `UserChallenge`, `QueryAttempt`, `Log`, `Lesson`, `ContactRequest`. Relevant fields:
  - `Challenge.expectedResult: String? @db.LongText` — JSON-stringified expected rows.
  - `Challenge.requiredKeywords: String? @db.Text` — comma-separated SQL keywords the student must use (`JOIN`, `GROUP BY`, etc.).
  - `Challenge.database_id → ChallengeDatabase` — current model: **one DB per challenge**.
  - `ChallengeDatabase.mysqlDbName @unique` — actual MySQL schema name, e.g. `challenge_employees_a3f1b2c8`.
  - `ChallengeDatabase.status: "processing" | "ready" | "error"`.
  - `QueryAttempt(query, resultHash, rowCount, executionTimeMs, isCorrect, errorMessage, keywordsMatched, timestamp, user_id, challenge_id)` — already a submissions log.
- **Migrations.** `src/prisma/migrations/` exists (confirmed via `ls`); managed with Prisma Migrate.
- **A stray Postgres dependency** is declared (`src/package.json:58` `pg ^8.16.3`) but I found **no Postgres usage** in the codebase. Recommend removing or repurposing.

### 2.3 Existing challenge / validation domain

- **`src/lib/query-validator.js`** — the existing validator. Public surface:
  - `validateCommand(query)` — regex blocklist, allowlist of leading keywords (`SELECT`, `SHOW`, `DESCRIBE`, `DESC`, `EXPLAIN`).
  - `executeQuery(dbName, query, limit=100)` — runs as `student_readonly`, auto-appends `LIMIT 100` if missing, JS-side `setTimeout` of 30s.
  - `hashResult(rows)` / `normalizeResultSet(rows)` — sorts columns alphabetically, sorts rows by JSON, lowercases & trims strings, rounds floats to 6 dp, ISO-formats dates → SHA-256.
  - `compareResults(userResult, expectedResult)` — hash equality + structured diffs on column / row count mismatch.
  - `checkKeywords(query, requiredKeywords)` — case-insensitive word-boundary regex.
  - `validateQueryAgainstChallenge(...)` — the orchestrator.
  - `generateExpectedResult(dbName, expectedQuery)` — used at challenge-creation time to pre-compute and store the expected answer.
- **`src/app/api/challenges/[id]/validate/route.js`** — POST endpoint that calls the orchestrator and writes a `QueryAttempt`. Returns whether the answer is correct, *not* whether points were awarded.
- **`src/app/api/challenges/[id]/solve/route.js`** — separate POST endpoint that records the actual solve, increments `solves`, awards `current_score`, fetches the user's rank, and suggests the next challenge. **Trust gap**: the client calls this *after* `validate` returns `isCorrect`. Server-side guard exists (`prisma.queryAttempt.findFirst({ isCorrect: true })`) — sufficient as long as `QueryAttempt.isCorrect` cannot be forged. It cannot be (it's only written by the validate route).
- **`src/app/api/challenges/[id]/preview-result/route.js`** — teacher-only endpoint to dry-run a query and capture its expected output. Used from the create/edit challenge UI.
- **`src/app/api/challenges/[id]/attempts/route.js`** — analytics list of attempts.
- **`src/app/api/shell/route.js`** — *duplicate, weaker* sandbox for the in-browser terminal (`XTerminal.jsx`). Has its own ad-hoc blocklist. **Bug**: `trimmed.includes(cmd)` will block `SELECT name WHERE LOWER(name) LIKE '%insert%'`. Should call into `query-validator.js`. (Recent commit `c659b4d` added this as an HTTP fallback to a WebSocket terminal that doesn't run on Railway.)
- **`src/app/api/websocket/route.js`** — *dead/mock code* with hardcoded mock SQL responses. Recommend deleting; `c659b4d` already routes the terminal through `/api/shell`.
- **`src/lib/database-processor.js`** — uploads, MySQL DB creation, schema extraction, GRANT, drop. Already does what we need for ingesting hidden datasets.
- **No seed fixtures for challenge databases beyond `mysql-init/02-init.sql`** (a `practice` schema). Real challenge DBs are admin-uploaded SQL files via `/admin/databases`.

### 2.4 Auth & user identity

- Custom: bcrypt + cookies (`user`, `auth-token`). See §2.1. Cookies are `httpOnly: false` for `user` (so the client JS can read it). The `auth-token` is `httpOnly` but is just `user-${id}` — **not signed, not JWT, trivially forgeable**. We are not asked to fix auth here, but we *must* note that the validator endpoint's identity layer is currently advisory.

### 2.5 Background jobs / queues

- **None.** No BullMQ, no Inngest, no QStash. `src/app/api/databases/upload/route.js` calls `processUploadedDatabase` synchronously inside the request handler.
- WebSocket plumbing (`socket.io`, `ws`) is present in `dependencies` but the websocket routes are mock/fallback. The terminal now uses HTTP (`c659b4d`). Treat WS as not-deployed.

### 2.6 Infrastructure & deployment

- **Railway, long-running Node process.** Confirmed by `nixpacks.toml`, `package.json` start scripts, and recent commits. *No Vercel function timeout to design around.* This unlocks: in-process query execution, in-process queues (BullMQ on Railway Redis), and ≥30s student-query timeouts.
- `docker-compose.yml` exists for local dev only. Production is Railway-managed MySQL (`2949df8`).
- No Kubernetes config, no per-submission container primitives.

---

## 3. Recommended Architecture

### 3.1 Component diagram

```
                    ┌────────────────────────────────────────────────────┐
                    │  Next.js App Router (Railway-hosted, single proc)  │
                    │                                                    │
   POST /validate   │   ┌─────────────────┐    ┌───────────────────┐     │
   (cookie-auth) ──►│   │ validate route  │───►│ ChallengeRunner   │     │
                    │   │  - read user    │    │  (lib/runner)     │     │
                    │   │  - load chal+   │    │  ┌──────────────┐ │     │
                    │   │    datasets     │    │  │ SqlGuard     │ │     │  AST parse +
                    │   │  - record       │    │  │ (AST parser) │ │     │  whitelist
                    │   │    QueryAttempt │    │  └──────┬───────┘ │     │
                    │   └─────────────────┘    │         ▼         │     │
                    │                          │  ┌──────────────┐ │     │  per-challenge
                    │                          │  │ SandboxExec  │─┼─────┼──► mysql-challenges
                    │                          │  │ (mysql2)     │ │     │     student_readonly
                    │                          │  └──────┬───────┘ │     │     dataset_<id>
                    │                          │         ▼         │     │
                    │                          │  ┌──────────────┐ │     │
                    │                          │  │ Result       │ │     │
                    │                          │  │ Comparator   │ │     │
                    │                          │  └──────┬───────┘ │     │
                    │                          │         ▼         │     │
                    │                          │   Pass/Fail+Diff  │     │
                    │                          └───────────────────┘     │
                    └────────────────────────────────────────────────────┘
                                             │
                                             ▼
                                  ┌──────────────────────┐
                                  │ Prisma → mysql-app   │
                                  │  Challenge           │
                                  │  ChallengeDataset (N)│
                                  │  ExpectedResult      │
                                  │  QueryAttempt        │
                                  │  UserChallenge       │
                                  └──────────────────────┘
```

For Phase C, insert a queue between `validate route` and `ChallengeRunner`:

```
validate route ──enqueue──► Redis (BullMQ) ──pop──► ChallengeRunner worker ──persist──► Prisma
                              │
                              └──────────────────► /api/challenges/.../attempts/[id] (poll/SSE)
```

### 3.2 Sandboxing strategy — recommendation

**Primary: Single shared MySQL server, one schema per challenge, strict read-only role.** This is what the codebase already does and it is the right answer.

| Option | Verdict | Why |
|---|---|---|
| **One DB server, schema-per-challenge, read-only role** ✅ chosen | Strong-enough isolation given a privileges-only attacker (no DDL/DML), great latency (~tens of ms warm), zero infra to add, MySQL-dialect-faithful. | Already implemented; shore it up. |
| Ephemeral container per submission | Rejected | Cold-start ≥1s, blows latency budget for "instant feedback" UX, requires Docker-in-Docker on Railway. |
| Embedded SQLite per submission | Rejected | Loses MySQL dialect (`DATE_SUB`, `MAX_EXECUTION_TIME`, `JSON_*`, window-function syntax differences). Existing seeded challenges (see `prisma/seed.js`) use `MySQL`-only constructs. |
| Hosted DB branching (Neon/Turso/PlanetScale) | Rejected | Postgres or non-MySQL; we already pay for Railway MySQL. |
| Single sandbox DB, transactions rolled back per submission | Rejected | Read-only challenges don't need rollback; for write-style challenges, schema-per-attempt is cleaner. |

**Fallback (write-permitted challenges, future):** if we ever need to grade `INSERT`/`UPDATE` exercises, spin up a **fresh schema per attempt** (`CREATE DATABASE attempt_<uuid>`, run dataset seed, run student query, diff, drop). Same MySQL server, ephemeral schema.

### 3.3 Resource limits

| Layer | Setting | Value | Source |
|---|---|---|---|
| MySQL session | `MAX_EXECUTION_TIME` hint on every `SELECT` | 5000 ms | `SELECT /*+ MAX_EXECUTION_TIME(5000) */ ...` rewritten by `SqlGuard` after AST parse |
| MySQL session | `SET SESSION net_write_timeout` | 5 s | per connection |
| MySQL user | `MAX_QUERIES_PER_HOUR` on `student_readonly` | 5000 | one-time `ALTER USER` |
| MySQL user | `MAX_USER_CONNECTIONS` | 50 | matches `connectionLimit` in `mysql-connection.js:46` |
| Node | `Promise.race([query, sleep(8000)])` JS-side | 8 s | belt-and-braces; current `executeWithTimeout` |
| Node | row cap before `JSON.stringify` | 1000 hard, 100 returned | currently 100, inconsistent (see §10) |
| Node | query length | 10 KB max | reject before parse |
| Express layer | request body size | 64 KB | Next.js default is 1 MB — explicitly cap |

### 3.4 Pre-execution validation (replace regex)

Use **`node-sql-parser`** with `database: 'mysql'`. Parse the submission once; reject if:

- More than one statement.
- Statement type ∉ `{Select}` for grading challenges (`{Select, Show, Describe, Explain}` for the playground/terminal).
- AST contains banned function calls: `SLEEP`, `BENCHMARK`, `LOAD_FILE`, `GET_LOCK`, `MASTER_POS_WAIT`, `pg_sleep`, etc.
- AST references `information_schema`, `mysql`, `performance_schema`, `sys` for graded challenges (allow on the playground).
- AST contains user variable assignments (`@x := ...`).
- Subquery depth > 8 (mitigates pathological CPU).

Why an AST and not regex: the existing regex `\b(CREATE)\s+(TABLE|DATABASE|INDEX|VIEW|USER)\b` misses `CREATE FUNCTION`, `CREATE PROCEDURE`, `CREATE TRIGGER`. Comments smuggle past it (`/* CREATE TABLE */ DROP TABLE x` — though `multipleStatements:false` already blocks the second statement). AST is one shot of correctness.

### 3.5 Result comparator

```js
// src/lib/sql-runner/comparator.js
/**
 * @typedef {Object} ComparatorOptions
 * @property {boolean} ordered                 default false
 * @property {boolean} ignoreColumnOrder       default true
 * @property {boolean} nullEqualsNull          default true
 * @property {number}  floatPrecision          default 6 (decimal places)
 * @property {boolean} caseSensitiveStrings    default true
 * @property {boolean} trimStrings             default false
 * @property {'iso'|'epoch'|'raw'} dateNormalization  default 'iso'
 */

/**
 * @typedef {Object} ComparisonResult
 * @property {boolean} match
 * @property {'row_count'|'column_count'|'column_names'|'first_row_diff'|'type_mismatch'|null} reason
 * @property {object} [diff]   - { rowIndex, expected, actual, columnName }
 */
```

Returns a *structured* diff. The current implementation returns short strings — keep the strings for the UI but expose the structured diff for analytics and the teacher tools.

The `Challenge` row gets a new column `comparator: Json` storing this options object. Defaults are fine for "find all employees with salary > 50000"-style problems; turn `ordered: true` for any challenge whose statement says "ordered by …".

### 3.6 Multi-dataset testing (anti-cheating)

Currently a challenge has one `ChallengeDatabase`. That lets `SELECT 'Alice', 42 UNION ALL SELECT 'Bob', 37` pass.

Introduce `ChallengeDataset`:

```prisma
model ChallengeDataset {
  id              String   @id @default(uuid())
  challenge_id    String
  database_id     String   // points to ChallengeDatabase (a MySQL schema)
  is_public       Boolean  @default(false)  // shown to student in the schema viewer
  expectedResult  String   @db.LongText     // JSON, pre-computed
  expectedHash    String                    // SHA-256 of normalized result
  dataset_version Int      @default(1)      // bumped when underlying schema reseeded
  created_at      DateTime @default(now())

  challenge Challenge         @relation(fields: [challenge_id], references: [id])
  database  ChallengeDatabase @relation(fields: [database_id], references: [id])

  @@index([challenge_id])
}
```

Validation runs the student's *one* query against *each* dataset's schema. The submission passes only when **every** dataset matches. Recommend 3 datasets per challenge (1 public sample + 2 hidden). Public means: student can see the schema and a sample of rows; hidden means: schema only.

### 3.7 Expected-output pre-computation

**Recommendation: pre-compute at dataset-attach time, store the result + hash + a `dataset_version`**, and *also* re-run on every Nth submission (sample-rate) for drift detection.

- *Why pre-compute*: 3 datasets × every submission = 3× extra work for no benefit when the dataset is static.
- *Why drift-check*: the underlying MySQL schema is mutable by admins. The drift check (`if (sampleRate hits) { rerun reference; if (hash != stored) alert }`) catches stale expectations cheaply.
- The teacher UI already has `preview-result` — extend it to write `ChallengeDataset.expectedResult` directly when the teacher clicks "Save".

### 3.8 Submission lifecycle

**Today (Phase A) — synchronous request/response**, since execution is fast (<1s p95 against the existing pool):

```
queued (in-memory) → running → passed | failed | errored | timeout
```

`POST /api/challenges/:id/validate` returns a single response with the verdict. `QueryAttempt` is written before returning.

**Phase C — queued**:

```
queued (BullMQ) → running → passed | failed | errored | timeout
```

`POST /api/challenges/:id/validate` returns `{ attemptId, status: "queued" }` with a 202.
`GET /api/challenges/:id/attempts/:attemptId` polls (or SSE-streams) the verdict.
Worker process: a separate `node worker.js` started alongside `next start` (Railway supports multi-process via additional services or via `concurrently` like the existing `dev:full` script). Redis comes from Railway add-on.

We don't need this for MVP. Add it when we measure tail latencies > 2s, or when we want true concurrency caps without throttling at the HTTP layer.

---

## 4. Component Specifications

All new files live under `src/lib/sql-runner/` so the validator concerns are co-located. The existing `src/lib/query-validator.js` is **kept** but reduced to a thin re-export shim during migration, then deleted.

### 4.1 `src/lib/sql-runner/guard.js`

- **Responsibility**: parse + reject. Replaces the `BLOCKED_PATTERNS` regex block in `query-validator.js`.
- **Inputs**: `{ sql: string, mode: 'graded' | 'playground' }`.
- **Outputs**: `{ ok: true, ast } | { ok: false, error: string, code: 'multi_statement'|'banned_function'|'wrong_type'|'too_long'|'parse_error' }`.
- **Library**: `node-sql-parser` (see §6).

### 4.2 `src/lib/sql-runner/sandbox.js`

- **Responsibility**: connection acquisition, statement-timeout-rewrite, row-cap, execute, release.
- **Inputs**: `{ ast, dbName: string, maxRows: number, timeoutMs: number }`.
- **Outputs**: `{ rows: any[], fields: FieldPacket[], executionTimeMs: number, truncated: boolean }`.
- **Notes**: replaces `executeQuery` in `query-validator.js`. Uses `student_readonly` pool from existing `src/lib/mysql-connection.js`. Adds `MAX_EXECUTION_TIME` hint to the SELECT via AST node insertion (or `SET SESSION MAX_EXECUTION_TIME=…` before query).

### 4.3 `src/lib/sql-runner/comparator.js`

- **Responsibility**: order-aware/order-insensitive comparison with configurable options. See §3.5.
- **Inputs**: `{ actualRows, expectedRows, options: ComparatorOptions }`.
- **Outputs**: `ComparisonResult`.
- **Notes**: replaces `normalizeResultSet` + `compareResults`. Normalization rules become *opt-in*; today's defaults (lowercase + trim + global row sort) are too aggressive.

### 4.4 `src/lib/sql-runner/keywords.js`

- **Responsibility**: AST-aware keyword presence check (cheaper to verify against the parsed tree than via regex on the raw text).
- **Inputs**: `{ ast, required: string[] }`.
- **Outputs**: `{ allMatched, matched, missing }`.
- **Notes**: today's `checkKeywords` is regex over the raw query — false-positive on `SELECT 'GROUP BY' FROM x`. AST removes that.

### 4.5 `src/lib/sql-runner/runner.js`

- **Responsibility**: the orchestrator. Public entrypoint.
- **Signature**:
  ```js
  /**
   * @param {{ challengeId, userId, sql }} input
   * @returns {Promise<{
   *   verdict: 'passed' | 'failed' | 'errored' | 'timeout',
   *   perDatasetResults: Array<{ datasetId, isPublic, comparison: ComparisonResult, executionTimeMs }>,
   *   keywordsCheck: { allMatched, matched, missing },
   *   firstFailingDiff?: ComparisonResult,
   *   totalExecutionMs: number,
   * }>}
   */
  async function gradeSubmission(input) { ... }
  ```
- **Persistence**: writes one `QueryAttempt`. (Per-dataset results live in the response payload; persist only an aggregate `isCorrect` to keep the table narrow.)

### 4.6 `src/app/api/challenges/[id]/validate/route.js` — *changes*

- Resolve `userId` from cookies (read `auth-token`, look up the user by id from the `user-${id}` token), **not** from the request body. Reject if absent.
- Call `gradeSubmission` instead of `validateQueryAgainstChallenge`.
- Return `{ verdict, feedback, firstFailingDiff }`. Don't ever return result rows from *hidden* datasets to the student — leak.
- Keep `QueryAttempt` write.

### 4.7 `src/app/api/challenges/[id]/preview-result/route.js` — *changes*

- When teacher saves a query as the reference, also persist into `ChallengeDataset.expectedResult` + `expectedHash` for *each* attached dataset (run the reference once per dataset).
- Return per-dataset previews so the teacher can inspect.

### 4.8 `src/app/api/shell/route.js` — *changes*

- Replace its inline blocklist with a call to `src/lib/sql-runner/guard.js` in `mode: 'playground'`.
- Fixes the `trimmed.includes('INSERT')` bug.

### 4.9 `src/app/api/challenges/[id]/datasets/route.js` — *new*

- `GET` — list datasets (admin/teacher only).
- `POST` — attach a `ChallengeDatabase` as a new dataset, run the reference query, persist expected result.
- `DELETE` — detach.

---

## 5. Data Model Changes

### 5.1 Add `ChallengeDataset` (see §3.6)

Migration steps:

1. Create `ChallengeDataset` table.
2. Backfill: for every `Challenge` with a `database_id` and `expectedResult`, insert one `ChallengeDataset` row (`is_public: true`, copy `expectedResult`, hash it).
3. Keep `Challenge.database_id` and `Challenge.expectedResult` *temporarily* — read/write both. Phase B switches reads to `ChallengeDataset`. Phase C drops the legacy columns.

### 5.2 Add `Challenge.comparator: Json`

Stores `ComparatorOptions`. Default `{}` ⇒ runner uses the defaults from §3.5. Pure additive change.

### 5.3 Add `Challenge.guard_mode: String @default("graded")`

Reserves the door for future "write challenges" without forcing a schema change later.

### 5.4 Add `QueryAttempt.verdict: String @default("failed")`

Replaces the binary `isCorrect` with `passed | failed | errored | timeout`. Keep `isCorrect` as a generated/computed column for backwards compat in Phase A.

### 5.5 Index hint

`@@index([challenge_id, isCorrect, timestamp])` on `QueryAttempt` — the `solve` route's `findFirst({ user_id, challenge_id, isCorrect: true })` (`solve/route.js:64`) currently scans on `(user_id, challenge_id)`.

---

## 6. Library Recommendations

| Need | Pick | Version | Why over alternatives |
|---|---|---|---|
| SQL AST parsing | **`node-sql-parser`** | ^5.x | Multi-dialect (`mysql`, `postgresql`, `sqlite`); maintained; pure JS so no native deps to bother Railway. `pgsql-ast-parser` is Postgres-only. `libpg_query` requires a native build. |
| Connection pooling | **`mysql2/promise`** | already installed (`^3.14.4`) | Keep. Has `MAX_EXECUTION_TIME` support and prepared statements. |
| Hashing | **node:crypto** | stdlib | Already used. No reason to import `crypto-js`. |
| Queue (Phase C) | **BullMQ** | ^5.x | Battle-tested on Node, Redis-backed, Railway has Redis as a one-click add-on. *Inngest* and *Trigger.dev* are great but introduce vendor + webhook complexity we don't need. *QStash* is for serverless; we're not. |
| Structured diff in tests | **`fast-deep-equal`** | ^3.x | Tiny, no deps, used inside the comparator's hot path for object equality. |
| Schema fixtures (test-time) | **`@databases/mysql-test`** or just `docker-compose` | n/a | Defer — existing docker-compose is enough. |

**Do not add**: `sql-injection-detector`, `safesql`, regex-based linters. We have a parser; that supersedes them.

**Remove**: stray `pg ^8.16.3` from `src/package.json` unless we plan to support Postgres-dialect challenges (out of scope here).

---

## 7. Phased Implementation Plan

### Phase A — Tighten the existing single-dataset path  (≈1–2 weeks)

Goal: the validator stops being the weakest part of the system, while keeping the single-dataset model.

- A1. Create `src/lib/sql-runner/{guard,sandbox,comparator,keywords,runner}.js` with the surfaces in §4. Keep `query-validator.js` re-exporting from them for one release.
- A2. Wire `guard.js` to use `node-sql-parser`. Delete `BLOCKED_PATTERNS` regex. Tests for: `SLEEP(10)`, `INFORMATION_SCHEMA`, `INTO OUTFILE`, `CREATE TRIGGER`, multi-statement `;`, comment smuggling.
- A3. Add `MAX_EXECUTION_TIME` hint server-side. Drop the JS-side timer to a defensive 8s.
- A4. Auth: read `user_id` from the cookie in `validate/route.js`; reject the body field. Same for `solve/route.js` and `preview-result/route.js`.
- A5. Make `comparator.js` driven by `Challenge.comparator` JSON. Default options preserve current behaviour for already-seeded challenges; add `ordered: true` to seeded challenges that test ORDER BY.
- A6. Replace `shell/route.js` blocklist with a call into `guard.js` (`mode: 'playground'`).
- A7. Delete the mock `src/app/api/websocket/route.js`.
- A8. Add Prisma migration: `Challenge.comparator JSON`, `Challenge.guard_mode`, `QueryAttempt.verdict`, plus the composite index in §5.5.
- A9. Tests: unit tests on `guard`, `comparator`, `keywords`. Integration test that hits a docker-compose MySQL.

**Exit criteria**: all existing challenges in `prisma/seed.js` still validate green for known-correct solutions; no regression in `QueryAttempt` analytics.

### Phase B — Multi-dataset & comparator UI  (≈1 week)

- B1. Add `ChallengeDataset` model and migration. Backfill from existing `Challenge.database_id`.
- B2. Update `runner.gradeSubmission` to fan out across all datasets and AND the matches.
- B3. New `/api/challenges/[id]/datasets` route for attach/detach.
- B4. Admin/teacher UI: dataset list per challenge, "attach existing database", "compute expected result", "preview".
- B5. Student UI: schema viewer shows only `is_public: true` datasets.
- B6. Hidden-dataset response sanitization: never return rows from a non-public dataset's diff. Only show a generic "your output didn't match on a hidden test" with shape mismatch info if any.

**Exit criteria**: a deliberately-hardcoded `SELECT 'Alice', 42` answer fails the hidden-test challenge.

### Phase C — Hardening, anti-cheating, observability  (ongoing)

- C1. BullMQ + Redis worker. Frontend polls `GET /attempts/:id`. Concurrency cap on the `student_readonly` pool.
- C2. Drift detector: every Nth solve, re-run the reference and compare against `expectedHash`. Alert via `Log` table on mismatch.
- C3. Per-user rate limit on `/validate` (e.g., 60 attempts / 5 min) — store in Redis or `mysql-app`.
- C4. MySQL user-level limits (`MAX_QUERIES_PER_HOUR`, `MAX_USER_CONNECTIONS`) wired into `mysql-init/01-create-users.sql`.
- C5. Submission heuristics for cheating: identical `query` across users in short windows, copy-paste of exact reference solution, very-low `executionTimeMs` with very-high accuracy. Surface in admin activity table (`/admin/activity` already exists).
- C6. Structured logging: every grade decision emits `{ challengeId, userId, datasetIds, verdict, executionTimeMs, queryHash }`.

---

## 8. Risks & Open Questions

| # | Risk / Question | Severity | Mitigation / Note |
|---|---|---|---|
| R1 | `auth-token` cookie is unsigned (`user-${id}`) — anyone can submit as anyone. | **High** | Out-of-scope here, but A4 cannot fully fix until tokens are signed (JWT or a sessions table). Document the limitation in the validator. |
| R2 | `student_readonly` runs against a *shared* MySQL server that also hosts `db_admin` privileges (same instance, separate users). A privilege escalation in MySQL itself would be catastrophic. | Medium | Keep MySQL patched. Long-term: split admin DB onto a different instance from student DBs. |
| R3 | Result-set normalization is currently lossy (lowercase strings, sort all rows) — false positives on case-sensitive answers and ORDER BY challenges. | High (correctness) | A5 makes it opt-in. |
| R4 | `executeWithTimeout` doesn't actually kill the MySQL query — `setTimeout` only rejects the JS Promise. The query keeps running on the server. | High (DoS) | Move to `MAX_EXECUTION_TIME` (A3). |
| R5 | `multipleStatements: true` on the admin pool. SQL ingestion (`importSqlFile`) splits on `;` with a hand-rolled tokenizer (`splitSqlStatements`) — bug-prone for nested strings, escapes, delimiters. | Medium | Out of validator scope, but consider replacing with `mysql-statements` package or `mysql -e <`. Note for ops. |
| R6 | `Challenge.expectedResult` is duplicated across challenges; `LongText` in `mysql-app` will balloon if datasets get bigger. | Low | Acceptable for ≤1000-row results. Cap at `MAX_RESULT_ROWS` (already 100 in the code). |
| R7 | The `pg` dependency suggests a Postgres path was once intended. Cross-dialect grading is hard (window-fn syntax, `||` vs `CONCAT`, date ops). | Low | Pin to MySQL only. Remove `pg` to make intent explicit. |
| R8 | "Hidden" datasets in `mysql-challenges` are still listed by `SHOW DATABASES`, defeating the hidden-ness. | Medium | The current validator blocks `SHOW DATABASES` in graded mode. Keep that block. Verify `student_readonly` only has SELECT on its assigned schema (it does, per `mysql-init/01-create-users.sql:18-19` + the `GRANT` per-DB in `database-processor.js:233`). |
| R9 | Timing-based information leak: students could measure response times to infer dataset row counts. | Low | Optional: clamp returned `executionTimeMs` to coarse buckets (50/100/500/1000ms) on hidden datasets. |
| R10 | `prisma.js` logs `'query'` in production. | Low | Strip `'query'` from `log:` array in prod (`if (NODE_ENV === 'production')`). |
| Q1 | Do we have a Redis instance on Railway today? | n/a | Phase C requires it. If not, the phase plan adds an add-on. |
| Q2 | What is the maximum dataset row count we want to support per challenge? | n/a | Drives row caps in §3.3 and JSON size in `expectedResult`. Recommend ≤10k rows in the dataset, ≤1k in any expected result. |
| Q3 | Should challenges support `WITH RECURSIVE`? | n/a | MySQL 8 supports it. Allow at the AST guard. Bound recursion via `MAX_EXECUTION_TIME`. |
| Q4 | Do we keep the "required keywords" mechanism, or rely solely on result-comparison? | n/a | Recommend keeping for pedagogical challenges ("you must use a JOIN"), but make it AST-checked, not regex. (§4.4) |
| Q5 | How do we handle non-deterministic queries (`NOW()`, `RAND()`, auto-generated UUIDs)? | n/a | Reject `NOW()`/`RAND()`/`UUID()` at the guard for graded mode unless the comparator's `dateNormalization` says otherwise. Or bound the dataset to fixed seeds at ingest time. |

---

## 9. Out of Scope

- The **query editor UI** itself (Monaco wiring, autocomplete, schema introspection panel).
- **Scoring decay / leaderboards.** Already implemented in `src/lib/scoring-utils.js`.
- **Hint system** beyond the existing `Challenge.help` field.
- **Authentication overhaul.** Signing the `auth-token` and properly enforcing it server-side is a separate project. The validator design assumes it lands; in the meantime, document the limitation.
- **Cross-dialect support** (Postgres / SQLite). MySQL 8 only.
- **Containerized per-attempt sandboxes.** Designed against, not for. Revisit only if we add write-style challenges and the schema-per-attempt approach proves insufficient.
- **WebSocket / streaming verdicts.** HTTP request/response (Phase A/B) and polled queue (Phase C) are sufficient.
- **Plagiarism detection / cross-student similarity.** Heuristics in C5 are coarse anti-cheat; full plagiarism detection (token-level diff against the cohort) is a future project.

---

## 10. Concrete defects in the current code (to fix in Phase A)

These are real bugs in the inspected revision, not design opinions:

- `src/lib/query-validator.js:18–35`: regex blocklist misses `CREATE FUNCTION/PROCEDURE/TRIGGER`, `ANALYZE`, `OPTIMIZE`, `RESET`, and string-literal-smuggled keywords. Fix via AST.
- `src/lib/query-validator.js:101–119`: `executeWithTimeout` doesn't kill the MySQL query — JS `setTimeout` only rejects locally. Move to `MAX_EXECUTION_TIME`.
- `src/lib/query-validator.js:140–174`: `normalizeResultSet` lowercases & trims **all** strings before hashing. Wrong for case-sensitive answers. Make opt-in via `ComparatorOptions`.
- `src/lib/query-validator.js:171`: sorts rows globally. Wrong for `ORDER BY`-style challenges. Make opt-in.
- `src/lib/query-validator.js:198–202`: `expectedHash` falls back to `expected` (a *string*) when `expected` is a string — but `expected` is the JSON of the expected rows, not its hash. The current code path almost certainly never goes correct via that branch. Either always rehash, or store + read `expectedHash` directly.
- `src/lib/mysql-connection.js:58–72`: `getTeacherPool()` is named "teacher" but uses `db_admin` credentials. Either rename or wire `teacher_preview` creds.
- `src/lib/mysql-connection.js:104–119`: `executeWithTimeout` is a Promise-race anti-pattern (see above).
- `src/app/api/shell/route.js:25–31`: `trimmed.includes(cmd)` — false-positive on any `SELECT` whose literals contain `INSERT`, `DELETE`, etc. Replace with `guard.js`.
- `src/app/api/shell/route.js:32–40`: the allowed list also permits `USE`, contradicting the validator path which blocks it.
- `src/app/api/websocket/route.js:24–43`: hardcoded mock responses. Dead code post-`c659b4d`. Delete.
- `src/app/api/challenges/[id]/validate/route.js:13`: reads `user_id` from the request body. Anyone can submit as anyone. Read from cookie.
- `src/app/api/challenges/[id]/solve/route.js:7`: same.
- `src/lib/scoring-utils.js`: Prisma relation says `UserChallenge.user_id` (snake_case) but the include in `getUserSolvedChallenges` uses `challenge` — fine; flagged here only because the snake_case/camelCase split across the schema is fragile. Out of validator scope.
- `src/lib/prisma.js:6`: `log: ['query', 'error', 'warn']` always on. Strip `'query'` in production.

These are direct quotes from the codebase, not speculation. Fixing them is the smallest possible useful first PR (Phase A1–A4).
