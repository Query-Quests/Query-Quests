import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  try {
    const { id: challengeId } = await params;
    const { userId, validated } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify the challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has already solved this challenge
    const existingSolve = await prisma.userChallenge.findUnique({
      where: {
        user_id_challenge_id: {
          user_id: userId,
          challenge_id: challengeId,
        },
      },
    });

    if (existingSolve) {
      // User already solved - no additional points
      return NextResponse.json({
        success: true,
        alreadySolved: true,
        pointsAwarded: 0,
        totalScore: user.totalScore,
        message: "Challenge already completed. No additional points awarded.",
      });
    }

    // Optional: Verify that the user has a correct query attempt
    // This ensures they can't just call the solve endpoint directly
    if (validated !== false && challenge.database_id) {
      const correctAttempt = await prisma.queryAttempt.findFirst({
        where: {
          user_id: userId,
          challenge_id: challengeId,
          isCorrect: true,
        },
        orderBy: { timestamp: 'desc' },
      });

      if (!correctAttempt) {
        return NextResponse.json(
          { error: "No validated correct answer found. Please solve the challenge first." },
          { status: 400 }
        );
      }
    }

    const pointsAwarded = challenge.current_score;

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create the UserChallenge record
      const userChallenge = await tx.userChallenge.create({
        data: {
          user_id: userId,
          challenge_id: challengeId,
          score: pointsAwarded,
        },
      });

      // Update user's stats
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          solvedChallenges: { increment: 1 },
          totalScore: { increment: pointsAwarded },
        },
      });

      // Update challenge stats
      await tx.challenge.update({
        where: { id: challengeId },
        data: {
          solves: { increment: 1 },
        },
      });

      // Create a log entry
      await tx.log.create({
        data: {
          uuidTrial: `solve_${Date.now()}`,
          request: 'Challenge solved',
          response: JSON.stringify({ pointsAwarded }),
          isCompleted: true,
          challenge_id: challengeId,
          user_id: userId,
        },
      });

      return { userChallenge, updatedUser };
    });

    // Get user's rank
    const rank = await prisma.user.count({
      where: {
        totalScore: {
          gt: result.updatedUser.totalScore,
        },
      },
    }) + 1;

    // Get suggested next challenge (unsolved, similar or next level)
    const nextChallenge = await prisma.challenge.findFirst({
      where: {
        id: { not: challengeId },
        level: { gte: challenge.level },
        userChallenges: {
          none: { user_id: userId },
        },
        // Match institution if user has one
        OR: user.institution_id
          ? [
              { institution_id: user.institution_id },
              { institution_id: null },
            ]
          : [{ institution_id: null }],
      },
      orderBy: [
        { level: 'asc' },
        { current_score: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        level: true,
        current_score: true,
      },
    });

    return NextResponse.json({
      success: true,
      alreadySolved: false,
      pointsAwarded,
      totalScore: result.updatedUser.totalScore,
      solvedChallenges: result.updatedUser.solvedChallenges,
      rank,
      nextChallenge,
      challenge: {
        id: challenge.id,
        name: challenge.name,
      },
      user: {
        id: user.id,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error solving challenge:", error);

    if (error.code === 'P2002') {
      // Unique constraint violation - already solved
      return NextResponse.json({
        success: true,
        alreadySolved: true,
        pointsAwarded: 0,
        message: "Challenge already completed.",
      });
    }

    return NextResponse.json(
      { error: "Failed to solve challenge" },
      { status: 500 }
    );
  }
}
