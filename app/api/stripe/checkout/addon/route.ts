// Stripe Add-on Checkout API Route
// POST /api/stripe/checkout/addon - Create a checkout session for add-on purchase

import { NextRequest, NextResponse } from "next/server";
import {
  createAddOnCheckoutSession,
  getActiveSubscription
} from "@/lib/stripe/server";
import { getStripeAddOnPriceId } from "@/lib/stripe/config";
import { addOns } from "@/lib/config/pricing";
import { getDatabase as getDb } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { addOnId, quantity = 1 } = body as {
      addOnId: string;
      quantity?: number;
    };

    // Validate inputs
    if (!addOnId) {
      return NextResponse.json(
        { error: "Missing addOnId" },
        { status: 400 }
      );
    }

    // Validate add-on exists
    const addOn = addOns.find(a => a.id === addOnId);
    if (!addOn) {
      return NextResponse.json(
        { error: "Invalid add-on ID" },
        { status: 400 }
      );
    }

    // Get Stripe price ID for add-on
    const priceId = getStripeAddOnPriceId(addOnId);
    if (!priceId) {
      return NextResponse.json(
        { error: "Add-on not configured in Stripe" },
        { status: 400 }
      );
    }

    // Require authenticated user for add-ons
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user's Stripe customer ID
    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ email: user.email });

    if (!userDoc?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found. Please subscribe to a plan first." },
        { status: 400 }
      );
    }

    // Verify user has active subscription
    const subscription = await getActiveSubscription(userDoc.stripeCustomerId);
    if (!subscription) {
      return NextResponse.json(
        { error: "Active subscription required to purchase add-ons" },
        { status: 400 }
      );
    }

    // Check if user's plan allows this add-on
    const userPlan = userDoc.planTier;
    if (!addOn.availableOn.includes(userPlan)) {
      return NextResponse.json(
        { error: `This add-on is not available on your current plan (${userPlan})` },
        { status: 400 }
      );
    }

    const isRecurring = addOn.billingPeriod !== "one-time";

    // Create checkout session for add-on
    const session = await createAddOnCheckoutSession({
      customerId: userDoc.stripeCustomerId,
      priceId,
      quantity,
      isRecurring,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?addon_success=true&addon=${addOnId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?addon_canceled=true`,
      metadata: {
        addOnId,
        userId: user.userId,
        quantity: String(quantity),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Add-on checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create add-on checkout session" },
      { status: 500 }
    );
  }
}
