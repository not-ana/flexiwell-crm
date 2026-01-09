// Client Plan Checkout API
// POST /api/client/checkout - Create a checkout session for client plan purchase

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import type { Client } from "@/lib/db/schemas";

// Plan configuration
const PLAN_CONFIGS: Record<string, { classes: number; durationDays: number }> = {
  "drop-in": { classes: 1, durationDays: 30 },
  "pack-4": { classes: 4, durationDays: 30 },
  monthly: { classes: 8, durationDays: 30 },
  quarterly: { classes: 24, durationDays: 90 },
  annual: { classes: 96, durationDays: 365 },
};

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { planId, planName, classes, price, duration } = body;

    if (!planId || !price) {
      return NextResponse.json(
        { error: "planId and price are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get or create client record
    let client = await db.collection<Client>("clients").findOne({
      $or: [
        { _id: new ObjectId(user.userId) },
        { email: user.email },
      ],
    });

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      // Demo mode - directly update client plan without payment
      const planConfig = PLAN_CONFIGS[planId] || { classes, durationDays: 30 };
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + planConfig.durationDays);

      if (client) {
        // Update existing client's plan
        const newRemainingClasses = (client.plan?.remainingClasses || 0) + planConfig.classes;

        await db.collection<Client>("clients").updateOne(
          { _id: client._id },
          {
            $set: {
              "plan.type": planId === "drop-in" ? "drop-in" :
                           planId === "pack-4" ? "monthly" :
                           planId === "monthly" ? "monthly" :
                           planId === "quarterly" ? "quarterly" : "annual",
              "plan.totalClasses": planConfig.classes,
              "plan.remainingClasses": newRemainingClasses,
              "plan.startDate": now,
              "plan.endDate": endDate,
              "plan.price": price,
              status: "active",
              updatedAt: now,
            },
          }
        );
      } else {
        // Create new client with plan
        const newClient: Omit<Client, "_id"> = {
          name: user.email.split("@")[0],
          email: user.email,
          phone: "",
          plan: {
            type: planId === "drop-in" ? "drop-in" :
                  planId === "pack-4" ? "monthly" :
                  planId === "monthly" ? "monthly" :
                  planId === "quarterly" ? "quarterly" : "annual",
            totalClasses: planConfig.classes,
            usedClasses: 0,
            remainingClasses: planConfig.classes,
            startDate: now,
            endDate: endDate,
            price: price,
          },
          status: "active",
          preferences: {
            notifications: {
              email: true,
              whatsapp: true,
              instagram: false,
            },
          },
          createdAt: now,
          updatedAt: now,
        };

        await db.collection<Client>("clients").insertOne(newClient);
      }

      // Log the purchase
      await db.collection("purchases").insertOne({
        clientId: client?._id?.toString() || user.userId,
        clientEmail: user.email,
        planId,
        planName,
        classes,
        price,
        duration,
        status: "completed",
        paymentMethod: "demo",
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        message: "Plano adquirido com sucesso!",
        redirectUrl: "/dashboard",
      });
    }

    // Production mode with Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    });

    // Get or create Stripe customer
    let customerId: string | undefined;
    const userDoc = await db.collection("users").findOne({ email: user.email });

    if (userDoc?.stripeCustomerId) {
      customerId = userDoc.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.userId,
        },
      });
      customerId = customer.id;

      // Save Stripe customer ID
      await db.collection("users").updateOne(
        { email: user.email },
        { $set: { stripeCustomerId: customer.id } }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: planName || `Plano ${planId}`,
              description: `${classes} aulas - Validade: ${duration}`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/plans/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/plans`,
      metadata: {
        userId: user.userId,
        planId,
        planName,
        classes: String(classes),
        price: String(price),
        duration,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Client checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
