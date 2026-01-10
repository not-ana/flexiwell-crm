import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Conversation } from "@/lib/db/schemas";

// GET /api/conversations/stats - Get conversation stats for sidebar badges
export async function GET() {
  try {
    const db = await getDatabase();

    // Count unread conversations (awaiting response from bot/admin)
    const unreadCount = await db.collection<Conversation>("conversations").countDocuments({
      "context.awaitingResponse": true,
    });

    return NextResponse.json({
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching conversation stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
