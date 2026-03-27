import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractSchema, getSampleData } from "@/lib/database-processor";

/**
 * GET /api/databases/[id]/schema
 * Get detailed schema information for a database
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeSampleData = searchParams.get("sampleData") === "true";
    const sampleLimit = parseInt(searchParams.get("sampleLimit")) || 5;

    // Get the database record
    const database = await prisma.challengeDatabase.findUnique({
      where: { id },
    });

    if (!database) {
      return NextResponse.json({ error: "Database not found" }, { status: 404 });
    }

    if (database.status !== "ready") {
      return NextResponse.json(
        {
          error: "Database is not ready",
          status: database.status,
          errorMessage: database.errorMessage,
        },
        { status: 400 }
      );
    }

    // Check if we have cached schema
    let schema;
    if (database.schemaPreview) {
      try {
        schema = JSON.parse(database.schemaPreview);
      } catch (e) {
        // Re-extract if cached schema is invalid
        schema = await extractSchema(database.mysqlDbName);
      }
    } else {
      // Extract fresh schema
      schema = await extractSchema(database.mysqlDbName);
    }

    // Include sample data if requested
    if (includeSampleData && schema.tables) {
      for (const table of schema.tables) {
        try {
          table.sampleData = await getSampleData(
            database.mysqlDbName,
            table.name,
            sampleLimit
          );
        } catch (error) {
          console.error(`Error getting sample data for ${table.name}:`, error);
          table.sampleData = [];
        }
      }
    }

    return NextResponse.json({
      id: database.id,
      name: database.name,
      mysqlDbName: database.mysqlDbName,
      schema,
    });
  } catch (error) {
    console.error("Error fetching database schema:", error);
    return NextResponse.json(
      { error: "Failed to fetch database schema" },
      { status: 500 }
    );
  }
}
