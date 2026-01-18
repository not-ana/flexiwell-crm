import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { HealthAssessment } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/auth";

// POST /api/health-assessments/[id]/mark-reviewed - Mark assessment as reviewed by admin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { notes } = body;

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
        { error: "Cannot mark a draft assessment as reviewed" },
        { status: 400 }
      );
    }

    const now = new Date();
    const result = await db.collection<HealthAssessment>("health_assessments").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "reviewed",
          reviewedBy: user?.userId,
          reviewedAt: now,
          reviewNotes: notes,
          updatedAt: now,
        },
      },
      { returnDocument: "after" }
    );

    return NextResponse.json({
      success: true,
      assessment: result,
      message: "Health assessment marked as reviewed",
    });
  } catch (error) {
    console.error("Error marking health assessment as reviewed:", error);
    return NextResponse.json(
      { error: "Failed to mark as reviewed" },
      { status: 500 }
    );
  }
}
