import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import type { CompanyInvite } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// Gerar código de convite único
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "FW-"; // Prefixo FlexiWell
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/company/invites - Listar códigos de convite da empresa
export async function GET() {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apenas admin pode gerenciar convites
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can manage invite codes" },
        { status: 403 }
      );
    }

    const db = await getDatabase();
    const invites = await db
      .collection<CompanyInvite>("company_invites")
      .find({ companyId: user.userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      invites: invites.map((invite) => ({
        id: invite._id?.toString(),
        code: invite.code,
        name: invite.name,
        maxUses: invite.maxUses,
        currentUses: invite.currentUses,
        remainingUses: invite.maxUses ? invite.maxUses - invite.currentUses : null,
        expiresAt: invite.expiresAt,
        isActive: invite.isActive,
        isExpired: invite.expiresAt ? new Date(invite.expiresAt) < new Date() : false,
        createdAt: invite.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite codes" },
      { status: 500 }
    );
  }
}

// POST /api/company/invites - Criar novo código de convite
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create invite codes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, maxUses, expiresInDays } = body;

    const db = await getDatabase();

    // Gerar código único
    let code = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db
        .collection<CompanyInvite>("company_invites")
        .findOne({ code });
      if (!existing) break;
      code = generateInviteCode();
      attempts++;
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const newInvite: Omit<CompanyInvite, "_id"> = {
      companyId: user.userId,
      code,
      name: name || "Convite Geral",
      maxUses: maxUses || null,
      currentUses: 0,
      expiresAt,
      isActive: true,
      createdBy: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection<CompanyInvite>("company_invites")
      .insertOne(newInvite);

    return NextResponse.json(
      {
        success: true,
        invite: {
          id: result.insertedId.toString(),
          code: newInvite.code,
          name: newInvite.name,
          maxUses: newInvite.maxUses,
          currentUses: newInvite.currentUses,
          expiresAt: newInvite.expiresAt,
          isActive: newInvite.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite code" },
      { status: 500 }
    );
  }
}

// DELETE /api/company/invites - Desativar código de convite
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete invite codes" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get("id");

    if (!inviteId) {
      return NextResponse.json(
        { error: "Invite ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db.collection<CompanyInvite>("company_invites").updateOne(
      {
        _id: new ObjectId(inviteId),
        companyId: user.userId,
      },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Invite code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invite:", error);
    return NextResponse.json(
      { error: "Failed to delete invite code" },
      { status: 500 }
    );
  }
}
