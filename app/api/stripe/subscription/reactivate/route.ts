// Stripe Subscription Reactivate API Route
// POST /api/stripe/subscription/reactivate - Reactivate a canceled subscription

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  getActiveSubscription,
  reactivateSubscription
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

export async function POST() {
  try {
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

    // Get subscription (could be active but set to cancel)
    const subscription = await getActiveSubscription(userDoc.stripeCustomerId);
    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription to reactivate" },
        { status: 400 }
      );
    }

    // Check if subscription is set to cancel
    if (!subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: "Subscription is not scheduled for cancellation" },
        { status: 400 }
      );
    }

    // Reactivate subscription
    const updatedSubscription = await reactivateSubscription(subscription.id);

    // Update user status
    await db.collection("users").updateOne(
      { email: user.email },
      {
        $set: {
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        },
      }
    );

    // Log reactivation
    await db.collection("subscriptionEvents").insertOne({
      userId: user.userId,
      event: "subscription_reactivated",
      subscriptionId: subscription.id,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Your subscription has been reactivated. You will continue to be charged normally.",
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        currentPeriodEnd: updatedSubscription.items.data[0]?.current_period_end,
      },
    });
  } catch (error) {
    console.error("Reactivate subscription error:", error);
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 500 }
    );
  }
}
