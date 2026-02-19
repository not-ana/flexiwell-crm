import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sendWinBackCampaign } from "@/lib/services/onboarding.service";

// POST /api/clients/win-back - Send win-back campaigns to churned clients
export async function POST(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { clientIds } = body;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: "clientIds array is required" },
        { status: 400 }
      );
    }

    const results = await sendWinBackCampaign(clientIds);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error sending win-back campaign:", error);
    return NextResponse.json(
      { error: "Failed to send win-back campaign" },
      { status: 500 }
    );
  }
}
