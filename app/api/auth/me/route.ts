import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { User, Client, Staff } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { requireAuth } from "@/lib/auth/middleware";

// GET /api/auth/me - Get current user profile
export async function GET(request: NextRequest) {
  // Require authentication
  const { user: authUser, error } = requireAuth(request);

  if (error) {
    return error;
  }

  try {
    const db = await getDatabase();

    // Get full user data
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(authUser!.userId) }) as User | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build response based on role
    const userData: Record<string, unknown> = {
      id: user._id!.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      // Plan and subscription info
      planTier: user.planTier || "retention_pro",
      subscriptionStatus: user.subscriptionStatus || "none",
      trialStatus: user.trialStatus,
      trialEndDate: user.trialEndDate?.toISOString(),
    };

    // If client, get client data
    if (user.role === "client" && user.clientId) {
      const client = await db
        .collection("clients")
        .findOne({ _id: new ObjectId(user.clientId) }) as Client | null;

      if (client) {
        userData.clientProfile = {
          id: client._id!.toString(),
          plan: client.plan,
          status: client.status,
          preferences: client.preferences,
        };
      }
    }

    // If teacher or admin, get staff data
    if ((user.role === "teacher" || user.role === "admin") && user.staffId) {
      const staff = await db
        .collection("staff")
        .findOne({ _id: new ObjectId(user.staffId) }) as Staff | null;

      if (staff) {
        userData.staffProfile = {
          id: staff._id!.toString(),
          specialties: staff.specialties,
          schedule: staff.schedule,
          status: staff.status,
        };
      }
    }

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

// PUT /api/auth/me - Update current user profile
export async function PUT(request: NextRequest) {
  // Require authentication
  const { user: authUser, error } = requireAuth(request);

  if (error) {
    return error;
  }

  try {
    const body = await request.json();
    const { name, phone, avatar } = body;

    const db = await getDatabase();

    // Build update object
    const updateData: Partial<User> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Update user
    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(authUser!.userId) },
      { $set: updateData },
      { returnDocument: "after" }
    ) as User | null;

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result._id!.toString(),
        email: result.email,
        name: result.name,
        role: result.role,
        phone: result.phone,
        avatar: result.avatar,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
