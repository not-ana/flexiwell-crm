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

    // Get all saved credentials
    const allCredentials = await db.collection("integration_credentials").find({}).toArray();
    const credentialsMap: Record<string, unknown> = {};
    for (const cred of allCredentials) {
      if (cred.provider) {
        credentialsMap[cred.provider] = cred;
      }
    }

    // Build integrations list based on what's configured in the database
    const integrations = [
      {
        id: "wellhub",
        name: "Wellhub",
        description: "Connect with Wellhub (formerly Gympass) for corporate wellness",
        icon: "🏋️",
        category: "marketplace",
        status: credentialsMap["wellhub"] ? "connected" : "available",
        connectedAt: (credentialsMap["wellhub"] as Record<string, unknown>)?.createdAt || null,
      },
      {
        id: "stripe",
        name: "Stripe",
        description: "Process payments and manage subscriptions",
        icon: "💳",
        category: "payments",
        status: credentialsMap["stripe"] ? "connected" : "available",
        connectedAt: (credentialsMap["stripe"] as Record<string, unknown>)?.createdAt || null,
      },
      {
        id: "google_calendar",
        name: "Google Calendar",
        description: "Sync classes with Google Calendar",
        icon: "📅",
        category: "scheduling",
        status: credentialsMap["google-calendar"] ? "connected" : "available",
        connectedAt: (credentialsMap["google-calendar"] as Record<string, unknown>)?.createdAt || null,
      },
      {
        id: "whatsapp",
        name: "WhatsApp Business",
        description: "Send notifications and chat with clients via Twilio",
        icon: "📱",
        category: "messaging",
        status: settings?.whatsapp?.accountSid ? "connected" : "available",
        connectedAt: settings?.whatsapp?.connectedAt || null,
      },
      {
        id: "instagram",
        name: "Instagram",
        description: "Receive messages and respond to clients",
        icon: "📸",
        category: "messaging",
        status: settings?.instagram?.accessToken ? "connected" : "available",
        connectedAt: settings?.instagram?.connectedAt || null,
      },
      {
        id: "mailchimp",
        name: "Mailchimp",
        description: "Email marketing and newsletters",
        icon: "📧",
        category: "marketing",
        status: settings?.mailchimp?.apiKey ? "connected" : "available",
        connectedAt: settings?.mailchimp?.connectedAt || null,
      },
      {
        id: "zapier",
        name: "Zapier",
        description: "Connect with 5000+ apps",
        icon: "⚡",
        category: "automation",
        status: settings?.zapier?.webhookUrl ? "connected" : "available",
        connectedAt: settings?.zapier?.connectedAt || null,
      },
      {
        id: "classpass",
        name: "ClassPass",
        description: "List your classes on ClassPass marketplace",
        icon: "🎫",
        category: "marketplace",
        status: "coming_soon",
        connectedAt: null,
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
      case "wellhub":
        if (!credentials.apiKey || !credentials.gymId) {
          return NextResponse.json(
            { error: "Wellhub requires apiKey and gymId" },
            { status: 400 }
          );
        }
        credentialData = {
          provider: "wellhub",
          apiKey: credentials.apiKey,
          gymId: credentials.gymId,
          isActive: true,
          connectedAt: new Date(),
        };
        // Save using provider-based document
        await db.collection("integration_credentials").updateOne(
          { provider: "wellhub" },
          {
            $set: credentialData,
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );
        return NextResponse.json({
          success: true,
          message: "Wellhub connected successfully",
        });

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
