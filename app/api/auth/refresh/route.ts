import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { User, RefreshToken } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import {
  verifyRefreshToken,
  generateTokenPair,
  getRefreshTokenExpiry,
} from "@/lib/auth/jwt";
import { logAuditEvent, getClientIp } from "@/lib/security";
import { isOperatorEmail } from "@/lib/auth/operator";

// POST /api/auth/refresh - Refresh access token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    const db = await getDatabase();

    // Check if refresh token exists in database and is not expired
    const storedToken = await db
      .collection<RefreshToken>("refresh_tokens")
      .findOne({
        userId: decoded.userId,
        token: refreshToken,
        expiresAt: { $gt: new Date() },
      });

    if (!storedToken) {
      // Possible token reuse attack — the token was valid JWT but not in DB.
      // Someone may have stolen a previously-rotated token.
      // Invalidate ALL refresh tokens for this user as a safety measure.
      await db
        .collection<RefreshToken>("refresh_tokens")
        .deleteMany({ userId: decoded.userId });

      const clientIp = getClientIp(request);
      await logAuditEvent({
        type: "token_reuse_detected",
        userId: decoded.userId,
        ip: clientIp,
        userAgent: request.headers.get("user-agent") || undefined,
        metadata: { action: "all_sessions_revoked" },
      }, db);

      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Get user
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(decoded.userId) }) as User | null;

    if (!user || !user.isActive) {
      // Delete the refresh token if user doesn't exist or is inactive
      await db
        .collection<RefreshToken>("refresh_tokens")
        .deleteOne({ _id: storedToken._id });

      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 401 }
      );
    }

    const userId = user._id!.toString();

    // Generate new token pair
    const tokens = generateTokenPair({
      userId,
      email: user.email,
      role: user.role,
      name: user.name,
      establishmentId: user.establishmentId,
      isOperator: user.isOperator || isOperatorEmail(user.email),
    });

    // Delete old refresh token
    await db
      .collection<RefreshToken>("refresh_tokens")
      .deleteOne({ _id: storedToken._id });

    // Store new refresh token
    const newRefreshTokenDoc: Omit<RefreshToken, "_id"> = {
      userId,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      createdAt: new Date(),
    };

    await db.collection<RefreshToken>("refresh_tokens").insertOne(newRefreshTokenDoc);

    const response = NextResponse.json({
      success: true,
      tokens,
    });

    // Update auth cookie with new access token
    response.cookies.set("auth_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    return response;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
