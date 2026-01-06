// Stripe Subscription Add-ons API Route
// POST /api/stripe/subscription/addons - Add an add-on to subscription
// DELETE /api/stripe/subscription/addons - Remove an add-on from subscription

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  getActiveSubscription,
  addSubscriptionItem,
  removeSubscriptionItem
} from "@/lib/stripe/server";
import { stripeAddOnPriceIds } from "@/lib/stripe/config";
import { addOns } from "@/lib/config/pricing";
import { getDb } from "@/lib/db/mongodb";
import { getAddOnIdFromPriceId } from "../helpers";

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

// Add an add-on to subscription
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

    // Only recurring add-ons can be added to subscription
    if (addOn.billingPeriod === "one-time") {
      return NextResponse.json(
        { error: "One-time add-ons cannot be added to subscription. Use checkout instead." },
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

    // Check if user's plan allows this add-on
    const userPlan = userDoc.planTier;
    if (!addOn.availableOn.includes(userPlan)) {
      return NextResponse.json(
        { error: `This add-on is not available on your current plan (${userPlan})` },
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

    // Check if add-on already exists
    const existingItem = subscription.items.data.find(item => {
      const itemAddOnId = getAddOnIdFromPriceId(item.price.id);
      return itemAddOnId === addOnId;
    });

    if (existingItem) {
      return NextResponse.json(
        { error: "This add-on is already in your subscription" },
        { status: 400 }
      );
    }

    // Get Stripe price ID for add-on
    const priceId = stripeAddOnPriceIds[addOnId];
    if (!priceId) {
      return NextResponse.json(
        { error: "Add-on not configured in Stripe" },
        { status: 500 }
      );
    }

    // Add add-on to subscription
    const newItem = await addSubscriptionItem({
      subscriptionId: subscription.id,
      priceId,
      quantity,
    });

    // Update user's active add-ons
    await db.collection("users").updateOne(
      { email: user.email },
      {
        $addToSet: { activeAddOns: addOnId },
        $set: { updatedAt: new Date() },
      }
    );

    // Log the addition
    await db.collection("subscriptionEvents").insertOne({
      userId: user.userId,
      event: "addon_added",
      addOnId,
      quantity,
      subscriptionId: subscription.id,
      itemId: newItem.id,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ${addOn.name} to your subscription.`,
      item: {
        id: newItem.id,
        addOnId,
        quantity: newItem.quantity,
      },
    });
  } catch (error) {
    console.error("Add add-on error:", error);
    return NextResponse.json(
      { error: "Failed to add add-on" },
      { status: 500 }
    );
  }
}

// Remove an add-on from subscription
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { addOnId } = body as { addOnId: string };

    // Validate inputs
    if (!addOnId) {
      return NextResponse.json(
        { error: "Missing addOnId" },
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

    // Find the add-on item in subscription
    const itemToRemove = subscription.items.data.find(item => {
      const itemAddOnId = getAddOnIdFromPriceId(item.price.id);
      return itemAddOnId === addOnId;
    });

    if (!itemToRemove) {
      return NextResponse.json(
        { error: "This add-on is not in your subscription" },
        { status: 400 }
      );
    }

    // Remove add-on from subscription
    await removeSubscriptionItem(itemToRemove.id);

    // Update user's active add-ons
    await db.collection("users").updateOne(
      { email: user.email },
      {
        $pull: { activeAddOns: addOnId },
        $set: { updatedAt: new Date() },
      }
    );

    // Get add-on name for message
    const addOn = addOns.find(a => a.id === addOnId);
    const addOnName = addOn?.name || addOnId;

    // Log the removal
    await db.collection("subscriptionEvents").insertOne({
      userId: user.userId,
      event: "addon_removed",
      addOnId,
      subscriptionId: subscription.id,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${addOnName} from your subscription. You'll receive a prorated credit.`,
    });
  } catch (error) {
    console.error("Remove add-on error:", error);
    return NextResponse.json(
      { error: "Failed to remove add-on" },
      { status: 500 }
    );
  }
}
