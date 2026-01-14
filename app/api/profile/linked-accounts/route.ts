import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie, requireAuth } from "@/lib/auth/middleware";
import { unlinkSocialAccount } from "@/lib/auth/social-oauth";
import type { User } from "@/lib/db/schemas";

// Helper to get auth from either cookie or Bearer token
async function getAuthUser(request: NextRequest) {
  // First try Bearer token
  const bearerAuth = requireAuth(request);
  if (bearerAuth.user) {
    return { user: bearerAuth.user, error: null };
  }

  // Fall back to cookie
  return await requireAuthFromCookie();
}

// GET - Fetch linked accounts for the current user
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const dbUser = await db.collection<User>("users").findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { linkedAccounts: 1 } }
    );

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return linked accounts (without sensitive data like providerId)
    const linkedAccounts = (dbUser.linkedAccounts || []).map((account) => ({
      provider: account.provider,
      email: account.email,
      name: account.name,
      avatar: account.avatar,
      linkedAt: account.linkedAt,
    }));

    return NextResponse.json({ linkedAccounts });
  } catch (error) {
    console.error("Get linked accounts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch linked accounts" },
      { status: 500 }
    );
  }
}

// DELETE - Unlink a social account
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await getAuthUser(request);
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { provider } = await request.json();

    if (!provider || provider !== "google") {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    const result = await unlinkSocialAccount(user.userId, provider);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unlink account error:", error);
    return NextResponse.json(
      { error: "Failed to unlink account" },
      { status: 500 }
    );
  }
}
