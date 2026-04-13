import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getDatabase } from "@/lib/db/mongodb";
import { SMS_BOT_ENABLED, smsBotDisabledResponse } from "@/lib/features/sms-bot";

// GET - Check SMS bot connection status
export async function GET(request: NextRequest) {
  if (!SMS_BOT_ENABLED) return smsBotDisabledResponse();
  try {
    const { user, error } = requireAuth(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const establishmentId = searchParams.get("establishmentId") || user.userId;

    // SMS is managed at the platform level via env vars
    const envConfigured = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_PHONE_NUMBER)
    );

    // Check if this studio has actually enabled SMS
    const db = await getDatabase();
    const smsConfig = await db.collection("sms_config").findOne({ establishmentId });
    const studioEnabled = !!smsConfig?.enabled;
    const connected = envConfigured && studioEnabled;

    // Fetch real stats for this month
    let stats = { messages: 0, responseRate: 0, bookings: 0 };
    if (connected) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const messagesCol = db.collection("sms_messages");
      const totalMessages = await messagesCol.countDocuments({
        establishmentId,
        createdAt: { $gte: monthStart },
      });
      const responded = await messagesCol.countDocuments({
        establishmentId,
        createdAt: { $gte: monthStart },
        responded: true,
      });
      const bookings = await messagesCol.countDocuments({
        establishmentId,
        createdAt: { $gte: monthStart },
        action: "BOOK_CLASS",
      });
      stats = {
        messages: totalMessages,
        responseRate: totalMessages > 0 ? Math.round((responded / totalMessages) * 100) : 0,
        bookings,
      };
    }

    return NextResponse.json({
      connected,
      phoneNumber: envConfigured
        ? (process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_PHONE_NUMBER || "")
        : "",
      botEnabled: connected,
      stats,
    });
  } catch (error) {
    console.error("Error checking SMS status:", error);
    return NextResponse.json(
      { error: "Failed to check SMS status" },
      { status: 500 }
    );
  }
}
