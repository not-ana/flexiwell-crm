import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getDatabase } from "@/lib/db/mongodb";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

async function getUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

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
