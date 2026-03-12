// POST /api/admin/coupons/validate - Validate and optionally redeem a coupon code
// Used during checkout flow to check if a code is valid before applying

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Coupon, CouponRedemption } from "@/lib/db/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId, userEmail, planTier, amount, redeem = false } = body;

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const db = await getDatabase();
    const normalizedCode = code.toUpperCase().trim();

    // Find coupon
    const coupon = await db.collection<Coupon>("coupons").findOne({ code: normalizedCode });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code" }, { status: 404 });
    }

    // Check active
    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, error: "This coupon is no longer active" });
    }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: "This coupon has expired" });
    }

    // Check start date
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
      return NextResponse.json({ valid: false, error: "This coupon is not yet active" });
    }

    // Check max redemptions
    if (coupon.maxRedemptions && coupon.currentRedemptions >= coupon.maxRedemptions) {
      return NextResponse.json({ valid: false, error: "This coupon has reached its maximum redemptions" });
    }

    // Check per-user limit
    if (userId && coupon.maxRedemptionsPerUser) {
      const userRedemptions = await db.collection("coupon_redemptions").countDocuments({
        couponId: coupon._id!.toString(),
        userId,
      });
      if (userRedemptions >= coupon.maxRedemptionsPerUser) {
        return NextResponse.json({ valid: false, error: "You have already used this coupon" });
      }
    }

    // Check plan applicability
    if (planTier && coupon.applicablePlans && coupon.applicablePlans.length > 0) {
      if (!coupon.applicablePlans.includes(planTier)) {
        return NextResponse.json({ valid: false, error: "This coupon is not applicable to the selected plan" });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (amount) {
      if (coupon.discountType === "percentage") {
        discountAmount = Math.round((amount * coupon.discountValue) / 100 * 100) / 100;
      } else {
        discountAmount = Math.min(coupon.discountValue, amount);
      }
    }

    const finalAmount = amount ? Math.max(0, amount - discountAmount) : null;

    // If redeem=true, actually apply the coupon
    if (redeem && userId) {
      const now = new Date();

      // Record redemption
      const redemption: Omit<CouponRedemption, "_id"> = {
        couponId: coupon._id!.toString(),
        couponCode: normalizedCode,
        userId,
        userEmail: userEmail || "",
        discountApplied: discountAmount,
        originalAmount: amount || 0,
        finalAmount: finalAmount || 0,
        context: "checkout",
        redeemedAt: now,
      };

      await db.collection("coupon_redemptions").insertOne(redemption);

      // Increment redemption count
      await db.collection("coupons").updateOne(
        { _id: coupon._id },
        { $inc: { currentRedemptions: 1 }, $set: { updatedAt: now } }
      );

      // Log pricing audit
      await db.collection("pricing_audit").insertOne({
        userId,
        userEmail: userEmail || "",
        action: "coupon_applied",
        newValue: { couponCode: normalizedCode, discountAmount, discountType: coupon.discountType },
        performedBy: userId,
        createdAt: now,
      });
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount: discountAmount,
      finalAmount,
      redeemed: redeem && !!userId,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
