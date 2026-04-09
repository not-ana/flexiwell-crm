import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { User, RefreshToken, Establishment } from "@/lib/db/schemas";
import {
  hashPassword,
  generateTokenPair,
  getRefreshTokenExpiry,
} from "@/lib/auth/jwt";
import { checkRateLimit, getClientIp, RATE_LIMITS, validatePassword } from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { isOperatorEmail } from "@/lib/auth/operator";

// POST /api/auth/register - Register a new user
export async function POST(request: NextRequest) {
  // Rate limiting - prevent mass account creation
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(`register:${clientIp}`, RATE_LIMITS.register);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const { email, password, name, role, phone, turnstileToken } = body;

    // Verify CAPTCHA
    const captcha = await verifyTurnstileToken(turnstileToken);
    if (!captcha.success) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

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

    // Validate password strength with comprehensive checks
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["admin", "teacher"];
    const userRole = role || "admin";
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

    const normalizedEmail = email.toLowerCase();
    const isOperator = isOperatorEmail(normalizedEmail);

    // Create user (establishmentId set below for studio admins)
    const newUser: Omit<User, "_id"> = {
      email: normalizedEmail,
      password: hashedPassword,
      name,
      role: userRole,
      isOperator: isOperator || undefined,
      phone: phone || undefined,
      isActive: true,
      subscriptionStatus: userRole === "admin" ? "active" as const : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<User>("users").insertOne(newUser);
    const userId = result.insertedId.toString();

    // For studio admins (and only non-operator accounts), create an
    // Establishment so the dashboard has data to scope queries against.
    // Operators are FlexiWell staff — they don't own a studio of their own.
    let establishmentId: string | undefined;
    if (userRole === "admin" && !isOperator) {
      const newEstablishment: Omit<Establishment, "_id"> = {
        name: `${name}'s Studio`,
        location: "",
        assignedTeachers: [],
        isActive: true,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const estResult = await db
        .collection<Establishment>("establishments")
        .insertOne(newEstablishment);
      establishmentId = estResult.insertedId.toString();

      await db.collection<User>("users").updateOne(
        { _id: result.insertedId },
        { $set: { establishmentId, updatedAt: new Date() } }
      );
      newUser.establishmentId = establishmentId;
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      establishmentId: newUser.establishmentId,
      isOperator,
    });

    // Store refresh token
    const refreshTokenDoc: Omit<RefreshToken, "_id"> = {
      userId,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      createdAt: new Date(),
    };

    await db.collection<RefreshToken>("refresh_tokens").insertOne(refreshTokenDoc);

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
          isOperator,
        },
        tokens,
      },
      { status: 201 }
    );
  } catch (error) {
    // Don't log sensitive details in production
    console.error("Registration error occurred");
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
