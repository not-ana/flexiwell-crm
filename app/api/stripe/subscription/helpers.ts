// Helper functions for subscription routes

import { stripePlanPriceIds, stripeAddOnPriceIds } from "@/lib/stripe/config";
import type { PlanTier } from "@/lib/config/pricing";

// Map Stripe price IDs back to plan tiers
// Now handles regional pricing (USD/BRL)
export function getPlanTierFromPriceId(priceId: string): PlanTier | null {
  for (const [tier, regionalPrices] of Object.entries(stripePlanPriceIds)) {
    // Check USD prices
    if (regionalPrices.USD.monthly === priceId || regionalPrices.USD.annual === priceId) {
      return tier as PlanTier;
    }
    // Check BRL prices
    if (regionalPrices.BRL.monthly === priceId || regionalPrices.BRL.annual === priceId) {
      return tier as PlanTier;
    }
  }
  return null;
}

// Get billing period from price ID
// Now handles regional pricing (USD/BRL)
export function getBillingPeriodFromPriceId(priceId: string): "monthly" | "annual" | null {
  for (const regionalPrices of Object.values(stripePlanPriceIds)) {
    // Check USD prices
    if (regionalPrices.USD.monthly === priceId) return "monthly";
    if (regionalPrices.USD.annual === priceId) return "annual";
    // Check BRL prices
    if (regionalPrices.BRL.monthly === priceId) return "monthly";
    if (regionalPrices.BRL.annual === priceId) return "annual";
  }
  return null;
}

// Get currency from price ID
export function getCurrencyFromPriceId(priceId: string): "USD" | "BRL" | null {
  for (const regionalPrices of Object.values(stripePlanPriceIds)) {
    if (regionalPrices.USD.monthly === priceId || regionalPrices.USD.annual === priceId) {
      return "USD";
    }
    if (regionalPrices.BRL.monthly === priceId || regionalPrices.BRL.annual === priceId) {
      return "BRL";
    }
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
