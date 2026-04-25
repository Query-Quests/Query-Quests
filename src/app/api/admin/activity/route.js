import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/activity
 *
 * Unified per-user activity feed for the admin dashboard. Sources:
 *   - UserChallenge (CHALLENGE_SOLVED)
 *   - LessonProgress (LESSON_STARTED, LESSON_COMPLETED)
 *   - QueryAttempt with verdict='passed' (CHALLENGE_SOLUTION_PASSED)
 *   - User.last_login (LOGIN)
 *   - User.created_at (USER_CREATED)
 *
 * Returns a time-sorted list, newest first, capped at `limit` (default 100).
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 100, 1), 500);

  try {
    const [solves, lessonStarts, lessonCompletes, queryAttempts, recentLogins] =
      await Promise.all([
        prisma.userChallenge.findMany({
          orderBy: { created_at: "desc" },
          take: limit,
          include: {
            user: { select: { id: true, name: true, email: true, isAdmin: true, isTeacher: true } },
            challenge: { select: { id: true, name: true, level: true } },
          },
        }),
        prisma.lessonProgress.findMany({
          orderBy: { started_at: "desc" },
          take: limit,
          include: {
            user: { select: { id: true, name: true, email: true } },
            lesson: { select: { id: true, title: true } },
          },
        }),
        prisma.lessonProgress.findMany({
          where: { status: "COMPLETED", completed_at: { not: null } },
          orderBy: { completed_at: "desc" },
          take: limit,
          include: {
            user: { select: { id: true, name: true, email: true } },
            lesson: { select: { id: true, title: true } },
          },
        }),
        prisma.queryAttempt.findMany({
          where: { verdict: "passed" },
          orderBy: { timestamp: "desc" },
          take: limit,
          include: {
            user: { select: { id: true, name: true, email: true } },
            challenge: { select: { id: true, name: true } },
          },
        }),
        prisma.user.findMany({
          where: { last_login: { not: null } },
          orderBy: { last_login: "desc" },
          take: limit,
          select: { id: true, name: true, email: true, last_login: true, isAdmin: true, isTeacher: true },
        }),
      ]);

    const events = [];

    for (const r of solves) {
      events.push({
        id: `solve-${r.id}`,
        type: "challenge_complete",
        timestamp: r.created_at,
        actor: r.user,
        details: `Solved "${r.challenge?.name ?? "challenge"}" · +${r.score} pts`,
      });
    }

    for (const r of lessonStarts) {
      events.push({
        id: `lesson-start-${r.id}`,
        type: "challenge_start",
        timestamp: r.started_at,
        actor: r.user,
        details: `Started lesson "${r.lesson?.title ?? "?"}"`,
      });
    }

    for (const r of lessonCompletes) {
      events.push({
        id: `lesson-done-${r.id}`,
        type: "challenge_complete",
        timestamp: r.completed_at,
        actor: r.user,
        details: `Completed lesson "${r.lesson?.title ?? "?"}"`,
      });
    }

    for (const r of queryAttempts) {
      events.push({
        id: `attempt-${r.id}`,
        type: "challenge_start",
        timestamp: r.timestamp,
        actor: r.user,
        details: `Submitted passing query for "${r.challenge?.name ?? "challenge"}"`,
      });
    }

    for (const u of recentLogins) {
      if (!u.last_login) continue;
      events.push({
        id: `login-${u.id}-${u.last_login.getTime()}`,
        type: "login",
        timestamp: u.last_login,
        actor: u,
        details: u.isAdmin ? "Administrator signed in" : u.isTeacher ? "Teacher signed in" : "Student signed in",
      });
    }

    events.sort((a, b) => (b.timestamp?.getTime?.() ?? 0) - (a.timestamp?.getTime?.() ?? 0));

    return NextResponse.json({ events: events.slice(0, limit) });
  } catch (error) {
    console.error("activity feed error:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
