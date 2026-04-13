// POST /api/admin/retention-copilot-weekly-report/preview
//
// Admin convenience: send the weekly Retention Copilot report immediately to
// the logged-in studio owner. Used by Settings → "Preview my weekly report".

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sendWeeklyReportForEstablishment } from "@/lib/services/retention-copilot-weekly-report";

export async function POST(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  if (!user?.establishmentId) {
    return NextResponse.json({ error: "No establishment found" }, { status: 400 });
  }

  try {
    const result = await sendWeeklyReportForEstablishment(user.establishmentId);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Failed to send weekly report preview:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to send weekly report",
      },
      { status: 500 },
    );
  }
}
