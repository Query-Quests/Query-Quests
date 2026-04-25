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

    // Compute streak from any "active" day — a day on which the user
    // either solved a challenge or completed a lesson. Days are
    // measured in UTC; the streak is the count of consecutive days
    // ending today (or yesterday if no activity today yet) where the
    // user had at least one event.
    const [solveDates, lessonDates] = await Promise.all([
      prisma.userChallenge.findMany({
        where: { user_id: userId },
        select: { created_at: true },
      }),
      prisma.lessonProgress.findMany({
        where: { user_id: userId, status: "COMPLETED" },
        select: { completed_at: true },
      }),
    ]);
    const activeDayKeys = new Set();
    for (const r of solveDates) {
      if (r.created_at) activeDayKeys.add(r.created_at.toISOString().slice(0, 10));
    }
    for (const r of lessonDates) {
      if (r.completed_at) activeDayKeys.add(r.completed_at.toISOString().slice(0, 10));
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let streak = 0;
    let cursor = new Date(today);
    if (!activeDayKeys.has(cursor.toISOString().slice(0, 10))) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    while (activeDayKeys.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return NextResponse.json({
      user,
      solvedChallenges,
      stats: {
        totalChallenges: solvedChallenges.length,
        totalScore: user.totalScore,
        averageScore: solvedChallenges.length > 0
          ? Math.round(solvedChallenges.reduce((sum, sc) => sum + sc.score, 0) / solvedChallenges.length)
          : 0,
        streak,
      },
    });

  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
