// GET /api/admin/health-alerts - Get clients needing attention based on health scores
// POST /api/admin/health-alerts - Run health score recalculation + trigger alerts

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { calculateHealthScore, determineLifecycleStage } from "@/lib/utils/health-score";

// GET: Fetch clients grouped by risk level with actionable data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riskLevel = searchParams.get("riskLevel"); // critical, at_risk, watch
    const adminId = searchParams.get("adminId");
    const limit = parseInt(searchParams.get("limit") || "100");

    const db = await getDatabase();

    // Build filter
    const filter: Record<string, unknown> = {
      status: "active",
      deletedAt: { $exists: false },
    };

    if (adminId) {
      const establishments = await db.collection("establishments")
        .find({ ownerId: adminId })
        .project({ _id: 1 })
        .toArray();
      const estIds = establishments.map(e => e._id.toString());
      if (estIds.length > 0) {
        filter.establishmentId = { $in: estIds };
      }
    }

    if (riskLevel) {
      const scoreRanges: Record<string, { min: number; max: number }> = {
        critical: { min: 0, max: 30 },
        at_risk: { min: 30, max: 50 },
        watch: { min: 50, max: 70 },
      };
      const range = scoreRanges[riskLevel];
      if (range) {
        filter["healthScore.overall"] = { $gte: range.min, $lt: range.max };
      }
    } else {
      // Default: show all clients with score < 70 (not healthy)
      filter["healthScore.overall"] = { $lt: 70 };
    }

    const clients = await db.collection("clients")
      .find(filter)
      .sort({ "healthScore.overall": 1 })
      .limit(limit)
      .project({
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        healthScore: 1,
        lifecycleStage: 1,
        lastClassDate: 1,
        currentStreak: 1,
        "plan.type": 1,
        "plan.endDate": 1,
        lastChurnAlertSentAt: 1,
      })
      .toArray();

    // Group by risk level
    const grouped = {
      critical: clients.filter(c => (c.healthScore?.overall ?? 0) < 30),
      at_risk: clients.filter(c => {
        const score = c.healthScore?.overall ?? 0;
        return score >= 30 && score < 50;
      }),
      watch: clients.filter(c => {
        const score = c.healthScore?.overall ?? 0;
        return score >= 50 && score < 70;
      }),
    };

    return NextResponse.json({
      alerts: grouped,
      summary: {
        critical: grouped.critical.length,
        at_risk: grouped.at_risk.length,
        watch: grouped.watch.length,
        total: clients.length,
      },
    });
  } catch (error) {
    console.error("Error fetching health alerts:", error);
    return NextResponse.json({ error: "Failed to fetch health alerts" }, { status: 500 });
  }
}

// POST: Recalculate health scores for all active clients and update lifecycle stages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId } = body;

    const db = await getDatabase();
    const now = new Date();

    // Get all active clients
    const filter: Record<string, unknown> = {
      status: "active",
      deletedAt: { $exists: false },
    };

    if (adminId) {
      const establishments = await db.collection("establishments")
        .find({ ownerId: adminId })
        .project({ _id: 1 })
        .toArray();
      const estIds = establishments.map(e => e._id.toString());
      if (estIds.length > 0) {
        filter.establishmentId = { $in: estIds };
      }
    }

    const clients = await db.collection("clients").find(filter).toArray();

    let updated = 0;
    let alertsTriggered = 0;
    const alertsToSend: Array<{ clientId: string; name: string; riskLevel: string; score: number }> = [];

    for (const client of clients) {
      const clientId = client._id.toString();

      // Get booking stats
      const [bookings, payments] = await Promise.all([
        db.collection("bookings").find({ clientId }).toArray(),
        db.collection("payments").find({ clientId }).toArray(),
      ]);

      const completedBookings = bookings.filter(b => b.status === "completed").length;
      const totalBookings = bookings.filter(b =>
        ["completed", "no-show", "cancelled"].includes(b.status)
      ).length;

      const totalPayments = payments.length;
      const failedPayments = payments.filter(p => p.status === "failed").length;
      const latePayments = 0; // Would need late detection logic

      // Calculate health score
      const healthResult = calculateHealthScore({
        completedBookings,
        totalBookings,
        classesUsed: client.plan?.usedClasses || 0,
        classesTotal: client.plan?.totalClasses || 1,
        planStartDate: client.plan?.startDate || client.createdAt,
        planEndDate: client.plan?.endDate || now,
        lastActivityDate: client.lastClassDate,
        totalPayments,
        failedPayments,
        latePayments,
      });

      // Determine lifecycle stage
      const daysSinceLastActivity = client.lastClassDate
        ? Math.floor((now.getTime() - new Date(client.lastClassDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const daysSinceCreated = Math.floor(
        (now.getTime() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      const newStage = determineLifecycleStage({
        status: client.status,
        healthScore: healthResult.overall,
        daysSinceLastActivity,
        totalClasses: completedBookings,
        planType: client.plan?.type || "monthly",
        daysSinceCreated,
      });

      // Update client
      await db.collection("clients").updateOne(
        { _id: client._id },
        {
          $set: {
            healthScore: {
              overall: healthResult.overall,
              breakdown: healthResult.breakdown,
              lastCalculatedAt: now,
            },
            lifecycleStage: newStage,
            updatedAt: now,
          },
        }
      );
      updated++;

      // Check if alert needed (score dropped to at_risk or critical)
      const previousScore = client.healthScore?.overall ?? 100;
      if (
        healthResult.overall < 50 &&
        previousScore >= 50 &&
        (!client.lastChurnAlertSentAt ||
          now.getTime() - new Date(client.lastChurnAlertSentAt).getTime() > 7 * 24 * 60 * 60 * 1000)
      ) {
        alertsToSend.push({
          clientId,
          name: client.name,
          riskLevel: healthResult.riskLevel,
          score: healthResult.overall,
        });
        alertsTriggered++;

        await db.collection("clients").updateOne(
          { _id: client._id },
          { $set: { lastChurnAlertSentAt: now } }
        );
      }
    }

    // Log the recalculation
    await db.collection("activities").insertOne({
      type: "system",
      action: "health_score_recalculation",
      description: `Recalculated health scores for ${updated} clients, triggered ${alertsTriggered} alerts`,
      metadata: { updated, alertsTriggered },
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      updated,
      alertsTriggered,
      alerts: alertsToSend,
    });
  } catch (error) {
    console.error("Error recalculating health scores:", error);
    return NextResponse.json({ error: "Failed to recalculate health scores" }, { status: 500 });
  }
}
