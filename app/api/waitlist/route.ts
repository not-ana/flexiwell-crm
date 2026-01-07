import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { WaitlistEntry } from "@/lib/db/schemas";

// GET /api/waitlist - List all waitlist entries
export async function GET(request: NextRequest) {
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

    // Calculate priority score (simplified version)
    const priorityBreakdown = {
      planTypePoints: 20, // TODO: Get from client's actual plan
      waitingTimePoints: 0, // Starts at 0
      attendancePoints: 30, // TODO: Calculate from client's attendance
      vipPoints: 0, // TODO: Check if client is VIP
      cancelledByStudioPoints: requestType === "cancelled_by_studio" ? 100 : 0,
      urgentReasonPoints: isUrgent ? 25 : 0,
    };

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
