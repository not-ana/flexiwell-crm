// Stripe Server-side utilities
// This file should only be imported in server-side code (API routes, server components)

import Stripe from "stripe";

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && process.env.NODE_ENV === "production") {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(stripeSecretKey || "sk_test_placeholder", {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// Create a Stripe customer
export async function createStripeCustomer(params: {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata || {},
  });
}

// Get or create Stripe customer by email
export async function getOrCreateStripeCustomer(params: {
  email: string;
  name: string;
  userId: string;
}): Promise<Stripe.Customer> {
  // Search for existing customer
  const existingCustomers = await stripe.customers.list({
    email: params.email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  return createStripeCustomer({
    email: params.email,
    name: params.name,
    metadata: {
      userId: params.userId,
    },
  });
}

// Create a checkout session for new subscriptions
export async function createCheckoutSession(params: {
  customerId?: string;
  customerEmail?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
  allowPromotionCodes?: boolean;
}): Promise<Stripe.Checkout.Session> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: params.allowPromotionCodes ?? true,
    billing_address_collection: "auto",
    metadata: params.metadata || {},
  };

  // Add customer or email
  if (params.customerId) {
    sessionParams.customer = params.customerId;
  } else if (params.customerEmail) {
    sessionParams.customer_email = params.customerEmail;
  }

  // Add trial if specified
  if (params.trialPeriodDays) {
    sessionParams.subscription_data = {
      trial_period_days: params.trialPeriodDays,
      metadata: params.metadata || {},
    };
  }

  return stripe.checkout.sessions.create(sessionParams);
}

// Create a checkout session for add-ons (can be one-time or recurring)
export async function createAddOnCheckoutSession(params: {
  customerId: string;
  priceId: string;
  quantity?: number;
  isRecurring: boolean;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    mode: params.isRecurring ? "subscription" : "payment",
    customer: params.customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: params.quantity || 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata || {},
  });
}

// Create a billing portal session
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
}

// Get customer's active subscription
export async function getActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
    expand: ["data.default_payment_method"],
  });

  return subscriptions.data[0] || null;
}

// Get all customer subscriptions (including trialing, past_due)
export async function getCustomerSubscriptions(
  customerId: string
): Promise<Stripe.Subscription[]> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    expand: ["data.default_payment_method", "data.items.data.price.product"],
  });

  return subscriptions.data;
}

// Update subscription (for plan changes)
export async function updateSubscription(params: {
  subscriptionId: string;
  newPriceId: string;
  prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior;
}): Promise<Stripe.Subscription> {
  // Get current subscription to find the item ID
  const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);
  const subscriptionItemId = subscription.items.data[0].id;

  return stripe.subscriptions.update(params.subscriptionId, {
    items: [
      {
        id: subscriptionItemId,
        price: params.newPriceId,
      },
    ],
    proration_behavior: params.prorationBehavior || "create_prorations",
  });
}

// Cancel subscription at period end
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Reactivate a subscription that was set to cancel
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

// Cancel subscription immediately
export async function cancelSubscriptionImmediately(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.cancel(subscriptionId);
}

// Add an item (add-on) to existing subscription
export async function addSubscriptionItem(params: {
  subscriptionId: string;
  priceId: string;
  quantity?: number;
}): Promise<Stripe.SubscriptionItem> {
  return stripe.subscriptionItems.create({
    subscription: params.subscriptionId,
    price: params.priceId,
    quantity: params.quantity || 1,
  });
}

// Remove an item (add-on) from subscription
export async function removeSubscriptionItem(
  subscriptionItemId: string
): Promise<Stripe.DeletedSubscriptionItem> {
  return stripe.subscriptionItems.del(subscriptionItemId, {
    proration_behavior: "create_prorations",
  });
}

// Get upcoming invoice (preview of next charge)
export async function getUpcomingInvoice(
  customerId: string
): Promise<Stripe.Invoice | null> {
  try {
    return await stripe.invoices.createPreview({
      customer: customerId,
    });
  } catch {
    // No upcoming invoice (no active subscription)
    return null;
  }
}

// Get invoice history
export async function getInvoiceHistory(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data;
}

// Preview proration for plan change
export async function previewPlanChange(params: {
  customerId: string;
  subscriptionId: string;
  newPriceId: string;
}): Promise<Stripe.Invoice> {
  const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);
  const subscriptionItemId = subscription.items.data[0].id;

  return stripe.invoices.createPreview({
    customer: params.customerId,
    subscription: params.subscriptionId,
    subscription_details: {
      items: [
        {
          id: subscriptionItemId,
          price: params.newPriceId,
        },
      ],
    },
  });
}

// Construct webhook event from request
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// Get customer by ID
export async function getCustomer(
  customerId: string
): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
  return stripe.customers.retrieve(customerId);
}

// Update customer metadata
export async function updateCustomerMetadata(
  customerId: string,
  metadata: Record<string, string>
): Promise<Stripe.Customer> {
  return stripe.customers.update(customerId, {
    metadata,
  });
}

// Create a price (useful for custom pricing)
export async function createPrice(params: {
  productId: string;
  unitAmount: number; // in cents
  currency: string;
  recurring?: {
    interval: "month" | "year";
    intervalCount?: number;
  };
}): Promise<Stripe.Price> {
  const priceParams: Stripe.PriceCreateParams = {
    product: params.productId,
    unit_amount: params.unitAmount,
    currency: params.currency,
  };

  if (params.recurring) {
    priceParams.recurring = {
      interval: params.recurring.interval,
      interval_count: params.recurring.intervalCount || 1,
    };
  }

  return stripe.prices.create(priceParams);
}

// Get subscription by ID
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method", "items.data.price.product"],
  });
}

// Apply coupon to subscription
export async function applyCoupon(params: {
  subscriptionId: string;
  couponId: string;
}): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(params.subscriptionId, {
    discounts: [{ coupon: params.couponId }],
  });
}

// Get price details
export async function getPrice(priceId: string): Promise<Stripe.Price> {
  return stripe.prices.retrieve(priceId, {
    expand: ["product"],
  });
}
