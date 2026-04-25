import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { userIdFromCookies } from "@/lib/auth-server";

/**
 * GET /api/modules
 *
 * Lists published modules with their lessons (id, title, order) and,
 * for the authed user, the per-lesson progress status. Used by
 * `/lessons` to render module cards with real completion %.
 *
 * Modules with `institution_id` set are filtered to the user's
 * institution; modules without an institution are global and shown to
 * everyone.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUnpublished = searchParams.get("all") === "true";

    const userId = userIdFromCookies(request.cookies);
    let institutionId = null;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { institution_id: true },
      });
      institutionId = user?.institution_id ?? null;
    }

    const modules = await prisma.module.findMany({
      where: {
        ...(includeUnpublished ? {} : { isPublished: true }),
        OR: [
          { institution_id: null },
          ...(institutionId ? [{ institution_id: institutionId }] : []),
        ],
      },
      orderBy: { order: "asc" },
      include: {
        lessons: {
          where: includeUnpublished ? undefined : { isPublished: true },
          select: { id: true, title: true, description: true, order: true, isPublished: true },
          orderBy: { order: "asc" },
        },
      },
    });

    let progressByLesson = {};
    if (userId) {
      const lessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
      if (lessonIds.length) {
        const rows = await prisma.lessonProgress.findMany({
          where: { user_id: userId, lesson_id: { in: lessonIds } },
          select: { lesson_id: true, status: true },
        });
        progressByLesson = Object.fromEntries(
          rows.map((r) => [r.lesson_id, r.status])
        );
      }
    }

    const enriched = modules.map((m) => {
      const total = m.lessons.length;
      const completed = m.lessons.filter(
        (l) => progressByLesson[l.id] === "COMPLETED"
      ).length;
      return {
        ...m,
        progress: {
          total,
          completed,
          percent: total ? Math.round((completed / total) * 100) : 0,
        },
        lessons: m.lessons.map((l) => ({
          ...l,
          status: progressByLesson[l.id] ?? "NOT_STARTED",
        })),
      };
    });

    return NextResponse.json({ modules: enriched });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/modules
 *
 * Admin/teacher only. Creates a new module.
 */
export async function POST(request) {
  try {
    const data = await request.json();
    const { title, description, order, isPublished, creator_id } = data;

    if (!title || !creator_id) {
      return NextResponse.json(
        { error: "title and creator_id are required" },
        { status: 400 }
      );
    }

    const creator = await prisma.user.findUnique({ where: { id: creator_id } });
    if (!creator || (!creator.isTeacher && !creator.isAdmin)) {
      return NextResponse.json(
        { error: "Only teachers and admins can create modules" },
        { status: 403 }
      );
    }

    const created = await prisma.module.create({
      data: {
        title,
        description: description ?? null,
        order: typeof order === "number" ? order : 0,
        isPublished: !!isPublished,
        institution_id: creator.institution_id ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create module" },
      { status: 500 }
    );
  }
}
