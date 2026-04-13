// POST /api/cron/retention-copilot-digest
//
// Cron entrypoint that sends every studio owner her daily Retention Copilot
// digest. Designed to be hit once per day, early morning in the studio's
// timezone, by an external scheduler (Vercel Cron, GitHub Actions, etc.).
//
// Auth: optional `Bearer ${CRON_SECRET}` header. If `CRON_SECRET` is unset,
// the route is open — match the convention used by the other cron routes
// under /api/notifications.

import { NextRequest, NextResponse } from "next/server";
import { sendDigestForAllEstablishments } from "@/lib/services/retention-copilot-digest";

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const summary = await sendDigestForAllEstablishments();
    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (err) {
    console.error("Retention Copilot digest cron failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to send digests",
      },
      { status: 500 },
    );
  }
}

// Allow GET for easy manual trigger / health check from a browser when
// CRON_SECRET is unset (dev convenience). Production should always use POST
// from a scheduler.
export async function GET(request: NextRequest) {
  return POST(request);
}
