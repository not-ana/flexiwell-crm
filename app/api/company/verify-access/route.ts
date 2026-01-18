import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { CompanyInvite, User } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// POST /api/company/verify-access - Verify invite code validity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Find the invite code
    const invite = await db.collection<CompanyInvite>("company_invites").findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    });

    if (!invite) {
      return NextResponse.json(
        { valid: false, error: "Invalid invite code" },
        { status: 200 }
      );
    }

    // Check if expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "This invite code has expired" },
        { status: 200 }
      );
    }

    // Check if max uses reached
    if (invite.maxUses !== null && invite.currentUses >= invite.maxUses) {
      return NextResponse.json(
        { valid: false, error: "This invite code has reached its maximum uses" },
        { status: 200 }
      );
    }

    // Get company/admin info
    const admin = await db.collection<User>("users").findOne({
      _id: new ObjectId(invite.companyId),
    });

    // Get studio name from settings if available
    let studioName = admin?.name || "Studio";
    const settings = await db.collection("studio_settings").findOne({
      ownerId: invite.companyId,
    });
    if (settings?.general?.studioName) {
      studioName = settings.general.studioName;
    }

    return NextResponse.json({
      valid: true,
      companyId: invite.companyId,
      companyName: studioName,
      inviteName: invite.name || "General Invite",
      remainingUses: invite.maxUses !== null ? invite.maxUses - invite.currentUses : null,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error("Error verifying invite code:", error);
    return NextResponse.json(
      { error: "Failed to verify invite code" },
      { status: 500 }
    );
  }
}
