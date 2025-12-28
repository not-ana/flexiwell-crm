import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { User, RefreshToken } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/middleware";
import { verifyPassword, hashPassword } from "@/lib/auth/jwt";

// PUT /api/auth/password - Change password
export async function PUT(request: NextRequest) {
  // Require authentication
  const { user: authUser, error } = requireAuth(request);

  if (error) {
    return error;
  }

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get user with password
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(authUser!.userId) }) as User | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db.collection("users").updateOne(
      { _id: new ObjectId(authUser!.userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    // Invalidate all refresh tokens (force re-login on all devices)
    await db.collection<RefreshToken>("refresh_tokens").deleteMany({
      userId: authUser!.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
