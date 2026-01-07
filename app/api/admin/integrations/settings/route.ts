import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getDatabase } from "@/lib/db/mongodb";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

async function getUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

// POST - Save integration settings
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

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
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

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
