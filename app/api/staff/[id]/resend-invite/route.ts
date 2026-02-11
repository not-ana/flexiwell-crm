import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { notificationService } from "@/lib/services/notification.service";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { Staff } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// POST /api/staff/[id]/resend-invite - Resend invitation email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid staff ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get staff member
    const staff = await db.collection<Staff>("staff").findOne({
      _id: new ObjectId(id),
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Check if user has already activated their account
    const existingUser = await db.collection("users").findOne({
      email: staff.email,
      status: "active",
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Staff member has already activated their account" },
        { status: 400 }
      );
    }

    // Find or create user account
    const user = await db.collection("users").findOne({
      email: staff.email,
    });

    // Generate new credentials
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const invitationToken = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    if (user) {
      // Update existing user
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedPassword,
            invitationToken,
            invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            passwordResetRequired: true,
            status: "invited",
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Create new user
      await db.collection("users").insertOne({
        name: staff.name,
        email: staff.email,
        password: hashedPassword,
        role: staff.role,
        staffId: id,
        invitationToken,
        invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        passwordResetRequired: true,
        status: "invited",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/auth/accept-invite?token=${invitationToken}`;

    try {
      await notificationService.sendCustomMessage(
        id,
        `Convite Reenviado - FlexiWell`,
        `Olá ${staff.name}!\n\n` +
        `Este é um novo convite para ativar sua conta no FlexiWell.\n\n` +
        `Cargo: ${staff.role === "admin" ? "Administrador" : staff.role === "teacher" ? "Professor" : "Recepcionista"}\n\n` +
        `Para ativar sua conta, clique no link abaixo:\n${inviteUrl}\n\n` +
        `Ou use as credenciais temporárias:\n` +
        `Email: ${staff.email}\n` +
        `Senha temporária: ${tempPassword}\n\n` +
        `Este convite expira em 7 dias.\n\n` +
        `Bem-vindo(a) à equipe!`,
        "email"
      );
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Continue anyway - return success with warning
      return NextResponse.json({
        success: true,
        warning: "Invitation renewed but email could not be sent",
        // Only return temp password in development for testing
        ...(process.env.NODE_ENV === "development" && { tempPassword }),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Invitation resent successfully",
      // Only return temp password in development for testing
      ...(process.env.NODE_ENV === "development" && { tempPassword }),
    });
  } catch (error) {
    console.error("Error resending invite:", error);
    return NextResponse.json(
      { error: "Failed to resend invitation" },
      { status: 500 }
    );
  }
}
