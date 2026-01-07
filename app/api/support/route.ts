import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { SupportTicket } from "@/lib/db/schemas";

// GET /api/support - List all support tickets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (priority && priority !== "all") {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    const [tickets, stats] = await Promise.all([
      db
        .collection<SupportTicket>("support_tickets")
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray(),
      db
        .collection<SupportTicket>("support_tickets")
        .aggregate([
          {
            $facet: {
              byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
              byPriority: [{ $group: { _id: "$priority", count: { $sum: 1 } } }],
              byCategory: [{ $group: { _id: "$category", count: { $sum: 1 } } }],
            },
          },
        ])
        .toArray(),
    ]);

    // Format stats
    const statsByStatus = (stats[0]?.byStatus || []).reduce(
      (acc: Record<string, number>, s: { _id: string; count: number }) => {
        acc[s._id] = s.count;
        return acc;
      },
      {} as Record<string, number>
    );

    const statsByPriority = (stats[0]?.byPriority || []).reduce(
      (acc: Record<string, number>, s: { _id: string; count: number }) => {
        acc[s._id] = s.count;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      tickets,
      stats: {
        open: statsByStatus.open || 0,
        in_progress: statsByStatus.in_progress || 0,
        resolved: statsByStatus.resolved || 0,
        closed: statsByStatus.closed || 0,
        urgent: statsByPriority.urgent || 0,
        high: statsByPriority.high || 0,
        total: tickets.length,
      },
    });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}

// POST /api/support - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      clientName,
      clientEmail,
      subject,
      category,
      priority,
      description,
    } = body;

    // Validation
    if (!clientId || !clientName || !subject || !category || !description) {
      return NextResponse.json(
        { error: "Client ID, name, subject, category, and description are required" },
        { status: 400 }
      );
    }

    const validCategories = ["billing", "classes", "technical", "feedback", "other"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const newTicket: Omit<SupportTicket, "_id"> = {
      clientId,
      clientName,
      clientEmail,
      subject,
      category,
      priority: priority || "medium",
      status: "open",
      messages: [{
        id: `msg-${Date.now()}`,
        from: "client",
        content: description,
        isAdmin: false,
        timestamp: new Date(),
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<SupportTicket>("support_tickets").insertOne(newTicket);

    return NextResponse.json(
      {
        success: true,
        ticket: {
          _id: result.insertedId,
          ...newTicket,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return NextResponse.json(
      { error: "Failed to create support ticket" },
      { status: 500 }
    );
  }
}
