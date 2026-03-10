import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getDatabase } from "@/lib/db/mongodb";

// GET - Check SMS bot connection status
export async function GET(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const establishmentId = searchParams.get("establishmentId") || user.userId;

    const db = await getDatabase();

    // Check integration_credentials for SMS/Twilio config
    const smsCredential = await db.collection("integration_credentials").findOne({
      establishmentId,
      provider: "twilio_sms",
    });

    if (smsCredential) {
      return NextResponse.json({
        connected: true,
        phoneNumber: smsCredential.phoneNumber || "",
        botEnabled: smsCredential.botEnabled ?? true,
        configuredAt: smsCredential.createdAt,
      });
    }

    // Also check establishment_whatsapp_credentials for Twilio provider (shared setup)
    const whatsappCred = await db.collection("establishment_whatsapp_credentials").findOne({
      establishmentId,
      provider: "twilio",
      isConnected: true,
    });

    if (whatsappCred?.twilioPhoneNumber) {
      return NextResponse.json({
        connected: true,
        phoneNumber: whatsappCred.twilioPhoneNumber,
        botEnabled: whatsappCred.botEnabled ?? true,
        sharedWithWhatsApp: true,
        configuredAt: whatsappCred.createdAt,
      });
    }

    // Check if env vars are configured (fallback for single-tenant setups)
    const envConfigured = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_PHONE_NUMBER)
    );

    return NextResponse.json({
      connected: envConfigured,
      phoneNumber: envConfigured
        ? (process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_PHONE_NUMBER || "")
        : "",
      botEnabled: envConfigured,
      source: envConfigured ? "env" : null,
    });
  } catch (error) {
    console.error("Error checking SMS status:", error);
    return NextResponse.json(
      { error: "Failed to check SMS status" },
      { status: 500 }
    );
  }
}
