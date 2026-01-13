// Stripe Configuration for FlexiWell CRM
// Maps pricing plans to Stripe Products/Prices
// Multi-region support: BR (BRL) and US/Global (USD)

import { PlanTier, BillingPeriod, addOns, Region, Currency } from "@/lib/config/pricing";

// Stripe Price IDs - These need to be created in your Stripe Dashboard
// and the IDs pasted here. Format: price_xxx
export interface StripePriceIds {
  monthly: string;
  annual: string;
}

// Regional Stripe Price IDs - different prices for each currency
export interface RegionalStripePriceIds {
  USD: StripePriceIds;
  BRL: StripePriceIds;
}

// Map plan tiers to Stripe Price IDs by currency
// IMPORTANT: Replace these with your actual Stripe Price IDs after creating products
// 4 plans: Starter, Growth, Business, Enterprise
// USD prices and BRL prices are separate products in Stripe
export const stripePlanPriceIds: Record<PlanTier, RegionalStripePriceIds> = {
  starter: {
    USD: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY_USD || "price_starter_monthly_usd",
      annual: process.env.STRIPE_PRICE_STARTER_ANNUAL_USD || "price_starter_annual_usd",
    },
    BRL: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY_BRL || "price_starter_monthly_brl",
      annual: process.env.STRIPE_PRICE_STARTER_ANNUAL_BRL || "price_starter_annual_brl",
    },
  },
  growth: {
    USD: {
      monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY_USD || "price_growth_monthly_usd",
      annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL_USD || "price_growth_annual_usd",
    },
    BRL: {
      monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY_BRL || "price_growth_monthly_brl",
      annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL_BRL || "price_growth_annual_brl",
    },
  },
  business: {
    USD: {
      monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY_USD || "price_business_monthly_usd",
      annual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL_USD || "price_business_annual_usd",
    },
    BRL: {
      monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY_BRL || "price_business_monthly_brl",
      annual: process.env.STRIPE_PRICE_BUSINESS_ANNUAL_BRL || "price_business_annual_brl",
    },
  },
  enterprise: {
    USD: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY_USD || "price_enterprise_monthly_usd",
      annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL_USD || "price_enterprise_annual_usd",
    },
    BRL: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY_BRL || "price_enterprise_monthly_brl",
      annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL_BRL || "price_enterprise_annual_brl",
    },
  },
};

// Map add-ons to Stripe Price IDs
export const stripeAddOnPriceIds: Record<string, string> = {
  extra_whatsapp_msgs: process.env.STRIPE_PRICE_ADDON_WHATSAPP || "price_addon_whatsapp",
  extra_ai_chats: process.env.STRIPE_PRICE_ADDON_AI || "price_addon_ai",
  sms_bundle: process.env.STRIPE_PRICE_ADDON_SMS || "price_addon_sms",
  additional_location: process.env.STRIPE_PRICE_ADDON_LOCATION || "price_addon_location",
  additional_storage: process.env.STRIPE_PRICE_ADDON_STORAGE || "price_addon_storage",
  migration_service: process.env.STRIPE_PRICE_ADDON_MIGRATION || "price_addon_migration",
};

// Helper to get Stripe Price ID for a plan with currency support
export function getStripePriceId(tier: PlanTier, billing: BillingPeriod, currency: Currency = "USD"): string {
  const currencyKey = currency === "BRL" ? "BRL" : "USD";
  return stripePlanPriceIds[tier][currencyKey][billing];
}

// Helper to get Stripe Price ID for a region
export function getStripePriceIdForRegion(tier: PlanTier, billing: BillingPeriod, region: Region): string {
  const currencyMap: Record<Region, "USD" | "BRL"> = {
    BR: "BRL",
    US: "USD",
    EU: "USD", // EU uses USD pricing
    GLOBAL: "USD",
  };
  return stripePlanPriceIds[tier][currencyMap[region]][billing];
}

// Helper to get Stripe Price ID for an add-on
export function getStripeAddOnPriceId(addOnId: string): string | null {
  return stripeAddOnPriceIds[addOnId] || null;
}

// Plan tier ordering for upgrade/downgrade logic
// 4 plans only (professional removed)
export const planTierOrder: PlanTier[] = [
  "starter",
  "growth",
  "business",
  "enterprise",
];

// Check if changing from one plan to another is an upgrade
export function isUpgrade(fromTier: PlanTier, toTier: PlanTier): boolean {
  const fromIndex = planTierOrder.indexOf(fromTier);
  const toIndex = planTierOrder.indexOf(toTier);
  return toIndex > fromIndex;
}

// Check if changing from one plan to another is a downgrade
export function isDowngrade(fromTier: PlanTier, toTier: PlanTier): boolean {
  const fromIndex = planTierOrder.indexOf(fromTier);
  const toIndex = planTierOrder.indexOf(toTier);
  return toIndex < fromIndex;
}

// Trial configuration for Stripe
export const stripeTrialConfig = {
  trialPeriodDays: 30,
  requirePaymentMethod: true, // Requires credit card upfront
};

// Subscription behavior on plan changes
export const subscriptionBehavior = {
  // For upgrades: charge immediately and prorate
  upgrade: {
    prorationBehavior: "create_prorations" as const,
    billingCycleAnchor: "unchanged" as const,
  },
  // For downgrades: apply at end of billing period
  downgrade: {
    prorationBehavior: "none" as const,
    billingCycleAnchor: "unchanged" as const,
  },
};

// Stripe Checkout session configuration
export const checkoutConfig = {
  // URLs for redirect after checkout
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,

  // Payment methods to accept
  paymentMethodTypes: ["card"] as const,

  // Allow promotion codes
  allowPromotionCodes: true,

  // Collect billing address
  billingAddressCollection: "auto" as const,

  // Tax collection (if using Stripe Tax)
  automaticTax: {
    enabled: false, // Enable when you set up Stripe Tax
  },
};

// Customer portal configuration
export const portalConfig = {
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing`,

  // Features available in the portal
  features: {
    subscriptionUpdate: {
      enabled: true,
      defaultAllowedUpdates: ["price", "quantity"] as const,
      prorationBehavior: "create_prorations" as const,
    },
    subscriptionCancel: {
      enabled: true,
      mode: "at_period_end" as const, // Cancel at end of billing period
      cancellationReason: {
        enabled: true,
        options: [
          "too_expensive",
          "missing_features",
          "switched_service",
          "unused",
          "other",
        ] as const,
      },
    },
    paymentMethodUpdate: {
      enabled: true,
    },
    invoiceHistory: {
      enabled: true,
    },
  },
};

// Webhook events to handle
export const webhookEvents = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.trial_will_end",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.upcoming",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
] as const;

export type WebhookEventType = typeof webhookEvents[number];

// Get available add-ons for a plan with their Stripe price IDs
export function getAvailableAddOnsWithStripeIds(tier: PlanTier) {
  return addOns
    .filter(addon => addon.availableOn.includes(tier))
    .map(addon => ({
      ...addon,
      stripePriceId: stripeAddOnPriceIds[addon.id],
    }));
}
