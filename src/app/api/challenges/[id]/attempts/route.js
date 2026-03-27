import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/challenges/[id]/attempts
 * Get query attempts for a challenge (for analytics)
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const user_id = searchParams.get('user_id');
    const correct_only = searchParams.get('correct_only') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      challenge_id: id,
    };

    // Filter by user if specified
    if (user_id) {
      whereClause.user_id = user_id;
    }

    // Filter by correct answers only
    if (correct_only) {
      whereClause.isCorrect = true;
    }

    // Get total count
    const totalAttempts = await prisma.queryAttempt.count({
      where: whereClause,
    });

    // Get attempts with pagination
    const attempts = await prisma.queryAttempt.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
    });

    // Calculate statistics
    const stats = await prisma.queryAttempt.aggregate({
      where: { challenge_id: id },
      _count: { id: true },
      _avg: { executionTimeMs: true },
    });

    const correctCount = await prisma.queryAttempt.count({
      where: { challenge_id: id, isCorrect: true },
    });

    const uniqueUsers = await prisma.queryAttempt.groupBy({
      by: ['user_id'],
      where: { challenge_id: id },
      _count: true,
    });

    const totalPages = Math.ceil(totalAttempts / limit);

    return NextResponse.json({
      attempts,
      pagination: {
        totalAttempts,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      statistics: {
        totalAttempts: stats._count.id,
        correctAttempts: correctCount,
        successRate: stats._count.id > 0
          ? ((correctCount / stats._count.id) * 100).toFixed(2)
          : 0,
        averageExecutionTimeMs: stats._avg.executionTimeMs?.toFixed(2) || 0,
        uniqueUsers: uniqueUsers.length,
      },
    });
  } catch (error) {
    console.error("Error fetching attempts:", error);
    return NextResponse.json(
      { error: "Failed to fetch attempts" },
      { status: 500 }
    );
  }
}
