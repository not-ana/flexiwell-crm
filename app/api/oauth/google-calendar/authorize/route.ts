// Google Calendar OAuth Authorization Endpoint
// GET /api/oauth/google-calendar/authorize - Start OAuth flow

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { generateAuthUrl } from "@/lib/google-calendar/oauth";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

// Helper to get clientId from userId
async function getClientIdFromUserId(userId: string): Promise<string | null> {
  const db = await getDatabase();
  const user = await db.collection("users").findOne({
    _id: new ObjectId(userId),
  });
  return user?.clientId || null;
}

export async function GET(request: NextRequest) {
  try {
    // Require client authentication
    const { user, error } = requireRole(request, ["client"]);
    if (error) return error;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get client ID from user
    const clientId = await getClientIdFromUserId(user.userId);
    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID not found for user" },
        { status: 400 }
      );
    }

    // Get redirect path from query params (where to return after OAuth)
    const { searchParams } = new URL(request.url);
    const redirectPath = searchParams.get("redirect") || "/dashboard/settings";

    // Generate OAuth URL
    const authUrl = generateAuthUrl(clientId, redirectPath);

    // Return the URL for frontend to redirect
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Google Calendar auth error:", error);

    if (error instanceof Error && error.message.includes("not configured")) {
      return NextResponse.json(
        { error: "Google Calendar integration not configured by administrator" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}
