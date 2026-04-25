import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/modules/[id]
 *
 * Single module with its ordered lessons. Used by the admin module
 * edit page. Returns drafts and published items alike — admin only.
 */
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const m = await prisma.module.findUnique({
      where: { id },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            isPublished: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });
    if (!m) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }
    return NextResponse.json(m);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { title, description, order, isPublished, updater_id } = data;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const updater = await prisma.user.findUnique({ where: { id: updater_id } });
    if (!updater || (!updater.isTeacher && !updater.isAdmin)) {
      return NextResponse.json(
        { error: "Only teachers and admins can update modules" },
        { status: 403 }
      );
    }

    const updated = await prisma.module.update({
      where: { id },
      data: {
        title,
        description: description ?? null,
        order: typeof order === "number" ? order : 0,
        isPublished: !!isPublished,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update module" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleter_id = searchParams.get("deleter_id");
    if (!deleter_id) {
      return NextResponse.json(
        { error: "deleter_id is required" },
        { status: 400 }
      );
    }
    const deleter = await prisma.user.findUnique({ where: { id: deleter_id } });
    if (!deleter || (!deleter.isTeacher && !deleter.isAdmin)) {
      return NextResponse.json(
        { error: "Only teachers and admins can delete modules" },
        { status: 403 }
      );
    }

    await prisma.module.delete({ where: { id } });

    return NextResponse.json({ message: "Module deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete module" },
      { status: 500 }
    );
  }
}
