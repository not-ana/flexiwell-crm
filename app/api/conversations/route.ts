import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Conversation } from "@/lib/db/schemas";

// GET /api/conversations - List all conversations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (platform && platform !== "all") {
      filter.platform = platform;
    }

    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { "messages.content": { $regex: search, $options: "i" } },
      ];
    }

    const [conversations, stats] = await Promise.all([
      db
        .collection<Conversation>("conversations")
        .find(filter)
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray(),
      db
        .collection<Conversation>("conversations")
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

    // Calculate unread count (conversations with context.awaitingResponse = true)
    const unreadCount = await db.collection<Conversation>("conversations").countDocuments({
      "context.awaitingResponse": true,
    });

    return NextResponse.json({
      conversations,
      stats: {
        active: statsMap.active || 0,
        closed: statsMap.closed || 0,
        unread: unreadCount,
        total: conversations.length,
      },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      clientName,
      platform,
      platformUserId,
      initialMessage,
    } = body;

    // Validation
    if (!clientId || !clientName || !platform || !platformUserId) {
      return NextResponse.json(
        { error: "Client ID, name, platform, and platform user ID are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const newConversation: Omit<Conversation, "_id"> = {
      clientId,
      clientName,
      platform,
      platformUserId,
      messages: initialMessage ? [{
        id: `msg-${Date.now()}`,
        from: "client",
        content: initialMessage,
        timestamp: new Date(),
      }] : [],
      context: {
        awaitingResponse: !!initialMessage,
      },
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Conversation>("conversations").insertOne(newConversation);

    return NextResponse.json(
      {
        success: true,
        conversation: {
          _id: result.insertedId,
          ...newConversation,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
