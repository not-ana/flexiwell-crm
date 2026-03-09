import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";

// GET /api/auth/verify-invite?token=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
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
        { valid: false, error: "Invite is invalid or has already been used." },
        { status: 404 }
      );
    }

    // Check if token has expired
    if (user.invitationExpires && new Date(user.invitationExpires) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "This invite has expired. Please request a new invite." },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error verifying invite:", error);
    return NextResponse.json(
      { valid: false, error: "Error verifying invite." },
      { status: 500 }
    );
  }
}
