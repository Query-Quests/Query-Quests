import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleChallengeSolve } from "@/lib/scoring-utils";

export async function POST(request, { params }) {
  try {
    const { id: challengeId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify the challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { id: true, statement: true }
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
      select: { id: true, name: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Handle the challenge solve using the scoring utility
    const result = await handleChallengeSolve(userId, challengeId);

    return NextResponse.json({
      message: "Challenge solved successfully!",
      userScore: result.userScore,
      challengeScore: result.challengeScore,
      totalScore: result.totalScore,
      challenge: {
        id: challenge.id,
        statement: challenge.statement
      },
      user: {
        id: user.id,
        name: user.name
      }
    });

  } catch (error) {
    console.error("Error solving challenge:", error);
    
    if (error.message === "User has already solved this challenge") {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to solve challenge" },
      { status: 500 }
    );
  }
}
