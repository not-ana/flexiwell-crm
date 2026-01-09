import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";

// GET - Fetch notification preferences
export async function GET() {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const preferences = await db.collection("notification_preferences").findOne({
      userId: user.userId,
    });

    if (!preferences) {
      // Return default preferences
      return NextResponse.json({
        general: [],
        summary: [],
        business: [],
        staff: [],
      });
    }

    return NextResponse.json(preferences.settings);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

// Valid notification types for each category
const VALID_NOTIFICATION_TYPES = {
  general: ["new_booking", "booking_cancelled", "booking_reminder", "payment_received", "payment_failed"],
  summary: ["daily_summary", "weekly_summary", "monthly_report"],
  business: ["low_attendance", "high_demand", "revenue_milestone", "new_review"],
  staff: ["schedule_change", "new_assignment", "time_off_request", "performance_update"],
};

// POST - Save notification preferences
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { general, summary, business, staff } = body;

    // Validate that all fields are arrays
    if (general !== undefined && !Array.isArray(general)) {
      return NextResponse.json(
        { error: "general must be an array" },
        { status: 400 }
      );
    }
    if (summary !== undefined && !Array.isArray(summary)) {
      return NextResponse.json(
        { error: "summary must be an array" },
        { status: 400 }
      );
    }
    if (business !== undefined && !Array.isArray(business)) {
      return NextResponse.json(
        { error: "business must be an array" },
        { status: 400 }
      );
    }
    if (staff !== undefined && !Array.isArray(staff)) {
      return NextResponse.json(
        { error: "staff must be an array" },
        { status: 400 }
      );
    }

    // Validate notification types
    const validateTypes = (types: string[] | undefined, category: keyof typeof VALID_NOTIFICATION_TYPES) => {
      if (!types) return true;
      return types.every((type) => VALID_NOTIFICATION_TYPES[category].includes(type));
    };

    if (!validateTypes(general, "general")) {
      return NextResponse.json(
        { error: `Invalid general notification type. Valid types: ${VALID_NOTIFICATION_TYPES.general.join(", ")}` },
        { status: 400 }
      );
    }
    if (!validateTypes(summary, "summary")) {
      return NextResponse.json(
        { error: `Invalid summary notification type. Valid types: ${VALID_NOTIFICATION_TYPES.summary.join(", ")}` },
        { status: 400 }
      );
    }
    if (!validateTypes(business, "business")) {
      return NextResponse.json(
        { error: `Invalid business notification type. Valid types: ${VALID_NOTIFICATION_TYPES.business.join(", ")}` },
        { status: 400 }
      );
    }
    if (!validateTypes(staff, "staff")) {
      return NextResponse.json(
        { error: `Invalid staff notification type. Valid types: ${VALID_NOTIFICATION_TYPES.staff.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    await db.collection("notification_preferences").updateOne(
      { userId: user.userId },
      {
        $set: {
          userId: user.userId,
          settings: {
            general,
            summary,
            business,
            staff,
          },
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
      message: "Notification preferences saved successfully",
    });
  } catch (error) {
    console.error("Error saving notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to save notification preferences" },
      { status: 500 }
    );
  }
}
