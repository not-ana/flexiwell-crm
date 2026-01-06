// FlexiWell Pricing Configuration
// US Market Pricing in USD
// Updated January 2026

export type PlanTier = "starter" | "growth" | "business" | "professional" | "enterprise";
export type BillingPeriod = "monthly" | "annual";
export type Currency = "USD" | "BRL" | "EUR" | "GBP";

export interface PricingPlan {
  id: PlanTier;
  name: string;
  description: string;
  tagline: string;
  pricing: {
    monthly: number;
    annual: number; // per month when billed annually
    annualTotal: number;
    currency: Currency;
    customPricing?: boolean; // For enterprise - contact sales
  };
  limits: {
    clients: number | "unlimited";
    teamMembers: number | "unlimited";
    locations: number | "unlimited";
    storage: string; // e.g., "5GB", "10GB"
  };
  features: PlanFeature[];
  highlighted?: boolean;
  badge?: string;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string | number;
  tooltip?: string;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: BillingPeriod | "one-time";
  availableOn: PlanTier[];
}

// Core pricing plans for US market
export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For solo instructors getting started.",
    tagline: "For solo instructors",
    pricing: {
      monthly: 49,
      annual: 39,
      annualTotal: 468,
      currency: "USD",
    },
    limits: {
      clients: 100,
      teamMembers: 1,
      locations: 1,
      storage: "5GB",
    },
    features: [
      // Core features
      { name: "Online scheduling", included: true },
      { name: "Client portal", included: true },
      { name: "Payment processing", included: true, tooltip: "2.9% + $0.30 per transaction" },
      { name: "Email reminders", included: true },
      { name: "Calendar sync", included: true },
      // Communication
      { name: "SMS notifications", included: false },
      { name: "WhatsApp notifications", included: false },
      { name: "WhatsApp Bot", included: false },
      { name: "Instagram Bot", included: false },
      // AI features
      { name: "AI Support Assistant", included: false },
      { name: "Smart Waitlist", included: false },
      { name: "Cancellation predictions", included: false },
      // Reports
      { name: "Basic reports", included: true },
      { name: "Advanced reports", included: false },
      { name: "Custom dashboards", included: false },
      { name: "Data export", included: true },
      // Support
      { name: "Email support", included: true },
      { name: "Chat support", included: false },
      { name: "Priority support", included: false },
      { name: "Dedicated account manager", included: false },
      { name: "24/7 phone support", included: false },
      // Advanced
      { name: "API access", included: false },
      { name: "White-label branding", included: false },
      { name: "Custom integrations", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing studios with multiple staff.",
    tagline: "For growing studios",
    pricing: {
      monthly: 99,
      annual: 79,
      annualTotal: 948,
      currency: "USD",
    },
    limits: {
      clients: 500,
      teamMembers: 5,
      locations: 2,
      storage: "10GB",
    },
    features: [
      // Core features
      { name: "Online scheduling", included: true },
      { name: "Client portal", included: true },
      { name: "Payment processing", included: true, tooltip: "2.5% + $0.25 per transaction" },
      { name: "Email reminders", included: true },
      { name: "Calendar sync", included: true },
      // Communication
      { name: "SMS notifications", included: true },
      { name: "WhatsApp notifications", included: true },
      { name: "WhatsApp Bot", included: false },
      { name: "Instagram Bot", included: false },
      // AI features
      { name: "AI Support Assistant", included: false },
      { name: "Smart Waitlist", included: false },
      { name: "Cancellation predictions", included: false },
      // Reports
      { name: "Basic reports", included: true },
      { name: "Advanced reports", included: true },
      { name: "Custom dashboards", included: false },
      { name: "Data export", included: true },
      // Support
      { name: "Email support", included: true },
      { name: "Chat support", included: true },
      { name: "Priority support", included: false },
      { name: "Dedicated account manager", included: false },
      { name: "24/7 phone support", included: false },
      // Advanced
      { name: "API access", included: false },
      { name: "White-label branding", included: false },
      { name: "Custom integrations", included: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "For established studios with AI features.",
    tagline: "AI-powered",
    pricing: {
      monthly: 179,
      annual: 149,
      annualTotal: 1788,
      currency: "USD",
    },
    limits: {
      clients: 500,
      teamMembers: 3,
      locations: 2,
      storage: "50GB",
    },
    highlighted: true,
    badge: "Most popular",
    features: [
      // Core features
      { name: "Online scheduling", included: true },
      { name: "Client portal", included: true },
      { name: "Payment processing", included: true, tooltip: "2.2% + $0.20 per transaction" },
      { name: "Email reminders", included: true },
      { name: "Calendar sync", included: true },
      // Communication
      { name: "SMS notifications", included: true },
      { name: "WhatsApp notifications", included: true },
      { name: "WhatsApp Bot", included: true, limit: "1,000 msgs/mo" },
      { name: "Instagram Bot", included: false },
      // AI features
      { name: "AI Support Assistant", included: true, limit: "500 chats/mo" },
      { name: "Smart Waitlist", included: true, tooltip: "Priority tiers" },
      { name: "Cancellation predictions", included: true },
      // Reports
      { name: "Basic reports", included: true },
      { name: "Advanced reports", included: true },
      { name: "Custom dashboards", included: false },
      { name: "Data export", included: true },
      // Support
      { name: "Email support", included: true },
      { name: "Chat support", included: true },
      { name: "Priority support", included: false },
      { name: "Dedicated account manager", included: false },
      { name: "24/7 phone support", included: false },
      // Advanced
      { name: "API access", included: false },
      { name: "White-label branding", included: false },
      { name: "Custom integrations", included: false },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "For multi-location studios.",
    tagline: "Multi-location",
    pricing: {
      monthly: 199,
      annual: 159,
      annualTotal: 1908,
      currency: "USD",
    },
    limits: {
      clients: 2000,
      teamMembers: 10,
      locations: 5,
      storage: "200GB",
    },
    features: [
      // Core features
      { name: "Online scheduling", included: true },
      { name: "Client portal", included: true },
      { name: "Payment processing", included: true, tooltip: "1.9% + $0.15 per transaction" },
      { name: "Email reminders", included: true },
      { name: "Calendar sync", included: true },
      // Communication
      { name: "SMS notifications", included: true },
      { name: "WhatsApp notifications", included: true },
      { name: "WhatsApp Bot", included: true, limit: "5,000 msgs/mo" },
      { name: "Instagram Bot", included: true },
      // AI features
      { name: "AI Support Assistant", included: true, limit: "2,000 chats/mo" },
      { name: "Smart Waitlist", included: true, tooltip: "Priority tiers" },
      { name: "Cancellation predictions", included: true },
      // Reports
      { name: "Basic reports", included: true },
      { name: "Advanced reports", included: true },
      { name: "Custom dashboards", included: true },
      { name: "Data export", included: true },
      // Support
      { name: "Email support", included: true },
      { name: "Chat support", included: true },
      { name: "Priority support", included: true },
      { name: "Dedicated account manager", included: false },
      { name: "24/7 phone support", included: false },
      // Advanced
      { name: "API access", included: true },
      { name: "White-label branding", included: true },
      { name: "Custom integrations", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For studio networks.",
    tagline: "Custom Pricing",
    pricing: {
      monthly: 0, // Custom pricing - contact sales
      annual: 0,
      annualTotal: 0,
      currency: "USD",
      customPricing: true,
    },
    limits: {
      clients: "unlimited",
      teamMembers: "unlimited",
      locations: "unlimited",
      storage: "500GB",
    },
    features: [
      // Core features
      { name: "Online scheduling", included: true },
      { name: "Client portal", included: true },
      { name: "Payment processing", included: true, tooltip: "1.9% + $0.15 per transaction" },
      { name: "Email reminders", included: true },
      { name: "Calendar sync", included: true },
      // Communication
      { name: "SMS notifications", included: true },
      { name: "WhatsApp notifications", included: true },
      { name: "WhatsApp Bot", included: true, limit: "Unlimited" },
      { name: "Instagram Bot", included: true },
      // AI features
      { name: "AI Support Assistant", included: true, limit: "Unlimited" },
      { name: "Smart Waitlist", included: true, tooltip: "Priority tiers" },
      { name: "Cancellation predictions", included: true },
      // Reports
      { name: "Basic reports", included: true },
      { name: "Advanced reports", included: true },
      { name: "Custom dashboards", included: true },
      { name: "Data export", included: true },
      // Support
      { name: "Email support", included: true },
      { name: "Chat support", included: true },
      { name: "Priority support", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "24/7 phone support", included: true },
      // Advanced
      { name: "API access", included: true },
      { name: "White-label branding", included: true },
      { name: "Custom integrations", included: true },
    ],
  },
];

// Add-ons available for purchase
export const addOns: AddOn[] = [
  {
    id: "extra_whatsapp_msgs",
    name: "Extra WhatsApp Messages",
    description: "Additional 1,000 WhatsApp Bot messages per month",
    price: 19,
    billingPeriod: "monthly",
    availableOn: ["business", "professional"],
  },
  {
    id: "extra_ai_chats",
    name: "Extra AI Chats",
    description: "Additional 500 AI Support chats per month",
    price: 29,
    billingPeriod: "monthly",
    availableOn: ["business", "professional"],
  },
  {
    id: "sms_bundle",
    name: "SMS Bundle (1000)",
    description: "1000 SMS credits for notifications and reminders",
    price: 25,
    billingPeriod: "monthly",
    availableOn: ["starter", "growth", "business", "professional", "enterprise"],
  },
  {
    id: "additional_location",
    name: "Additional Location",
    description: "Add one more location to your account",
    price: 49,
    billingPeriod: "monthly",
    availableOn: ["growth", "business", "professional"],
  },
  {
    id: "additional_storage",
    name: "Additional Storage (50GB)",
    description: "Add 50GB of storage to your account",
    price: 15,
    billingPeriod: "monthly",
    availableOn: ["starter", "growth", "business", "professional"],
  },
  {
    id: "migration_service",
    name: "White Glove Migration",
    description: "Full-service data migration from your current platform",
    price: 299,
    billingPeriod: "one-time",
    availableOn: ["starter", "growth", "business", "professional", "enterprise"],
  },
];

// Transaction fees by plan
export const transactionFees: Record<PlanTier, { percentage: number; fixed: number }> = {
  starter: { percentage: 2.9, fixed: 0.30 },
  growth: { percentage: 2.5, fixed: 0.25 },
  business: { percentage: 2.2, fixed: 0.20 },
  professional: { percentage: 1.9, fixed: 0.15 },
  enterprise: { percentage: 1.9, fixed: 0.15 },
};

// Feature availability matrix for quick lookups
export const featureMatrix: Record<string, Record<PlanTier, boolean | string | number>> = {
  // Limits
  active_clients: { starter: 100, growth: 500, business: 500, professional: 2000, enterprise: "unlimited" },
  team_members: { starter: 1, growth: 5, business: 3, professional: 10, enterprise: "unlimited" },
  locations: { starter: 1, growth: 2, business: 2, professional: 5, enterprise: "unlimited" },
  storage: { starter: "5GB", growth: "10GB", business: "50GB", professional: "200GB", enterprise: "500GB" },

  // Core features
  online_scheduling: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  client_portal: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  payment_processing: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  email_reminders: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  calendar_sync: { starter: true, growth: true, business: true, professional: true, enterprise: true },

  // Communication
  sms_notifications: { starter: false, growth: true, business: true, professional: true, enterprise: true },
  whatsapp_notifications: { starter: false, growth: true, business: true, professional: true, enterprise: true },
  whatsapp_bot: { starter: false, growth: false, business: "1,000 msgs/mo", professional: "5,000 msgs/mo", enterprise: "unlimited" },
  instagram_bot: { starter: false, growth: false, business: false, professional: true, enterprise: true },

  // AI features
  ai_support_assistant: { starter: false, growth: false, business: "500 chats/mo", professional: "2,000 chats/mo", enterprise: "unlimited" },
  smart_waitlist: { starter: false, growth: false, business: true, professional: true, enterprise: true },
  cancellation_predictions: { starter: false, growth: false, business: true, professional: true, enterprise: true },

  // Reports & analytics
  basic_reports: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  advanced_reports: { starter: false, growth: true, business: true, professional: true, enterprise: true },
  custom_dashboards: { starter: false, growth: false, business: false, professional: true, enterprise: true },
  data_export: { starter: true, growth: true, business: true, professional: true, enterprise: true },

  // Support
  email_support: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  chat_support: { starter: false, growth: true, business: true, professional: true, enterprise: true },
  priority_support: { starter: false, growth: false, business: false, professional: true, enterprise: true },
  dedicated_manager: { starter: false, growth: false, business: false, professional: false, enterprise: true },
  phone_support_24_7: { starter: false, growth: false, business: false, professional: false, enterprise: true },

  // Advanced features
  api_access: { starter: false, growth: false, business: false, professional: true, enterprise: true },
  white_label: { starter: false, growth: false, business: false, professional: true, enterprise: true },
  custom_integrations: { starter: false, growth: false, business: false, professional: false, enterprise: true },
};

// Helper functions
export function getPlanByTier(tier: PlanTier): PricingPlan {
  return pricingPlans.find(p => p.id === tier)!;
}

export function calculateAnnualSavings(plan: PricingPlan): number {
  return (plan.pricing.monthly * 12) - plan.pricing.annualTotal;
}

export function calculateAnnualSavingsPercentage(plan: PricingPlan): number {
  const monthlyTotal = plan.pricing.monthly * 12;
  const savings = monthlyTotal - plan.pricing.annualTotal;
  return Math.round((savings / monthlyTotal) * 100);
}

export function getTransactionFee(tier: PlanTier, amount: number): number {
  const fees = transactionFees[tier];
  return (amount * fees.percentage / 100) + fees.fixed;
}

export function getAvailableAddOns(tier: PlanTier): AddOn[] {
  return addOns.filter(addon => addon.availableOn.includes(tier));
}

export function isFeatureAvailable(feature: string, tier: PlanTier): boolean | string | number {
  return featureMatrix[feature]?.[tier] ?? false;
}

// Pricing display helpers
export function formatPrice(price: number, currency: Currency = "USD"): string {
  const symbols: Record<Currency, string> = {
    USD: "$",
    BRL: "R$",
    EUR: "€",
    GBP: "£",
  };
  return `${symbols[currency]}${price}`;
}

export function getPlanRecommendation(
  clientCount: number,
  teamMemberCount: number,
  locationCount: number,
  needsAI: boolean,
  needsWhatsAppBot: boolean
): PlanTier {
  // Enterprise for large scale
  if (
    clientCount > 2000 ||
    teamMemberCount > 10 ||
    locationCount > 5
  ) {
    return "enterprise";
  }

  // Professional for multi-location or high volume
  if (
    clientCount > 500 ||
    teamMemberCount > 5 ||
    locationCount > 2 ||
    needsWhatsAppBot
  ) {
    return "professional";
  }

  // Business for AI features
  if (needsAI) {
    return "business";
  }

  // Growth for multiple staff
  if (
    clientCount > 100 ||
    teamMemberCount > 1 ||
    locationCount > 1
  ) {
    return "growth";
  }

  return "starter";
}

// Free trial configuration
export const trialConfig = {
  durationDays: 30,
  requiresCreditCard: true,
  features: "full", // Full access to selected plan features during trial
};

// Competitor comparison data
export interface CompetitorPricing {
  name: string;
  starterEquivalent: number;
  midTierEquivalent: number;
  notes: string;
}

export const competitorPricing: CompetitorPricing[] = [
  { name: "Mindbody", starterEquivalent: 129, midTierEquivalent: 249, notes: "Essential plan starts at $129/mo" },
  { name: "Glofox", starterEquivalent: 110, midTierEquivalent: 250, notes: "Custom pricing, typically higher" },
  { name: "Momence", starterEquivalent: 99, midTierEquivalent: 199, notes: "Similar pricing structure" },
  { name: "Mariana Tek", starterEquivalent: 150, midTierEquivalent: 350, notes: "Premium pricing for boutique" },
  { name: "Zen Planner", starterEquivalent: 117, midTierEquivalent: 227, notes: "Based on member count" },
];
