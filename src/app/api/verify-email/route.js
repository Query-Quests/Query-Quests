import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json({
        message: "Email already verified. You can sign in.",
      });
    }

    if (
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt < new Date()
    ) {
      return NextResponse.json(
        {
          error:
            "This verification link has expired. Please request a new one.",
          expired: true,
        },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });

    // Fire-and-forget: don't block the success response if welcome mail fails.
    sendWelcomeEmail(user.email, user.name).catch((err) =>
      console.error("Welcome email failed:", err)
    );

    return NextResponse.json({
      message: "Email verified successfully! You can now log in to your account.",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
