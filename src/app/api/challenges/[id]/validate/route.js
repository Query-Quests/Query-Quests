import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradeSubmission, gradeAcrossDatasets } from "@/lib/sql-runner/runner";
import { getUserFromCookies } from "@/lib/auth-server";
import { logGrade } from "@/lib/sql-runner/logger";
import { maybeCheckDrift } from "@/lib/sql-runner/drift";
import { checkRateLimit } from "@/lib/sql-runner/rate-limit";

/**
 * POST /api/challenges/[id]/validate
 *
 * Run a student's SQL submission. Identity comes from the auth-token
 * cookie — never the request body.
 *
 * Two grading paths:
 *   - If the challenge has ChallengeDataset rows attached, fan out
 *     across them. Public datasets surface real diffs; failures only
 *     on hidden datasets surface as a generic "didn't match on hidden
 *     tests" message (no row leakage).
 *   - Otherwise fall back to the legacy single-dataset path
 *     (Challenge.database_id + Challenge.expectedResult). Existing
 *     challenges keep working unchanged until backfilled.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { query } = data;

    if (!query) {
      return NextResponse.json(
        { error: "Missing required field: query" },
        { status: 400 }
      );
    }

    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const rate = await checkRateLimit({ userId: user.id });
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded — try again in a few minutes.`,
          used: rate.used,
          limit: rate.limit,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        database: true,
        datasets: {
          orderBy: [{ is_public: "desc" }, { display_order: "asc" }],
          include: { database: true },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const hasDatasets = challenge.datasets.length > 0;
    if (!hasDatasets) {
      if (!challenge.database) {
        return NextResponse.json(
          { error: "This challenge does not have a database configured" },
          { status: 400 }
        );
      }
      if (challenge.database.status !== "ready") {
        return NextResponse.json(
          { error: "Challenge database is not ready" },
          { status: 400 }
        );
      }
    } else {
      const notReady = challenge.datasets.find(
        (d) => d.database.status !== "ready",
      );
      if (notReady) {
        return NextResponse.json(
          { error: "One or more challenge datasets are not ready" },
          { status: 400 }
        );
      }
    }

    const challengeComparator = withInferredOrdering(
      parseComparator(challenge.comparator),
      challenge.statement,
    );

    let result;
    let datasetIdsForLog;
    let hadHiddenFailure;
    if (hasDatasets) {
      const multi = await gradeAcrossDatasets({
        sql: query,
        requiredKeywords: challenge.requiredKeywords,
        datasets: challenge.datasets.map((d) => ({
          id: d.id,
          databaseName: d.database.mysqlDbName,
          expectedResult: d.expectedResult,
          isPublic: d.is_public,
          comparator: challengeComparator,
        })),
      });

      const failed = multi.datasets.find((d) => d.verdict !== "passed");
      const failedOnHidden = failed && !failed.isPublic;

      datasetIdsForLog = multi.datasets.map((d) => d.datasetId);
      hadHiddenFailure = !!failedOnHidden;

      result = {
        verdict: multi.verdict,
        isCorrect: multi.isCorrect,
        executionTimeMs: multi.totalExecutionMs,
        rowCount: failed?.rowCount,
        truncated: undefined,
        resultHash: undefined,
        keywords: multi.keywords,
        comparison: failed?.isPublic ? failed.comparison : undefined,
        feedback: feedbackFor(multi, failed, failedOnHidden),
        error: multi.error,
        errorCode: multi.errorCode,
        rows: undefined,
      };
    } else {
      const single = await gradeSubmission({
        sql: query,
        databaseName: challenge.database.mysqlDbName,
        expectedResult: challenge.expectedResult,
        requiredKeywords: challenge.requiredKeywords,
        comparator: challengeComparator,
      });

      result = {
        verdict: single.verdict,
        isCorrect: single.isCorrect,
        executionTimeMs: single.executionTimeMs,
        rowCount: single.rowCount,
        truncated: single.truncated,
        resultHash: single.resultHash,
        keywords: single.keywords,
        comparison: single.comparison,
        feedback: single.comparison?.message,
        error: single.error,
        errorCode: single.errorCode,
        rows: single.rows,
      };
    }

    await prisma.queryAttempt.create({
      data: {
        query,
        resultHash: result.resultHash || null,
        rowCount: result.rowCount || null,
        executionTimeMs: result.executionTimeMs || null,
        isCorrect: result.isCorrect,
        verdict: result.verdict,
        errorMessage: result.error || null,
        keywordsMatched: result.keywords?.matched
          ? JSON.stringify(result.keywords.matched)
          : null,
        user_id: user.id,
        challenge_id: id,
      },
    });

    logGrade({
      challengeId: id,
      userId: user.id,
      verdict: result.verdict,
      isCorrect: result.isCorrect,
      executionTimeMs: result.executionTimeMs || 0,
      rowCount: result.rowCount,
      errorCode: result.errorCode,
      datasetIds: datasetIdsForLog,
      hadHiddenFailure,
      sql: query,
    });

    // Drift check fires only on a passing submission with datasets;
    // we use it as a low-cost signal that the dataset state is fresh.
    // Fire-and-forget — never block the grade response on telemetry.
    if (result.verdict === "passed" && hasDatasets && datasetIdsForLog?.length) {
      maybeCheckDrift({
        challengeId: id,
        datasetIds: datasetIdsForLog,
      }).catch(() => {});
    }

    const existingSolve = await prisma.userChallenge.findUnique({
      where: {
        user_id_challenge_id: { user_id: user.id, challenge_id: id },
      },
    });

    const response = {
      success: result.verdict !== "errored" && result.verdict !== "timeout",
      verdict: result.verdict,
      isCorrect: result.isCorrect,
      executionTimeMs: result.executionTimeMs,
      rowCount: result.rowCount,
      error: result.error,
      alreadySolved: !!existingSolve,
      pointsAwarded: 0,
    };

    if (result.feedback) response.feedback = result.feedback;
    if (result.keywords?.missing?.length) {
      response.missingKeywords = result.keywords.missing;
    }

    if (result.isCorrect && !existingSolve) {
      response.pointsAwarded = challenge.current_score;
      response.canSolve = true;
    } else if (result.isCorrect && existingSolve) {
      response.message =
        "Challenge already completed. No additional points awarded.";
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error validating query:", error);
    return NextResponse.json(
      { error: "Failed to validate query" },
      { status: 500 }
    );
  }
}

/**
 * Build student-facing feedback. Never reveals data from a hidden
 * dataset's diff — only a generic "didn't match" string.
 */
function feedbackFor(multi, failed, failedOnHidden) {
  if (multi.verdict === "passed") return undefined;
  if (multi.verdict === "errored") return multi.error;
  if (multi.verdict === "timeout") return "Query execution timed out";
  if (!failed) return undefined;
  if (failedOnHidden) {
    return "Your query produced the right output for the sample dataset but failed on a hidden test. Make sure your query handles the general case, not just the visible rows.";
  }
  return failed.comparison?.message;
}

function parseComparator(value) {
  if (!value) return undefined;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

// If the challenge statement implies an ordering and the teacher hasn't
// explicitly set `ordered`, force ordered comparison. Catches the silent
// failure mode where "list X ordered by …" challenges accept any order
// because the comparator's default is `ordered: false`.
//
// English + Spanish since seeded statements use both.
const ORDERING_RE =
  /\b(order(ed)?\s+by|sort(ed)?\s+by|ascending|descending|orden(ado)?\s+por|ordenar\s+por|ascendente|descendente|top\s+\d+|primer(o|os)?\s+\d+|último(s)?\s+\d+|first\s+\d+|last\s+\d+)\b/i;

function withInferredOrdering(opts, statement) {
  if (opts && typeof opts.ordered === "boolean") return opts;
  if (typeof statement !== "string" || !ORDERING_RE.test(statement)) return opts;
  return { ...(opts || {}), ordered: true };
}
