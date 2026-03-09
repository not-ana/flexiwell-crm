import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import bcrypt from "bcryptjs";

// POST /api/auth/accept-invite - Accept invitation and set password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Find user with this invitation token
    const user = await db.collection("users").findOne({
      invitationToken: token,
      status: "invited",
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invite is invalid or has already been used." },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (user.invitationExpires && new Date(user.invitationExpires) < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired. Please request a new invite." },
        { status: 410 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user - activate account
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          status: "active",
          passwordResetRequired: false,
          updatedAt: new Date(),
        },
        $unset: {
          invitationToken: "",
          invitationExpires: "",
        },
      }
    );

    // Also update staff status
    if (user.staffId) {
      await db.collection("staff").updateOne(
        { _id: { $toString: user.staffId } },
        {
          $set: {
            status: "active",
            updatedAt: new Date(),
          },
        }
      );
    }

    // Update by email as fallback
    await db.collection("staff").updateOne(
      { email: user.email },
      {
        $set: {
          status: "active",
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Account activated successfully",
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Failed to activate account" },
      { status: 500 }
    );
  }
}
