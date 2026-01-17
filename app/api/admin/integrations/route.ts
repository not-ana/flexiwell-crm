import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";

// GET - Fetch integration status
export async function GET() {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    // Hidden for US market: wellhub, instagram, tecnofit - re-enable for Brazil/LATAM
    const integrations = [
      // wellhub: Hidden for US market
      // {
      //   id: "wellhub",
      //   name: "Wellhub",
      //   description: "Connect with Wellhub (formerly Gympass) for corporate wellness",
      //   icon: "🏋️",
      //   category: "marketplace",
      //   status: credentialsMap["wellhub"] ? "connected" : "available",
      //   connectedAt: (credentialsMap["wellhub"] as Record<string, unknown>)?.createdAt || null,
      // },
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
        description: "Send notifications and chat with clients via WhatsApp Business API",
        icon: "📱",
        category: "messaging",
        status: (settings?.whatsapp?.accountSid || settings?.whatsapp?.phoneNumberId) ? "connected" : "available",
        connectedAt: settings?.whatsapp?.connectedAt || null,
      },
      {
        id: "sms",
        name: "SMS (Twilio)",
        description: "Send SMS notifications and automated replies to US clients",
        icon: "💬",
        category: "messaging",
        status: settings?.sms?.accountSid ? "connected" : "available",
        connectedAt: settings?.sms?.connectedAt || null,
      },
      // instagram: Hidden - incomplete implementation, re-enable post-MVP
      // {
      //   id: "instagram",
      //   name: "Instagram",
      //   description: "Receive messages and respond to clients",
      //   icon: "📸",
      //   category: "messaging",
      //   status: settings?.instagram?.accessToken ? "connected" : "available",
      //   connectedAt: settings?.instagram?.connectedAt || null,
      // },
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
        id: "paypal",
        name: "PayPal",
        description: "Accept PayPal payments and subscriptions",
        icon: "💰",
        category: "payments",
        status: settings?.paypal?.clientId ? "connected" : "available",
        connectedAt: settings?.paypal?.connectedAt || null,
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
      {
        id: "mindbody",
        name: "Mindbody",
        description: "Import clients, schedules and data from Mindbody",
        icon: "📥",
        category: "migration",
        status: credentialsMap["mindbody"] ? "connected" : "available",
        connectedAt: (credentialsMap["mindbody"] as Record<string, unknown>)?.createdAt || null,
      },
      {
        id: "glofox",
        name: "Glofox",
        description: "Migrate your data from Glofox seamlessly",
        icon: "📥",
        category: "migration",
        status: credentialsMap["glofox"] ? "connected" : "available",
        connectedAt: (credentialsMap["glofox"] as Record<string, unknown>)?.createdAt || null,
      },
      // tecnofit: Hidden for US market - re-enable for Brazil/LATAM
      // {
      //   id: "tecnofit",
      //   name: "Tecnofit",
      //   description: "Importe seus dados do Tecnofit para o FlexiWell",
      //   icon: "📥",
      //   category: "migration",
      //   status: credentialsMap["tecnofit"] ? "connected" : "available",
      //   connectedAt: (credentialsMap["tecnofit"] as Record<string, unknown>)?.createdAt || null,
      // },
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
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        // Support both Twilio and Meta Cloud API providers
        if (credentials.provider === "cloud-api") {
          // Meta WhatsApp Cloud API
          if (!credentials.phoneNumberId || !credentials.accessToken) {
            return NextResponse.json(
              { error: "WhatsApp Cloud API requires phoneNumberId and accessToken" },
              { status: 400 }
            );
          }
          credentialData = {
            provider: "cloud-api",
            phoneNumberId: credentials.phoneNumberId,
            accessToken: credentials.accessToken,
            businessAccountId: credentials.businessAccountId || "",
            verifyToken: credentials.verifyToken || "",
            connectedAt: new Date(),
          };
        } else {
          // Twilio (legacy)
          if (!credentials.accountSid || !credentials.authToken || !credentials.phoneNumber) {
            return NextResponse.json(
              { error: "WhatsApp Twilio requires accountSid, authToken, and phoneNumber" },
              { status: 400 }
            );
          }
          credentialData = {
            provider: "twilio",
            accountSid: credentials.accountSid,
            authToken: credentials.authToken,
            phoneNumber: credentials.phoneNumber,
            connectedAt: new Date(),
          };
        }
        break;

      case "sms":
        if (!credentials.accountSid || !credentials.authToken || !credentials.phoneNumber) {
          return NextResponse.json(
            { error: "SMS requires accountSid, authToken, and phoneNumber (Twilio)" },
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

      case "paypal":
        if (!credentials.clientId || !credentials.clientSecret) {
          return NextResponse.json(
            { error: "PayPal requires clientId and clientSecret" },
            { status: 400 }
          );
        }
        credentialData = {
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          sandbox: credentials.sandbox || false,
          connectedAt: new Date(),
        };
        break;

      case "mindbody":
        if (!credentials.siteId || !credentials.apiKey || !credentials.username || !credentials.password) {
          return NextResponse.json(
            { error: "Mindbody requires siteId, apiKey, username and password" },
            { status: 400 }
          );
        }
        credentialData = {
          provider: "mindbody",
          siteId: credentials.siteId,
          apiKey: credentials.apiKey,
          username: credentials.username,
          password: credentials.password,
          isActive: true,
          connectedAt: new Date(),
        };
        await db.collection("integration_credentials").updateOne(
          { provider: "mindbody" },
          {
            $set: credentialData,
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );
        return NextResponse.json({
          success: true,
          message: "Mindbody connected successfully",
        });

      case "glofox":
        if (!credentials.branchId || !credentials.apiKey) {
          return NextResponse.json(
            { error: "Glofox requires branchId and apiKey" },
            { status: 400 }
          );
        }
        credentialData = {
          provider: "glofox",
          branchId: credentials.branchId,
          apiKey: credentials.apiKey,
          isActive: true,
          connectedAt: new Date(),
        };
        await db.collection("integration_credentials").updateOne(
          { provider: "glofox" },
          {
            $set: credentialData,
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );
        return NextResponse.json({
          success: true,
          message: "Glofox connected successfully",
        });

      case "tecnofit":
        if (!credentials.empresaId || !credentials.apiToken) {
          return NextResponse.json(
            { error: "Tecnofit requires empresaId and apiToken" },
            { status: 400 }
          );
        }
        credentialData = {
          provider: "tecnofit",
          empresaId: credentials.empresaId,
          apiToken: credentials.apiToken,
          isActive: true,
          connectedAt: new Date(),
        };
        await db.collection("integration_credentials").updateOne(
          { provider: "tecnofit" },
          {
            $set: credentialData,
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );
        return NextResponse.json({
          success: true,
          message: "Tecnofit connected successfully",
        });

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
    const { error } = await requireAuthFromCookie();
    if (error) return error;

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
