// POST /api/admin/churn-checkup/send - Send a churn intervention message to a client

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { fillTemplate } from "@/lib/services/churn-intervention.service";

export async function POST(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const db = await getDatabase();
    const body = await request.json();
    const { clientId, signal, messageTemplate, templateData, channel = "sms" } = body;

    if (!clientId || !messageTemplate) {
      return NextResponse.json({ error: "clientId and messageTemplate are required" }, { status: 400 });
    }

    const client = await db.collection("clients").findOne({ _id: new ObjectId(clientId) });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get establishment for studio name
    const establishment = await db.collection("establishments").findOne({
      _id: new ObjectId(client.establishmentId),
    });

    // Fill template with real data
    const message = fillTemplate(messageTemplate, {
      clientName: client.name.split(" ")[0], // First name only
      studioName: establishment?.name || "our studio",
      instructorName: templateData?.instructorName || "your instructor",
      nextClassName: templateData?.nextClassName || "our next class",
      nextClassDay: templateData?.nextClassDay || "this week",
      remainingClasses: client.plan?.remainingClasses || 0,
      longestStreak: client.longestStreak || 0,
      ...templateData,
    });

    // Send via the selected channel
    let sendResult: { success: boolean; error?: string } = { success: false };

    if (channel === "sms") {
      // Use Twilio SMS directly
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const smsNumber = process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !smsNumber) {
        return NextResponse.json({ error: "SMS not configured" }, { status: 400 });
      }

      const cleaned = client.phone.replace(/\D/g, "");
      let formattedPhone: string;
      if (cleaned.startsWith("1") && cleaned.length === 11) {
        formattedPhone = `+${cleaned}`;
      } else if (cleaned.length === 10) {
        formattedPhone = `+1${cleaned}`;
      } else if (cleaned.length >= 12) {
        formattedPhone = `+${cleaned}`;
      } else {
        formattedPhone = `+1${cleaned}`;
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: formattedPhone,
            From: smsNumber,
            Body: message,
          }),
        }
      );

      if (response.ok) {
        sendResult = { success: true };
      } else {
        const err = await response.json();
        sendResult = { success: false, error: err.message || "SMS send failed" };
      }
    }

    // Log the intervention
    const now = new Date();
    await db.collection("churn_interventions").insertOne({
      clientId,
      clientName: client.name,
      establishmentId: client.establishmentId,
      signal,
      channel,
      message,
      sent: sendResult.success,
      error: sendResult.error,
      sentBy: user?.userId,
      createdAt: now,
    });

    // Update client's last churn alert timestamp
    if (sendResult.success) {
      await db.collection("clients").updateOne(
        { _id: client._id },
        { $set: { lastChurnAlertSentAt: now, updatedAt: now } }
      );
    }

    return NextResponse.json({
      success: sendResult.success,
      message: sendResult.success ? message : undefined,
      error: sendResult.error,
    });
  } catch (err) {
    console.error("Error sending churn intervention:", err);
    return NextResponse.json({ error: "Failed to send intervention" }, { status: 500 });
  }
}
