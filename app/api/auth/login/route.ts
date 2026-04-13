import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { User, RefreshToken } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import {
  verifyPassword,
  generateTokenPair,
  getRefreshTokenExpiry,
} from "@/lib/auth/jwt";
import {
  checkRateLimit,
  getClientIp,
  RATE_LIMITS,
  checkAccountLockout,
  recordFailedLogin,
  clearLockout,
  logAuditEvent,
} from "@/lib/security";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { isOperatorEmail } from "@/lib/auth/operator";

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(`login:${clientIp}`, RATE_LIMITS.login);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
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
    const { email, password, turnstileToken } = await request.json();

    // Verify CAPTCHA
    const captcha = await verifyTurnstileToken(turnstileToken);
    if (!captcha.success) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check account lockout before any DB work
    const lockout = checkAccountLockout(normalizedEmail);
    if (lockout.locked) {
      const retryAfter = Math.ceil(((lockout.lockedUntilMs ?? Date.now()) - Date.now()) / 1000);
      await logAuditEvent({
        type: "login_locked",
        email: normalizedEmail,
        ip: clientIp,
        userAgent: request.headers.get("user-agent") || undefined,
      });
      return NextResponse.json(
        { error: "Account temporarily locked due to too many failed attempts. Try again later." },
        { status: 423, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const db = await getDatabase();

    const user = await db
      .collection<User>("users")
      .findOne({ email: normalizedEmail });

    if (!user) {
      recordFailedLogin(normalizedEmail);
      await logAuditEvent({
        type: "login_failed",
        email: normalizedEmail,
        ip: clientIp,
        userAgent: request.headers.get("user-agent") || undefined,
        metadata: { reason: "user_not_found" },
      });
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated. Please contact support." },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      const result = recordFailedLogin(normalizedEmail);
      await logAuditEvent({
        type: "login_failed",
        userId: user._id!.toString(),
        email: normalizedEmail,
        ip: clientIp,
        userAgent: request.headers.get("user-agent") || undefined,
        metadata: { reason: "invalid_password", remainingAttempts: result.remainingAttempts },
      });
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Successful login — clear lockout
    clearLockout(normalizedEmail);

    const userId = user._id!.toString();
    const isOperator = user.isOperator || isOperatorEmail(user.email);

    const tokens = generateTokenPair({
      userId,
      email: user.email,
      role: user.role,
      name: user.name,
      establishmentId: user.establishmentId,
      isOperator,
    });

    await db.collection<RefreshToken>("refresh_tokens").deleteMany({ userId });

    await db.collection<RefreshToken>("refresh_tokens").insertOne({
      userId,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      createdAt: new Date(),
    });

    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }
    );

    await logAuditEvent({
      type: "login_success",
      userId,
      email: normalizedEmail,
      ip: clientIp,
      userAgent: request.headers.get("user-agent") || undefined,
    }, db);

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        staffId: user.staffId,
        isOperator,
      },
      tokens,
    });

    // Set auth cookie so server-side cookie auth works
    response.cookies.set("auth_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes (matches access token expiry)
    });

    return response;
  } catch (error) {
    console.error("Login error occurred");
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
