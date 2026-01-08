import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { notificationService, NotificationChannel } from "@/lib/services/notification.service";
import type { Client } from "@/lib/db/schemas";

// POST /api/notifications/send-bulk
// Send bulk notifications to multiple clients
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientIds, // array of client IDs or "all" for all active clients
      filter, // alternative: filter clients by criteria
      subject,
      message,
      channels = "both" as NotificationChannel,
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    let clients: Client[] = [];

    if (clientIds === "all") {
      // Get all active clients
      clients = await db
        .collection<Client>("clients")
        .find({ status: "active" })
        .toArray();
    } else if (Array.isArray(clientIds) && clientIds.length > 0) {
      // Get specific clients
      clients = await db
        .collection<Client>("clients")
        .find({
          _id: { $in: clientIds.map((id: string) => new ObjectId(id)) },
        })
        .toArray();
    } else if (filter) {
      // Build filter from criteria
      const query: Record<string, unknown> = {};

      if (filter.status) query.status = filter.status;
      if (filter.planType) query["plan.name"] = filter.planType;
      if (filter.hasClassesRemaining) {
        query["plan.remainingClasses"] = filter.hasClassesRemaining ? { $gt: 0 } : { $lte: 0 };
      }
      if (filter.minClassesRemaining) {
        query["plan.remainingClasses"] = { $gte: filter.minClassesRemaining };
      }
      if (filter.maxClassesRemaining) {
        query["plan.remainingClasses"] = {
          ...((query["plan.remainingClasses"] as object) || {}),
          $lte: filter.maxClassesRemaining,
        };
      }
      if (filter.planExpiringInDays) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + filter.planExpiringInDays);
        query["plan.endDate"] = { $lte: targetDate, $gte: new Date() };
      }

      clients = await db.collection<Client>("clients").find(query).toArray();
    } else {
      return NextResponse.json(
        { error: "clientIds, filter, or 'all' is required" },
        { status: 400 }
      );
    }

    if (clients.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        sent: 0,
        failed: 0,
        message: "No clients matched the criteria",
      });
    }

    // Limit bulk sends to prevent abuse
    const MAX_BULK_SEND = 500;
    if (clients.length > MAX_BULK_SEND) {
      return NextResponse.json(
        {
          error: `Too many recipients. Maximum is ${MAX_BULK_SEND}. Found ${clients.length} clients.`,
        },
        { status: 400 }
      );
    }

    const results = {
      total: clients.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send notifications in parallel batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < clients.length; i += BATCH_SIZE) {
      const batch = clients.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map((client) =>
          notificationService.sendCustomMessage(
            client._id?.toString() || "",
            subject || "Mensagem do Studio",
            message,
            channels
          )
        )
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const client = batch[j];

        if (result.status === "fulfilled" && result.value.success) {
          results.sent++;
        } else {
          results.failed++;
          const error =
            result.status === "rejected"
              ? result.reason?.message
              : result.value?.error;
          results.errors.push(`${client.name}: ${error}`);
        }
      }
    }

    // Log the bulk send
    await db.collection("bulk_notification_logs").insertOne({
      subject,
      message,
      channels,
      clientIds: clients.map((c) => c._id?.toString()),
      total: results.total,
      sent: results.sent,
      failed: results.failed,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: results.sent > 0,
      ...results,
    });
  } catch (error) {
    console.error("Error sending bulk notifications:", error);
    return NextResponse.json(
      { error: "Failed to send bulk notifications" },
      { status: 500 }
    );
  }
}
