import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";

// POST /api/trial/cleanup - Clean up expired trial data after retention period
// This endpoint should be called by a cron job (e.g., weekly)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const now = new Date();

    // Data retention period: 30 days after trial expiration
    const retentionDays = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Find expired trial accounts past retention period that haven't converted
    const expiredTrials = await db.collection("users").find({
      role: "admin",
      trialStatus: "expired",
      trialEndDate: { $lt: cutoffDate },
      subscriptionStatus: { $nin: ["active", "past_due"] },
    }).toArray();

    const results = {
      usersProcessed: 0,
      dataCleanedUp: {
        classes: 0,
        bookings: 0,
        clients: 0,
        staff: 0,
        establishments: 0,
        settings: 0,
      },
      errors: [] as string[],
    };

    for (const user of expiredTrials) {
      const userId = user._id.toString();

      try {
        // 1. Delete classes created by this admin
        const classesDeleted = await db.collection("classes").deleteMany({
          $or: [
            { createdBy: userId },
            { establishmentId: { $in: await getEstablishmentIds(db, userId) } },
          ],
        });
        results.dataCleanedUp.classes += classesDeleted.deletedCount;

        // 2. Delete bookings for those classes
        const bookingsDeleted = await db.collection("bookings").deleteMany({
          $or: [
            { adminId: userId },
            { establishmentId: { $in: await getEstablishmentIds(db, userId) } },
          ],
        });
        results.dataCleanedUp.bookings += bookingsDeleted.deletedCount;

        // 3. Delete clients associated with this admin
        const clientsDeleted = await db.collection("clients").deleteMany({
          adminId: userId,
        });
        results.dataCleanedUp.clients += clientsDeleted.deletedCount;

        // 4. Delete company-client relationships
        await db.collection("company_clients").deleteMany({
          companyId: userId,
        });

        // 5. Delete staff members
        const staffDeleted = await db.collection("staff").deleteMany({
          $or: [
            { adminId: userId },
            { establishmentId: { $in: await getEstablishmentIds(db, userId) } },
          ],
        });
        results.dataCleanedUp.staff += staffDeleted.deletedCount;

        // 6. Delete establishments
        const establishmentsDeleted = await db.collection("establishments").deleteMany({
          ownerId: userId,
        });
        results.dataCleanedUp.establishments += establishmentsDeleted.deletedCount;

        // 7. Delete studio settings
        const settingsDeleted = await db.collection("studio_settings").deleteMany({
          ownerId: userId,
        });
        results.dataCleanedUp.settings += settingsDeleted.deletedCount;

        // 8. Delete invite codes
        await db.collection("company_invites").deleteMany({
          companyId: userId,
        });

        // 9. Delete activities
        await db.collection("activities").deleteMany({
          userId: userId,
        });

        // 10. Delete subscription events
        await db.collection("subscriptionEvents").deleteMany({
          userId: userId,
        });

        // 11. Delete payments
        await db.collection("payments").deleteMany({
          userId: userId,
        });

        // 12. Delete refresh tokens
        await db.collection("refresh_tokens").deleteMany({
          userId: userId,
        });

        // 13. Mark user as cleaned up (don't delete to keep record for analytics)
        await db.collection("users").updateOne(
          { _id: user._id },
          {
            $set: {
              dataCleanedUp: true,
              dataCleanedUpAt: now,
              isActive: false,
              updatedAt: now,
            },
          }
        );

        results.usersProcessed++;
      } catch (userError) {
        results.errors.push(`Error processing user ${userId}: ${userError}`);
      }
    }

    // Log cleanup results
    await db.collection("system_logs").insertOne({
      type: "trial_cleanup",
      timestamp: now,
      results,
      expiredTrialsFound: expiredTrials.length,
    });

    console.log("Trial cleanup completed:", results);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.usersProcessed} expired trial accounts`,
      results,
    });
  } catch (error) {
    console.error("Trial cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to run trial cleanup" },
      { status: 500 }
    );
  }
}

// Helper function to get establishment IDs for a user
async function getEstablishmentIds(db: Awaited<ReturnType<typeof getDatabase>>, userId: string): Promise<string[]> {
  const establishments = await db.collection("establishments").find({
    ownerId: userId,
  }).project({ _id: 1 }).toArray();

  return establishments.map(e => e._id.toString());
}

// GET /api/trial/cleanup - Get cleanup stats (for admin monitoring)
export async function GET(request: NextRequest) {
  try {
    // Verify auth
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();

    // Data retention period: 30 days after trial expiration
    const retentionDays = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Count accounts pending cleanup
    const pendingCleanup = await db.collection("users").countDocuments({
      role: "admin",
      trialStatus: "expired",
      trialEndDate: { $lt: cutoffDate },
      subscriptionStatus: { $nin: ["active", "past_due"] },
      dataCleanedUp: { $ne: true },
    });

    // Get last cleanup log
    const lastCleanup = await db.collection("system_logs").findOne(
      { type: "trial_cleanup" },
      { sort: { timestamp: -1 } }
    );

    // Count accounts already cleaned up
    const alreadyCleanedUp = await db.collection("users").countDocuments({
      dataCleanedUp: true,
    });

    return NextResponse.json({
      pendingCleanup,
      alreadyCleanedUp,
      lastCleanup: lastCleanup ? {
        timestamp: lastCleanup.timestamp,
        usersProcessed: lastCleanup.results?.usersProcessed || 0,
      } : null,
      retentionDays,
      cutoffDate,
    });
  } catch (error) {
    console.error("Error getting cleanup stats:", error);
    return NextResponse.json(
      { error: "Failed to get cleanup stats" },
      { status: 500 }
    );
  }
}
