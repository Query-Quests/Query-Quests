import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institutionId');

    // Build query filter based on institutionId
    const whereClause = institutionId ? { institution_id: institutionId } : {};

    // Get challenges based on filters
    const allChallenges = await prisma.challenge.findMany({
      where: whereClause,
      select: {
        id: true,
        level: true,
        initial_score: true,
        current_score: true,
        solves: true,
      },
    });

    const totalChallenges = allChallenges.length;
    const totalSolves = allChallenges.reduce((sum, challenge) => sum + challenge.solves, 0);
    const totalInitialPoints = allChallenges.reduce((sum, challenge) => sum + challenge.initial_score, 0);
    const totalCurrentPoints = allChallenges.reduce((sum, challenge) => sum + challenge.current_score, 0);
    const avgDifficulty = totalChallenges > 0 
      ? Math.round(allChallenges.reduce((sum, challenge) => sum + challenge.level, 0) / totalChallenges * 10) / 10
      : 0;

    return NextResponse.json({
      totalChallenges,
      totalSolves,
      avgDifficulty,
      totalInitialPoints,
      totalCurrentPoints,
    });
  } catch (error) {
    console.error("Error fetching challenge stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenge stats" },
      { status: 500 }
    );
  }
}
