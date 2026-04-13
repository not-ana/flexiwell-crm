// Stripe Subscription Change API Route
// POST /api/stripe/subscription/change - Upgrade or downgrade plan

import { NextRequest, NextResponse } from "next/server";
import {
  getActiveSubscription,
  updateSubscription
} from "@/lib/stripe/server";
import {
  getStripePriceId,
  isUpgrade,
  isDowngrade,
  subscriptionBehavior
} from "@/lib/stripe/config";
import { PlanTier, BillingPeriod, pricingPlans } from "@/lib/config/pricing";
import { getDatabase as getDb } from "@/lib/db/mongodb";
import { getPlanTierFromPriceId } from "../helpers";
import { requireAuthFromCookie } from "@/lib/auth/middleware";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newPlanTier, newBillingPeriod } = body as {
      newPlanTier: PlanTier;
      newBillingPeriod: BillingPeriod;
    };

    // Validate inputs
    if (!newPlanTier || !newBillingPeriod) {
      return NextResponse.json(
        { error: "Missing newPlanTier or newBillingPeriod" },
        { status: 400 }
      );
    }

    // Validate plan exists
    const plan = pricingPlans.find(p => p.id === newPlanTier);
    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan tier" },
        { status: 400 }
      );
    }

    // Require authenticated user
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user's Stripe info
    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ email: user.email });

    if (!userDoc?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 }
      );
    }

    // Get active subscription
    const subscription = await getActiveSubscription(userDoc.stripeCustomerId);
    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription to change" },
        { status: 400 }
      );
    }

    // Get current plan
    const currentPriceId = subscription.items.data[0].price.id;
    const currentPlanTier = getPlanTierFromPriceId(currentPriceId);

    if (!currentPlanTier) {
      return NextResponse.json(
        { error: "Could not determine current plan" },
        { status: 500 }
      );
    }

    // Check if this is actually a change
    if (currentPlanTier === newPlanTier) {
      // Same tier - might be changing billing period
      const newPriceId = getStripePriceId(newPlanTier, newBillingPeriod);
      if (currentPriceId === newPriceId) {
        return NextResponse.json(
          { error: "You are already on this plan and billing period" },
          { status: 400 }
        );
      }
    }

    // Determine if upgrade or downgrade
    const upgrading = isUpgrade();
    const downgrading = isDowngrade();

    // Get new price ID
    const newPriceId = getStripePriceId(newPlanTier, newBillingPeriod);

    // Determine proration behavior
    let prorationBehavior: "create_prorations" | "none" = "create_prorations";

    if (downgrading) {
      // For downgrades, apply at end of billing period (no proration)
      prorationBehavior = subscriptionBehavior.downgrade.prorationBehavior;
    } else if (upgrading) {
      // For upgrades, charge immediately with proration
      prorationBehavior = subscriptionBehavior.upgrade.prorationBehavior;
    }

    // Update subscription
    const updatedSubscription = await updateSubscription({
      subscriptionId: subscription.id,
      newPriceId,
      prorationBehavior,
    });

    // Update user in database
    await db.collection("users").updateOne(
      { email: user.email },
      {
        $set: {
          planTier: newPlanTier,
          billingPeriod: newBillingPeriod,
          updatedAt: new Date(),
        },
      }
    );

    // Log the change
    await db.collection("subscriptionEvents").insertOne({
      userId: user.userId,
      event: upgrading ? "plan_upgraded" : downgrading ? "plan_downgraded" : "plan_changed",
      fromPlan: currentPlanTier,
      toPlan: newPlanTier,
      billingPeriod: newBillingPeriod,
      subscriptionId: subscription.id,
      timestamp: new Date(),
    });

    let message = "";
    if (upgrading) {
      message = `Successfully upgraded to ${plan.name}. Your card will be charged the prorated difference.`;
    } else if (downgrading) {
      message = `Successfully scheduled downgrade to ${plan.name}. The change will take effect at the end of your current billing period.`;
    } else {
      message = `Successfully changed to ${plan.name} (${newBillingPeriod}).`;
    }

    return NextResponse.json({
      success: true,
      message,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        planTier: newPlanTier,
        billingPeriod: newBillingPeriod,
        currentPeriodEnd: updatedSubscription.items.data[0]?.current_period_end,
      },
    });
  } catch (error) {
    console.error("Change plan error:", error);
    return NextResponse.json(
      { error: "Failed to change plan" },
      { status: 500 }
    );
  }
}
