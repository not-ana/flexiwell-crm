import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireRoleFromCookie } from "@/lib/auth/middleware";

// DELETE /api/admin/integrations/[provider] - Disconnect an integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { error } = await requireRoleFromCookie(["admin"]);
    if (error) return error;

    const { provider } = await params;

    const validProviders = ["wellhub", "stripe", "googleCalendar", "resend", "sendgrid"];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Map provider names to database keys
    const providerMap: Record<string, string> = {
      wellhub: "wellhub",
      stripe: "stripe",
      googleCalendar: "google-calendar",
      resend: "resend",
      sendgrid: "sendgrid",
    };

    const dbProvider = providerMap[provider] || provider;

    // Remove credentials
    await db.collection("integration_credentials").deleteOne({
      provider: dbProvider,
    });

    // Map to settings key
    const settingsKeyMap: Record<string, string> = {
      wellhub: "wellhubConnected",
      stripe: "stripeConnected",
      googleCalendar: "googleCalendarConnected",
      resend: "resendConnected",
      sendgrid: "sendgridConnected",
    };

    const settingsKey = settingsKeyMap[provider];
    if (settingsKey) {
      await db.collection("settings").updateOne(
        { type: "studio" },
        {
          $set: {
            [`integrations.${settingsKey}`]: false,
            updatedAt: new Date(),
          },
        }
      );
    }

    // For Google Calendar, also clear client integrations if needed
    if (provider === "googleCalendar") {
      await db.collection("clients").updateMany(
        { "integrations.googleCalendar.syncEnabled": true },
        {
          $set: {
            "integrations.googleCalendar.syncEnabled": false,
          },
        }
      );
    }

    return NextResponse.json({
      message: `${provider} disconnected successfully`,
    });
  } catch (error) {
    console.error("Error disconnecting integration:", error);
    return NextResponse.json(
      { error: "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}

// GET /api/admin/integrations/[provider] - Get integration details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { error } = await requireRoleFromCookie(["admin"]);
    if (error) return error;

    const { provider } = await params;

    const db = await getDatabase();

    const credentials = await db.collection("integration_credentials").findOne({
      provider,
    });

    if (!credentials) {
      return NextResponse.json({
        connected: false,
        provider,
      });
    }

    // Don't return sensitive data
    return NextResponse.json({
      connected: true,
      provider,
      isActive: credentials.isActive,
      connectedAt: credentials.createdAt,
      lastSync: credentials.lastSyncAt || credentials.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching integration:", error);
    return NextResponse.json(
      { error: "Failed to fetch integration" },
      { status: 500 }
    );
  }
}
