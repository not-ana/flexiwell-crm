// GET /api/admin/coupons/[id] - Get coupon details + redemption history
// PUT /api/admin/coupons/[id] - Update a coupon
// DELETE /api/admin/coupons/[id] - Deactivate a coupon

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
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });
    }

    const db = await getDatabase();

    const [coupon, redemptions] = await Promise.all([
      db.collection("coupons").findOne({ _id: new ObjectId(id) }),
      db.collection("coupon_redemptions")
        .find({ couponId: id })
        .sort({ redeemedAt: -1 })
        .limit(100)
        .toArray(),
    ]);

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ coupon, redemptions });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });
    }

    const db = await getDatabase();
    const { _id, createdAt, createdBy, currentRedemptions, code, ...updateData } = body;

    // Don't allow changing the code or createdBy
    const result = await db.collection("coupons").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon: result });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });
    }

    const db = await getDatabase();

    // Soft-deactivate, don't hard delete (preserve redemption history)
    const result = await db.collection("coupons").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { isActive: false, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Coupon deactivated" });
  } catch (error) {
    console.error("Error deactivating coupon:", error);
    return NextResponse.json({ error: "Failed to deactivate coupon" }, { status: 500 });
  }
}
