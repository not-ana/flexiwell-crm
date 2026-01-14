import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { WaitlistEntry, Client, Booking } from "@/lib/db/schemas";
import { requireRole } from "@/lib/auth/middleware";

// GET /api/waitlist - List all waitlist entries
export async function GET(request: NextRequest) {
  // Require authentication - only admin and teacher can view waitlist
  const { error } = requireRole(request, ["admin", "teacher"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const requestType = searchParams.get("requestType");
    const clientId = searchParams.get("clientId");
    const limit = parseInt(searchParams.get("limit") || "100");

    const db = await getDatabase();

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (requestType && requestType !== "all") {
      filter.requestType = requestType;
    }

    if (clientId) {
      filter.clientId = clientId;
    }

    const [entries, stats] = await Promise.all([
      db
        .collection<WaitlistEntry>("waitlist")
        .find(filter)
        .sort({ priorityScore: -1, createdAt: 1 })
        .limit(limit)
        .toArray(),
      db
        .collection<WaitlistEntry>("waitlist")
        .aggregate([
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray(),
    ]);

    // Calculate stats
    const statsMap = stats.reduce(
      (acc, s) => {
        acc[s._id] = s.count;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      entries,
      stats: {
        waiting: statsMap.waiting || 0,
        notified: statsMap.notified || 0,
        confirmed: statsMap.confirmed || 0,
        expired: statsMap.expired || 0,
        declined: statsMap.declined || 0,
        total: entries.length,
      },
    });
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}

// POST /api/waitlist - Create a new waitlist entry
export async function POST(request: NextRequest) {
  // Require authentication - admin, teacher, or client can create entries
  const { error } = requireRole(request, ["admin", "teacher", "client"]);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      requestType,
      reason,
      isUrgent,
      preferredClassId,
      preferredClassName,
      preferredClassTypes,
      preferredInstructorIds,
      preferredDays,
      preferredTimeSlots,
      originalBookingId,
      originalClassId,
      originalClassName,
      originalDate,
    } = body;

    // Validation
    if (!clientId || !clientName || !clientEmail || !requestType) {
      return NextResponse.json(
        { error: "Client ID, name, email, and request type are required" },
        { status: 400 }
      );
    }

    const validTypes = ["reschedule", "extra_class", "cancelled_by_studio"];
    if (!validTypes.includes(requestType)) {
      return NextResponse.json(
        { error: `Invalid request type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Calculate priority score with real data from database
    const priorityBreakdown = await calculatePriorityScore(
      db,
      clientId,
      requestType,
      isUrgent
    );

    const priorityScore = Object.values(priorityBreakdown).reduce((a, b) => a + b, 0);

    const newEntry: Omit<WaitlistEntry, "_id"> = {
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      requestType,
      reason,
      isUrgent: isUrgent || false,
      preferredClassId,
      preferredClassName,
      preferredClassTypes,
      preferredInstructorIds,
      preferredDays,
      preferredTimeSlots,
      originalBookingId,
      originalClassId,
      originalClassName,
      originalDate: originalDate ? new Date(originalDate) : undefined,
      priorityScore,
      priorityBreakdown,
      status: "waiting",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<WaitlistEntry>("waitlist").insertOne(newEntry);

    return NextResponse.json(
      {
        success: true,
        entry: {
          _id: result.insertedId,
          ...newEntry,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to create waitlist entry" },
      { status: 500 }
    );
  }
}

// Calculate priority score based on real client data
async function calculatePriorityScore(
  db: Awaited<ReturnType<typeof getDatabase>>,
  clientId: string,
  requestType: string,
  isUrgent: boolean
): Promise<WaitlistEntry["priorityBreakdown"]> {
  const breakdown: WaitlistEntry["priorityBreakdown"] = {
    planTypePoints: 0,
    waitingTimePoints: 0,
    attendancePoints: 0,
    vipPoints: 0,
    cancelledByStudioPoints: 0,
    urgentReasonPoints: 0,
  };

  try {
    // 1. Get client info for plan type
    let client: Client | null = null;
    if (ObjectId.isValid(clientId)) {
      client = await db.collection<Client>("clients").findOne({
        _id: new ObjectId(clientId),
      });
    }

    if (client) {
      // Plan type points based on plan value
      const planPoints: Record<string, number> = {
        "drop-in": 5,
        "monthly": 20,
        "quarterly": 35,
        "annual": 50,
      };
      breakdown.planTypePoints = planPoints[client.plan.type] || 15;

      // VIP points - check if client has high revenue or is marked as VIP
      const totalPayments = await db.collection("payments").aggregate([
        { $match: { clientId: clientId, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray();

      const totalSpent = totalPayments[0]?.total || 0;
      if (totalSpent >= 5000 || client.plan.type === "annual") {
        breakdown.vipPoints = 30;
      } else if (totalSpent >= 2000 || client.plan.type === "quarterly") {
        breakdown.vipPoints = 15;
      }
    }

    // 2. Calculate attendance score (last 30 days)
    if (ObjectId.isValid(clientId)) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const bookingStats = await db.collection<Booking>("bookings").aggregate([
        {
          $match: {
            clientId: clientId,
            scheduledDate: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            noShows: {
              $sum: { $cond: [{ $eq: ["$status", "no-show"] }, 1, 0] },
            },
          },
        },
      ]).toArray();

      if (bookingStats.length > 0) {
        const stats = bookingStats[0];
        const total = stats.total || 0;
        const completed = stats.completed || 0;

        if (total > 0) {
          const attendanceRate = (completed / total) * 100;
          // Higher attendance = higher priority
          if (attendanceRate >= 90) {
            breakdown.attendancePoints = 40;
          } else if (attendanceRate >= 75) {
            breakdown.attendancePoints = 30;
          } else if (attendanceRate >= 50) {
            breakdown.attendancePoints = 20;
          } else {
            breakdown.attendancePoints = 10;
          }
        } else {
          // New client with no history
          breakdown.attendancePoints = 25;
        }
      } else {
        // New client
        breakdown.attendancePoints = 25;
      }
    }

    // 3. Cancelled by studio gets highest priority
    if (requestType === "cancelled_by_studio") {
      breakdown.cancelledByStudioPoints = 100;
    }

    // 4. Urgent reason bonus
    if (isUrgent) {
      breakdown.urgentReasonPoints = 25;
    }

    // 5. Waiting time starts at 0 - will increase over time via scheduled job

  } catch (error) {
    console.error("Error calculating priority score:", error);
    // Return default values on error
    breakdown.planTypePoints = 15;
    breakdown.attendancePoints = 25;
  }

  return breakdown;
}
