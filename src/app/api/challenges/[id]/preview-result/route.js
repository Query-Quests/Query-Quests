import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateExpectedResult } from "@/lib/query-validator";

/**
 * POST /api/challenges/[id]/preview-result
 * Execute the expected query and return the result preview (for teachers)
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { query, user_id, database_id } = data;

    // Validate required fields
    if (!query || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields: query and user_id" },
        { status: 400 }
      );
    }

    // Verify user is teacher or admin
    const user = await prisma.user.findUnique({
      where: { id: user_id },
    });

    if (!user || (!user.isTeacher && !user.isAdmin)) {
      return NextResponse.json(
        { error: "Only teachers and admins can preview query results" },
        { status: 403 }
      );
    }

    // Get database name - either from the challenge or from the provided database_id
    let databaseName;

    if (database_id) {
      // Use the provided database_id (for creating/editing challenges)
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

      databaseName = database.mysqlDbName;
    } else if (id && id !== "new") {
      // Use the challenge's assigned database
      const challenge = await prisma.challenge.findUnique({
        where: { id },
        include: { database: true },
      });

      if (!challenge) {
        return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
      }

      if (!challenge.database) {
        return NextResponse.json(
          { error: "Challenge does not have a database assigned" },
          { status: 400 }
        );
      }

      if (challenge.database.status !== "ready") {
        return NextResponse.json(
          { error: "Challenge database is not ready" },
          { status: 400 }
        );
      }

      databaseName = challenge.database.mysqlDbName;
    } else {
      return NextResponse.json(
        { error: "Either database_id or a valid challenge id must be provided" },
        { status: 400 }
      );
    }

    // Execute the query and generate result
    const result = await generateExpectedResult(databaseName, query);

    return NextResponse.json({
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
      executionTimeMs: result.executionTimeMs,
      resultJson: result.resultJson,
      hash: result.hash,
    });
  } catch (error) {
    console.error("Error previewing query result:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to preview query result",
        success: false
      },
      { status: 500 }
    );
  }
}
