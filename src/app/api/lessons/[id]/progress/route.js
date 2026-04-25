import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { userIdFromCookies } from "@/lib/auth-server";

/**
 * POST /api/lessons/[id]/progress
 * Body: { status: "started" | "completed" }
 *
 * - "started" upserts a row with IN_PROGRESS, never demoting an
 *   existing COMPLETED row (we just bump last_viewed_at).
 * - "completed" sets status=COMPLETED, completed_at=now(), and
 *   bumps last_viewed_at.
 */
export async function POST(request, { params }) {
  const { id: lessonId } = await params;
  const userId = userIdFromCookies(request.cookies);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body?.status;
  if (action !== "started" && action !== "completed") {
    return NextResponse.json(
      { error: "status must be 'started' or 'completed'" },
      { status: 400 }
    );
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const now = new Date();
  const existing = await prisma.lessonProgress.findUnique({
    where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
  });

  if (action === "started") {
    if (!existing) {
      const created = await prisma.lessonProgress.create({
        data: {
          user_id: userId,
          lesson_id: lessonId,
          status: "IN_PROGRESS",
          started_at: now,
          last_viewed_at: now,
        },
      });
      return NextResponse.json(created);
    }
    const updated = await prisma.lessonProgress.update({
      where: { id: existing.id },
      data: { last_viewed_at: now },
    });
    return NextResponse.json(updated);
  }

  // completed
  const upserted = await prisma.lessonProgress.upsert({
    where: { user_id_lesson_id: { user_id: userId, lesson_id: lessonId } },
    create: {
      user_id: userId,
      lesson_id: lessonId,
      status: "COMPLETED",
      started_at: now,
      completed_at: now,
      last_viewed_at: now,
    },
    update: {
      status: "COMPLETED",
      completed_at: existing?.completed_at ?? now,
      last_viewed_at: now,
    },
  });
  return NextResponse.json(upserted);
}
