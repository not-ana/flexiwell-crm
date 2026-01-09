import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireRoleFromCookie } from "@/lib/auth/middleware";

// GET /api/admin/integrations/google-calendar - Get OAuth URL for admin
export async function GET() {
  try {
    const { user, error } = await requireRoleFromCookie(["admin"]);
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if Google Calendar OAuth is configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: "Google Calendar OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to environment variables.",
          missingConfig: true
        },
        { status: 503 }
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/oauth/google-calendar/callback`;

    // Build OAuth URL
    const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events");
    const state = Buffer.from(JSON.stringify({
      userId: user.userId,
      role: "admin",
      redirect: "/admin/settings?tab=integrations",
    })).toString("base64");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Google Calendar auth error:", error);
    return NextResponse.json(
      { error: "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}

// POST /api/admin/integrations/google-calendar - Save admin Google Calendar connection
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireRoleFromCookie(["admin"]);
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { accessToken, refreshToken, email } = await request.json();

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: "Access and refresh tokens are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Store admin Google Calendar credentials
    await db.collection("integration_credentials").updateOne(
      { provider: "google-calendar" },
      {
        $set: {
          provider: "google-calendar",
          accessToken,
          refreshToken,
          email,
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
          isActive: true,
          updatedAt: new Date(),
          connectedBy: user.userId,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Update studio settings
    await db.collection("settings").updateOne(
      { type: "studio" },
      {
        $set: {
          "integrations.googleCalendarConnected": true,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: "Google Calendar connected successfully",
      connected: true,
    });
  } catch (error) {
    console.error("Error connecting Google Calendar:", error);
    return NextResponse.json(
      { error: "Failed to connect Google Calendar" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/integrations/google-calendar - Disconnect Google Calendar
export async function DELETE() {
  try {
    const { error } = await requireRoleFromCookie(["admin"]);
    if (error) return error;

    const db = await getDatabase();

    // Remove credentials
    await db.collection("integration_credentials").deleteOne({
      provider: "google-calendar",
    });

    // Update studio settings
    await db.collection("settings").updateOne(
      { type: "studio" },
      {
        $set: {
          "integrations.googleCalendarConnected": false,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "Google Calendar disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Google Calendar:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Google Calendar" },
      { status: 500 }
    );
  }
}
