// GET /api/admin/refunds/[id] - Get refund request details
// PATCH /api/admin/refunds/[id] - Review/approve/reject a refund request

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid refund request ID" }, { status: 400 });
    }

    const db = await getDatabase();
    const refundRequest = await db.collection("refund_requests").findOne({ _id: new ObjectId(id) });

    if (!refundRequest) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    }

    return NextResponse.json({ refundRequest });
  } catch (error) {
    console.error("Error fetching refund request:", error);
    return NextResponse.json({ error: "Failed to fetch refund request" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reviewedBy, reviewNotes, rejectionReason, refundAmount } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid refund request ID" }, { status: 400 });
    }

    if (!action || !["approve", "reject", "start_review"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'approve', 'reject', or 'start_review'" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    let updateData: Record<string, unknown> = { updatedAt: now };

    switch (action) {
      case "start_review":
        updateData.status = "under_review";
        updateData.reviewedBy = reviewedBy;
        break;

      case "approve":
        if (!reviewedBy) {
          return NextResponse.json({ error: "reviewedBy is required" }, { status: 400 });
        }
        updateData.status = "approved";
        updateData.reviewedBy = reviewedBy;
        updateData.reviewedAt = now;
        updateData.reviewNotes = reviewNotes;
        if (refundAmount != null) updateData.refundAmount = refundAmount;
        break;

      case "reject":
        if (!reviewedBy || !rejectionReason) {
          return NextResponse.json(
            { error: "reviewedBy and rejectionReason are required" },
            { status: 400 }
          );
        }
        updateData.status = "rejected";
        updateData.reviewedBy = reviewedBy;
        updateData.reviewedAt = now;
        updateData.reviewNotes = reviewNotes;
        updateData.rejectionReason = rejectionReason;
        break;
    }

    const result = await db.collection("refund_requests").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, refundRequest: result });
  } catch (error) {
    console.error("Error updating refund request:", error);
    return NextResponse.json({ error: "Failed to update refund request" }, { status: 500 });
  }
}
