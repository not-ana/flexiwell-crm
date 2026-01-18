import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { HealthAssessment, User } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { requireRole, getAuthUser } from "@/lib/auth";

// Helper to get client ID from user
async function getClientIdForUser(userId: string): Promise<string | null> {
  const db = await getDatabase();
  const user = await db.collection<User>("users").findOne({ _id: new ObjectId(userId) });
  return user?.clientId || null;
}

// GET /api/health-assessments/[id] - Get a single health assessment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { id } = await params;

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

    // Clients can only view their own assessment
    if (user.role === "client") {
      const clientId = await getClientIdForUser(user.userId);
      if (assessment.clientId !== clientId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error("Error fetching health assessment:", error);
    return NextResponse.json(
      { error: "Failed to fetch health assessment" },
      { status: 500 }
    );
  }
}

// PUT /api/health-assessments/[id] - Update a health assessment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid assessment ID" }, { status: 400 });
    }

    const db = await getDatabase();
    const existingAssessment = await db.collection<HealthAssessment>("health_assessments").findOne({
      _id: new ObjectId(id),
    });

    if (!existingAssessment) {
      return NextResponse.json({ error: "Health assessment not found" }, { status: 404 });
    }

    // Clients can only update their own assessment
    if (user.role === "client") {
      const clientId = await getClientIdForUser(user.userId);
      if (existingAssessment.clientId !== clientId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Clients can only update draft or requires_update assessments
    if (user.role === "client" && !["draft", "requires_update"].includes(existingAssessment.status)) {
      return NextResponse.json(
        { error: "Cannot edit a submitted assessment. Request an update from admin." },
        { status: 403 }
      );
    }

    const now = new Date();
    const isDraft = body.status === "draft";
    const isSubmitting = body.status === "submitted" && existingAssessment.status !== "submitted";

    const updateData: Partial<HealthAssessment> = {
      ...body,
      updatedAt: now,
    };

    // Handle submission
    if (isSubmitting) {
      updateData.submittedAt = now;
      updateData.status = "submitted";
      // Update consent with IP
      if (body.consent) {
        updateData.consent = {
          ...body.consent,
          signedAt: now,
          signedIp: request.headers.get("x-forwarded-for") || "unknown",
        };
      }
    }

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.clientId;
    delete updateData.clientEmail;
    delete updateData.version;
    delete updateData.createdAt;

    const result = await db.collection<HealthAssessment>("health_assessments").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    return NextResponse.json({
      success: true,
      assessment: result,
    });
  } catch (error) {
    console.error("Error updating health assessment:", error);
    return NextResponse.json(
      { error: "Failed to update health assessment" },
      { status: 500 }
    );
  }
}

// DELETE /api/health-assessments/[id] - Delete a health assessment (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid assessment ID" }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await db.collection<HealthAssessment>("health_assessments").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Health assessment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Health assessment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting health assessment:", error);
    return NextResponse.json(
      { error: "Failed to delete health assessment" },
      { status: 500 }
    );
  }
}
