import { NextResponse } from "next/server";
import { processOnboardingTimers } from "@/lib/services/onboarding.service";

// POST /api/admin/onboarding/process - Run onboarding timer checks
// Call this via cron job (e.g. every hour) or manually from admin
export async function POST() {
  try {
    const results = await processOnboardingTimers();
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Error processing onboarding timers:", error);
    return NextResponse.json(
      { error: "Failed to process onboarding timers" },
      { status: 500 }
    );
  }
}
