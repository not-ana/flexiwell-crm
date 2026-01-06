// Helper functions for subscription routes

import { stripePlanPriceIds, stripeAddOnPriceIds } from "@/lib/stripe/config";
import type { PlanTier } from "@/lib/config/pricing";

// Map Stripe price IDs back to plan tiers
export function getPlanTierFromPriceId(priceId: string): PlanTier | null {
  for (const [tier, prices] of Object.entries(stripePlanPriceIds)) {
    if (prices.monthly === priceId || prices.annual === priceId) {
      return tier as PlanTier;
    }
  }
  return null;
}

// Get billing period from price ID
export function getBillingPeriodFromPriceId(priceId: string): "monthly" | "annual" | null {
  for (const prices of Object.values(stripePlanPriceIds)) {
    if (prices.monthly === priceId) return "monthly";
    if (prices.annual === priceId) return "annual";
  }
  return null;
}

// Get add-on ID from price ID
export function getAddOnIdFromPriceId(priceId: string): string | null {
  for (const [addOnId, stripePriceId] of Object.entries(stripeAddOnPriceIds)) {
    if (stripePriceId === priceId) {
      return addOnId;
    }
  }
  return null;
}

// Get Stripe price ID for an add-on
export function getStripePriceIdForAddOn(addOnId: string): string | null {
  return stripeAddOnPriceIds[addOnId] || null;
}
