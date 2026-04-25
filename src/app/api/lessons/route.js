import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get('institutionId');
    const publishedOnly = searchParams.get('published') === 'true';
    
    let whereClause = {};
    if (institutionId) {
      whereClause.institution_id = institutionId;
    }
    if (publishedOnly) {
      whereClause.isPublished = true;
    }
    
    const lessons = await prisma.lesson.findMany({
      where: whereClause,
      orderBy: [
        { order: 'asc' },
        { created_at: 'desc' }
      ],
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
    return NextResponse.json(lessons);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      title,
      content,
      description,
      order,
      isPublished,
      creator_id,
      module_id,
    } = data;

    // Validate required fields
    if (!title || !content || !creator_id) {
      return NextResponse.json(
        { error: "Title, content, and creator are required" },
        { status: 400 }
      );
    }

    // Verify the creator is a teacher or admin
    const creator = await prisma.user.findUnique({
      where: { id: creator_id },
      include: { institution: true },
    });

    if (!creator || (!creator.isTeacher && !creator.isAdmin)) {
      return NextResponse.json(
        { error: "Only teachers and admins can create lessons" },
        { status: 403 }
      );
    }

    // Set institution_id to creator's institution
    const institution_id = creator.institution_id;

    const newLesson = await prisma.lesson.create({
      data: {
        title,
        content,
        description: description || null,
        order: order || 0,
        isPublished: isPublished || false,
        institution_id,
        creator_id: creator_id,
        module_id: module_id || null,
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

    return NextResponse.json(newLesson, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
} 