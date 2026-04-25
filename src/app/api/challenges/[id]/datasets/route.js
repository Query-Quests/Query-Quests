import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { captureExpectedResult } from "@/lib/sql-runner/runner";
import { getUserFromCookies } from "@/lib/auth-server";

/**
 * GET /api/challenges/[id]/datasets
 * List datasets attached to a challenge. Admin/teacher only.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!user.isTeacher && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const datasets = await prisma.challengeDataset.findMany({
      where: { challenge_id: id },
      orderBy: [{ display_order: "asc" }, { created_at: "asc" }],
      include: {
        database: {
          select: {
            id: true,
            name: true,
            mysqlDbName: true,
            status: true,
            tableCount: true,
            rowCount: true,
          },
        },
      },
    });

    return NextResponse.json({ datasets });
  } catch (error) {
    console.error("Error listing datasets:", error);
    return NextResponse.json(
      { error: "Failed to list datasets" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/challenges/[id]/datasets
 * Attach a ChallengeDatabase as a dataset and pre-compute the
 * expected result by running the challenge's reference solution
 * (or a teacher-supplied query) against it.
 *
 * Body: { database_id, is_public?, display_order?, expected_query?, comparator? }
 */
export async function POST(request, { params }) {
  try {
    const { id: challengeId } = await params;
    const body = await request.json();

    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!user.isTeacher && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      database_id,
      is_public = false,
      display_order = 0,
      expected_query,
      comparator,
    } = body;

    if (!database_id) {
      return NextResponse.json(
        { error: "Missing required field: database_id" },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Teachers can only modify challenges within their institution.
    if (
      user.isTeacher && !user.isAdmin &&
      challenge.institution_id !== user.institution_id
    ) {
      return NextResponse.json(
        { error: "Teachers can only modify challenges for their own institution" },
        { status: 403 }
      );
    }

    const database = await prisma.challengeDatabase.findUnique({
      where: { id: database_id },
    });
    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }
    if (database.status !== "ready") {
      return NextResponse.json(
        { error: "Database is not ready" },
        { status: 400 }
      );
    }

    const querySql = expected_query || challenge.solution;
    if (!querySql) {
      return NextResponse.json(
        { error: "No expected query supplied and challenge has no solution" },
        { status: 400 }
      );
    }

    let captured;
    try {
      captured = await captureExpectedResult({
        sql: querySql,
        databaseName: database.mysqlDbName,
        comparator,
      });
    } catch (err) {
      return NextResponse.json(
        { error: `Could not capture expected result: ${err.message}` },
        { status: 400 }
      );
    }

    const dataset = await prisma.challengeDataset.create({
      data: {
        challenge_id: challengeId,
        database_id,
        is_public: !!is_public,
        display_order,
        expectedResult: captured.resultJson,
        expectedHash: captured.hash,
        dataset_version: 1,
      },
      include: {
        database: {
          select: { id: true, name: true, mysqlDbName: true, status: true },
        },
      },
    });

    return NextResponse.json(
      {
        dataset,
        capture: {
          rowCount: captured.rowCount,
          executionTimeMs: captured.executionTimeMs,
          columns: captured.columns,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error attaching dataset:", error);
    return NextResponse.json(
      { error: "Failed to attach dataset" },
      { status: 500 }
    );
  }
}
