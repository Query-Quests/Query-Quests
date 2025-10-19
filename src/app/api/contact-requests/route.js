import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const contactRequests = await prisma.contactRequest.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json(contactRequests);
  } catch (error) {
    console.error("Error fetching contact requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact requests" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Request ID and status are required" },
        { status: 400 }
      );
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'pending', 'approved', or 'rejected'" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.contactRequest.update({
      where: { id: id },
      data: { status }
    });

    // If approved, create the institution
    if (status === "approved") {
      await prisma.institution.create({
        data: {
          name: updatedRequest.institutionName,
          studentEmailSuffix: updatedRequest.studentEmailSuffix,
          teacherEmailSuffix: updatedRequest.teacherEmailSuffix,
          address: updatedRequest.website || null
        }
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating contact request:", error);
    return NextResponse.json(
      { error: "Failed to update contact request" },
      { status: 500 }
    );
  }
} 