import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { notificationService } from "@/lib/services/notification.service";

// GET /api/notifications - Get notification logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const type = searchParams.get("type");
    const channel = searchParams.get("channel");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    const db = await getDatabase();

    const filter: Record<string, unknown> = {};

    if (clientId) filter.clientId = clientId;
    if (type) filter.type = type;
    if (channel) filter.channel = channel;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      db
        .collection("notification_logs")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("notification_logs").countDocuments(filter),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notification logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification logs" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Send a notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, clientId, data, channels = "both" } = body;

    if (!type || !clientId) {
      return NextResponse.json(
        { error: "type and clientId are required" },
        { status: 400 }
      );
    }

    const result = await notificationService.send({
      type,
      clientId,
      data: data || {},
      channels,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, emailSent: result.emailSent, whatsappSent: result.whatsappSent },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      emailSent: result.emailSent,
      whatsappSent: result.whatsappSent,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
