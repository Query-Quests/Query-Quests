import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const lesson = await prisma.lesson.findUnique({
      where: { id: id },
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

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json(lesson);
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
      updater_id 
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