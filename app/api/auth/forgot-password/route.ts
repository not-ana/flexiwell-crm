import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import crypto from "crypto";
import { checkRateLimit, getClientIp, RATE_LIMITS, generateSecureToken } from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { EmailService } from "@/lib/email";

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(`password-reset:${clientIp}`, RATE_LIMITS.passwordReset);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { email, turnstileToken } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Verify CAPTCHA
    const turnstile = await verifyTurnstileToken(turnstileToken);
    if (!turnstile.success) {
      return NextResponse.json(
        { error: turnstile.error || "CAPTCHA verification failed" },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: "If an account with that email exists, we've sent a password reset link.",
    });

    const db = await getDatabase();
    const user = await db.collection("users").findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return successResponse;
    }

    // Generate reset token and store hashed version
    const resetToken = generateSecureToken(48);
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: tokenHash,
          resetPasswordExpires: expiresAt,
          updatedAt: new Date(),
        },
      }
    );

    // Send reset email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    await EmailService.sendPasswordReset(user.email, {
      clientName: user.name || "there",
      resetUrl,
      expiresIn: "1 hour",
    });

    return successResponse;
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
