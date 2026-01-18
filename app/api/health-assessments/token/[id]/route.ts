import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { HealthAssessmentToken } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/auth";

// DELETE /api/health-assessments/token/[id] - Revoke a token
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid token ID" }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await db.collection<HealthAssessmentToken>("health_assessment_tokens").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Token revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking health assessment token:", error);
    return NextResponse.json(
      { error: "Failed to revoke token" },
      { status: 500 }
    );
  }
}
