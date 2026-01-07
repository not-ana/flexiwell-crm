// Stripe Webhook Handler
// POST /api/stripe/webhook - Handle Stripe webhook events

import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, stripe } from "@/lib/stripe/server";
import { getDatabase as getDb } from "@/lib/db/mongodb";
import { stripePlanPriceIds, stripeAddOnPriceIds } from "@/lib/stripe/config";
import type { PlanTier } from "@/lib/config/pricing";
import { EmailService } from "@/lib/email";
import Stripe from "stripe";

// Disable body parsing - we need raw body for webhook verification
export const runtime = "nodejs";

// Map Stripe price IDs back to plan tiers
function getPlanTierFromPriceId(priceId: string): PlanTier | null {
  for (const [tier, prices] of Object.entries(stripePlanPriceIds)) {
    if (prices.monthly === priceId || prices.annual === priceId) {
      return tier as PlanTier;
    }
  }
  return null;
}

// Get billing period from price ID
function getBillingPeriodFromPriceId(priceId: string): "monthly" | "annual" | null {
  for (const prices of Object.values(stripePlanPriceIds)) {
    if (prices.monthly === priceId) return "monthly";
    if (prices.annual === priceId) return "annual";
  }
  return null;
}

// Get add-on ID from price ID
function getAddOnIdFromPriceId(priceId: string): string | null {
  for (const [addOnId, stripePriceId] of Object.entries(stripeAddOnPriceIds)) {
    if (stripePriceId === priceId) {
      return addOnId;
    }
  }
  return null;
}

// Handle checkout.session.completed
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const db = await getDb();
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const metadata = session.metadata || {};

  console.log("Checkout completed:", { customerId, subscriptionId, metadata });

  // Find user by Stripe customer ID
  const user = await db.collection("users").findOne({ stripeCustomerId: customerId });

  if (!user) {
    // Try to find by email
    const customerEmail = session.customer_details?.email;
    if (customerEmail) {
      const userByEmail = await db.collection("users").findOne({ email: customerEmail });
      if (userByEmail) {
        // Update user with Stripe customer ID
        await db.collection("users").updateOne(
          { email: customerEmail },
          {
            $set: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              planTier: metadata.planTier || "starter",
              billingPeriod: metadata.billingPeriod || "monthly",
              subscriptionStatus: "active",
              updatedAt: new Date(),
            },
          }
        );
      }
    }
    return;
  }

  // Update user subscription info
  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: {
        stripeSubscriptionId: subscriptionId,
        planTier: metadata.planTier || user.planTier || "starter",
        billingPeriod: metadata.billingPeriod || "monthly",
        subscriptionStatus: "active",
        updatedAt: new Date(),
      },
    }
  );

  // Log subscription event
  await db.collection("subscriptionEvents").insertOne({
    userId: user._id.toString(),
    event: "checkout_completed",
    customerId,
    subscriptionId,
    planTier: metadata.planTier,
    billingPeriod: metadata.billingPeriod,
    timestamp: new Date(),
  });
}

// Handle subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const db = await getDb();
  const customerId = subscription.customer as string;

  // Get price info
  const priceId = subscription.items.data[0]?.price.id;
  const planTier = getPlanTierFromPriceId(priceId);
  const billingPeriod = getBillingPeriodFromPriceId(priceId);

  console.log("Subscription created:", { customerId, planTier, billingPeriod });

  await db.collection("users").updateOne(
    { stripeCustomerId: customerId },
    {
      $set: {
        stripeSubscriptionId: subscription.id,
        planTier: planTier || "starter",
        billingPeriod: billingPeriod || "monthly",
        subscriptionStatus: subscription.status,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
        currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        updatedAt: new Date(),
      },
    }
  );
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const db = await getDb();
  const customerId = subscription.customer as string;

  // Get price info for plan tier
  const priceId = subscription.items.data[0]?.price.id;
  const planTier = getPlanTierFromPriceId(priceId);
  const billingPeriod = getBillingPeriodFromPriceId(priceId);

  // Get add-ons from subscription items
  const addOns: string[] = [];
  for (const item of subscription.items.data) {
    const addOnId = getAddOnIdFromPriceId(item.price.id);
    if (addOnId) {
      addOns.push(addOnId);
    }
  }

  console.log("Subscription updated:", {
    customerId,
    status: subscription.status,
    planTier,
    billingPeriod,
    addOns,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  const updateData: Record<string, unknown> = {
    subscriptionStatus: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
    activeAddOns: addOns,
    updatedAt: new Date(),
  };

  if (planTier) {
    updateData.planTier = planTier;
  }
  if (billingPeriod) {
    updateData.billingPeriod = billingPeriod;
  }

  await db.collection("users").updateOne(
    { stripeCustomerId: customerId },
    { $set: updateData }
  );

  // Log the update
  const user = await db.collection("users").findOne({ stripeCustomerId: customerId });
  if (user) {
    await db.collection("subscriptionEvents").insertOne({
      userId: user._id.toString(),
      event: "subscription_updated",
      customerId,
      subscriptionId: subscription.id,
      status: subscription.status,
      planTier,
      billingPeriod,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      timestamp: new Date(),
    });
  }
}

// Handle subscription deleted (canceled)
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const db = await getDb();
  const customerId = subscription.customer as string;

  console.log("Subscription deleted:", { customerId, subscriptionId: subscription.id });

  await db.collection("users").updateOne(
    { stripeCustomerId: customerId },
    {
      $set: {
        subscriptionStatus: "canceled",
        planTier: null,
        billingPeriod: null,
        canceledAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  // Log cancellation
  const user = await db.collection("users").findOne({ stripeCustomerId: customerId });
  if (user) {
    await db.collection("subscriptionEvents").insertOne({
      userId: user._id.toString(),
      event: "subscription_canceled",
      customerId,
      subscriptionId: subscription.id,
      timestamp: new Date(),
    });
  }
}

// Handle trial ending soon (3 days before)
async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const db = await getDb();
  const customerId = subscription.customer as string;

  const user = await db.collection("users").findOne({ stripeCustomerId: customerId });

  if (user) {
    const trialEndDate = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;

    // Log trial ending event
    await db.collection("subscriptionEvents").insertOne({
      userId: user._id.toString(),
      event: "trial_will_end",
      customerId,
      subscriptionId: subscription.id,
      trialEnd: trialEndDate,
      timestamp: new Date(),
    });

    // Send email notification about trial ending
    if (user.email && trialEndDate) {
      const daysRemaining = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      try {
        await EmailService.sendTrialEndingNotification(user.email, {
          clientName: user.name || "Valued Customer",
          trialEndDate: trialEndDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          daysRemaining,
          planName: user.planTier || "Starter",
          upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://flexiwell.com"}/dashboard/subscription`,
        });
        console.log("Trial ending email sent to:", user.email);
      } catch (emailError) {
        console.error("Failed to send trial ending email:", emailError);
      }
    }
  }
}

// Handle successful invoice payment
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const db = await getDb();
  const customerId = invoice.customer as string;

  console.log("Invoice paid:", {
    customerId,
    amount: invoice.amount_paid,
    invoiceId: invoice.id,
  });

  // Log payment
  const user = await db.collection("users").findOne({ stripeCustomerId: customerId });
  if (user) {
    // Get payment intent ID from payments array (Stripe v20.x structure)
    const paymentIntentId = invoice.payments?.data?.[0]?.payment?.payment_intent;
    const paidAt = new Date((invoice.status_transitions?.paid_at || Date.now() / 1000) * 1000);

    await db.collection("payments").insertOne({
      userId: user._id.toString(),
      type: "subscription",
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: typeof paymentIntentId === "string" ? paymentIntentId : paymentIntentId?.id || null,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      status: "completed",
      paidAt,
      invoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      createdAt: new Date(),
    });

    // Send payment confirmation email
    if (user.email && invoice.amount_paid > 0) {
      try {
        await EmailService.sendPaymentConfirmation(user.email, {
          clientName: user.name || "Valued Customer",
          amount: invoice.amount_paid / 100,
          currency: invoice.currency?.toUpperCase() || "USD",
          planName: user.planTier || "Subscription",
          transactionId: invoice.id,
          date: paidAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        });
        console.log("Payment confirmation email sent to:", user.email);
      } catch (emailError) {
        console.error("Failed to send payment confirmation email:", emailError);
      }
    }
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const db = await getDb();
  const customerId = invoice.customer as string;

  console.log("Invoice payment failed:", {
    customerId,
    amount: invoice.amount_due,
    invoiceId: invoice.id,
  });

  const user = await db.collection("users").findOne({ stripeCustomerId: customerId });
  if (user) {
    await db.collection("subscriptionEvents").insertOne({
      userId: user._id.toString(),
      event: "payment_failed",
      customerId,
      invoiceId: invoice.id,
      amount: invoice.amount_due / 100,
      timestamp: new Date(),
    });

    // Send email notification about payment failure
    if (user.email) {
      try {
        await EmailService.sendPaymentFailedNotification(user.email, {
          clientName: user.name || "Valued Customer",
          amount: invoice.amount_due / 100,
          currency: invoice.currency?.toUpperCase() || "USD",
          failureReason: "Please update your payment method",
          updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://flexiwell.com"}/dashboard/subscription`,
        });
        console.log("Payment failed email sent to:", user.email);
      } catch (emailError) {
        console.error("Failed to send payment failed email:", emailError);
      }
    }
  }
}

// Handle upcoming invoice (sent ~1 hour before renewal)
async function handleInvoiceUpcoming(invoice: Stripe.Invoice) {
  const db = await getDb();
  const customerId = invoice.customer as string;

  const user = await db.collection("users").findOne({ stripeCustomerId: customerId });
  if (user) {
    await db.collection("subscriptionEvents").insertOne({
      userId: user._id.toString(),
      event: "invoice_upcoming",
      customerId,
      amount: invoice.amount_due / 100,
      timestamp: new Date(),
    });

    // Send email about upcoming charge
    if (user.email) {
      const chargeDate = invoice.due_date
        ? new Date(invoice.due_date * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "within 24 hours";

      try {
        await EmailService.sendUpcomingInvoiceNotification(user.email, {
          clientName: user.name || "Valued Customer",
          amount: invoice.amount_due / 100,
          currency: invoice.currency?.toUpperCase() || "USD",
          chargeDate,
          planName: user.planTier || "Subscription",
        });
        console.log("Upcoming invoice email sent to:", user.email);
      } catch (emailError) {
        console.error("Failed to send upcoming invoice email:", emailError);
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify and construct event
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    console.log("Received Stripe webhook:", event.type);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "invoice.upcoming":
        await handleInvoiceUpcoming(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
