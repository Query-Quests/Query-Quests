# When (and how) to add a queue to the validator

Phase C scoping deliberately did **not** add BullMQ + Redis. This note
records why, and what the trigger condition + minimum-viable
implementation would look like when it's time.

## Why not now

- The Railway-hosted Node process has no Vercel-style request timeout
  to design around — synchronous request/response is fine for
  multi-second grades.
- Phase A's `MAX_EXECUTION_TIME` caps any individual SELECT at 5
  seconds server-side; a single grade is bounded.
- Adding Redis adds: a Railway add-on, an env var
  (`REDIS_URL`), a separate worker process, two new failure modes
  (queue backlog and worker death), and a polling/SSE flow on the
  frontend. All real work, none of it bought today.
- The MySQL-backed rate limit (`src/lib/sql-runner/rate-limit.js`)
  prevents any single user from saturating the pool during the
  synchronous-only window.

## Trigger to revisit

Switch to a queue when **any** of:

1. p95 grade time exceeds 2 seconds, or p99 exceeds 5 seconds, on the
   `logGrade` event stream — students start staring at spinners.
2. Sustained `student_readonly` pool exhaustion — visible as
   `ER_CON_COUNT_ERROR` in logs, or `getConnection()` resolving > 1s.
3. Validator hot-paths that legitimately need > 8 seconds (e.g.
   write-style challenges that diff dataset state). The current
   `clientTimeoutMs` of 8 s is the hard ceiling for a synchronous
   route.

## Minimum-viable implementation

Three files, in this order:

1. **`src/lib/sql-runner/queue.js`** — wraps a single `enqueue` and
   `getResult` interface. Initially backed by an in-process map
   (current behaviour, just behind an interface). When BullMQ is
   added, swap the implementation; the route doesn't change.

2. **`src/lib/sql-runner/worker.js`** — separate `node` entrypoint
   (`scripts/worker.js`) that pops grade jobs, calls
   `gradeAcrossDatasets` / `gradeSubmission`, persists the
   `QueryAttempt`, and writes the verdict back into the queue.
   Railway runs it as an additional service alongside `next start`.

3. **`/api/challenges/[id]/attempts/[attemptId]`** — GET returns the
   verdict for a queued attempt. Frontend polls (or upgrades to SSE)
   until status leaves `queued` / `running`.

`POST /validate` becomes "create a queued attempt, return 202 with the
attempt id." The frontend at `src/app/challenges/[id]/page.jsx`
already has `setValidating(true)` plumbing — wiring it to a poll loop
is mechanical.

Estimated work: 1 focused day, plus the Railway Redis add-on.

## What to **not** do

- Don't add an in-process queue (BullMQ-on-localhost) without Redis.
  It buys none of the durability/horizontal-scale wins and adds
  failure modes we don't have today.
- Don't run the worker inside the Next.js process. Railway will
  restart `next` on deploy and you'll lose every in-flight grade.
- Don't add the queue *before* hitting the trigger. The current sync
  path is faster end-to-end for ≤2s grades than queue+poll.
