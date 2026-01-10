import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { User, RefreshToken, CompanyInvite, CompanyClient } from "@/lib/db/schemas";
import {
  hashPassword,
  generateTokenPair,
  getRefreshTokenExpiry,
} from "@/lib/auth/jwt";

// POST /api/auth/register - Register a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, phone, inviteCode } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["admin", "teacher", "client"];
    const userRole = role || "client";
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if user already exists
    const existingUser = await db
      .collection<User>("users")
      .findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Calculate trial dates for admin users (30 days free trial)
    const trialDays = 30;
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    // Create user
    const newUser: Omit<User, "_id"> = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: userRole,
      phone: phone || undefined,
      isActive: true,
      // Start trial for admin users (studio owners)
      ...(userRole === "admin" && {
        trialStartDate,
        trialEndDate,
        trialStatus: "active" as const,
        subscriptionStatus: "trialing" as const,
        trialNotifications: {
          sevenDaysSent: false,
          threeDaysSent: false,
          oneDaySent: false,
          expiredSent: false,
        },
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<User>("users").insertOne(newUser);
    const userId = result.insertedId.toString();

    // Generate tokens
    const tokens = generateTokenPair({
      userId,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    // Store refresh token
    const refreshTokenDoc: Omit<RefreshToken, "_id"> = {
      userId,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      createdAt: new Date(),
    };

    await db.collection<RefreshToken>("refresh_tokens").insertOne(refreshTokenDoc);

    // Se for cliente e tiver codigo de convite, vincular a empresa
    let companyLinked = null;
    if (userRole === "client" && inviteCode) {
      const invite = await db.collection<CompanyInvite>("company_invites").findOne({
        code: inviteCode.toUpperCase(),
        isActive: true,
      });

      if (invite) {
        // Verificar se codigo eh valido
        const isExpired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
        const isLimitReached = invite.maxUses && invite.currentUses >= invite.maxUses;

        if (!isExpired && !isLimitReached) {
          // Criar vinculo empresa-cliente
          const companyClient: Omit<CompanyClient, "_id"> = {
            userId,
            companyId: invite.companyId,
            joinedVia: "invite_code",
            inviteCodeUsed: invite.code,
            status: "active",
            role: "client",
            joinedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.collection<CompanyClient>("company_clients").insertOne(companyClient);

          // Incrementar uso do codigo
          await db.collection<CompanyInvite>("company_invites").updateOne(
            { _id: invite._id },
            {
              $inc: { currentUses: 1 },
              $set: { updatedAt: new Date() },
            }
          );

          companyLinked = {
            companyId: invite.companyId,
            inviteCode: invite.code,
          };
        }
      }
    }

    // Return user data (without password) and tokens
    return NextResponse.json(
      {
        success: true,
        user: {
          id: userId,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          // Include trial info for admin users
          ...(userRole === "admin" && {
            trialStartDate,
            trialEndDate,
            trialStatus: "active",
            subscriptionStatus: "trialing",
          }),
        },
        tokens,
        companyLinked,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
