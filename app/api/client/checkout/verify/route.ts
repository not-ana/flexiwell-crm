// Verify Stripe Checkout Session
// GET /api/client/checkout/verify?session_id=xxx

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { notificationService } from "@/lib/services/notification.service";
import type { Client } from "@/lib/db/schemas";

// Plan configuration
const PLAN_CONFIGS: Record<string, { classes: number; durationDays: number; type: Client["plan"]["type"] }> = {
  "drop-in": { classes: 1, durationDays: 30, type: "drop-in" },
  "pack-4": { classes: 4, durationDays: 30, type: "monthly" },
  monthly: { classes: 8, durationDays: 30, type: "monthly" },
  quarterly: { classes: 24, durationDays: 90, type: "quarterly" },
  annual: { classes: 96, durationDays: 365, type: "annual" },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      // Demo mode - just return success
      return NextResponse.json({
        success: true,
        planName: "Demo Plan",
        classes: 8,
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    });

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Check if we've already processed this session
    const db = await getDatabase();
    const existingPurchase = await db.collection("purchases").findOne({
      stripeSessionId: sessionId,
      status: "completed",
    });

    if (existingPurchase) {
      // Already processed, just return the details
      return NextResponse.json({
        success: true,
        planName: existingPurchase.planName,
        classes: existingPurchase.classes,
        alreadyProcessed: true,
      });
    }

    // Extract metadata
    const metadata = session.metadata || {};
    const { userId, planId, planName, classes, price, duration } = metadata;

    if (!userId || !planId) {
      return NextResponse.json(
        { error: "Invalid session metadata" },
        { status: 400 }
      );
    }

    // Get plan configuration
    const planConfig = PLAN_CONFIGS[planId] || {
      classes: parseInt(classes) || 8,
      durationDays: 30,
      type: "monthly" as const,
    };

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + planConfig.durationDays);

    // Get client by userId or email
    const customerEmail = session.customer_details?.email || "";
    const client = await db.collection<Client>("clients").findOne({
      $or: [
        { _id: new ObjectId(userId) },
        ...(customerEmail ? [{ email: customerEmail }] : []),
      ],
    });

    if (client) {
      // Update existing client's plan
      const newRemainingClasses = (client.plan?.remainingClasses || 0) + planConfig.classes;

      await db.collection<Client>("clients").updateOne(
        { _id: client._id },
        {
          $set: {
            "plan.type": planConfig.type,
            "plan.totalClasses": planConfig.classes,
            "plan.remainingClasses": newRemainingClasses,
            "plan.startDate": now,
            "plan.endDate": endDate,
            "plan.price": parseFloat(price) || 0,
            status: "active",
            updatedAt: now,
            // Reset expiry notifications
            planExpiryNotified_7d: false,
            planExpiryNotified_3d: false,
            planExpiryNotified_1d: false,
            planExpiredNotified: false,
          },
        }
      );

      // Send payment confirmation notification
      await notificationService.sendPaymentConfirmation(
        client._id!.toString(),
        planName || `Plano ${planId}`,
        `R$${price}`,
        "Cartão de crédito",
        planConfig.classes
      );
    } else {
      // Create new client with plan
      const newClient: Omit<Client, "_id"> = {
        name: session.customer_details?.name || session.customer_details?.email?.split("@")[0] || "Cliente",
        email: session.customer_details?.email || "",
        phone: session.customer_details?.phone || "",
        plan: {
          type: planConfig.type,
          totalClasses: planConfig.classes,
          usedClasses: 0,
          remainingClasses: planConfig.classes,
          startDate: now,
          endDate: endDate,
          price: parseFloat(price) || 0,
        },
        status: "active",
        preferences: {
          notifications: {
            email: true,
            whatsapp: true,
            instagram: false,
            sms: false,
          },
        },
        createdAt: now,
        updatedAt: now,
      };

      const result = await db.collection<Client>("clients").insertOne(newClient);

      // Send welcome notification
      const createdClient = { ...newClient, _id: result.insertedId };
      await notificationService.sendWelcome(
        createdClient as Client,
        planName || `Plano ${planId}`,
        planConfig.classes
      );
    }

    // Log the purchase
    await db.collection("purchases").insertOne({
      stripeSessionId: sessionId,
      stripePaymentIntentId: session.payment_intent,
      clientId: client?._id?.toString() || userId,
      clientEmail: session.customer_details?.email,
      planId,
      planName,
      classes: planConfig.classes,
      price: parseFloat(price) || 0,
      duration,
      status: "completed",
      paymentMethod: "stripe",
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      planName: planName || `Plano ${planId}`,
      classes: planConfig.classes,
    });
  } catch (error) {
    console.error("Verify checkout error:", error);
    return NextResponse.json(
      { error: "Failed to verify checkout session" },
      { status: 500 }
    );
  }
}
