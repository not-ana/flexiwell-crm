import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Establishment } from "@/lib/db/schemas";

// GET /api/establishments - List the user's studio (single-location only)
// Query params:
//   - active=true: only return active establishments
//   - teacherId=xxx: only return establishments where this teacher is assigned
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const teacherId = searchParams.get("teacherId");

    const db = await getDatabase();

    const filter: Record<string, unknown> = {};
    if (activeOnly) {
      filter.isActive = true;
    }
    if (teacherId) {
      filter.assignedTeachers = teacherId;
    }

    const establishments = await db
      .collection<Establishment>("establishments")
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({ establishments });
  } catch (error) {
    console.error("Error fetching establishments:", error);
    return NextResponse.json(
      { error: "Failed to fetch establishments" },
      { status: 500 }
    );
  }
}
