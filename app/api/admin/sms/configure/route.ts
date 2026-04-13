import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getDatabase } from "@/lib/db/mongodb";
import { SMS_BOT_ENABLED, smsBotDisabledResponse } from "@/lib/features/sms-bot";

// POST - Save Twilio SMS configuration
export async function POST(request: NextRequest) {
  if (!SMS_BOT_ENABLED) return smsBotDisabledResponse();
  try {
    const { user, error } = requireAuth(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { accountSid, authToken, phoneNumber, establishmentId: estId } = body;

    if (!accountSid || !authToken || !phoneNumber) {
      return NextResponse.json(
        { error: "Account SID, Auth Token, and Phone Number are required" },
        { status: 400 }
      );
    }

    // Validate Twilio credentials by making a test API call
    const testResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
      }
    );

    if (!testResponse.ok) {
      return NextResponse.json(
        { error: "Invalid Twilio credentials. Please check your Account SID and Auth Token." },
        { status: 400 }
      );
    }

    const establishmentId = estId || user.userId;
    const db = await getDatabase();

    // Normalize phone number
    const normalizedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber.replace(/\D/g, "")}`;

    // Upsert SMS credentials
    await db.collection("integration_credentials").updateOne(
      { establishmentId, provider: "twilio_sms" },
      {
        $set: {
          establishmentId,
          provider: "twilio_sms",
          accountSid,
          authToken,
          phoneNumber: normalizedPhone,
          botEnabled: true,
          isConnected: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      connected: true,
      phoneNumber: normalizedPhone,
    });
  } catch (error) {
    console.error("Error configuring SMS:", error);
    return NextResponse.json(
      { error: "Failed to save SMS configuration" },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect SMS
export async function DELETE(request: NextRequest) {
  if (!SMS_BOT_ENABLED) return smsBotDisabledResponse();
  try {
    const { user, error } = requireAuth(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const establishmentId = searchParams.get("establishmentId") || user.userId;

    const db = await getDatabase();

    await db.collection("integration_credentials").updateOne(
      { establishmentId, provider: "twilio_sms" },
      {
        $set: {
          isConnected: false,
          botEnabled: false,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true, connected: false });
  } catch (error) {
    console.error("Error disconnecting SMS:", error);
    return NextResponse.json(
      { error: "Failed to disconnect SMS" },
      { status: 500 }
    );
  }
}
