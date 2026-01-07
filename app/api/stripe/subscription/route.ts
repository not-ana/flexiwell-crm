// Stripe Subscription API Route
// GET /api/stripe/subscription - Get current subscription details

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getActiveSubscription, getCustomerSubscriptions, getUpcomingInvoice } from "@/lib/stripe/server";
import { getDatabase as getDb } from "@/lib/db/mongodb";
import { getPlanTierFromPriceId, getAddOnIdFromPriceId } from "./helpers";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

async function getUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ email: user.email });

    if (!userDoc?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Get subscriptions
    const subscriptions = await getCustomerSubscriptions(userDoc.stripeCustomerId);
    const activeSubscription = subscriptions.find(
      s => s.status === "active" || s.status === "trialing"
    );

    if (!activeSubscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Get plan info from first item (main plan)
    const mainItem = activeSubscription.items.data[0];
    const priceId = mainItem.price.id;
    const planTier = getPlanTierFromPriceId(priceId);
    const product = mainItem.price.product as unknown as { name: string };

    // Get add-ons from other items
    const addOns = activeSubscription.items.data.slice(1).map(item => {
      const addOnId = getAddOnIdFromPriceId(item.price.id);
      const addOnProduct = item.price.product as unknown as { name: string };
      return {
        id: addOnId || item.id,
        stripeItemId: item.id,
        name: addOnProduct?.name || "Add-on",
        amount: (item.price.unit_amount || 0) / 100,
        quantity: item.quantity || 1,
      };
    });

    // Get upcoming invoice
    const upcomingInvoice = await getUpcomingInvoice(userDoc.stripeCustomerId);

    const response = {
      id: activeSubscription.id,
      status: activeSubscription.status,
      currentPeriodStart: mainItem.current_period_start,
      currentPeriodEnd: mainItem.current_period_end,
      cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
      cancelAt: activeSubscription.cancel_at,
      trialStart: activeSubscription.trial_start,
      trialEnd: activeSubscription.trial_end,
      plan: {
        id: planTier || "unknown",
        priceId: priceId,
        name: product?.name || planTier || "Unknown Plan",
        amount: (mainItem.price.unit_amount || 0) / 100,
        currency: mainItem.price.currency.toUpperCase(),
        interval: mainItem.price.recurring?.interval || "month",
        intervalCount: mainItem.price.recurring?.interval_count || 1,
      },
      addOns,
      upcomingInvoice: upcomingInvoice
        ? {
            amount: upcomingInvoice.amount_due / 100,
            currency: upcomingInvoice.currency.toUpperCase(),
            date: upcomingInvoice.next_payment_attempt,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription" },
      { status: 500 }
    );
  }
}
