import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 25;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const institution = searchParams.get('institution') || '';

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where = {};

    // Search filter - use contains for SQLite compatibility
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Role filter
    if (role === 'admin') {
      where.isAdmin = true;
    } else if (role === 'teacher') {
      where.isTeacher = true;
      where.isAdmin = false;
    } else if (role === 'student') {
      where.isAdmin = false;
      where.isTeacher = false;
    }

    // Institution filter
    if (institution && institution !== 'all') {
      where.institution_id = institution;
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });

    // Get users with pagination and filtering
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        isEmailVerified: true,
        isTeacher: true,
        isAdmin: true,
        solvedChallenges: true,
        totalScore: true,
        last_login: true,
        institution_id: true,
        institution: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: limit,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { name, email, password, institution_id, isAdmin, isTeacher, isEmailVerified } = data;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password (you should use bcrypt or similar)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
      institution_id: institution_id && institution_id !== "none" ? institution_id.toString() : null,
      isAdmin: isAdmin || false,
      isTeacher: isTeacher || false,
      isEmailVerified: isEmailVerified || false,
    };
    
    const newUser = await prisma.user.create({
      data: userData,
      include: {
        institution: true,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "Invalid institution ID" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to create user: ${error.message}` },
      { status: 500 }
    );
  }
} 
