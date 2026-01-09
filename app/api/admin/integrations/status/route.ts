import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireRoleFromCookie } from "@/lib/auth/middleware";

export async function GET() {
  try {
    const { error } = await requireRoleFromCookie(["admin"]);
    if (error) return error;

    const db = await getDatabase();

    // Get studio settings to check integration status
    const settings = await db.collection("settings").findOne({ type: "studio" });
    const credentials = await db.collection("integration_credentials").find({}).toArray();

    const integrationStatus: Record<string, { connected: boolean; lastSync?: string }> = {
      wellhub: { connected: false },
      stripe: { connected: false },
      googleCalendar: { connected: false },
    };

    // Check Wellhub
    const wellhubCreds = credentials.find(c => c.provider === "wellhub");
    if (wellhubCreds && wellhubCreds.apiKey) {
      integrationStatus.wellhub = {
        connected: true,
        lastSync: wellhubCreds.lastSyncAt?.toISOString() || wellhubCreds.updatedAt?.toISOString(),
      };
    }

    // Check Stripe
    const stripeCreds = credentials.find(c => c.provider === "stripe");
    if (stripeCreds && stripeCreds.secretKey) {
      integrationStatus.stripe = {
        connected: true,
        lastSync: stripeCreds.updatedAt?.toISOString(),
      };
    }

    // Check Google Calendar (check if any client has connected)
    const clientWithGoogleCal = await db.collection("clients").findOne({
      "integrations.googleCalendar.syncEnabled": true,
    });
    if (clientWithGoogleCal || (settings?.integrations?.googleCalendarConnected)) {
      integrationStatus.googleCalendar = {
        connected: true,
        lastSync: clientWithGoogleCal?.integrations?.googleCalendar?.lastSyncAt?.toISOString(),
      };
    }

    return NextResponse.json(integrationStatus);
  } catch (error) {
    console.error("Error fetching integration status:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration status" },
      { status: 500 }
    );
  }
}
