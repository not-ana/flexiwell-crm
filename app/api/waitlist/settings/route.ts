import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { WaitlistPriorityConfig } from "@/lib/db/schemas";

// GET - Get waitlist priority settings
export async function GET() {
  try {
    const db = await getDatabase();
    const settings = await db.collection<WaitlistPriorityConfig>("waitlist_settings").findOne({});

    if (!settings) {
      // Return default settings
      return NextResponse.json({
        planTypePoints: {
          annual: 10,
          quarterly: 7,
          monthly: 5,
          "drop-in": 2,
        },
        waitingTimePointsPerDay: 1,
        attendanceRateMultiplier: 0.5,
        vipBonus: 15,
        cancelledByStudioBonus: 20,
        urgentReasonBonus: 10,
        notificationWindowMinutes: 60,
        autoDeclineAfterMinutes: 120,
        maxNotificationsPerSlot: 3,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching waitlist settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT - Update waitlist priority settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDatabase();

    const settings: WaitlistPriorityConfig = {
      planTypePoints: body.planTypePoints,
      waitingTimePointsPerDay: body.waitingTimePointsPerDay,
      attendanceRateMultiplier: body.attendanceRateMultiplier,
      vipBonus: body.vipBonus,
      cancelledByStudioBonus: body.cancelledByStudioBonus,
      urgentReasonBonus: body.urgentReasonBonus,
      notificationWindowMinutes: body.notificationWindowMinutes,
      autoDeclineAfterMinutes: body.autoDeclineAfterMinutes,
      maxNotificationsPerSlot: body.maxNotificationsPerSlot,
      updatedAt: new Date(),
    };

    await db.collection("waitlist_settings").updateOne(
      {},
      { $set: settings },
      { upsert: true }
    );

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating waitlist settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
