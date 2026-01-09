import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { requireAuthFromCookie } from "@/lib/auth/middleware";

// GET - Fetch current user profile
export async function GET() {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const dbUser = await db.collection("users").findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { password: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
    );

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: dbUser._id.toString(),
      email: dbUser.email,
      name: dbUser.name,
      firstName: dbUser.firstName || dbUser.name?.split(" ")[0] || "",
      lastName: dbUser.lastName || dbUser.name?.split(" ").slice(1).join(" ") || "",
      phone: dbUser.phone || "",
      avatar: dbUser.avatar || null,
      role: dbUser.role,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { firstName, lastName, phone, avatar, currentPassword, newPassword } = body;

    const db = await getDatabase();
    const dbUser = await db.collection("users").findOne({
      _id: new ObjectId(user.userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (firstName !== undefined) {
      updateData.firstName = firstName.trim();
      updateData.name = `${firstName.trim()} ${lastName?.trim() || dbUser.lastName || ""}`.trim();
    }

    if (lastName !== undefined) {
      updateData.lastName = lastName.trim();
      updateData.name = `${firstName?.trim() || dbUser.firstName || ""} ${lastName.trim()}`.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    // Handle password change
    if (currentPassword && newPassword) {
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, dbUser.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }

      // Hash new password
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // Update user
    await db.collection("users").updateOne(
      { _id: new ObjectId(user.userId) },
      { $set: updateData }
    );

    // Fetch updated user
    const updatedUser = await db.collection("users").findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { password: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?._id.toString(),
        email: updatedUser?.email,
        name: updatedUser?.name,
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        phone: updatedUser?.phone,
        avatar: updatedUser?.avatar,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
