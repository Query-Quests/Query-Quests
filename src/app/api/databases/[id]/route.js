import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dropDatabase } from "@/lib/database-processor";
import { unlink } from "fs/promises";

/**
 * GET /api/databases/[id]
 * Get a single database by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const database = await prisma.challengeDatabase.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        challenges: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    return NextResponse.json(database);
  } catch (error) {
    console.error("Error fetching database:", error);
    return NextResponse.json(
      { error: "Failed to fetch database" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/databases/[id]
 * Update a database record
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Only allow updating certain fields
    const allowedFields = ["name", "description"];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const database = await prisma.challengeDatabase.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(database);
  } catch (error) {
    console.error("Error updating database:", error);

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update database" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/databases/[id]
 * Delete a database and all associated resources
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Get the database record
    const database = await prisma.challengeDatabase.findUnique({
      where: { id },
      include: {
        challenges: {
          select: { id: true },
        },
      },
    });

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    // Check if any challenges are using this database
    if (database.challenges.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete database that is being used by challenges",
          challengeCount: database.challenges.length,
        },
        { status: 409 }
      );
    }

    // Drop the MySQL database
    try {
      await dropDatabase(database.mysqlDbName);
    } catch (error) {
      console.error("Error dropping MySQL database:", error);
      // Continue with deletion even if MySQL drop fails
    }

    // Delete the SQL file
    try {
      await unlink(database.filepath);
    } catch (error) {
      console.error("Error deleting SQL file:", error);
      // Continue with deletion even if file deletion fails
    }

    // Delete the database record
    await prisma.challengeDatabase.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Database deleted successfully" });
  } catch (error) {
    console.error("Error deleting database:", error);
    return NextResponse.json(
      { error: "Failed to delete database" },
      { status: 500 }
    );
  }
}
