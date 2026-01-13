import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { StudioSettings } from "@/lib/db/schemas";

const DEFAULT_SETTINGS: Omit<StudioSettings, "_id"> = {
  general: {
    studioName: "FlexiWell Studio",
    email: "contact@flexiwell.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street - New York, NY 10001",
    timezone: "America/New_York",
    currency: "USD",
    language: "en-US",
    region: "US",
    businessType: "pilates",
  },
  branding: {
    primaryColor: "#7c3aed",
  },
  notifications: {
    emailEnabled: true,
    whatsappEnabled: false,
    smsEnabled: false,
    primaryMessagingChannel: "whatsapp",
    messagingBotEnabled: false,
    reminderHours: 24,
    confirmationEmail: true,
    marketingEmails: false,
  },
  waitlist: {
    enabled: true,
    maxSize: 10,
    autoNotify: true,
    notificationWindowMinutes: 60,
    priorityByPlanType: true,
  },
  integrations: {
    stripeConnected: false,
    whatsappConnected: false,
    googleCalendarConnected: false,
    resendConnected: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// GET /api/settings - Get studio settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section"); // optional: 'general', 'branding', etc.

    const db = await getDatabase();

    // Get settings document (there should only be one)
    let settings = await db.collection<StudioSettings>("settings").findOne({});

    // If no settings exist, create default settings
    if (!settings) {
      const result = await db.collection<StudioSettings>("settings").insertOne({
        ...DEFAULT_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      settings = { _id: result.insertedId, ...DEFAULT_SETTINGS };
    }

    // If a specific section is requested, return only that section
    if (section && section in settings) {
      return NextResponse.json({
        [section]: settings[section as keyof StudioSettings],
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update studio settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: "Section and data are required" },
        { status: 400 }
      );
    }

    const validSections = ["general", "branding", "notifications", "waitlist", "integrations"];
    if (!validSections.includes(section)) {
      return NextResponse.json(
        { error: `Invalid section. Must be one of: ${validSections.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Update the specific section
    const updateData: Record<string, unknown> = {
      [section]: data,
      updatedAt: new Date(),
    };

    const result = await db.collection<StudioSettings>("settings").findOneAndUpdate(
      {},
      { $set: updateData },
      {
        returnDocument: "after",
        upsert: true,
      }
    );

    return NextResponse.json({
      success: true,
      settings: result,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Partial update to a specific field
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { error: "Updates object is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Flatten the updates for nested fields (e.g., "general.studioName")
    const flattenedUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
          flattenedUpdates[`${key}.${nestedKey}`] = nestedValue;
        }
      } else {
        flattenedUpdates[key] = value;
      }
    }

    flattenedUpdates.updatedAt = new Date();

    const result = await db.collection<StudioSettings>("settings").findOneAndUpdate(
      {},
      { $set: flattenedUpdates },
      {
        returnDocument: "after",
        upsert: true,
      }
    );

    return NextResponse.json({
      success: true,
      settings: result,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
