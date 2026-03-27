import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/databases
 * List all challenge databases with pagination and filtering
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 25;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const institution = searchParams.get('institution') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    let whereClause = {};

    // Search filter
    if (search && search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim() } },
        { description: { contains: search.trim() } },
        { filename: { contains: search.trim() } },
      ];
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // Institution filter
    if (institution) {
      if (institution === 'null') {
        whereClause.institution_id = null;
      } else {
        whereClause.institution_id = institution;
      }
    }

    // Get total count for pagination
    const totalDatabases = await prisma.challengeDatabase.count({
      where: whereClause,
    });

    // Get databases with pagination
    const databases = await prisma.challengeDatabase.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        institution: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            challenges: true,
          }
        }
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalDatabases / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      databases,
      pagination: {
        totalDatabases,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Error fetching databases:', error);
    return NextResponse.json(
      { error: "Failed to fetch databases" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/databases
 * Create a new database record (after file upload)
 */
export async function POST(request) {
  try {
    const data = await request.json();
    const {
      name,
      description,
      filename,
      filepath,
      filesize,
      mysqlDbName,
      creator_id,
      institution_id,
    } = data;

    // Validate required fields
    if (!name || !filename || !filepath || !filesize || !mysqlDbName || !creator_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify creator exists and is teacher/admin
    const creator = await prisma.user.findUnique({
      where: { id: creator_id },
    });

    if (!creator || (!creator.isTeacher && !creator.isAdmin)) {
      return NextResponse.json(
        { error: "Only teachers and admins can create databases" },
        { status: 403 }
      );
    }

    // Determine institution
    let finalInstitutionId = institution_id;
    if (creator.isTeacher && !creator.isAdmin && creator.institution_id) {
      // Teachers can only create for their own institution
      finalInstitutionId = creator.institution_id;
    }

    // Create the database record
    const newDatabase = await prisma.challengeDatabase.create({
      data: {
        name,
        description: description || null,
        filename,
        filepath,
        filesize,
        mysqlDbName,
        status: 'processing',
        creator_id,
        institution_id: finalInstitutionId || null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        institution: {
          select: {
            id: true,
            name: true,
          }
        },
      },
    });

    return NextResponse.json(newDatabase, { status: 201 });
  } catch (error) {
    console.error("Error creating database record:", error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "A database with this MySQL name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create database record" },
      { status: 500 }
    );
  }
}
