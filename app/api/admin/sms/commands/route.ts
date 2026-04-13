import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getDatabase } from "@/lib/db/mongodb";
import type { BotMenuCommand } from "@/lib/db/schemas";
import { SMS_BOT_ENABLED, smsBotDisabledResponse } from "@/lib/features/sms-bot";

const DEFAULT_COMMANDS: BotMenuCommand[] = [
  { id: "1", trigger: "1", label: "My Classes", action: "MY_BOOKINGS", enabled: true, order: 1 },
  { id: "2", trigger: "2", label: "Book Class", action: "BOOK_CLASS", enabled: true, order: 2 },
  { id: "3", trigger: "3", label: "Cancel", action: "CANCEL_BOOKING", enabled: true, order: 3 },
  { id: "4", trigger: "4", label: "Credits", action: "REMAINING_CREDITS", enabled: true, order: 4 },
  { id: "5", trigger: "5", label: "Support", action: "CONTACT_SUPPORT", enabled: true, order: 5 },
];

// GET - Load SMS bot commands
export async function GET(request: NextRequest) {
  if (!SMS_BOT_ENABLED) return smsBotDisabledResponse();
  try {
    const { user, error } = requireAuth(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const establishmentId = searchParams.get("establishmentId") || user.userId;

    const db = await getDatabase();
    const config = await db.collection("sms_bot_config").findOne({ establishmentId });

    return NextResponse.json({
      commands: config?.commands || DEFAULT_COMMANDS,
      welcomeMessage: config?.welcomeMessage || "",
    });
  } catch (error) {
    console.error("Error loading SMS bot commands:", error);
    return NextResponse.json({ error: "Failed to load commands" }, { status: 500 });
  }
}

// POST - Save SMS bot commands
export async function POST(request: NextRequest) {
  if (!SMS_BOT_ENABLED) return smsBotDisabledResponse();
  try {
    const { user, error } = requireAuth(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { commands, welcomeMessage, establishmentId: estId } = body;
    const establishmentId = estId || user.userId;

    if (!commands || !Array.isArray(commands)) {
      return NextResponse.json({ error: "Commands array is required" }, { status: 400 });
    }

    const db = await getDatabase();

    await db.collection("sms_bot_config").updateOne(
      { establishmentId },
      {
        $set: {
          establishmentId,
          commands,
          welcomeMessage: welcomeMessage || "",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving SMS bot commands:", error);
    return NextResponse.json({ error: "Failed to save commands" }, { status: 500 });
  }
}
