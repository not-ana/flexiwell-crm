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

    // Get integrations from settings collection
    const settings = await db.collection("settings").findOne({ type: "integrations" });

    // Check which integrations are configured via environment variables
    const hasStripe = !!process.env.STRIPE_SECRET_KEY;
    const hasWhatsApp = !!process.env.TWILIO_ACCOUNT_SID || !!process.env.WHATSAPP_API_KEY;
    const hasInstagram = !!process.env.INSTAGRAM_ACCESS_TOKEN;

    // Default integrations list
    const integrations = [
      {
        id: "stripe",
        name: "Stripe",
        description: "Process payments and manage subscriptions",
        icon: "💳",
        category: "payments",
        status: hasStripe ? "connected" : "not_connected",
        connectedAt: settings?.stripe?.connectedAt || null,
      },
      {
        id: "whatsapp",
        name: "WhatsApp Business",
        description: "Send notifications and chat with clients",
        icon: "📱",
        category: "messaging",
        status: hasWhatsApp ? "connected" : "not_connected",
        connectedAt: settings?.whatsapp?.connectedAt || null,
      },
      {
        id: "instagram",
        name: "Instagram",
        description: "Receive messages and respond to clients",
        icon: "📸",
        category: "messaging",
        status: hasInstagram ? "connected" : "not_connected",
        connectedAt: settings?.instagram?.connectedAt || null,
      },
      {
        id: "google_calendar",
        name: "Google Calendar",
        description: "Sync classes with Google Calendar",
        icon: "📅",
        category: "scheduling",
        status: settings?.googleCalendar?.connected ? "connected" : "not_connected",
        connectedAt: settings?.googleCalendar?.connectedAt || null,
      },
      {
        id: "mailchimp",
        name: "Mailchimp",
        description: "Email marketing and newsletters",
        icon: "📧",
        category: "marketing",
        status: settings?.mailchimp?.connected ? "connected" : "not_connected",
        connectedAt: settings?.mailchimp?.connectedAt || null,
      },
      {
        id: "zapier",
        name: "Zapier",
        description: "Connect with 5000+ apps",
        icon: "⚡",
        category: "automation",
        status: settings?.zapier?.connected ? "connected" : "not_connected",
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
