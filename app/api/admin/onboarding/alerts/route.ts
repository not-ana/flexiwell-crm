import { NextRequest, NextResponse } from "next/server";
import { getStaffAlerts, resolveStaffAlert } from "@/lib/services/onboarding.service";

// GET /api/admin/onboarding/alerts - Get all active staff alerts
export async function GET() {
  try {
    const alerts = await getStaffAlerts();
    return NextResponse.json({ alerts, total: alerts.length });
  } catch (error) {
    console.error("Error fetching staff alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff alerts" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/onboarding/alerts - Resolve a staff alert
export async function PATCH(request: NextRequest) {
  try {
    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    await resolveStaffAlert(clientId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resolving staff alert:", error);
    return NextResponse.json(
      { error: "Failed to resolve alert" },
      { status: 500 }
    );
  }
}
