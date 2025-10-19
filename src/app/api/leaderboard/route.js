import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/scoring-utils";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 25;
    const institution = searchParams.get('institution') || null;

    const skip = (page - 1) * limit;

    // Get total count for pagination
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const whereClause = institution ? { institution_id: institution } : {};

    const totalUsers = await prisma.user.count({
      where: {
        ...whereClause,
        isAdmin: false, // Exclude admins from leaderboard
      },
    });

    const leaderboard = await prisma.user.findMany({
      where: {
        ...whereClause,
        isAdmin: false, // Exclude admins from leaderboard
      },
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
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    await prisma.$disconnect();

    return NextResponse.json({
      leaderboard,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage,
        hasPrevPage,
      },
    });

  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
