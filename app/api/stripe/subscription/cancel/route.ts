// Stripe Subscription Cancel API Route
// POST /api/stripe/subscription/cancel - Cancel subscription

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  getActiveSubscription,
  cancelSubscriptionAtPeriodEnd,
  cancelSubscriptionImmediately
} from "@/lib/stripe/server";
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
    const { immediately = false, reason } = body as {
      immediately?: boolean;
      reason?: string;
    };

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
        { error: "No active subscription to cancel" },
        { status: 400 }
      );
    }

    let updatedSubscription;
    let message: string;

    if (immediately) {
      // Cancel immediately
      updatedSubscription = await cancelSubscriptionImmediately(subscription.id);
      message = "Your subscription has been canceled immediately. You no longer have access to paid features.";

      // Update user status
      await db.collection("users").updateOne(
        { email: user.email },
        {
          $set: {
            subscriptionStatus: "canceled",
            canceledAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    } else {
      // Cancel at period end
      updatedSubscription = await cancelSubscriptionAtPeriodEnd(subscription.id);
      const periodEndDate = new Date(subscription.items.data[0].current_period_end * 1000);
      message = `Your subscription will be canceled at the end of your billing period on ${periodEndDate.toLocaleDateString()}. You'll continue to have access until then.`;

      // Update user status
      await db.collection("users").updateOne(
        { email: user.email },
        {
          $set: {
            cancelAtPeriodEnd: true,
            updatedAt: new Date(),
          },
        }
      );
    }

    // Log cancellation
    await db.collection("subscriptionEvents").insertOne({
      userId: user.userId,
      event: immediately ? "subscription_canceled_immediately" : "subscription_scheduled_cancel",
      subscriptionId: subscription.id,
      reason: reason || "Not provided",
      cancelAt: immediately ? new Date() : new Date(subscription.items.data[0].current_period_end * 1000),
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        cancelAt: updatedSubscription.cancel_at,
        currentPeriodEnd: updatedSubscription.items.data[0]?.current_period_end,
      },
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
