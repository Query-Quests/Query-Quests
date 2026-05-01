import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateToken,
  sendVerificationEmail,
  VERIFICATION_TOKEN_TTL_MS,
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

    // Always return 200 to avoid leaking which emails are registered.
    const genericResponse = {
      message:
        "If an unverified account exists for that email, a new verification link has been sent.",
    };

    if (!user || user.isEmailVerified) {
      return NextResponse.json(genericResponse);
    }

    const token = generateToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationTokenExpiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      },
    });

    await sendVerificationEmail(user.email, user.name, token);

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Error resending verification email:", error);
    return NextResponse.json(
      { error: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
