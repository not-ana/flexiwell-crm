import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const db = await getDatabase();
    const collection = db.collection("notification_logs");

    const [logs, totalSent, smsSent, emailSent, failedCount] = await Promise.all([
      collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray(),
      collection.countDocuments({ status: "sent" }),
      collection.countDocuments({ status: "sent", channel: "sms" }),
      collection.countDocuments({ status: "sent", channel: "email" }),
      collection.countDocuments({ status: "failed" }),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        _id: log._id.toString(),
        type: log.type,
        channel: log.channel,
        clientName: log.clientName || "Unknown",
        recipient: log.recipient,
        status: log.status,
        sentAt: log.sentAt,
        error: log.error,
        createdAt: log.createdAt,
      })),
      stats: {
        totalSent,
        smsSent,
        emailSent,
        failedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching notification logs:", error);
    return NextResponse.json(
      { logs: [], stats: { totalSent: 0, smsSent: 0, emailSent: 0, failedCount: 0 } },
      { status: 200 }
    );
  }
}
