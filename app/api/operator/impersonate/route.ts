import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuth } from "@/lib/auth/middleware";
import { isOperatorEmail } from "@/lib/auth/operator";
import {
  generateTokenPair,
  getRefreshTokenExpiry,
} from "@/lib/auth/jwt";
import type { Establishment, RefreshToken, User } from "@/lib/db/schemas";

// POST /api/operator/impersonate
// Issue a fresh JWT pair where establishmentId is the target studio's id and
// `impersonating` is true. userId/email/name still refer to the operator —
// every existing scoped query already filters by establishmentId, so this
// alone makes the entire /admin app behave as if the operator were the studio
// owner. No per-screen rewiring needed.
export async function POST(request: NextRequest) {
  const { user, error } = requireAuth(request);
  if (error) return error;

  if (!user!.isOperator && !isOperatorEmail(user!.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Don't allow nested impersonation. Exit first.
  if (user!.impersonating) {
    return NextResponse.json(
      { error: "Already impersonating. Exit first." },
      { status: 409 }
    );
  }

  let body: { establishmentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { establishmentId } = body;
  if (!establishmentId || typeof establishmentId !== "string") {
    return NextResponse.json(
      { error: "establishmentId is required" },
      { status: 400 }
    );
  }

  let estObjectId: ObjectId;
  try {
    estObjectId = new ObjectId(establishmentId);
  } catch {
    return NextResponse.json({ error: "Invalid establishmentId" }, { status: 400 });
  }

  try {
    const db = await getDatabase();

    const establishment = await db
      .collection<Establishment>("establishments")
      .findOne({ _id: estObjectId });

    if (!establishment) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 });
    }

    // Issue impersonation tokens. Note: userId stays as the operator so the
    // refresh-token row and any audit lookups remain attached to the real
    // human, not the studio they're acting as.
    const tokens = generateTokenPair({
      userId: user!.userId,
      email: user!.email,
      role: "admin", // operator always acts with admin privileges inside a studio
      name: user!.name,
      establishmentId: establishment._id!.toString(),
      isOperator: true,
      impersonating: true,
      impersonatingName: establishment.name,
    });

    // Replace the operator's refresh token. Logging out of impersonation
    // will mint another pair, so this row gets rotated again.
    await db.collection<RefreshToken>("refresh_tokens").deleteMany({ userId: user!.userId });
    await db.collection<RefreshToken>("refresh_tokens").insertOne({
      userId: user!.userId,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      createdAt: new Date(),
    });

    const response = NextResponse.json({
      success: true,
      tokens,
      studio: {
        id: establishment._id!.toString(),
        name: establishment.name,
      },
    });

    response.cookies.set("auth_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    return response;
  } catch (err) {
    console.error("Impersonate error:", err);
    return NextResponse.json({ error: "Failed to impersonate" }, { status: 500 });
  }
}

// DELETE /api/operator/impersonate — exit impersonation, return to operator.
// We re-mint a clean operator JWT (no establishmentId, no impersonating
// flag) by reading the operator's User row from the DB.
export async function DELETE(request: NextRequest) {
  const { user, error } = requireAuth(request);
  if (error) return error;

  if (!user!.isOperator && !isOperatorEmail(user!.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!user!.impersonating) {
    return NextResponse.json({ error: "Not impersonating" }, { status: 400 });
  }

  try {
    const db = await getDatabase();

    const realUser = await db
      .collection<User>("users")
      .findOne({ _id: new ObjectId(user!.userId) });

    if (!realUser) {
      return NextResponse.json({ error: "Operator user not found" }, { status: 404 });
    }

    const tokens = generateTokenPair({
      userId: user!.userId,
      email: realUser.email,
      role: realUser.role,
      name: realUser.name,
      // No establishmentId — operator has no studio of their own.
      isOperator: true,
    });

    await db.collection<RefreshToken>("refresh_tokens").deleteMany({ userId: user!.userId });
    await db.collection<RefreshToken>("refresh_tokens").insertOne({
      userId: user!.userId,
      token: tokens.refreshToken,
      expiresAt: getRefreshTokenExpiry(),
      createdAt: new Date(),
    });

    const response = NextResponse.json({ success: true, tokens });
    response.cookies.set("auth_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    return response;
  } catch (err) {
    console.error("Exit impersonation error:", err);
    return NextResponse.json({ error: "Failed to exit impersonation" }, { status: 500 });
  }
}
