import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { Client } from "@/lib/db/schemas";
import { requireRole, getUserFromRequest } from "@/lib/auth/middleware";
import { calculatePriority, type ClientSource } from "@/lib/config/waitlist";
import { checkFeatureAccess, createPlanErrorResponse } from "@/lib/plans/enforcement";

// Simplified waitlist entry for MVP
interface WaitlistEntry {
  _id?: ObjectId;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientSource: ClientSource;
  classId: string;
  className: string;
  priority: number;
  position?: number;
  status: "waiting" | "notified" | "confirmed" | "expired";
  notifiedAt?: Date;
  expiresAt?: Date;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/waitlist - List waitlist entries
export async function GET(request: NextRequest) {
  const { error } = requireRole(request, ["admin", "teacher", "client"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const classId = searchParams.get("classId");
    const clientIdParam = searchParams.get("clientId");
    const limit = parseInt(searchParams.get("limit") || "100");

    const db = await getDatabase();
    const filter: Record<string, unknown> = {};

    // If client is requesting their own waitlist
    if (clientIdParam === "me") {
      const user = getUserFromRequest(request);
      if (user?.clientId) {
        filter.clientId = user.clientId;
      }
    } else if (clientIdParam) {
      filter.clientId = clientIdParam;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (classId) {
      filter.classId = classId;
    }

    const entries = await db
      .collection<WaitlistEntry>("waitlist")
      .find(filter)
      .sort({ priority: -1, createdAt: 1 })
      .limit(limit)
      .toArray();

    // Calculate positions
    const entriesWithPosition = entries.map((entry, index) => ({
      ...entry,
      id: entry._id?.toString(),
      position: index + 1,
    }));

    // Stats for admin
    const stats = await db
      .collection<WaitlistEntry>("waitlist")
      .aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray();

    const statsMap = stats.reduce(
      (acc, s) => ({ ...acc, [s._id as string]: s.count }),
      { waiting: 0, notified: 0, confirmed: 0, expired: 0 }
    );

    // Calculate "protected revenue" - direct clients served before aggregators
    const protectedRevenue = await calculateProtectedRevenue(db);

    // Waitlist counts per class (for social proof and demand visibility)
    const classWaitlistCounts = await db
      .collection<WaitlistEntry>("waitlist")
      .aggregate<{ _id: string; className: string; count: number }>([
        { $match: { status: { $in: ["waiting", "notified"] } } },
        { $group: { _id: "$classId", className: { $first: "$className" }, count: { $sum: 1 } } },
      ])
      .toArray();

    const waitlistByClass = classWaitlistCounts.reduce(
      (acc, item) => ({ ...acc, [item._id]: item.count }),
      {} as Record<string, number>
    );

    const waitlistClassNames = classWaitlistCounts.reduce(
      (acc, item) => ({ ...acc, [item._id]: item.className }),
      {} as Record<string, string>
    );

    return NextResponse.json({
      entries: entriesWithPosition,
      stats: { ...statsMap, total: entries.length },
      protectedRevenue,
      waitlistByClass,
      waitlistClassNames,
    });
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}

// POST /api/waitlist - Join waitlist (simplified - 1 click)
export async function POST(request: NextRequest) {
  const { error, user: authUser } = requireRole(request, ["admin", "teacher", "client"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { classId, className } = body;

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // Check if smart waitlist feature is available (for admin users)
    if (authUser && authUser.role === "admin") {
      const featureCheck = await checkFeatureAccess(authUser.userId, "smartWaitlist");
      if (!featureCheck.allowed) {
        return NextResponse.json(createPlanErrorResponse(featureCheck), { status: 403 });
      }
    }

    const db = await getDatabase();
    const user = getUserFromRequest(request);

    // Get client info
    let client: Client | null = null;
    let clientId = body.clientId;

    if (user?.clientId) {
      clientId = user.clientId;
      if (ObjectId.isValid(clientId)) {
        client = await db.collection<Client>("clients").findOne({
          _id: new ObjectId(clientId),
        });
      }
    }

    if (!client && !body.clientName) {
      return NextResponse.json(
        { error: "Client information required" },
        { status: 400 }
      );
    }

    // Check if already on waitlist
    const existing = await db.collection<WaitlistEntry>("waitlist").findOne({
      clientId: clientId,
      classId: classId,
      status: { $in: ["waiting", "notified"] },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You are already on the waitlist for this class" },
        { status: 400 }
      );
    }

    // Determine client source for priority
    const clientSource = getClientSource(client);
    const now = new Date();
    const priority = calculatePriority(clientSource, now);

    const newEntry: Omit<WaitlistEntry, "_id"> = {
      clientId: clientId,
      clientName: client?.name || body.clientName,
      clientEmail: client?.email || body.clientEmail,
      clientPhone: client?.phone,
      clientSource,
      classId,
      className: className || "Aula",
      priority,
      status: "waiting",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<WaitlistEntry>("waitlist").insertOne(newEntry);

    // Get position in queue and total queue size
    const [position, totalInQueue] = await Promise.all([
      db.collection<WaitlistEntry>("waitlist").countDocuments({
        classId,
        status: "waiting",
        priority: { $gt: priority },
      }).then(count => count + 1),
      db.collection<WaitlistEntry>("waitlist").countDocuments({
        classId,
        status: { $in: ["waiting", "notified"] },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        entry: {
          id: result.insertedId.toString(),
          ...newEntry,
          position,
          totalInQueue,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error joining waitlist:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}

// Helper: Determine client source from client data
function getClientSource(client: Client | null): ClientSource {
  if (!client) return "direct";

  // Check client source field if exists
  const source = (client as any).source?.toLowerCase();

  if (source === "gympass" || source === "wellhub") return "gympass";
  if (source === "classpass") return "classpass";
  if (source === "trial") return "trial";

  // Check if has package (any plan type that's not drop-in indicates a package)
  if (client.plan?.type && client.plan.type !== "drop-in") return "package";

  return "direct";
}

// Helper: Calculate "protected revenue" metric for admin dashboard
async function calculateProtectedRevenue(db: Awaited<ReturnType<typeof getDatabase>>): Promise<{
  thisMonth: number;
  directClientsServed: number;
  aggregatorsWaiting: number;
}> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Count direct clients confirmed this month
  const directConfirmed = await db.collection<WaitlistEntry>("waitlist").countDocuments({
    status: "confirmed",
    clientSource: { $in: ["direct", "package"] },
    confirmedAt: { $gte: startOfMonth },
  });

  // Count aggregators still waiting
  const aggregatorsWaiting = await db.collection<WaitlistEntry>("waitlist").countDocuments({
    status: "waiting",
    clientSource: { $in: ["gympass", "classpass"] },
  });

  // Estimate protected revenue (average class value R$80 for direct vs R$20 for aggregator)
  const protectedRevenue = directConfirmed * 60; // R$60 difference per spot

  return {
    thisMonth: protectedRevenue,
    directClientsServed: directConfirmed,
    aggregatorsWaiting,
  };
}
