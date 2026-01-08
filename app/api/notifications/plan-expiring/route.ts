import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { notificationService } from "@/lib/services/notification.service";
import type { Client } from "@/lib/db/schemas";

// POST /api/notifications/plan-expiring
// Send notifications to clients whose plans are about to expire
// Call daily via cron to notify clients 7 days and 3 days before expiry
export async function POST(request: NextRequest) {
  try {
    // Verify API key for cron security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const now = new Date();

    // Days before expiry to notify
    const notificationDays = [7, 3, 1];

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const daysAhead of notificationDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysAhead);
      targetDate.setHours(23, 59, 59, 999);

      const targetDateStart = new Date(now);
      targetDateStart.setDate(targetDateStart.getDate() + daysAhead);
      targetDateStart.setHours(0, 0, 0, 0);

      // Find active clients whose plan expires on target date
      const clients = await db
        .collection<Client>("clients")
        .find({
          status: "active",
          "plan.endDate": {
            $gte: targetDateStart,
            $lte: targetDate,
          },
          [`planExpiryNotified_${daysAhead}d`]: { $ne: true },
        })
        .toArray();

      for (const client of clients) {
        results.processed++;

        try {
          const result = await notificationService.sendPlanExpiring(client, daysAhead);

          if (result.success) {
            results.sent++;

            // Mark notification as sent
            await db.collection<Client>("clients").updateOne(
              { _id: client._id },
              {
                $set: {
                  [`planExpiryNotified_${daysAhead}d`]: true,
                  updatedAt: new Date(),
                },
              }
            );
          } else {
            results.failed++;
            results.errors.push(
              `Failed to notify ${client.name}: ${result.error}`
            );
          }
        } catch (error) {
          results.failed++;
          results.errors.push(
            `Error notifying ${client.name}: ${(error as Error).message}`
          );
        }
      }
    }

    // Also check for already expired plans to notify
    const expiredClients = await db
      .collection<Client>("clients")
      .find({
        status: "active",
        "plan.endDate": { $lt: now },
        planExpiredNotified: { $ne: true },
      })
      .toArray();

    for (const client of expiredClients) {
      results.processed++;

      try {
        // Send custom expired notification
        await notificationService.sendCustomMessage(
          client._id?.toString() || "",
          "Seu plano expirou",
          `Olá ${client.name}!\n\nSeu plano ${client.plan.type} expirou. Renove agora para continuar aproveitando nossas aulas!`,
        );

        results.sent++;

        // Update client status and mark as notified
        await db.collection<Client>("clients").updateOne(
          { _id: client._id },
          {
            $set: {
              status: "inactive",
              planExpiredNotified: true,
              updatedAt: new Date(),
            },
          }
        );
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Error notifying expired plan for ${client.name}: ${(error as Error).message}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking expiring plans:", error);
    return NextResponse.json(
      { error: "Failed to process expiring plans", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "plan-expiry-notifications",
    timestamp: new Date().toISOString(),
  });
}
