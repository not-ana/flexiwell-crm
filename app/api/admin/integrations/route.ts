import { NextRequest, NextResponse } from "next/server";
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

// GET - Fetch integration status
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const db = await getDatabase();

    // Get integrations from settings collection (tenant-specific credentials)
    const settings = await db.collection("integration_credentials").findOne({});

    // Build integrations list based on what's configured in the database
    const integrations = [
      {
        id: "stripe",
        name: "Stripe",
        description: "Process payments and manage subscriptions",
        icon: "💳",
        category: "payments",
        status: settings?.stripe?.secretKey ? "connected" : "not_connected",
        connectedAt: settings?.stripe?.connectedAt || null,
      },
      {
        id: "whatsapp",
        name: "WhatsApp Business",
        description: "Send notifications and chat with clients via Twilio",
        icon: "📱",
        category: "messaging",
        status: settings?.whatsapp?.accountSid ? "connected" : "not_connected",
        connectedAt: settings?.whatsapp?.connectedAt || null,
      },
      {
        id: "instagram",
        name: "Instagram",
        description: "Receive messages and respond to clients",
        icon: "📸",
        category: "messaging",
        status: settings?.instagram?.accessToken ? "connected" : "not_connected",
        connectedAt: settings?.instagram?.connectedAt || null,
      },
      {
        id: "google_calendar",
        name: "Google Calendar",
        description: "Sync classes with Google Calendar",
        icon: "📅",
        category: "scheduling",
        status: settings?.googleCalendar?.refreshToken ? "connected" : "not_connected",
        connectedAt: settings?.googleCalendar?.connectedAt || null,
      },
      {
        id: "mailchimp",
        name: "Mailchimp",
        description: "Email marketing and newsletters",
        icon: "📧",
        category: "marketing",
        status: settings?.mailchimp?.apiKey ? "connected" : "not_connected",
        connectedAt: settings?.mailchimp?.connectedAt || null,
      },
      {
        id: "zapier",
        name: "Zapier",
        description: "Connect with 5000+ apps",
        icon: "⚡",
        category: "automation",
        status: settings?.zapier?.webhookUrl ? "connected" : "not_connected",
        connectedAt: settings?.zapier?.connectedAt || null,
      },
    ];

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("Admin integrations error:", error);
    return NextResponse.json(
      { error: "Failed to load integrations" },
      { status: 500 }
    );
  }
}

// POST - Connect/save integration credentials
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { integrationId, credentials } = body;

    if (!integrationId || !credentials) {
      return NextResponse.json(
        { error: "Integration ID and credentials are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Validate and map credentials based on integration type
    let credentialData: Record<string, any> = {};

    switch (integrationId) {
      case "stripe":
        if (!credentials.secretKey || !credentials.publishableKey) {
          return NextResponse.json(
            { error: "Stripe requires secretKey and publishableKey" },
            { status: 400 }
          );
        }
        credentialData = {
          secretKey: credentials.secretKey,
          publishableKey: credentials.publishableKey,
          webhookSecret: credentials.webhookSecret || null,
          connectedAt: new Date(),
        };
        break;

      case "whatsapp":
        if (!credentials.accountSid || !credentials.authToken || !credentials.phoneNumber) {
          return NextResponse.json(
            { error: "WhatsApp requires accountSid, authToken, and phoneNumber (Twilio)" },
            { status: 400 }
          );
        }
        credentialData = {
          accountSid: credentials.accountSid,
          authToken: credentials.authToken,
          phoneNumber: credentials.phoneNumber,
          connectedAt: new Date(),
        };
        break;

      case "instagram":
        if (!credentials.accessToken || !credentials.pageId) {
          return NextResponse.json(
            { error: "Instagram requires accessToken and pageId" },
            { status: 400 }
          );
        }
        credentialData = {
          accessToken: credentials.accessToken,
          pageId: credentials.pageId,
          appId: credentials.appId || null,
          connectedAt: new Date(),
        };
        break;

      case "google_calendar":
        if (!credentials.clientId || !credentials.clientSecret) {
          return NextResponse.json(
            { error: "Google Calendar requires clientId and clientSecret" },
            { status: 400 }
          );
        }
        credentialData = {
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          refreshToken: credentials.refreshToken || null,
          connectedAt: new Date(),
        };
        break;

      case "mailchimp":
        if (!credentials.apiKey) {
          return NextResponse.json(
            { error: "Mailchimp requires apiKey" },
            { status: 400 }
          );
        }
        credentialData = {
          apiKey: credentials.apiKey,
          listId: credentials.listId || null,
          connectedAt: new Date(),
        };
        break;

      case "zapier":
        if (!credentials.webhookUrl) {
          return NextResponse.json(
            { error: "Zapier requires webhookUrl" },
            { status: 400 }
          );
        }
        credentialData = {
          webhookUrl: credentials.webhookUrl,
          connectedAt: new Date(),
        };
        break;

      default:
        return NextResponse.json(
          { error: "Unknown integration type" },
          { status: 400 }
        );
    }

    // Save to database
    await db.collection("integration_credentials").updateOne(
      {},
      { $set: { [integrationId]: credentialData, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `${integrationId} connected successfully`,
    });
  } catch (error) {
    console.error("Error saving integration:", error);
    return NextResponse.json(
      { error: "Failed to save integration" },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect integration
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("id");

    if (!integrationId) {
      return NextResponse.json(
        { error: "Integration ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Remove credentials for this integration
    await db.collection("integration_credentials").updateOne(
      {},
      { $unset: { [integrationId]: "" }, $set: { updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: `${integrationId} disconnected successfully`,
    });
  } catch (error) {
    console.error("Error disconnecting integration:", error);
    return NextResponse.json(
      { error: "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}
