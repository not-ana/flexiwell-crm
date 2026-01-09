// Stripe Checkout API Route
// POST /api/stripe/checkout - Create a checkout session for plan subscription

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  createCheckoutSession,
  getOrCreateStripeCustomer
} from "@/lib/stripe/server";
import {
  getStripePriceId,
  checkoutConfig,
  stripeTrialConfig
} from "@/lib/stripe/config";
import { PlanTier, BillingPeriod, pricingPlans } from "@/lib/config/pricing";
import { getDatabase as getDb } from "@/lib/db/mongodb";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

async function getUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    // Use JWT_SECRET from environment - must be set in production
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable is not set");
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planTier, billingPeriod } = body as {
      planTier: PlanTier;
      billingPeriod: BillingPeriod;
    };

    // Validate inputs
    if (!planTier || !billingPeriod) {
      return NextResponse.json(
        { error: "Missing planTier or billingPeriod" },
        { status: 400 }
      );
    }

    // Validate plan exists
    const plan = pricingPlans.find(p => p.id === planTier);
    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan tier" },
        { status: 400 }
      );
    }

    // Validate billing period
    if (!["monthly", "annual"].includes(billingPeriod)) {
      return NextResponse.json(
        { error: "Invalid billing period" },
        { status: 400 }
      );
    }

    // Get Stripe price ID
    const priceId = getStripePriceId(planTier, billingPeriod);

    // Get current user
    const user = await getUser();

    let customerId: string | undefined;
    let customerEmail: string | undefined;

    if (user) {
      // Get or create Stripe customer
      const db = await getDb();
      const userDoc = await db.collection("users").findOne({ email: user.email });

      if (userDoc?.stripeCustomerId) {
        customerId = userDoc.stripeCustomerId;
      } else {
        // Create Stripe customer
        const customer = await getOrCreateStripeCustomer({
          email: user.email,
          name: user.name || user.email,
          userId: user.userId,
        });

        customerId = customer.id;

        // Save Stripe customer ID to user
        await db.collection("users").updateOne(
          { email: user.email },
          { $set: { stripeCustomerId: customer.id } }
        );
      }
    } else {
      // Guest checkout - will prompt for email in Stripe
      customerEmail = undefined;
    }

    // Create checkout session
    const session = await createCheckoutSession({
      customerId,
      customerEmail,
      priceId,
      successUrl: checkoutConfig.successUrl,
      cancelUrl: checkoutConfig.cancelUrl,
      trialPeriodDays: stripeTrialConfig.trialPeriodDays,
      allowPromotionCodes: checkoutConfig.allowPromotionCodes,
      metadata: {
        planTier,
        billingPeriod,
        userId: user?.userId || "",
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
