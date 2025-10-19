import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSolvedChallenges } from "@/lib/scoring-utils";

export async function GET(request, { params }) {
  try {
    const { id: userId } = await params;

    // Get user basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isEmailVerified: true,
        isTeacher: true,
        isAdmin: true,
        solvedChallenges: true,
        totalScore: true,
        last_login: true,
        institution: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's solved challenges with scores
    const solvedChallenges = await getUserSolvedChallenges(userId);

    return NextResponse.json({
      user,
      solvedChallenges,
      stats: {
        totalChallenges: solvedChallenges.length,
        totalScore: user.totalScore,
        averageScore: solvedChallenges.length > 0 
          ? Math.round(solvedChallenges.reduce((sum, sc) => sum + sc.score, 0) / solvedChallenges.length)
          : 0
      }
    });

  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
