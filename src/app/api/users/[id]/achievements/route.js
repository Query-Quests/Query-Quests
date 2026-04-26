import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users/[id]/achievements
 * Returns the list of earned achievement rows for a user.
 * Caller composes display state by joining against ACHIEVEMENT_DEFINITIONS.
 */
export async function GET(_request, { params }) {
  const { id: userId } = await params;
  const rows = await prisma.achievement.findMany({
    where: { user_id: userId },
    orderBy: { earned_at: "asc" },
    select: { code: true, earned_at: true },
  });
  return NextResponse.json({ achievements: rows });
}
