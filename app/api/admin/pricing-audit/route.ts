// GET /api/admin/pricing-audit - Get pricing change history for a user
// POST /api/admin/pricing-audit - Log a pricing change (custom price, feature override, coupon)

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { PricingAudit } from "@/lib/db/schemas";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();
    const filter: Record<string, unknown> = {};
    if (userId) filter.userId = userId;

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      db.collection<PricingAudit>("pricing_audit")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<PricingAudit>("pricing_audit").countDocuments(filter),
    ]);

    return NextResponse.json({
      entries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching pricing audit:", error);
    return NextResponse.json({ error: "Failed to fetch pricing audit" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail, action, previousValue, newValue, reason, performedBy, performedByName } = body;

    if (!userId || !action || !performedBy) {
      return NextResponse.json(
        { error: "userId, action, and performedBy are required" },
        { status: 400 }
      );
    }

    const validActions = [
      "custom_price_set", "custom_price_changed", "custom_price_removed",
      "feature_override_set", "feature_override_removed",
      "coupon_applied", "coupon_removed",
      "price_lock_set", "price_lock_expired",
      "plan_changed", "discount_applied",
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action. Must be one of: ${validActions.join(", ")}` }, { status: 400 });
    }

    const db = await getDatabase();
    const now = new Date();

    const entry: Omit<PricingAudit, "_id"> = {
      userId,
      userEmail: userEmail || "",
      action,
      previousValue,
      newValue,
      reason,
      performedBy,
      performedByName,
      createdAt: now,
    };

    const result = await db.collection("pricing_audit").insertOne(entry);

    // If this is a custom price or feature override change, also update the user record
    if (action === "custom_price_set" || action === "custom_price_changed") {
      const updateFields: Record<string, unknown> = { updatedAt: now };
      if (newValue?.customPrice != null) updateFields.customPrice = newValue.customPrice;
      if (newValue?.priceLockUntil) updateFields.priceLockUntil = new Date(newValue.priceLockUntil as string);
      if (newValue?.pricingPhase) updateFields.pricingPhase = newValue.pricingPhase;

      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateFields }
      );
    }

    if (action === "feature_override_set" && newValue?.featureOverrides) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: { featureOverrides: newValue.featureOverrides, updatedAt: now } }
      );
    }

    if (action === "feature_override_removed") {
      const featureKey = previousValue?.feature as string;
      if (featureKey) {
        await db.collection("users").updateOne(
          { _id: new ObjectId(userId) },
          { $unset: { [`featureOverrides.${featureKey}`]: "" }, $set: { updatedAt: now } }
        );
      }
    }

    if (action === "custom_price_removed") {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $unset: { customPrice: "", priceLockUntil: "", pricingPhase: "" },
          $set: { updatedAt: now },
        }
      );
    }

    return NextResponse.json(
      { success: true, entry: { ...entry, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating pricing audit entry:", error);
    return NextResponse.json({ error: "Failed to create pricing audit entry" }, { status: 500 });
  }
}
