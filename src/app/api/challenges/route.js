import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 25;
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level') || '';
    const institution = searchParams.get('institution') || '';
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    let whereClause = {};
    
    // Search filter
    if (search && search.trim()) {
      whereClause.name = {
        contains: search.trim(),
      };
    }
    
    // Level filter
    if (level) {
      whereClause.level = parseInt(level);
    }
    
    // Institution filter - include both user's institution and global challenges (no institution)
    if (institution) {
      if (institution === 'null') {
        whereClause.institution_id = null;
      } else {
        whereClause.OR = [
          { institution_id: institution },
          { institution_id: null }
        ];
      }
    }
    
    // Get total count for pagination
    const totalChallenges = await prisma.challenge.count({
      where: whereClause,
    });
    
    // Get challenges with pagination
    const challenges = await prisma.challenge.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        institution: true,
      },
      skip,
      take: limit,
    });
    
    const totalPages = Math.ceil(totalChallenges / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      challenges,
      pagination: {
        totalChallenges,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const {
      name,
      statement,
      help,
      solution,
      level,
      initial_score,
      institution_id: requestInstitutionId,
      creator_id,
      database_id,
      expectedResult,
      requiredKeywords,
    } = data;

    // Validate required fields
    if (!name || !statement || !solution || !level || !initial_score) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use a mutable local copy for institution id
    let institutionId = requestInstitutionId;

    // If a creator is provided, enforce rules for teachers
    if (creator_id) {
      const creator = await prisma.user.findUnique({
        where: { id: creator_id },
        include: { institution: true },
      });

      if (!creator || (!creator.isTeacher && !creator.isAdmin)) {
        return NextResponse.json(
          { error: "Only teachers and admins can create challenges" },
          { status: 403 }
        );
      }

      // If creator is a teacher, ensure they can only create challenges for their institution
      if (creator.isTeacher && !creator.isAdmin) {
        if (!creator.institution_id) {
          return NextResponse.json(
            { error: "Teachers must be associated with an institution to create challenges" },
            { status: 403 }
          );
        }
        
        // For teachers, always use their institution_id regardless of what was requested
        if (creator.isTeacher && !creator.isAdmin) {
          institutionId = creator.institution_id;
          console.log('Teacher creating challenge - forcing institution_id to:', institutionId);
        }
        
        // Set institutionId to teacher's institution if not provided
        if (!institutionId) {
          institutionId = creator.institution_id;
        }
      }
    }

    const newChallenge = await prisma.challenge.create({
      data: {
        name,
        statement,
        help: help || null,
        solution,
        level,
        initial_score,
        current_score: initial_score, // Start with the same as initial score
        institution_id: institutionId ? institutionId : null,
        database_id: database_id || null,
        expectedResult: expectedResult || null,
        requiredKeywords: requiredKeywords || null,
      },
      include: {
        institution: true,
        database: {
          select: {
            id: true,
            name: true,
            mysqlDbName: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(newChallenge, { status: 201 });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }
} 