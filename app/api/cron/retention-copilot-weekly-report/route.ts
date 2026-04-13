// POST /api/cron/retention-copilot-weekly-report
//
// Cron entrypoint for the Retention Copilot weekly report. Run once per week
// — Sunday evening or Monday morning is ideal so the owner sees it as part
// of her weekly review.
//
// Auth: optional `Bearer ${CRON_SECRET}` header, matching convention.

import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyReportForAllEstablishments } from "@/lib/services/retention-copilot-weekly-report";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const summary = await sendWeeklyReportForAllEstablishments();
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error("Retention Copilot weekly report cron failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to send weekly reports",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
