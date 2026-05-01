import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateToken,
  sendPasswordResetEmail,
  RESET_TOKEN_TTL_MS,
} from "@/lib/email";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return 200 with the same message to avoid email enumeration.
    const genericResponse = {
      message:
        "If an account exists for that email, a password reset link has been sent.",
    };

    if (!user) {
      return NextResponse.json(genericResponse);
    }

    const token = generateToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    await sendPasswordResetEmail(user.email, user.name, token);

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
