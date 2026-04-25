import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { captureExpectedResult } from "@/lib/sql-runner/runner";
import { getUserFromCookies } from "@/lib/auth-server";

/**
 * PATCH /api/challenges/[id]/datasets/[datasetId]
 *
 * Update a dataset's is_public/display_order, OR re-capture its
 * expected result from the current schema by passing
 * `recapture: true`. Re-capture bumps `dataset_version`.
 *
 * Body: { is_public?, display_order?, expected_query?, recapture?, comparator? }
 */
export async function PATCH(request, { params }) {
  try {
    const { id: challengeId, datasetId } = await params;
    const body = await request.json().catch(() => ({}));

    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!user.isTeacher && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dataset = await prisma.challengeDataset.findUnique({
      where: { id: datasetId },
      include: { database: true, challenge: true },
    });
    if (!dataset || dataset.challenge_id !== challengeId) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    if (
      user.isTeacher && !user.isAdmin &&
      dataset.challenge.institution_id !== user.institution_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /** @type {Record<string, any>} */
    const data = {};
    if (typeof body.is_public === "boolean") data.is_public = body.is_public;
    if (typeof body.display_order === "number") data.display_order = body.display_order;

    if (body.recapture) {
      const querySql = body.expected_query || dataset.challenge.solution;
      if (!querySql) {
        return NextResponse.json(
          { error: "No expected query supplied and challenge has no solution" },
          { status: 400 }
        );
      }
      try {
        const captured = await captureExpectedResult({
          sql: querySql,
          databaseName: dataset.database.mysqlDbName,
          comparator: body.comparator,
        });
        data.expectedResult = captured.resultJson;
        data.expectedHash = captured.hash;
        data.dataset_version = { increment: 1 };
      } catch (err) {
        return NextResponse.json(
          { error: `Could not capture expected result: ${err.message}` },
          { status: 400 }
        );
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.challengeDataset.update({
      where: { id: datasetId },
      data,
      include: {
        database: {
          select: { id: true, name: true, mysqlDbName: true, status: true },
        },
      },
    });
    return NextResponse.json({ dataset: updated });
  } catch (error) {
    console.error("Error updating dataset:", error);
    return NextResponse.json(
      { error: "Failed to update dataset" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/challenges/[id]/datasets/[datasetId]
 */
export async function DELETE(request, { params }) {
  try {
    const { id: challengeId, datasetId } = await params;

    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    if (!user.isTeacher && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dataset = await prisma.challengeDataset.findUnique({
      where: { id: datasetId },
      include: { challenge: { select: { institution_id: true } } },
    });
    if (!dataset || dataset.challenge_id !== challengeId) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }
    if (
      user.isTeacher && !user.isAdmin &&
      dataset.challenge.institution_id !== user.institution_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.challengeDataset.delete({ where: { id: datasetId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting dataset:", error);
    return NextResponse.json(
      { error: "Failed to delete dataset" },
      { status: 500 }
    );
  }
}
