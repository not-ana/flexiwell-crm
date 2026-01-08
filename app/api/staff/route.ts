import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { notificationService } from "@/lib/services/notification.service";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Staff } from "@/lib/db/schemas";

// GET /api/staff - List all staff with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (role && role !== "all") {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [staff, total] = await Promise.all([
      db
        .collection<Staff>("staff")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Staff>("staff").countDocuments(filter),
    ]);

    return NextResponse.json({
      staff,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create a new staff member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, role, specialties, schedule } = body;

    // Validation
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 }
      );
    }

    if (!["admin", "teacher", "receptionist"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, teacher, or receptionist" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if email already exists
    const existingStaff = await db
      .collection<Staff>("staff")
      .findOne({ email: email.toLowerCase() });

    if (existingStaff) {
      return NextResponse.json(
        { error: "A staff member with this email already exists" },
        { status: 409 }
      );
    }

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Generate a temporary password and invitation token
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const invitationToken = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user account
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      invitationToken,
      invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      passwordResetRequired: true,
      status: "invited",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userResult = await db.collection("users").insertOne(newUser);

    // Create staff record linked to user
    // Note: Staff starts as inactive until they accept the invitation
    const newStaff = {
      name,
      email: email.toLowerCase(),
      phone: phone || "",
      role,
      specialties: specialties || [],
      schedule: schedule || [],
      status: "inactive", // Will be activated when user accepts invite
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const staffResult = await db.collection("staff").insertOne(newStaff);

    // Link user to staff
    await db.collection("users").updateOne(
      { _id: userResult.insertedId },
      { $set: { staffId: staffResult.insertedId.toString() } }
    );

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/auth/accept-invite?token=${invitationToken}`;

    try {
      await notificationService.sendCustomMessage(
        staffResult.insertedId.toString(),
        `Convite para ${role === "admin" ? "Administrador" : role === "teacher" ? "Professor" : "Recepcionista"} - FlexiWell`,
        `Olá ${name}!\n\n` +
        `Você foi convidado(a) para se juntar à equipe do FlexiWell como ${role === "admin" ? "Administrador" : role === "teacher" ? "Professor" : "Recepcionista"}.\n\n` +
        `Para ativar sua conta, clique no link abaixo:\n${inviteUrl}\n\n` +
        `Ou use as credenciais temporárias:\n` +
        `Email: ${email.toLowerCase()}\n` +
        `Senha temporária: ${tempPassword}\n\n` +
        `Este convite expira em 7 dias.\n\n` +
        `Bem-vindo(a) à equipe!`,
        "email"
      );
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        staff: {
          _id: staffResult.insertedId,
          ...newStaff,
        },
        invitationSent: true,
        // Only return temp password in development for testing
        ...(process.env.NODE_ENV === "development" && { tempPassword }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}
