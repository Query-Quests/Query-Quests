import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id: id },
      include: {
        institution: true,
        database: {
          select: {
            id: true,
            name: true,
            mysqlDbName: true,
            status: true,
            tableCount: true,
            rowCount: true,
          },
        },
        datasets: {
          // Public datasets only — hidden ones never leak through
          // this endpoint. Admin/teacher tooling uses the dedicated
          // /api/challenges/[id]/datasets route instead.
          where: { is_public: true },
          orderBy: [{ display_order: "asc" }, { created_at: "asc" }],
          select: {
            id: true,
            is_public: true,
            display_order: true,
            dataset_version: true,
            database: {
              select: {
                id: true,
                name: true,
                mysqlDbName: true,
                status: true,
                tableCount: true,
                rowCount: true,
              },
            },
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(challenge);
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenge" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const {
      name,
      statement,
      help,
      solution,
      level,
      institution_id,
      initial_score,
      updater_id,
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

    // Get the challenge to check if it exists and get its institution
    const existingChallenge = await prisma.challenge.findUnique({
      where: { id: id },
      include: { institution: true },
    });

    if (!existingChallenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Verify the updater is a teacher or admin
    const updater = await prisma.user.findUnique({
      where: { id: updater_id },
      include: { institution: true },
    });

    if (!updater || (!updater.isTeacher && !updater.isAdmin)) {
      return NextResponse.json(
        { error: "Only teachers and admins can update challenges" },
        { status: 403 }
      );
    }

    // If updater is a teacher, ensure they can only update challenges for their institution
    if (updater.isTeacher && !updater.isAdmin) {
      if (!updater.institution_id) {
        return NextResponse.json(
          { error: "Teachers must be associated with an institution to update challenges" },
          { status: 403 }
        );
      }
      
      if (existingChallenge.institution_id !== updater.institution_id) {
        return NextResponse.json(
          { error: "Teachers can only update challenges for their own institution" },
          { status: 403 }
        );
      }
    }

    const updatedChallenge = await prisma.challenge.update({
      where: { id: id },
      data: {
        name,
        statement,
        help: help || null,
        solution,
        level,
        institution_id: institution_id === 'null' ? null : institution_id,
        initial_score,
        // Update current_score to match initial_score if it's being changed
        current_score: initial_score,
        database_id: database_id === 'null' || database_id === '' ? null : database_id,
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

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    console.error("Error updating challenge:", error);
    return NextResponse.json(
      { error: "Failed to update challenge" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const existingChallenge = await prisma.challenge.findUnique({
      where: { id: id },
      select: { id: true },
    });

    if (!existingChallenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    await prisma.challenge.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Challenge deleted" });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return NextResponse.json(
      { error: "Failed to delete challenge" },
      { status: 500 }
    );
  }
}
