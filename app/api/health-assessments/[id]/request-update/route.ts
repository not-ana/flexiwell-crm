import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { HealthAssessment } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/auth";

// POST /api/health-assessments/[id]/request-update - Request client to update their assessment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { message } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid assessment ID" }, { status: 400 });
    }

    const db = await getDatabase();
    const assessment = await db.collection<HealthAssessment>("health_assessments").findOne({
      _id: new ObjectId(id),
    });

    if (!assessment) {
      return NextResponse.json({ error: "Health assessment not found" }, { status: 404 });
    }

    if (assessment.status === "draft") {
      return NextResponse.json(
        { error: "Cannot request update for a draft assessment" },
        { status: 400 }
      );
    }

    const now = new Date();
    const result = await db.collection<HealthAssessment>("health_assessments").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "requires_update",
          updateRequestedAt: now,
          updateRequestedBy: user?.userId,
          updateRequestMessage: message || "Please review and update your health assessment.",
          updatedAt: now,
        },
      },
      { returnDocument: "after" }
    );

    // TODO: Send notification to client (email/WhatsApp)
    // This would integrate with existing notification system

    return NextResponse.json({
      success: true,
      assessment: result,
      message: "Update request sent to client",
    });
  } catch (error) {
    console.error("Error requesting health assessment update:", error);
    return NextResponse.json(
      { error: "Failed to request update" },
      { status: 500 }
    );
  }
}
