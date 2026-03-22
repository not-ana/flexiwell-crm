import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { User, RefreshToken } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import {
  verifyPassword,
  generateTokenPair,
  getRefreshTokenExpiry,
} from "@/lib/auth/jwt";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(`login:${clientIp}`, RATE_LIMITS.login);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  }

  try {
    const { email, password, turnstileToken } = await request.json();

    // Verify CAPTCHA
    const captcha = await verifyTurnstileToken(turnstileToken);
    if (!captcha.success) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const user = await db
      .collection<User>("users")
      .findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated. Please contact support." },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const userId = user._id!.toString();

    const tokens = generateTokenPair({
      userId,
      email: user.email,
      role: user.role,
      name: user.name,
      establishmentId: user.establishmentId,
    });

    await db.collection<RefreshToken>("refresh_tokens").deleteMany({ userId });

    await db.collection<RefreshToken>("refresh_tokens").insertOne({
      userId,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      createdAt: new Date(),
    });

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        staffId: user.staffId,
        clientId: user.clientId,
      },
      tokens,
    });

    // Set auth cookie so server-side cookie auth works
    response.cookies.set("auth_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes (matches access token expiry)
    });

    return response;
  } catch (error) {
    console.error("Login error occurred");
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
