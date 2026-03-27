import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/scoring-utils";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const institution = searchParams.get('institution') || null;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Build where clause with filters
    const whereClause = {
      isAdmin: false, // Exclude admins from leaderboard
    };

    // Add institution filter
    if (institution) {
      whereClause.institution_id = institution;
    }

    const leaderboard = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        totalScore: true,
        solvedChallenges: true,
        institution: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        totalScore: 'desc',
      },
      take: limit,
    });

    await prisma.$disconnect();

    return NextResponse.json({
      leaderboard,
    });

  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
