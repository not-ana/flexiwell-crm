import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";

// POST - Save integration settings
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAuthFromCookie();
    if (error) return error;

    const body = await request.json();
    const { integrationId, settings } = body;

    if (!integrationId || !settings) {
      return NextResponse.json(
        { error: "Integration ID and settings are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Save settings to database
    await db.collection("integration_settings").updateOne(
      { integrationId },
      {
        $set: {
          integrationId,
          ...settings,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("Error saving integration settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

// GET - Get integration settings
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuthFromCookie();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("id");

    const db = await getDatabase();

    if (integrationId) {
      // Get settings for specific integration
      const settings = await db.collection("integration_settings").findOne({ integrationId });
      return NextResponse.json({ settings });
    } else {
      // Get all integration settings
      const settings = await db.collection("integration_settings").find({}).toArray();
      return NextResponse.json({ settings });
    }
  } catch (error) {
    console.error("Error fetching integration settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
