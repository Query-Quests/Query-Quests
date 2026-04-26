import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromCookies } from "@/lib/auth-server";
import { evaluateAchievements } from "@/lib/achievements-rules";

// A passing /validate must have run within this window for /solve to award
// points. Stops "validate once, replay /solve later after the dataset moves"
// and forces the student to actually re-prove their answer if they walk away
// for half an hour.
const RECENT_ATTEMPT_WINDOW_MS = 5 * 60 * 1000;

export async function POST(request, { params }) {
  try {
    const { id: challengeId } = await params;

    const user = await getUserFromCookies(request.cookies);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = user.id;

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

    // Always require a recent passing /validate. The previous gate was opt-in
    // via a client-supplied `validated` flag (and reversed: `validated !== false`
    // skipped the check), which a malicious client could trivially bypass by
    // posting `{ validated: false }`.
    const cutoff = new Date(Date.now() - RECENT_ATTEMPT_WINDOW_MS);
    const correctAttempt = await prisma.queryAttempt.findFirst({
      where: {
        user_id: userId,
        challenge_id: challengeId,
        isCorrect: true,
        timestamp: { gte: cutoff },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!correctAttempt) {
      return NextResponse.json(
        { error: "No recent validated correct answer found. Please run a passing query first." },
        { status: 400 }
      );
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

    // Achievement evaluation — outside the solve transaction so a slow or
    // broken rule never rolls back the score award. Return the newly-earned
    // codes so the client can show a toast.
    let newlyEarned = [];
    try {
      newlyEarned = await evaluateAchievements({ userId });
    } catch (err) {
      console.error("evaluateAchievements failed:", err);
    }

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
      newlyEarnedAchievements: newlyEarned,
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
