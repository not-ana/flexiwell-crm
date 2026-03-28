// GET  /api/admin/churn-checkup - Get latest weekly checkup report
// POST /api/admin/churn-checkup - Generate a new weekly checkup report

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getDatabase } from "@/lib/db/mongodb";
import { generateWeeklyCheckup } from "@/lib/services/churn-intervention.service";

// GET: Retrieve the most recent checkup or generate one if none exists this week
export async function GET(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const db = await getDatabase();
    const establishmentId = user?.establishmentId;

    if (!establishmentId) {
      return NextResponse.json({ error: "No establishment found" }, { status: 400 });
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Check for a recent report
    const existingReport = await db.collection("churn_checkup_reports").findOne(
      { establishmentId, generatedAt: { $gte: oneWeekAgo } },
      { sort: { generatedAt: -1 } }
    );

    if (existingReport) {
      return NextResponse.json(existingReport);
    }

    // No recent report — generate one
    const report = await generateWeeklyCheckup(establishmentId);

    await db.collection("churn_checkup_reports").insertOne(report);

    return NextResponse.json(report);
  } catch (err) {
    console.error("Error fetching churn checkup:", err);
    return NextResponse.json({ error: "Failed to fetch churn checkup" }, { status: 500 });
  }
}

// POST: Force generate a new weekly checkup
export async function POST(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const db = await getDatabase();
    const establishmentId = user?.establishmentId;

    if (!establishmentId) {
      return NextResponse.json({ error: "No establishment found" }, { status: 400 });
    }

    const report = await generateWeeklyCheckup(establishmentId);

    await db.collection("churn_checkup_reports").insertOne(report);

    return NextResponse.json(report);
  } catch (err) {
    console.error("Error generating churn checkup:", err);
    return NextResponse.json({ error: "Failed to generate churn checkup" }, { status: 500 });
  }
}
