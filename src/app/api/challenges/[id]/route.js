import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id: id },
      include: {
        institution: true,
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
      statement, 
      help, 
      solution, 
      level, 
      institution_id,
      initial_score,
      updater_id 
    } = data;

    // Validate required fields
    if (!statement || !solution || !level || !initial_score) {
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
        statement,
        help: help || null,
        solution,
        level,
        institution_id: institution_id === 'null' ? null : institution_id,
        initial_score,
        // Update current_score to match initial_score if it's being changed
        current_score: initial_score,
      },
      include: {
        institution: true,
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
