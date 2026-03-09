import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getDatabase } from "@/lib/db/mongodb";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  timestamp: Date;
}

interface SupportConversation {
  userId: string;
  userName: string;
  userEmail: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// GET - Get all support conversations (only for Ana Julia / super admin)
export async function GET(req: NextRequest) {
  // Only allow super admin (Ana Julia) to access this
  const { user, error } = requireRole(req, ["admin"]);
  if (error) return error;

  // Check if user is Ana Julia (by email)
  const allowedEmails = ["anajulia@flexiwell.net", "ana@flexiwell.net", "admin@flexiwell.net"];
  if (!allowedEmails.includes(user!.email?.toLowerCase() || "")) {
    return NextResponse.json(
      { error: "Unauthorized access" },
      { status: 403 }
    );
  }

  try {
    const db = await getDatabase();
    const collection = db.collection<SupportConversation>("supportConversations");

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    // Build query
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ];
    }

    // Get all conversations, sorted by most recent
    const conversations = await collection
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      conversations: conversations.map((conv) => ({
        ...conv,
        _id: conv._id?.toString(),
      })),
    });
  } catch (err) {
    console.error("Error fetching inbox:", err);
    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    );
  }
}
