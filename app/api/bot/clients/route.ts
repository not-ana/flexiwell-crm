import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Client } from "@/lib/db/schemas";
import { SMS_BOT_ENABLED, smsBotDisabledResponse } from "@/lib/features/sms-bot";

// GET /api/bot/clients - Get client info by phone/email/platform ID
export async function GET(request: NextRequest) {
  if (!SMS_BOT_ENABLED) return smsBotDisabledResponse();
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");
    const whatsappId = searchParams.get("whatsappId");
    const instagramId = searchParams.get("instagramId");

    if (!phone && !email && !whatsappId && !instagramId) {
      return NextResponse.json(
        { error: "Phone, email, whatsappId or instagramId is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const query: Record<string, string> = {};
    if (phone) query.phone = phone;
    if (email) query.email = email;
    if (whatsappId) query.whatsappId = whatsappId;
    if (instagramId) query.instagramId = instagramId;

    const client = await db.collection<Client>("clients").findOne(query);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Return client info (excluding sensitive data)
    return NextResponse.json({
      id: client._id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      plan: {
        type: client.plan.type,
        totalClasses: client.plan.totalClasses,
        usedClasses: client.plan.usedClasses,
        remainingClasses: client.plan.remainingClasses,
        endDate: client.plan.endDate,
      },
      status: client.status,
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/bot/clients/link - Link platform ID to existing client
export async function POST(request: NextRequest) {
  if (!SMS_BOT_ENABLED) return smsBotDisabledResponse();
  try {
    const body = await request.json();
    const { phone, email, platform, platformUserId } = body;

    if (!platformUserId || !platform) {
      return NextResponse.json(
        { error: "platformUserId and platform are required" },
        { status: 400 }
      );
    }

    if (!phone && !email) {
      return NextResponse.json(
        { error: "Phone or email is required to link account" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Find client by phone or email
    const query: Record<string, string> = {};
    if (phone) query.phone = phone;
    if (email) query.email = email;

    const client = await db.collection<Client>("clients").findOne(query);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Update client with platform ID
    const updateField = platform === "whatsapp" ? "whatsappId" : "instagramId";
    await db.collection<Client>("clients").updateOne(
      { _id: client._id },
      {
        $set: {
          [updateField]: platformUserId,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Account linked to ${platform}`,
      clientId: client._id,
    });
  } catch (error) {
    console.error("Error linking client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
