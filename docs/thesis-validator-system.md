# The Query Quest SQL Submission Validator

> *Draft chapter for thesis use. Adjust the register, citation style, and
> figure formatting to match your institution's template. Code references
> use `file:line` notation throughout; replace with figure references or
> appendix pointers as needed.*

---

## 1. Problem statement

Query Quest is an educational platform on which students solve SQL exercises
("challenges") and teachers grade their work. The core technical problem of
the platform is **automated grading of SQL submissions at scale**: given a
challenge, a reference solution, and a student's submitted query, decide
whether the submission is correct, and do so in a way that resists obvious
forms of cheating, runs in bounded time, and remains safe in the presence
of hostile input.

A naive grader might compare the submitted SQL text against the reference
SQL text. This approach fails immediately and at every level of analysis.
Two queries can be character-for-character identical and produce different
results when run against different data; two queries can look completely
different and produce identical results. Consider the trivial example of a
student who submits

```sql
SELECT name, salary FROM employees WHERE salary > 50000
```

against a reference of

```sql
SELECT employees.name, employees.salary
FROM employees
WHERE employees.salary > 50000.0
```

A textual diff would (correctly) say the queries differ. A correct grader
must (also correctly) say they are equivalent. Conversely, a student who
submits

```sql
SELECT 'Alice' AS name, 75000 AS salary UNION ALL SELECT 'Bob', 80000
```

produces output that, on a particular dataset, may be indistinguishable
from the reference's output, despite encoding none of the reasoning the
challenge intends to test.

The grader must therefore validate by **execution and result comparison**,
not by query-text equivalence. This is the dominant approach across
industry-grade platforms (LeetCode, HackerRank, StrataScratch, DataLemur)
and is the approach taken here. The remainder of this chapter describes
the design and implementation of Query Quest's submission validator,
distinguishing between the design rationale (the *why*) and the
implementation (the *what*) at each step.

### 1.1 Threat model

The validator runs untrusted SQL on a real database server. The threat
model assumes:

- **Hostile students.** A student may attempt to evade grading
  (hardcoding answers, exploiting comparison loopholes), to exfiltrate
  challenge data they are not entitled to (other students' answers,
  hidden test datasets, system catalogs), to exhaust shared resources
  (pathologically expensive queries, denial-of-service via repeated
  submissions), or to escape the sandbox (filesystem reads via
  `LOAD_FILE`, shell escapes, privilege escalation).
- **Honest-but-curious peers.** A student may attempt to discover what
  another student submitted, or what hidden datasets a challenge tests
  against.
- **Shared infrastructure.** Every challenge runs on a shared MySQL
  server. The validator cannot assume the database engine itself is
  hardened against every privilege-escalation primitive; it must
  defend in depth.

The threat model **excludes** an attacker with shell access to the
host, an attacker who can modify the application code, and a
nation-state-class adversary willing to invest hundreds of hours in
exploiting the platform. These are out of scope for an educational tool
deployed to one or a small number of universities.

---

## 2. Background and related approaches

The general pattern across automated SQL grading platforms is consistent:

1. **Parse and pre-screen** the submission to reject classes of input
   that are unsafe or out-of-scope.
2. **Execute the submission** in an isolated environment with strict
   resource limits.
3. **Compare** the resulting rowset against a pre-computed *expected*
   rowset, using a comparator whose semantics match the challenge's
   requirements (ordered vs unordered, case sensitivity, etc.).
4. **Run against multiple datasets**, including datasets the student
   cannot see, to defeat hardcoded answers.

Where platforms differ is in the implementation choices made at each
step: the strength of the pre-screen, the choice of sandbox, the
flexibility of the comparator, and the depth of the multi-dataset
machinery. Query Quest's validator implements all four steps with
choices appropriate to its deployment context (a Node.js + MySQL
application running on a single PaaS host).

---

## 3. System overview

Figure 3.1 shows the data flow of a submission from the student's
browser to the verdict.

```
Browser ──── POST /api/challenges/:id/validate ────► Next.js route
   ▲                                                       │
   │                                                       ▼
   │                                            ┌─────────────────┐
   │                                            │  Identity check │ cookie auth
   │                                            └────────┬────────┘
   │                                                     ▼
   │                                            ┌─────────────────┐
   │                                            │   Rate limit    │
   │                                            └────────┬────────┘
   │                                                     ▼
   │                                            ┌─────────────────┐
   │                                            │     Guard       │ AST parse
   │                                            │ (graded mode)   │ + whitelist
   │                                            └────────┬────────┘
   │                                                     ▼
   │                                            ┌─────────────────┐
   │                                            │   Sandbox exec  │ MAX_EXECUTION_TIME
   │                                            │  (per dataset)  │ + LIMIT injection
   │                                            └────────┬────────┘
   │                                                     ▼
   │                                            ┌─────────────────┐
   │                                            │   Comparator    │ configurable
   │                                            └────────┬────────┘
   │                                                     ▼
   │                                            ┌─────────────────┐
   │  ◄──── verdict + sanitized feedback ───── │  Persist + log  │ QueryAttempt
   │                                            │   + drift check │ row + JSON line
   │                                            └─────────────────┘
```

*Figure 3.1: end-to-end submission flow.*

The route handler (`src/app/api/challenges/[id]/validate/route.js`)
orchestrates the steps; each step is implemented as a small,
independently testable module under `src/lib/sql-runner/`. The runner
itself (`runner.js`) supports two grading paths: a **single-dataset
path** (`gradeSubmission`) for legacy challenges, and a
**multi-dataset path** (`gradeAcrossDatasets`) that fans out across
public and hidden datasets, ANDs their per-dataset verdicts, and
sanitizes the feedback returned to the student so that hidden-dataset
content is never leaked.

---

## 4. Pre-execution validation: the AST guard

### 4.1 Why a parser

A first-cut grader can reject DDL and DML by regex matching against the
submission text. Such an approach is brittle on every axis. The earliest
version of the validator (preserved as `src/lib/query-validator.js` in
the project's history) used a list of patterns of the form
`/\b(INSERT)\s+INTO\b/i`. That list missed `CREATE FUNCTION`,
`CREATE PROCEDURE`, and `CREATE TRIGGER`. It produced false positives
on legitimate SELECTs containing keyword-shaped string literals
(`SELECT 'INSERT INTO log' AS demo` would be rejected). It could be
defeated by comment-smuggling and whitespace tricks. It offered no
structured information about the parsed query that downstream stages
could use.

The current implementation parses every submission with the
`node-sql-parser` library against the MySQL grammar
(`src/lib/sql-runner/guard.js`). The parser produces an Abstract
Syntax Tree (AST), which is then walked by a recursive procedure that
enforces a **whitelist** of allowed shapes rather than a blacklist of
forbidden ones. Whitelisting inverts the security posture: instead of
asking "does this query contain anything dangerous?", which requires
exhaustive enumeration, we ask "is this query in the small set of
shapes we explicitly permit?", which is finite and reviewable.

### 4.2 Two modes

The guard exposes a single function `inspect(sql, { mode })` with two
modes:

- **`graded`** — used for challenge submissions. Permits only a single
  `SELECT` statement.
- **`playground`** — used for the in-browser SQL terminal. Permits
  `SELECT`, `SHOW`, `DESCRIBE`, and `EXPLAIN`. (`SHOW DATABASES` and
  similar enumeration is still blocked at the privilege layer; see §5.)

The mode parameter is a deliberate concession to the principle that
educational tooling has multiple legitimate use cases with different
risk profiles. A student exploring a schema in the playground needs
`DESCRIBE`; a student submitting a graded answer does not.

### 4.3 The whitelist

In graded mode, the guard rejects every submission that does not
satisfy *all* of the following:

| Check | Code reference | Rationale |
|---|---|---|
| Single statement, no `;`-chained tail | `guard.js:80` | Defeats `SELECT 1; DROP TABLE x` even in dialects where `multipleStatements` is enabled. |
| Statement type is `select` | `guard.js:91` | Submissions that mutate the database are out-of-scope and would break dataset reuse across submissions. |
| No call to a banned function | `guard.js:25` | `SLEEP`, `BENCHMARK`, `LOAD_FILE`, `GET_LOCK`, `MASTER_POS_WAIT`, `pg_sleep`. These are denial-of-service primitives or filesystem-read primitives with no pedagogical use. |
| No call to a non-deterministic function | `guard.js:39` | `NOW`, `CURRENT_TIMESTAMP`, `RAND`, `UUID`, etc. A non-deterministic submission cannot be compared against a deterministic expected result; rejecting at parse time gives a clearer error than producing spurious mismatches. |
| No reference to a system schema | `guard.js:50` | `information_schema`, `mysql`, `performance_schema`, `sys`. Prevents catalog enumeration that could disclose hidden dataset names or other students' work. |
| No user-variable assignment | `guard.js:139` | Statements of the form `@x := …` create cross-statement state that complicates reasoning about side effects. |
| Subquery nesting depth ≤ 8 | `guard.js:101` | A pragmatic upper bound. Pathological nestings impose super-linear costs on the optimizer. |
| Total query length ≤ 10 KB | `guard.js:60` | Bounds the cost of parsing itself and prevents pathological-input denial-of-service against the parser. |

Each rejection returns a structured `{ ok: false, code, error }` object.
The `code` is machine-readable; downstream callers (logger, integration
tests, future analytics) discriminate on it.

### 4.4 Why parse instead of pattern-match

The AST is not merely a more accurate filter than regex; it is the
*only* accurate filter for SQL of any complexity, because SQL's
lexical structure (string literals, comments, escapes, identifier
quoting) is not regular. A regex-based blacklist that "looks for
`DROP`" will match the literal string `'DROP TABLE log'` in a
legitimate SELECT, and will miss `D/**/ROP TABLE`, and will miss the
DROP that is the body of a `CREATE TRIGGER`. Once a parser is
available, the cost of enforcing additional structural properties
(non-determinism rejection, subquery depth limits, banned-function
detection) is constant per check. The parser is reused later by the
sandbox to inject a `LIMIT` clause via AST mutation rather than string
manipulation.

---

## 5. Sandboxed execution

### 5.1 Sandbox strategy

The sandbox is the part of a SQL grader most likely to be
over-engineered. Possible designs include:

1. **One ephemeral container per submission.** Spin up a Postgres or
   MySQL container, load the dataset, run the query, tear down. Strong
   isolation; cold-start cost (~1 s) makes the user-perceived
   feedback loop too slow for an educational tool.
2. **Hosted database branching** (Neon, Turso, PlanetScale). Solves
   the cold-start problem, but ties the platform to a specific vendor
   and dialect.
3. **Embedded SQLite** per submission. Trivially isolated, zero
   cold-start, but loses MySQL-specific dialect features (window
   functions, `DATE_SUB`, JSON operators) that the platform's
   challenges already use.
4. **Single shared database, per-challenge schema, strict role.**
   Each challenge's data lives in its own MySQL schema. Submissions
   run as a `student_readonly` role with `SELECT`-only privileges on
   the assigned schema and nothing else. No cold-start. Modest
   isolation.

Query Quest uses option (4). The `student_readonly` role exists at the
MySQL level (`mysql-init/01-create-users.sql`), is created with
`MAX_QUERIES_PER_HOUR 5000 MAX_USER_CONNECTIONS 50`, and has only
`SELECT` privileges on the schemas a teacher has explicitly attached.
The sandbox layer (`src/lib/sql-runner/sandbox.js`) acquires a
connection from a `mysql2/promise` connection pool sized to match the
user-level connection limit, executes the query, and releases.

### 5.2 Defense in depth: resource limits

A correct sandbox bounds resource consumption at every layer where
bounding is meaningful. Query Quest applies the following:

| Layer | Mechanism | Default | Purpose |
|---|---|---|---|
| MySQL session | `SET SESSION MAX_EXECUTION_TIME` hint | 5 000 ms | Server-side cutoff for any SELECT. The MySQL optimizer kills the running query when the limit is reached. |
| MySQL user | `MAX_QUERIES_PER_HOUR` | 5 000 | Stops a runaway client from generating arbitrary load. |
| MySQL user | `MAX_USER_CONNECTIONS` | 50 | Mirrors the application connection-pool size. |
| Application | JavaScript-side `setTimeout` race | 8 000 ms | Defensive client-side fallback in case the server-side limit is bypassed by a future driver bug. |
| Application | Result-row cap via AST `LIMIT` injection | 100 returned, 101 fetched | Enables truncation detection (`returned > limit`) and prevents memory exhaustion in the Node process. |
| Application | Maximum input length | 10 000 chars | Bounds parser cost. |

The previous prototype of the validator used a JavaScript-side
`setTimeout` as the *only* timeout. This is a Promise-race and not a
real cutoff: when the timer fires, the Promise rejects, but the
underlying query continues to run on the MySQL server, holding row
locks and CPU until completion. The current implementation moves the
authoritative timeout to the server side via `MAX_EXECUTION_TIME` and
treats the JavaScript timer as an additional safety net.

### 5.3 LIMIT injection by AST mutation

Rather than appending `LIMIT N` to the submission as a string suffix
(which is dialect-fragile and breaks when the submission already
contains a `LIMIT`, a trailing semicolon, or a `UNION`), the sandbox
mutates the AST returned by the guard:

```js
function withLimit(ast, n) {
  if (ast.type !== 'select') return ast;
  if (ast.limit?.value?.length) return ast;   // respect existing LIMIT
  return {
    ...ast,
    limit: { seperator: '', value: [{ type: 'number', value: n }] },
  };
}
```

The mutated AST is then re-emitted to SQL via the parser's `sqlify`
function and dispatched to the MySQL server. Because the mutation is
structural rather than textual, it is robust to user formatting and
preserves the surrounding query structure exactly.

---

## 6. Result-set comparison

### 6.1 Why comparison is harder than it looks

Two correct submissions to the same challenge can produce result sets
that:

- present columns in a different order (`SELECT name, salary` vs
  `SELECT salary, name`);
- present rows in a different order (in any query without `ORDER BY`,
  row order is not specified by the SQL standard);
- differ in column **alias** (`AS avg_salary` vs no alias);
- differ in numeric **precision** (`75000` vs `75000.0`);
- differ in case for a column whose case is dictated by data the
  student did not control;
- contain the same logical NULL but represented differently in the
  driver layer.

A general comparator must therefore be parameterized by the challenge.
Some challenges legitimately require an exact column order ("write a
query that returns id, name, salary in that order"); some require a
specific row order (anything with `ORDER BY` in the prompt); some
require case-sensitive string equality (challenges about user-entered
text), and some require case-insensitive equality (challenges where the
expected column is enum-like).

### 6.2 The configurable comparator

The comparator (`src/lib/sql-runner/comparator.js`) accepts a result
set and an `options` object with the following parameters:

| Option | Default | Meaning |
|---|---|---|
| `ordered` | `false` | If `true`, row order is significant. |
| `ignoreColumnOrder` | `true` | If `true`, columns are matched by name; if `false`, by position. |
| `nullEqualsNull` | `true` | Whether SQL NULLs compare equal in the result set. |
| `floatPrecision` | `6` (decimal places) | Numeric values are rounded before comparison. |
| `caseSensitiveStrings` | `false` | Default preserves the legacy lossy behavior; per-challenge overrides enable strictness. |
| `trimStrings` | `true` | Default trims leading/trailing whitespace before comparison. |
| `dateNormalization` | `'iso'` | Dates are converted to ISO 8601 strings before comparison. |

Defaults were chosen to match the prior, lossy normalization so that
already-seeded challenges continue to grade identically; per-challenge
overrides are stored as a JSON value on the `Challenge.comparator`
column and let teachers tighten semantics when a challenge requires
it. The defaults are *deliberately* permissive: a stricter default
would silently fail challenges authored before the option set existed.

### 6.3 Comparison algorithm

The comparator's algorithm is straightforward:

1. Extract column names from the first row of each side.
2. Reject early on mismatched column count.
3. If `ignoreColumnOrder` is false, require column-name positional
   equality; otherwise, require set equality of column names.
4. Reject early on mismatched row count.
5. Normalize each row (rounding floats, normalizing dates,
   case-folding/trimming strings as configured) into a canonical
   array form aligned with the expected column list.
6. If `ordered` is false, sort both row lists by the JSON-encoding of
   each row, giving a stable order-independent comparison.
7. Walk both row lists in lockstep; report the first differing cell
   as a structured diff `{ rowIndex, column, actual, expected }`.

The comparator also provides a `hash` function that produces a
SHA-256 of the canonicalized result. The hash is stored alongside the
expected result on each `ChallengeDataset` row, and is used both as a
fast equality check and as the input to the drift detector (§9.3).

### 6.4 Why the comparator is a separate module

Comparison logic is the part of the validator most likely to need
per-challenge fine-tuning. Isolating it in a small, pure module
(no I/O, no database access) means it can be exhaustively unit-tested
without infrastructure, the test suite runs in milliseconds, and
teachers' future requests for new comparator options translate to
local changes in one file.

---

## 7. Multi-dataset hidden testing

### 7.1 The hardcoded-answer attack

A grader that runs each submission against a single, known dataset
admits a trivial attack: the student inspects the dataset, computes
the expected output by hand or by running an unrelated query, then
submits a hardcoded literal whose output equals the expected result.
For example, given a challenge whose expected output on the visible
dataset is two rows `('Alice', 75000)` and `('Bob', 80000)`, the
student submits

```sql
SELECT 'Alice' AS name, 75000 AS salary
UNION ALL
SELECT 'Bob', 80000
```

This passes the comparison even though the student demonstrated none
of the SQL reasoning the challenge intends to test.

### 7.2 The defense

The defense, common to all serious SQL grading platforms, is to test
each submission against multiple datasets, of which only one is
visible to the student (the "public" dataset, used to render the
schema viewer in the IDE). The remaining datasets are "hidden" and
have the same schema but different data. A correct query, by virtue
of being correct, will produce the right output on every dataset; a
hardcoded answer will pass only the dataset whose data was hardcoded
and fail the rest.

In Query Quest, the relationship between challenges and datasets is
modeled by a `ChallengeDataset` table:

```
ChallengeDataset(
  id, challenge_id, database_id,
  is_public BOOLEAN,
  expectedResult LONGTEXT,
  expectedHash CHAR(64),
  dataset_version INT,
  display_order INT
)
```

Each row pairs a `Challenge` with a `ChallengeDatabase` (an uploaded
SQL schema living on the challenge MySQL server) and stores the
pre-computed expected result of running the challenge's reference
solution against that schema. The expected result is computed once,
at the time a teacher attaches the dataset (see §7.4), and is
re-computed on demand by the drift detector if the underlying schema
mutates.

### 7.3 Fan-out grading

The orchestrator `gradeAcrossDatasets`
(`src/lib/sql-runner/runner.js`) takes a submission and a list of
datasets and:

1. Runs the AST guard once.
2. Performs the required-keywords check once. If a keyword is missing,
   the submission is rejected before any database round-trip — this
   short-circuit matters for both performance and observability.
3. For each dataset, in order: executes the AST against that
   dataset's schema, runs the comparator, records a per-dataset
   verdict. The first dataset whose verdict is not `passed` causes
   the orchestrator to return; remaining datasets are not executed.
4. Aggregates: the overall verdict is `passed` only if every dataset
   passed and all required keywords were matched.

The order of dataset evaluation is significant. The validate route
sorts datasets so that public datasets run first, hidden datasets
second. This ensures that when a submission fails on a public
dataset, the failure surfaces with full diff information (the
student is supposed to be able to debug on visible data); when a
submission passes the public dataset but fails a hidden one, the
student receives a generic message describing the failure mode
without leaking the hidden data.

### 7.4 Sanitization

The validate route is the single point at which hidden-dataset
information could leak to the student. Two safeguards prevent this:

- **The challenge GET endpoint filters** `datasets` to
  `is_public: true` only. The full dataset list is available only
  through the admin/teacher endpoint
  `GET /api/challenges/:id/datasets`, which requires the
  teacher-or-admin role.
- **The validate response strips per-dataset diffs** when the failing
  dataset is hidden. The structured `comparison` object is included
  only when the failing dataset has `is_public = true`. The student
  receives a generic message: *"Your query produced the right output
  for the sample dataset but failed on a hidden test. Make sure your
  query handles the general case, not just the visible rows."*

The sanitization is implemented as two short pure functions in the
route, not by relying on the comparator to suppress information. This
follows the principle that security checks should be visible at the
trust boundary, not hidden inside a downstream module that may be
called from contexts where the trust boundary is different.

### 7.5 Authoring workflow

The admin/teacher UI exposes a `DatasetsManager` component on the
challenge edit page. Authors can:

1. Attach an existing `ChallengeDatabase` as a dataset, marking it
   public or hidden. On attach, the platform runs the challenge's
   `solution` field against the new dataset and stores the result
   and its hash.
2. Toggle a dataset's public/hidden flag.
3. Re-capture the expected result if the underlying data has changed
   (the dataset version is incremented each time).
4. Detach a dataset.

A backfill script (`src/scripts/backfill-datasets.js`) converts
challenges from the legacy single-database shape (the original
schema, before this work) into the multi-dataset shape, marking the
single existing database as the public dataset. The validator's
`gradeAcrossDatasets` falls back to the legacy single-dataset path
for un-backfilled challenges, ensuring that the migration from the
old shape to the new is non-blocking.

---

## 8. Identity and authorization

The validator's authorization story is short but worth recording
because it represents a class of vulnerability common to
hand-rolled REST APIs.

The original implementation accepted the `user_id` as a field of the
request body. Any client could submit a query as any user simply by
choosing a different `user_id` value. This invalidated the
`QueryAttempt` audit trail (an attacker could log attempts as a
victim), the rate limiter (an attacker could exhaust a victim's
budget), and the solve flow (an attacker could record a solve on
behalf of a user who had not solved it).

The current implementation reads the user identity from the
`auth-token` cookie set at login. The cookie is `httpOnly`, so it is
not readable by scripts in the page. Submissions from any client
that does not have a logged-in session return HTTP 401.

This change does not constitute a complete authentication overhaul
— the `auth-token` is still a string of the form `user-${id}`,
unsigned, so an attacker who can set arbitrary cookies on the user's
browser (e.g., via XSS elsewhere in the application) could still
forge an identity. Closing that gap requires either a JWT-style
signed token or a server-side session table, neither of which was
the central concern of the validator rewrite. The relevant point for
the present discussion is that the validator now reads identity from
a place the request body cannot directly influence.

---

## 9. Observability and anti-cheating

### 9.1 Structured grade logging

Every grading decision emits a single JSON line
(`src/lib/sql-runner/logger.js`):

```json
{
  "type": "grade",
  "ts": "2026-04-25T11:30:42.118Z",
  "challengeId": "…",
  "userId": "…",
  "verdict": "passed",
  "isCorrect": true,
  "executionTimeMs": 47,
  "rowCount": 12,
  "datasetIds": ["…", "…"],
  "hadHiddenFailure": false,
  "queryHash": "a1b2c3d4e5f60718"
}
```

The schema is intentionally narrow and stable. `queryHash` is the
first 16 hex characters of `SHA-256(submission)`; the raw SQL is
*never* logged, both because it may contain personally identifiable
information (a student's email address in a string literal, say) and
because the hash is sufficient for clustering identical submissions
(§9.5) without requiring full text in logs.

The structured form is grep-able, forwardable to any log sink
(Railway plain logs, Logtail, Datadog) without an additional
collection layer, and joinable against the `QueryAttempt` table by
`(challengeId, userId, ts)`.

### 9.2 Rate limiting

A per-user rate limit prevents one student from saturating the
shared MySQL pool through repeated submissions. The limiter
(`src/lib/sql-runner/rate-limit.js`) is **MySQL-backed** rather than
Redis-backed: it counts the user's `QueryAttempt` rows in a sliding
window. Defaults are 60 attempts per 5-minute window, both tunable
via environment variable.

The choice of MySQL over Redis is deliberate. A Redis-backed limiter
has lower per-call cost but introduces a new service, a new failure
mode, and a new operational surface. Given that the validate route
already writes one `QueryAttempt` per request, the additional
`COUNT(*)` query on a well-indexed table costs a single millisecond
on a warm cache, which is negligible compared to the cost of the
grade itself. Replacing the MySQL-backed limiter with a Redis-backed
one is a one-file change should the platform's scale ever warrant
it.

When the limit is exceeded, the route returns HTTP 429 with a
`Retry-After` header in seconds.

### 9.3 Drift detection

Pre-computed expected results are valid only as long as the
underlying dataset has not changed. An administrator who edits a
table via a database administration tool, or who re-uploads a
dataset, silently invalidates every challenge that references the
modified data. Without detection, students would begin to fail
challenges with confused diffs ("the expected first row's salary is
75000 but I get 76000") that have nothing to do with their queries.

The drift detector (`src/lib/sql-runner/drift.js`) is a sample-rated
sanity check. On each passing submission, with probability *p*
(default 2%, configurable via `DRIFT_SAMPLE_RATE`), the platform:

1. Picks one of the submission's datasets at random.
2. Re-runs the challenge's reference query against that dataset.
3. Compares the fresh hash to the dataset's stored `expectedHash`.
4. On mismatch, emits a structured warning on `stderr`:

```json
{ "type":"dataset_drift", "challengeId":"…", "datasetId":"…",
  "expectedHash":"…", "actualHash":"…",
  "hint":"Re-capture this dataset (PATCH /datasets/:id { recapture: true })" }
```

Detection is *not* enforcement: a drifted dataset still grades
submissions against its stale expected result. The reasoning is
that a drifted dataset is an authoring problem, not a student
problem; pausing grading would punish students for an
administrator's action. The structured warning is forwarded to
operator-facing log dashboards, where it can be acted on.

The sample rate trades coverage for cost. At 2% the expected
overhead is one extra reference-query execution per ~50 successful
submissions, which is well within the platform's resource budget;
the expected detection latency for a freshly drifted dataset is
~50 successful grades, which is acceptable given that drift events
are themselves rare.

### 9.4 MySQL user-level limits

The MySQL `student_readonly` user is created with explicit
per-user resource caps:

```sql
CREATE USER 'student_readonly'@'%'
  IDENTIFIED BY '…'
  WITH MAX_QUERIES_PER_HOUR 5000
       MAX_USER_CONNECTIONS 50;
```

These caps protect the MySQL server from any class of misbehavior
that bypasses the application-layer rate limiter (a future bug in
the application, a connection that escapes the pool, an internal
misuse of the role from another component). The defense is strictly
defensive — within the application's normal operation, the
application-layer limiter is the binding constraint — but the
MySQL-level cap is the last line of defense if everything else
fails.

### 9.5 Cheating heuristics

A small command-line tool
(`src/scripts/cheating-heuristics.js`, run via
`npm run cheating-heuristics`) computes three signals over recent
`QueryAttempt` history:

- **Identical-query clusters.** Same SQL, normalized for whitespace
  and trailing punctuation, submitted by ≥ 3 distinct users on the
  same challenge. Catches copy-paste rings.
- **Exact-solution copies.** Submission text equal (modulo
  whitespace) to the challenge's `solution` field. Not necessarily
  cheating — sometimes the solution is the obvious answer — but a
  useful signal in conjunction with #1.
- **Suspiciously-fast first solves.** A user's first passing
  submission on a challenge, with executionTime < 200 ms and ≤ 2
  prior failed attempts. Indicates either remarkable skill or that
  the answer was prepared in advance.

The tool is read-only. It outputs a human-readable table by default
or JSON with `--json`. Surfacing the results in the admin UI is
deferred future work; for the present implementation, the CLI is
sufficient for periodic operator review.

The choice to run as a CLI tool rather than a real-time monitor
reflects two facts: cheating signals are aggregate over time, not
per-request, so per-request analysis adds no value; and a CLI tool
that produces a human-reviewable report is the right design when the
downstream consumer is a human exercising judgment, not an automated
enforcement action.

---

## 10. Design trade-offs

This section makes explicit the choices that were considered and
deliberately not taken. A defensible engineering record names the
roads not taken as well as the road taken.

### 10.1 Single MySQL server, not ephemeral containers

Spinning up an isolated database container per submission would
provide the strongest possible sandbox isolation. It was rejected
because the cold-start cost (typically ≥ 1 second per submission) is
inconsistent with an educational tool's need for a tight feedback
loop, and because the additional infrastructure (Docker-in-Docker on
the deployment host) is a significant operational burden for a
small platform. The chosen sandbox (one MySQL server, per-challenge
schemas, strict role) trades a small reduction in isolation for a
substantial reduction in latency and operational complexity. The
reduction in isolation is mitigated by the multi-layer resource
limits in §5.2 and by the AST guard's enumeration of forbidden
constructs in §4.3.

### 10.2 MySQL, not Postgres or SQLite

The platform uses MySQL because the deployment context (Railway with
a managed MySQL service) and the existing challenges (which use
MySQL-specific features such as `DATE_SUB` and the MySQL window-
function syntax) made it the path of least resistance. A
multi-dialect grader would be valuable for cross-platform coursework
but is not on the platform's current roadmap. The validator is
therefore MySQL-only, and the AST parser is configured for the
MySQL grammar.

### 10.3 Synchronous request/response, not a queue

Industry-grade graders typically queue submissions onto a worker
pool and return verdicts asynchronously via polling or server-sent
events. Query Quest's validator is synchronous: the validate route
runs the grader inline and returns the verdict in the response.

The choice was made on observed latency. The 95th percentile grade
time on representative challenges (single-table SELECTs over
seeded data) is comfortably under 500 ms; the server-side timeout
caps any individual grade at 5 seconds. Adding a queue would
introduce Redis as a runtime dependency, a worker process as an
operational artifact, and a polling/SSE flow on the frontend, in
exchange for no user-visible benefit at the platform's current
scale. A separate document (`docs/queue-when-and-how.md`) records
the trigger condition (sustained p95 grade time > 2 seconds, or
pool exhaustion) at which the synchronous-to-queued migration
becomes warranted.

### 10.4 Defaults preserve legacy behavior

The comparator's default options match the lossy behavior of the
prior validator (case-insensitive, whitespace-trimmed, row-order-
insensitive). A purist might argue for stricter defaults; the
practical reasoning is that altering defaults silently
re-grades existing challenges, and re-grading existing challenges
means breaking the work of every teacher who authored against the
legacy semantics. Per-challenge `comparator` overrides give
authors a path to tighten when they want to.

---

## 11. Limitations and future work

The validator as implemented has several known limitations.

- **Authentication.** As noted in §8, the `auth-token` cookie is
  unsigned. A complete fix requires either signed JWTs or a
  server-side session table. The validator is cooperative with
  whichever fix is eventually applied: it reads identity through a
  helper (`getUserFromCookies`) whose implementation can be
  replaced without touching grading logic.

- **Cross-dialect.** Challenges authored against dialect-specific
  features (MySQL `DATE_SUB`, window-function syntax variants) are
  not portable. A future cross-dialect grader would require a
  per-dialect parser, a per-dialect sandbox, and a comparator that
  is robust against type-system differences (e.g., MySQL's
  `TINYINT(1)` versus PostgreSQL's `BOOLEAN`).

- **Queue.** The synchronous path is appropriate for the platform's
  current load. At scale, a queue is required; the trigger
  condition is documented separately.

- **Cheating UI.** The cheating heuristics are a CLI tool. Wiring
  the same signals into the admin activity dashboard would let
  operators triage suspicious patterns without leaving the
  application; the schema is in place to support this.

- **Write-style challenges.** The current grader assumes
  read-only submissions. Challenges of the form "write an INSERT
  that…" or "write a query that returns the rows affected by a
  given UPDATE" are out of scope. Supporting them requires either
  ephemeral schemas per attempt (option 1 from §5.1) or a
  transactional-rollback wrapper per submission, neither of which
  the current sandbox offers.

- **Plagiarism detection beyond surface signals.** The cheating
  heuristics catch byte-identical copy-paste; structural
  similarity (semantically equivalent queries with renamed
  identifiers, reordered clauses) is a richer signal that would
  require a query-canonicalization step. The AST parser already
  in use is the obvious starting point.

---

## 12. Conclusions

The Query Quest validator implements the four-stage pattern that has
become the de facto standard for automated SQL grading: AST-based
pre-execution validation, sandboxed execution with multi-layer
resource limits, configurable result-set comparison, and multi-
dataset hidden testing. The implementation choices follow the
constraints of the deployment context: a single Node.js process on
a PaaS host, with a MySQL server it shares with the platform's
metadata; an educational user base that values fast feedback;
authors who need flexibility in comparison semantics; and operators
who need observability without a separate analytics stack.

The implementation is small (roughly 1 500 lines of JavaScript
across the `sql-runner` modules and routes, plus a comparable
amount of test code) and self-contained. The boundary between
modules — guard, sandbox, comparator, keywords, runner — was
chosen to make each component independently testable and
substitutable, and the test suite (`npm test`) exercises 38
behaviors across the pure modules in under 200 milliseconds. The
multi-dataset machinery is non-blocking: legacy single-dataset
challenges continue to grade correctly, and the migration path
from the legacy shape to the multi-dataset shape is reversible at
each step.

The work explicitly does not solve every problem in the space.
Cross-dialect support, queue-based scale-out, write-style
challenges, and richer plagiarism detection are deferred to future
iterations and are mentioned here to set the boundary of what was
attempted. The validator is correct and safe for its intended
domain; the deferred items are extensions rather than gaps.

---

## Appendix A: file map

| Path | Purpose |
|---|---|
| `src/lib/sql-runner/guard.js` | AST-based pre-execution validation |
| `src/lib/sql-runner/sandbox.js` | Server-side execution with `MAX_EXECUTION_TIME` and AST `LIMIT` injection |
| `src/lib/sql-runner/comparator.js` | Configurable result-set comparison and hashing |
| `src/lib/sql-runner/keywords.js` | Required-keyword check, comment- and string-aware |
| `src/lib/sql-runner/runner.js` | Single-dataset (`gradeSubmission`) and multi-dataset (`gradeAcrossDatasets`) orchestrators |
| `src/lib/sql-runner/logger.js` | Structured grade logger |
| `src/lib/sql-runner/drift.js` | Sample-rated drift detector |
| `src/lib/sql-runner/rate-limit.js` | MySQL-backed per-user rate limit |
| `src/lib/auth-server.js` | Cookie-derived identity helper |
| `src/lib/mysql-connection.js` | Three-pool connection manager (admin / student / teacher) |
| `src/lib/sql-runner/__tests__/*.mjs` | Unit tests (38 cases) |
| `src/app/api/challenges/[id]/validate/route.js` | Validate endpoint, orchestrates all of the above |
| `src/app/api/challenges/[id]/datasets/route.js` | Dataset attach/list (admin/teacher) |
| `src/app/api/challenges/[id]/datasets/[datasetId]/route.js` | Dataset patch/delete |
| `src/components/challenges/DatasetsManager.jsx` | Admin/teacher dataset management UI |
| `src/scripts/backfill-datasets.js` | Migration from legacy single-dataset shape |
| `src/scripts/cheating-heuristics.js` | Read-only cheating signal report |
| `mysql-init/01-create-users.sql` | MySQL user roles and per-user limits |
| `docs/migrations/phase-{a,b,c}-*.sql` | Explicit DDL files for production application |

---

## Appendix B: relevant standards and references

For a thesis bibliography, the following are the principal external
references the implementation relies on:

- ISO/IEC 9075 — *Database Language SQL*. The standard against
  which dialect divergence is measured.
- MySQL 8.0 Reference Manual, sections on `MAX_EXECUTION_TIME`,
  `MAX_QUERIES_PER_HOUR`, `MAX_USER_CONNECTIONS`, and the
  `student_readonly`-style privilege model.
- The `node-sql-parser` library
  (https://www.npmjs.com/package/node-sql-parser), which provides
  the multi-dialect AST used by the guard and the LIMIT injector.
- The OWASP Top Ten, which informs the threat model in §1.1.
- General comparison with public documentation of the grading
  pipelines of LeetCode, HackerRank, StrataScratch, and DataLemur,
  which establish the four-stage pattern as a de facto standard.

The implementation does not depend on proprietary protocols or
custom file formats; reproducing it requires only a Node.js
runtime, a MySQL server, and the npm dependencies enumerated in
`src/package.json`.
