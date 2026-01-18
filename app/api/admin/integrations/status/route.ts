import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { error } = requireRole(request, ["admin"]);
    if (error) return error;

    const db = await getDatabase();

    // Get studio settings to check integration status
    const settings = await db.collection("settings").findOne({ type: "studio" });
    const credentials = await db.collection("integration_credentials").find({}).toArray();
    const globalCreds = credentials.find(c => !c.provider); // Legacy format without provider field

    const integrationStatus: Record<string, { connected: boolean; lastSync?: string }> = {
      wellhub: { connected: false },
      totalpass: { connected: false },
      classpass: { connected: false },
      stripe: { connected: false },
      whatsapp: { connected: false },
      googleCalendar: { connected: false },
    };

    // Check Wellhub
    const wellhubCreds = credentials.find(c => c.provider === "wellhub");
    if ((wellhubCreds && (wellhubCreds.apiKey || wellhubCreds.bearerToken)) || globalCreds?.wellhub?.bearerToken) {
      integrationStatus.wellhub = {
        connected: true,
        lastSync: wellhubCreds?.lastSyncAt?.toISOString() || wellhubCreds?.updatedAt?.toISOString(),
      };
    }

    // Check TotalPass
    const totalpassCreds = credentials.find(c => c.provider === "totalpass");
    if ((totalpassCreds && totalpassCreds.apiKey) || globalCreds?.totalpass?.apiKey) {
      integrationStatus.totalpass = {
        connected: true,
        lastSync: totalpassCreds?.updatedAt?.toISOString(),
      };
    }

    // Check ClassPass
    const classpassCreds = credentials.find(c => c.provider === "classpass");
    if ((classpassCreds && classpassCreds.apiKey) || globalCreds?.classpass?.apiKey) {
      integrationStatus.classpass = {
        connected: true,
        lastSync: classpassCreds?.updatedAt?.toISOString(),
      };
    }

    // Check Stripe
    const stripeCreds = credentials.find(c => c.provider === "stripe");
    if ((stripeCreds && stripeCreds.secretKey) || globalCreds?.stripe?.secretKey || process.env.STRIPE_SECRET_KEY) {
      integrationStatus.stripe = {
        connected: true,
        lastSync: stripeCreds?.updatedAt?.toISOString(),
      };
    }

    // Check WhatsApp (supports both Cloud API and Twilio, and per-establishment credentials)
    const whatsappCreds = credentials.find(c => c.provider === "whatsapp");
    const establishmentWhatsApp = await db.collection("establishment_whatsapp_credentials").findOne({ isConnected: true });
    const hasWhatsAppCloudApi = globalCreds?.whatsapp?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const hasWhatsAppTwilio = globalCreds?.whatsapp?.accountSid;

    if (whatsappCreds || establishmentWhatsApp || hasWhatsAppCloudApi || hasWhatsAppTwilio) {
      integrationStatus.whatsapp = {
        connected: true,
        lastSync: whatsappCreds?.updatedAt?.toISOString() || establishmentWhatsApp?.updatedAt?.toISOString(),
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
