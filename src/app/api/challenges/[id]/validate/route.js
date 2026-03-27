import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateQueryAgainstChallenge, hashResult } from "@/lib/query-validator";

/**
 * POST /api/challenges/[id]/validate
 * Validate a user's query against a challenge
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { query, user_id } = data;

    // Validate required fields
    if (!query || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields: query and user_id" },
        { status: 400 }
      );
    }

    // Get the challenge with its database
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        database: true,
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if challenge has a database assigned
    if (!challenge.database) {
      return NextResponse.json(
        { error: "This challenge does not have a database configured" },
        { status: 400 }
      );
    }

    // Check if database is ready
    if (challenge.database.status !== "ready") {
      return NextResponse.json(
        { error: "Challenge database is not ready" },
        { status: 400 }
      );
    }

    // Validate the query
    const result = await validateQueryAgainstChallenge({
      query,
      databaseName: challenge.database.mysqlDbName,
      expectedResult: challenge.expectedResult,
      requiredKeywords: challenge.requiredKeywords,
      userId: user_id,
      challengeId: id,
    });

    // Record the attempt
    await prisma.queryAttempt.create({
      data: {
        query,
        resultHash: result.resultHash || null,
        rowCount: result.rowCount || null,
        executionTimeMs: result.executionTimeMs || null,
        isCorrect: result.isCorrect || false,
        errorMessage: result.error || null,
        keywordsMatched: result.keywordsMatched ? JSON.stringify(result.keywordsMatched) : null,
        user_id,
        challenge_id: id,
      },
    });

    // Check if user has already solved this challenge
    const existingSolve = await prisma.userChallenge.findUnique({
      where: {
        user_id_challenge_id: {
          user_id,
          challenge_id: id,
        },
      },
    });

    // Build response
    const response = {
      success: result.success,
      isCorrect: result.isCorrect || false,
      executionTimeMs: result.executionTimeMs,
      rowCount: result.rowCount,
      error: result.error,
      alreadySolved: !!existingSolve,
      pointsAwarded: 0,
    };

    // If result comparison failed, provide feedback
    if (result.resultDetails) {
      response.feedback = result.resultDetails;
    }

    // If keywords are missing, provide feedback
    if (result.keywordsMissing && result.keywordsMissing.length > 0) {
      response.missingKeywords = result.keywordsMissing;
    }

    // If correct and not already solved, calculate points
    if (result.isCorrect && !existingSolve) {
      response.pointsAwarded = challenge.current_score;
      response.canSolve = true;
    } else if (result.isCorrect && existingSolve) {
      response.pointsAwarded = 0;
      response.message = "Challenge already completed. No additional points awarded.";
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
