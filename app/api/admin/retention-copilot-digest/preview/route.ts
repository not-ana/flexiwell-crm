// POST /api/admin/retention-copilot-digest/preview
//
// Admin-only convenience route that sends the daily Retention Copilot digest
// to the currently logged-in studio owner immediately, ignoring the daily
// schedule. Used by Settings → "Send me a preview" so owners can see what the
// morning email looks like before opting in.

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sendDigestForEstablishment } from "@/lib/services/retention-copilot-digest";

export async function POST(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  if (!user?.establishmentId) {
    return NextResponse.json({ error: "No establishment found" }, { status: 400 });
  }

  try {
    const result = await sendDigestForEstablishment(user.establishmentId);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Failed to send Retention Copilot digest preview:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to send digest",
      },
      { status: 500 },
    );
  }
}
