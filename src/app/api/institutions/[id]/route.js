import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const institution = await prisma.institution.findUnique({
      where: { id: id },
      include: {
        users: true,
      },
    });

    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    return NextResponse.json(institution);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch institution" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { name, address, studentEmailSuffix, teacherEmailSuffix } = data;

    if (!name || !studentEmailSuffix || !teacherEmailSuffix) {
      return NextResponse.json(
        { error: "Institution name, student email suffix, and teacher email suffix are required" },
        { status: 400 }
      );
    }

    const updatedInstitution = await prisma.institution.update({
      where: { id: id },
      data: {
        name,
        address: address || null,
        studentEmailSuffix,
        teacherEmailSuffix,
      },
    });

    return NextResponse.json(updatedInstitution);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update institution" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const institutionId = id;

    // Get counts for confirmation message
    const userCount = await prisma.user.count({
      where: { institution_id: institutionId },
    });

    const challengeCount = await prisma.challenge.count({
      where: { institution_id: institutionId },
    });

    // Use a transaction to ensure all deletions happen together
    await prisma.$transaction(async (tx) => {
      // 1. Delete all logs related to challenges from this institution
      const challenges = await tx.challenge.findMany({
        where: { institution_id: institutionId },
        select: { id: true }
      });
      
      if (challenges.length > 0) {
        const challengeIds = challenges.map(c => c.id);
        
        // Delete logs related to these challenges
        await tx.log.deleteMany({
          where: { challenge_id: { in: challengeIds } }
        });

        // Delete user challenges related to these challenges
        await tx.userChallenge.deleteMany({
          where: { challenge_id: { in: challengeIds } }
        });
      }

      // 2. Delete all challenges from this institution
      await tx.challenge.deleteMany({
        where: { institution_id: institutionId }
      });

      // 3. Delete all logs related to users from this institution
      const users = await tx.user.findMany({
        where: { institution_id: institutionId },
        select: { id: true }
      });

      if (users.length > 0) {
        const userIds = users.map(u => u.id);
        
        // Delete logs related to these users
        await tx.log.deleteMany({
          where: { user_id: { in: userIds } }
        });

        // Delete user challenges related to these users
        await tx.userChallenge.deleteMany({
          where: { user_id: { in: userIds } }
        });
      }

      // 4. Delete all users from this institution
      await tx.user.deleteMany({
        where: { institution_id: institutionId }
      });

      // 5. Finally, delete the institution itself
      await tx.institution.delete({
        where: { id: institutionId }
      });
    });

    return NextResponse.json({ 
      message: `Institution deleted successfully. Removed ${userCount} users and ${challengeCount} challenges.` 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete institution" },
      { status: 500 }
    );
  }
}
