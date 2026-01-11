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

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  // Rate limiting - prevent brute force attacks
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`login:${clientIp}`, RATE_LIMITS.login);

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
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Find user by email
    const user = await db
      .collection<User>("users")
      .findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const userId = user._id!.toString();

    // Generate tokens
    const tokens = generateTokenPair({
      userId,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Invalidate old refresh tokens for this user
    await db.collection<RefreshToken>("refresh_tokens").deleteMany({ userId });

    // Store new refresh token
    const refreshTokenDoc: Omit<RefreshToken, "_id"> = {
      userId,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      createdAt: new Date(),
    };

    await db.collection<RefreshToken>("refresh_tokens").insertOne(refreshTokenDoc);

    // Update last login
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Return user data (without password) and tokens
    return NextResponse.json({
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
  } catch (error) {
    // Don't log sensitive details in production
    console.error("Login error occurred");
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}
