import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { userIdFromCookies } from "@/lib/auth-server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const lesson = await prisma.lesson.findUnique({
      where: { id: id },
      include: {
        institution: true,
        module: true,
        creator: {
          select: {
            id: true,
            name: true,
            isTeacher: true,
            isAdmin: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const userId = userIdFromCookies(request.cookies);

    const [siblings, progress, moduleProgress] = await Promise.all([
      lesson.module_id
        ? prisma.lesson.findMany({
            where: { module_id: lesson.module_id, isPublished: true },
            select: { id: true, title: true, order: true },
            orderBy: { order: "asc" },
          })
        : Promise.resolve([]),
      userId
        ? prisma.lessonProgress.findUnique({
            where: { user_id_lesson_id: { user_id: userId, lesson_id: id } },
          })
        : Promise.resolve(null),
      userId && lesson.module_id
        ? prisma.lessonProgress.findMany({
            where: {
              user_id: userId,
              lesson: { module_id: lesson.module_id },
            },
            select: { lesson_id: true, status: true },
          })
        : Promise.resolve([]),
    ]);

    const moduleProgressMap = {};
    for (const row of moduleProgress) {
      moduleProgressMap[row.lesson_id] = row.status;
    }

    return NextResponse.json({
      ...lesson,
      siblings,
      progress,
      moduleProgress: moduleProgressMap,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const {
      title,
      content,
      description,
      order,
      isPublished,
      updater_id,
      module_id,
    } = data;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Verify the updater is a teacher or admin
    const updater = await prisma.user.findUnique({
      where: { id: updater_id },
    });

    if (!updater || (!updater.isTeacher && !updater.isAdmin)) {
      return NextResponse.json(
        { error: "Only teachers and admins can update lessons" },
        { status: 403 }
      );
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: id },
      data: {
        title,
        content,
        description: description || null,
        order: order || 0,
        isPublished: isPublished || false,
        module_id: module_id ?? null,
      },
      include: {
        institution: true,
        creator: {
          select: {
            id: true,
            name: true,
            isTeacher: true,
            isAdmin: true
          }
        }
      },
    });

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleter_id = searchParams.get('deleter_id');

    if (!deleter_id) {
      return NextResponse.json(
        { error: "Deleter ID is required" },
        { status: 400 }
      );
    }

    // Verify the deleter is a teacher or admin
    const deleter = await prisma.user.findUnique({
      where: { id: deleter_id },
    });

    if (!deleter || (!deleter.isTeacher && !deleter.isAdmin)) {
      return NextResponse.json(
        { error: "Only teachers and admins can delete lessons" },
        { status: 403 }
      );
    }

    await prisma.lesson.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Lesson deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
} 