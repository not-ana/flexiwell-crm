import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { verifyAccessToken, generateTokenPair, getRefreshTokenExpiry } from "@/lib/auth/jwt";
import type { User, RefreshToken } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { isOperatorEmail } from "@/lib/auth/operator";

// POST /api/auth/switch-role - Switch to a different role
export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["admin", "teacher"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin or teacher" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get user from database
    const user = await db.collection<User>("users").findOne({
      _id: new ObjectId(payload.userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has access to the requested role
    const availableRoles = [user.role, ...(user.additionalRoles || [])];
    if (!availableRoles.includes(role)) {
      return NextResponse.json(
        { error: "You do not have access to this role" },
        { status: 403 }
      );
    }

    const isOperator = user.isOperator || isOperatorEmail(user.email);

    // Generate new tokens with the new role
    const tokens = generateTokenPair({
      userId: payload.userId,
      email: user.email,
      role: role, // New role in token
      name: user.name,
      establishmentId: user.establishmentId,
      isOperator,
    });

    // Store new refresh token
    const refreshTokenDoc: Omit<RefreshToken, "_id"> = {
      userId: payload.userId,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      createdAt: new Date(),
    };

    await db.collection<RefreshToken>("refresh_tokens").insertOne(refreshTokenDoc);

    // Return user data with switched role and new tokens
    return NextResponse.json({
      success: true,
      user: {
        id: user._id?.toString(),
        email: user.email,
        name: user.name,
        role: role, // Active role
        primaryRole: user.role,
        availableRoles,
        avatar: user.avatar,
        phone: user.phone,
        isOperator,
      },
      tokens,
    });
  } catch (error) {
    console.error("Error switching role:", error);
    return NextResponse.json(
      { error: "Failed to switch role" },
      { status: 500 }
    );
  }
}

// GET /api/auth/switch-role - Get available roles for current user
export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const db = await getDatabase();

    // Get user from database
    const user = await db.collection<User>("users").findOne({
      _id: new ObjectId(payload.userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const availableRoles = [user.role, ...(user.additionalRoles || [])];

    return NextResponse.json({
      primaryRole: user.role,
      activeRole: payload.role,
      availableRoles,
      canSwitchRoles: availableRoles.length > 1,
    });
  } catch (error) {
    console.error("Error getting available roles:", error);
    return NextResponse.json(
      { error: "Failed to get available roles" },
      { status: 500 }
    );
  }
}
