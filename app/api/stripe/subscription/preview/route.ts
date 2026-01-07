// Stripe Subscription Preview API Route
// POST /api/stripe/subscription/preview - Preview plan change proration

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  getActiveSubscription,
  previewPlanChange
} from "@/lib/stripe/server";
import { getStripePriceId } from "@/lib/stripe/config";
import { PlanTier, BillingPeriod, pricingPlans } from "@/lib/config/pricing";
import { getDatabase as getDb } from "@/lib/db/mongodb";

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
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

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
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // Get new price ID
    const newPriceId = getStripePriceId(newPlanTier, newBillingPeriod);

    // Preview the change
    const preview = await previewPlanChange({
      customerId: userDoc.stripeCustomerId,
      subscriptionId: subscription.id,
      newPriceId,
    });

    // Calculate immediate charge (if any)
    // This is the difference between what's already paid and the new amount
    // In Stripe v20.x, proration is nested in parent.invoice_item_details or parent.subscription_item_details
    let immediateCharge = 0;
    for (const line of preview.lines.data) {
      const isProration = line.parent?.invoice_item_details?.proration ||
                          line.parent?.subscription_item_details?.proration || false;
      if (isProration) {
        immediateCharge += line.amount;
      }
    }

    return NextResponse.json({
      immediateCharge: immediateCharge / 100, // Convert from cents
      nextInvoiceAmount: preview.amount_due / 100,
      nextInvoiceDate: preview.next_payment_attempt,
      currency: preview.currency.toUpperCase(),
      lines: preview.lines.data.map(line => ({
        description: line.description,
        amount: line.amount / 100,
        proration: line.parent?.invoice_item_details?.proration ||
                   line.parent?.subscription_item_details?.proration || false,
      })),
    });
  } catch (error) {
    console.error("Preview plan change error:", error);
    return NextResponse.json(
      { error: "Failed to preview plan change" },
      { status: 500 }
    );
  }
}
