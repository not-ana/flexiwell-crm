// POST /api/admin/churn-checkup/send - Log a Retention Copilot intervention.
//
// The owner sends the SMS from her own phone (via an `sms:` deep link in the UI).
// This endpoint just records that the outreach happened so retention metrics
// and follow-up logic can pick it up. No automated sending, no Twilio.

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
    const { clientId, signal, messageTemplate, templateData } = body;

    if (!clientId || !messageTemplate) {
      return NextResponse.json({ error: "clientId and messageTemplate are required" }, { status: 400 });
    }

    const client = await db.collection("clients").findOne({ _id: new ObjectId(clientId) });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const establishment = await db.collection("establishments").findOne({
      _id: new ObjectId(client.establishmentId),
    });

    const message = fillTemplate(messageTemplate, {
      clientName: client.name.split(" ")[0],
      studioName: establishment?.name || "our studio",
      instructorName: templateData?.instructorName || "your instructor",
      nextClassName: templateData?.nextClassName || "our next class",
      nextClassDay: templateData?.nextClassDay || "this week",
      remainingClasses: client.plan?.remainingClasses || 0,
      longestStreak: client.longestStreak || 0,
      ...templateData,
    });

    const now = new Date();
    await db.collection("churn_interventions").insertOne({
      clientId,
      clientName: client.name,
      establishmentId: client.establishmentId,
      signal,
      channel: "sms",
      deliveryMode: "owner_sent", // owner sent it from her own phone
      message,
      sent: true,
      sentBy: user?.userId,
      createdAt: now,
    });

    await db.collection("clients").updateOne(
      { _id: client._id },
      { $set: { lastChurnAlertSentAt: now, updatedAt: now } }
    );

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error("Error logging churn intervention:", err);
    return NextResponse.json({ error: "Failed to log intervention" }, { status: 500 });
  }
}
