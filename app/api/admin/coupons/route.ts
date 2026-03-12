// GET /api/admin/coupons - List all coupons
// POST /api/admin/coupons - Create a new coupon

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Coupon } from "@/lib/db/schemas";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();
    const filter: Record<string, unknown> = {};

    if (activeOnly) {
      filter.isActive = true;
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ];
    }

    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      db.collection<Coupon>("coupons")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Coupon>("coupons").countDocuments(filter),
    ]);

    return NextResponse.json({
      coupons,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      currency,
      applicablePlans,
      applicableAddons,
      maxRedemptions,
      maxRedemptionsPerUser = 1,
      startsAt,
      expiresAt,
      createdBy,
    } = body;

    // Validation
    if (!code || !name || !discountType || discountValue == null || !createdBy) {
      return NextResponse.json(
        { error: "code, name, discountType, discountValue, and createdBy are required" },
        { status: 400 }
      );
    }

    if (!["percentage", "fixed_amount"].includes(discountType)) {
      return NextResponse.json(
        { error: "discountType must be 'percentage' or 'fixed_amount'" },
        { status: 400 }
      );
    }

    if (discountType === "percentage" && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json(
        { error: "Percentage discount must be between 1 and 100" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const normalizedCode = code.toUpperCase().trim();

    // Check uniqueness
    const existing = await db.collection("coupons").findOne({ code: normalizedCode });
    if (existing) {
      return NextResponse.json(
        { error: `Coupon code "${normalizedCode}" already exists` },
        { status: 409 }
      );
    }

    const now = new Date();
    const coupon: Omit<Coupon, "_id"> = {
      code: normalizedCode,
      name,
      description: description || undefined,
      discountType,
      discountValue,
      currency: currency || "USD",
      applicablePlans: applicablePlans || [],
      applicableAddons: applicableAddons || [],
      maxRedemptions: maxRedemptions || undefined,
      maxRedemptionsPerUser,
      currentRedemptions: 0,
      isActive: true,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("coupons").insertOne(coupon);

    return NextResponse.json(
      { success: true, coupon: { ...coupon, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
