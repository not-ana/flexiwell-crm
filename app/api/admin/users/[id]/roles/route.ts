import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import type { User } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/admin/users/[id]/roles - Get user's roles
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();

    const user = await db.collection<User>("users").findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: user._id?.toString(),
      email: user.email,
      name: user.name,
      primaryRole: user.role,
      additionalRoles: user.additionalRoles || [],
      allRoles: [user.role, ...(user.additionalRoles || [])],
    });
  } catch (error) {
    console.error("Error getting user roles:", error);
    return NextResponse.json(
      { error: "Failed to get user roles" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/[id]/roles - Add role to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["admin", "teacher", "client"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, teacher, or client" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const user = await db.collection<User>("users").findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has this role
    const currentRoles = [user.role, ...(user.additionalRoles || [])];
    if (currentRoles.includes(role)) {
      return NextResponse.json(
        { error: "User already has this role" },
        { status: 400 }
      );
    }

    // Add role to additionalRoles
    await db.collection<User>("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $addToSet: { additionalRoles: role },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Role '${role}' added to user`,
      allRoles: [...currentRoles, role],
    });
  } catch (error) {
    console.error("Error adding user role:", error);
    return NextResponse.json(
      { error: "Failed to add user role" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/roles - Remove role from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["admin", "teacher", "client"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, teacher, or client" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const user = await db.collection<User>("users").findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot remove primary role
    if (role === user.role) {
      return NextResponse.json(
        { error: "Cannot remove primary role. Change primary role first." },
        { status: 400 }
      );
    }

    // Check if role is in additionalRoles
    if (!user.additionalRoles?.includes(role)) {
      return NextResponse.json(
        { error: "User does not have this additional role" },
        { status: 400 }
      );
    }

    // Remove role from additionalRoles
    await db.collection<User>("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: { additionalRoles: role },
        $set: { updatedAt: new Date() },
      }
    );

    const remainingRoles = [user.role, ...(user.additionalRoles || []).filter(r => r !== role)];

    return NextResponse.json({
      success: true,
      message: `Role '${role}' removed from user`,
      allRoles: remainingRoles,
    });
  } catch (error) {
    console.error("Error removing user role:", error);
    return NextResponse.json(
      { error: "Failed to remove user role" },
      { status: 500 }
    );
  }
}
