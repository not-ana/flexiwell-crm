// Client Calendar API
// Manage Google Calendar connection for clients

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  isCalendarConnected,
  toggleCalendarSync,
  disconnectClientCalendar,
} from "@/lib/google-calendar/oauth";
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

// GET /api/client/calendar - Get calendar connection status
export async function GET(request: NextRequest) {
  try {
    const { user, error } = requireRole(request, ["client"]);
    if (error) return error;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = await getClientIdFromUserId(user.userId);
    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID not found" },
        { status: 400 }
      );
    }

    // Get client's calendar settings
    const db = await getDatabase();
    const client = await db.collection("clients").findOne({
      _id: new ObjectId(clientId),
    });

    const calendarData = client?.integrations?.googleCalendar;
    const connected = await isCalendarConnected(clientId);

    return NextResponse.json({
      connected,
      syncEnabled: calendarData?.syncEnabled || false,
      calendarEmail: calendarData?.calendarEmail || null,
      connectedAt: calendarData?.connectedAt || null,
      lastSyncAt: calendarData?.lastSyncAt || null,
    });
  } catch (error) {
    console.error("Calendar status error:", error);
    return NextResponse.json(
      { error: "Failed to get calendar status" },
      { status: 500 }
    );
  }
}

// PUT /api/client/calendar - Toggle sync or update settings
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = requireRole(request, ["client"]);
    if (error) return error;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = await getClientIdFromUserId(user.userId);
    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID not found" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { syncEnabled } = body;

    if (typeof syncEnabled !== "boolean") {
      return NextResponse.json(
        { error: "syncEnabled must be a boolean" },
        { status: 400 }
      );
    }

    // Check if calendar is connected
    const connected = await isCalendarConnected(clientId);
    if (!connected) {
      return NextResponse.json(
        { error: "Google Calendar not connected. Please connect first." },
        { status: 400 }
      );
    }

    await toggleCalendarSync(clientId, syncEnabled);

    return NextResponse.json({
      success: true,
      syncEnabled,
    });
  } catch (error) {
    console.error("Calendar toggle error:", error);
    return NextResponse.json(
      { error: "Failed to update calendar settings" },
      { status: 500 }
    );
  }
}

// DELETE /api/client/calendar - Disconnect calendar
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = requireRole(request, ["client"]);
    if (error) return error;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = await getClientIdFromUserId(user.userId);
    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID not found" },
        { status: 400 }
      );
    }

    await disconnectClientCalendar(clientId);

    // Log activity
    const db = await getDatabase();
    const client = await db.collection("clients").findOne({
      _id: new ObjectId(clientId),
    });

    await db.collection("activities").insertOne({
      type: "system",
      action: "google_calendar_disconnected",
      description: `Google Calendar disconnected for ${client?.name || "client"}`,
      entityId: clientId,
      entityType: "client",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Google Calendar disconnected",
    });
  } catch (error) {
    console.error("Calendar disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect calendar" },
      { status: 500 }
    );
  }
}
