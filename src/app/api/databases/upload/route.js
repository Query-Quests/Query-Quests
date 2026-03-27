import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { generateDbName, processUploadedDatabase, validateSqlFile } from "@/lib/database-processor";
import { v4 as uuidv4 } from "uuid";

// Maximum file size (500MB)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 524288000;

// Upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads/databases";

/**
 * POST /api/databases/upload
 * Upload a SQL file and create a new challenge database
 */
export async function POST(request) {
  try {
    const formData = await request.formData();

    // Get form fields
    const file = formData.get("file");
    const name = formData.get("name");
    const description = formData.get("description");
    const creator_id = formData.get("creator_id");
    const institution_id = formData.get("institution_id");

    // Validate required fields
    if (!file || !name || !creator_id) {
      return NextResponse.json(
        { error: "Missing required fields: file, name, and creator_id are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const filename = file.name;
    if (!filename.toLowerCase().endsWith(".sql")) {
      return NextResponse.json(
        { error: "Only .sql files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    // Verify creator exists and is teacher/admin
    const creator = await prisma.user.findUnique({
      where: { id: creator_id },
    });

    if (!creator || (!creator.isTeacher && !creator.isAdmin)) {
      return NextResponse.json(
        { error: "Only teachers and admins can upload databases" },
        { status: 403 }
      );
    }

    // Generate unique ID and database name
    const databaseId = uuidv4();
    const mysqlDbName = generateDbName(filename, databaseId);

    // Ensure upload directory exists
    const uploadPath = path.resolve(process.cwd(), UPLOAD_DIR);
    await mkdir(uploadPath, { recursive: true });

    // Save the file
    const savedFilename = `${databaseId}_${filename}`;
    const filepath = path.join(uploadPath, savedFilename);
    await writeFile(filepath, buffer);

    // Validate SQL file content
    const validation = await validateSqlFile(filepath);
    if (!validation.valid) {
      // Clean up the uploaded file
      const { unlink } = await import("fs/promises");
      await unlink(filepath).catch(() => {});

      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Determine institution
    let finalInstitutionId = institution_id;
    if (creator.isTeacher && !creator.isAdmin && creator.institution_id) {
      finalInstitutionId = creator.institution_id;
    }

    // Create the database record
    const newDatabase = await prisma.challengeDatabase.create({
      data: {
        id: databaseId,
        name,
        description: description || null,
        filename,
        filepath,
        filesize: buffer.length,
        mysqlDbName,
        status: "processing",
        creator_id,
        institution_id: finalInstitutionId || null,
      },
    });

    // Process the database asynchronously
    // We don't await this - it runs in the background
    processUploadedDatabase(databaseId)
      .then(() => {
        console.log(`Database ${databaseId} processed successfully`);
      })
      .catch((error) => {
        console.error(`Error processing database ${databaseId}:`, error);
      });

    return NextResponse.json(
      {
        id: newDatabase.id,
        name: newDatabase.name,
        status: newDatabase.status,
        message: "File uploaded successfully. Database is being processed.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading database:", error);
    return NextResponse.json(
      { error: "Failed to upload database" },
      { status: 500 }
    );
  }
}
