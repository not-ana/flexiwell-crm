import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import { getRetentionDashboard } from "@/lib/services/retention-metrics.service";

// GET /api/admin/retention
// Returns the full retention dashboard payload in a single JSON blob.
// One endpoint, one snapshot, one consistent view of the data.
//
// Cached for 1 hour at the HTTP layer — retention metrics don't need to be
// real-time, and the underlying aggregations are expensive.
export async function GET(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const establishmentId = searchParams.get("establishmentId") || user?.establishmentId;

    const db = await getDatabase();
    const payload = await getRetentionDashboard(db, { establishmentId });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[/api/admin/retention] error:", err);
    return NextResponse.json(
      { error: "Failed to compute retention metrics" },
      { status: 500 },
    );
  }
}
