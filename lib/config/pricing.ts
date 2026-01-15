// FlexiWell Pricing Configuration
// Multi-region support: BR (BRL) and US/Global (USD)
// Focus: Support + Smart Waitlist + Bot (WhatsApp BR / SMS+WhatsApp US)
// Updated January 2026

export type PlanTier = "starter" | "growth" | "business" | "enterprise";
export type BillingPeriod = "monthly" | "annual";
export type Currency = "USD" | "BRL" | "EUR" | "GBP";
export type Region = "BR" | "US" | "EU" | "GLOBAL";
export type SupportedLocale = "pt-BR" | "en-US" | "en-GB" | "es-ES";

// Region configuration - messaging channel defaults
export interface RegionConfig {
  currency: Currency;
  locale: SupportedLocale;
  defaultMessagingChannels: ("whatsapp" | "sms")[];
  dateFormat: string;
  currencySymbol: string;
  currencyPosition: "before" | "after";
}

export const regionConfigs: Record<Region, RegionConfig> = {
  BR: {
    currency: "BRL",
    locale: "pt-BR",
    defaultMessagingChannels: ["whatsapp"], // Brazil: WhatsApp only
    dateFormat: "dd/MM/yyyy",
    currencySymbol: "R$",
    currencyPosition: "before",
  },
  US: {
    currency: "USD",
    locale: "en-US",
    defaultMessagingChannels: ["whatsapp", "sms"], // US: choice between WhatsApp and SMS
    dateFormat: "MM/dd/yyyy",
    currencySymbol: "$",
    currencyPosition: "before",
  },
  EU: {
    currency: "EUR",
    locale: "en-GB",
    defaultMessagingChannels: ["whatsapp", "sms"],
    dateFormat: "dd/MM/yyyy",
    currencySymbol: "€",
    currencyPosition: "before",
  },
  GLOBAL: {
    currency: "USD",
    locale: "en-US",
    defaultMessagingChannels: ["whatsapp", "sms"],
    dateFormat: "dd/MM/yyyy",
    currencySymbol: "$",
    currencyPosition: "before",
  },
};

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

// Multi-currency pricing by region
// USD is base currency, BRL uses fixed conversion
export interface RegionalPricing {
  USD: { monthly: number; annual: number; annualTotal: number };
  BRL: { monthly: number; annual: number; annualTotal: number };
}

export const regionalPricing: Record<PlanTier, RegionalPricing> = {
  starter: {
    USD: { monthly: 99, annual: 79, annualTotal: 948 },
    BRL: { monthly: 349, annual: 279, annualTotal: 3348 },
  },
  growth: {
    USD: { monthly: 179, annual: 143, annualTotal: 1716 },
    BRL: { monthly: 629, annual: 499, annualTotal: 5988 },
  },
  business: {
    USD: { monthly: 299, annual: 239, annualTotal: 2868 },
    BRL: { monthly: 1049, annual: 839, annualTotal: 10068 },
  },
  enterprise: {
    USD: { monthly: 499, annual: 399, annualTotal: 4788 },
    BRL: { monthly: 1749, annual: 1399, annualTotal: 16788 },
  },
};

// Core pricing plans - Default in USD
// Focus: Support + Smart Waitlist + Messaging Bot (WhatsApp BR / SMS+WhatsApp US)
// 4 tiers: Starter, Growth, Business, Enterprise
// Team members are UNLIMITED on all plans - limit is by clients and locations
export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For solo instructors getting started.",
    tagline: "For solo instructors",
    pricing: {
      monthly: 99,
      annual: 79,
      annualTotal: 948,
      currency: "USD",
    },
    limits: {
      clients: 100,
      teamMembers: "unlimited",
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
      // Messaging - Region dependent (WhatsApp BR / SMS+WhatsApp US)
      { name: "SMS notifications", included: false },
      { name: "WhatsApp notifications", included: false },
      { name: "Messaging Bot", included: false, tooltip: "WhatsApp Bot (BR) or SMS/WhatsApp Bot (US)" },
      // AI & Waitlist - Core differentiator
      { name: "AI Support Assistant", included: false },
      { name: "Smart Waitlist", included: false, tooltip: "Reduce revenue variation, improve cash flow predictability" },
      { name: "Cancellation predictions", included: false },
      // Integrations
      { name: "Wellhub/Gympass", included: false },
      // Reports
      { name: "Basic reports", included: true },
      { name: "Advanced reports", included: false },
      { name: "Revenue analytics", included: false, tooltip: "Cash flow and predictability insights" },
      { name: "Data export", included: true },
      // Support
      { name: "Email support", included: true },
      { name: "Chat support", included: false },
      { name: "Priority support", included: false },
      { name: "Dedicated account manager", included: false },
      // Advanced
      { name: "API access", included: false },
      { name: "White-label branding", included: false },
      { name: "Custom integrations", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing studios ready to scale.",
    tagline: "For growing studios",
    pricing: {
      monthly: 179,
      annual: 143,
      annualTotal: 1716,
      currency: "USD",
    },
    limits: {
      clients: 500,
      teamMembers: "unlimited",
      locations: 2,
      storage: "25GB",
    },
    features: [
      // Core features
      { name: "Online scheduling", included: true },
      { name: "Client portal", included: true },
      { name: "Payment processing", included: true, tooltip: "2.5% + $0.25 per transaction" },
      { name: "Email reminders", included: true },
      { name: "Calendar sync", included: true },
      // Messaging - Region dependent
      { name: "SMS notifications", included: true, tooltip: "US market" },
      { name: "WhatsApp notifications", included: true },
      { name: "Messaging Bot", included: false, tooltip: "WhatsApp Bot (BR) or SMS/WhatsApp Bot (US)" },
      // AI & Waitlist - Core differentiator
      { name: "AI Support Assistant", included: false },
      { name: "Smart Waitlist", included: true, limit: "Basic queue", tooltip: "FIFO priority, manual notifications" },
      { name: "Cancellation predictions", included: false },
      // Integrations
      { name: "Wellhub/Gympass", included: true },
      // Reports
      { name: "Basic reports", included: true },
      { name: "Advanced reports", included: true },
      { name: "Revenue analytics", included: true, tooltip: "Basic cash flow insights" },
      { name: "Data export", included: true },
      // Support
      { name: "Email support", included: true },
      { name: "Chat support", included: true },
      { name: "Priority support", included: false },
      { name: "Dedicated account manager", included: false },
      // Advanced
      { name: "API access", included: false },
      { name: "White-label branding", included: false },
      { name: "Custom integrations", included: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "Maximize revenue with AI-powered waitlist and predictive insights.",
    tagline: "Revenue optimization",
    pricing: {
      monthly: 299,
      annual: 239,
      annualTotal: 2868,
      currency: "USD",
    },
    limits: {
      clients: 2000,
      teamMembers: "unlimited",
      locations: 5,
      storage: "100GB",
    },
    highlighted: true,
    badge: "Best for predictability",
    features: [
      // Core features
      { name: "Online scheduling", included: true },
      { name: "Client portal", included: true },
      { name: "Payment processing", included: true, tooltip: "1.9% + $0.15 per transaction" },
      { name: "Email reminders", included: true },
      { name: "Calendar sync", included: true },
      // Messaging - Full bot support (WhatsApp BR / SMS+WhatsApp US)
      { name: "SMS notifications", included: true },
      { name: "WhatsApp notifications", included: true },
      { name: "Messaging Bot", included: true, limit: "5,000 msgs/mo", tooltip: "WhatsApp Bot (BR) or SMS/WhatsApp Bot (US) - automated scheduling, confirmations, reminders" },
      // AI & Waitlist - Core differentiator - MAIN VALUE PROP
      { name: "AI Support Assistant", included: true, limit: "2,000 chats/mo" },
      { name: "Smart Waitlist", included: true, tooltip: "AI-powered priority, auto-fill cancellations, reduce no-shows by 40%" },
      { name: "Cancellation predictions", included: true, tooltip: "ML-based predictions to proactively fill spots" },
      { name: "Auto-fill spots", included: true, tooltip: "Automatically notify waitlist when spots open" },
      { name: "Revenue protection", included: true, tooltip: "Late cancellation fees, no-show tracking" },
      // Integrations
      { name: "Wellhub/Gympass", included: true },
      // Reports - Revenue focus
      { name: "Basic reports", included: true },
      { name: "Advanced reports", included: true },
      { name: "Revenue analytics", included: true, tooltip: "Full cash flow predictability dashboard" },
      { name: "Monthly revenue forecast", included: true, tooltip: "30-day revenue predictions based on bookings" },
      { name: "Data export", included: true },
      // Support
      { name: "Email support", included: true },
      { name: "Chat support", included: true },
      { name: "Priority support", included: true },
      { name: "Dedicated account manager", included: false },
      // Advanced
      { name: "API access", included: true },
      { name: "White-label branding", included: true },
      { name: "Custom integrations", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Professional",
    description: "For studio networks and franchises with maximum control.",
    tagline: "Premium solution",
    pricing: {
      monthly: 499,
      annual: 399,
      annualTotal: 4788,
      currency: "USD",
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
      { name: "Payment processing", included: true, tooltip: "Custom rates" },
      { name: "Email reminders", included: true },
      { name: "Calendar sync", included: true },
      // Messaging - Unlimited (WhatsApp BR / SMS+WhatsApp US)
      { name: "SMS notifications", included: true },
      { name: "WhatsApp notifications", included: true },
      { name: "Messaging Bot", included: true, limit: "Unlimited", tooltip: "WhatsApp Bot (BR) or SMS/WhatsApp Bot (US)" },
      // AI & Waitlist - Full suite
      { name: "AI Support Assistant", included: true, limit: "Unlimited" },
      { name: "Smart Waitlist", included: true, tooltip: "AI-powered priority with custom rules" },
      { name: "Cancellation predictions", included: true },
      { name: "Auto-fill spots", included: true },
      { name: "Revenue protection", included: true },
      { name: "Custom waitlist rules", included: true, tooltip: "Define priority based on membership, LTV, etc" },
      // Integrations
      { name: "Wellhub/Gympass", included: true },
      // Reports
      { name: "Basic reports", included: true },
      { name: "Advanced reports", included: true },
      { name: "Revenue analytics", included: true },
      { name: "Monthly revenue forecast", included: true },
      { name: "Multi-location analytics", included: true },
      { name: "Data export", included: true },
      // Support
      { name: "Email support", included: true },
      { name: "Chat support", included: true },
      { name: "Priority support", included: true },
      { name: "Dedicated account manager", included: true },
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
    availableOn: ["business"],
  },
  {
    id: "extra_ai_chats",
    name: "Extra AI Chats",
    description: "Additional 500 AI Support chats per month",
    price: 29,
    billingPeriod: "monthly",
    availableOn: ["business"],
  },
  {
    id: "sms_bundle",
    name: "SMS Bundle (1000)",
    description: "1000 SMS credits for notifications and reminders",
    price: 25,
    billingPeriod: "monthly",
    availableOn: ["starter", "growth", "business", "enterprise"],
  },
  {
    id: "additional_location",
    name: "Additional Location",
    description: "Add one more location to your account",
    price: 49,
    billingPeriod: "monthly",
    availableOn: ["growth", "business"],
  },
  {
    id: "additional_storage",
    name: "Additional Storage (50GB)",
    description: "Add 50GB of storage to your account",
    price: 15,
    billingPeriod: "monthly",
    availableOn: ["starter", "growth", "business"],
  },
  {
    id: "migration_service",
    name: "White Glove Migration",
    description: "Full-service data migration from your current platform",
    price: 299,
    billingPeriod: "one-time",
    availableOn: ["starter", "growth", "business", "enterprise"],
  },
];

// Transaction fees by plan
export const transactionFees: Record<PlanTier, { percentage: number; fixed: number }> = {
  starter: { percentage: 2.9, fixed: 0.30 },
  growth: { percentage: 2.5, fixed: 0.25 },
  business: { percentage: 1.9, fixed: 0.15 },
  enterprise: { percentage: 1.9, fixed: 0.15 }, // Custom rates available
};

// Feature availability matrix for quick lookups
// 4 plans: starter, growth, business, enterprise
// Focus: Smart Waitlist, Messaging Bot, Revenue Predictability
export const featureMatrix: Record<string, Record<PlanTier, boolean | string | number>> = {
  // Limits - team_members is unlimited for all plans
  active_clients: { starter: 100, growth: 500, business: 2000, enterprise: "unlimited" },
  team_members: { starter: "unlimited", growth: "unlimited", business: "unlimited", enterprise: "unlimited" },
  locations: { starter: 1, growth: 2, business: 5, enterprise: "unlimited" },
  storage: { starter: "5GB", growth: "25GB", business: "100GB", enterprise: "500GB" },

  // Core features
  online_scheduling: { starter: true, growth: true, business: true, enterprise: true },
  client_portal: { starter: true, growth: true, business: true, enterprise: true },
  payment_processing: { starter: true, growth: true, business: true, enterprise: true },
  email_reminders: { starter: true, growth: true, business: true, enterprise: true },
  calendar_sync: { starter: true, growth: true, business: true, enterprise: true },

  // Messaging - Region dependent (WhatsApp BR / SMS+WhatsApp US)
  sms_notifications: { starter: false, growth: true, business: true, enterprise: true },
  whatsapp_notifications: { starter: false, growth: true, business: true, enterprise: true },
  messaging_bot: { starter: false, growth: false, business: "5,000 msgs/mo", enterprise: "unlimited" },

  // AI & Waitlist - Core differentiator for revenue predictability
  ai_support_assistant: { starter: false, growth: false, business: "2,000 chats/mo", enterprise: "unlimited" },
  smart_waitlist: { starter: false, growth: "basic", business: true, enterprise: true },
  cancellation_predictions: { starter: false, growth: false, business: true, enterprise: true },
  auto_fill_spots: { starter: false, growth: false, business: true, enterprise: true },
  revenue_protection: { starter: false, growth: false, business: true, enterprise: true },
  custom_waitlist_rules: { starter: false, growth: false, business: false, enterprise: true },

  // Integrations
  wellhub_gympass: { starter: false, growth: true, business: true, enterprise: true },

  // Reports & analytics - Revenue focus
  basic_reports: { starter: true, growth: true, business: true, enterprise: true },
  advanced_reports: { starter: false, growth: true, business: true, enterprise: true },
  revenue_analytics: { starter: false, growth: true, business: true, enterprise: true },
  monthly_revenue_forecast: { starter: false, growth: false, business: true, enterprise: true },
  multi_location_analytics: { starter: false, growth: false, business: false, enterprise: true },
  data_export: { starter: true, growth: true, business: true, enterprise: true },

  // Support
  email_support: { starter: true, growth: true, business: true, enterprise: true },
  chat_support: { starter: false, growth: true, business: true, enterprise: true },
  priority_support: { starter: false, growth: false, business: true, enterprise: true },
  dedicated_manager: { starter: false, growth: false, business: false, enterprise: true },

  // Advanced features
  api_access: { starter: false, growth: false, business: true, enterprise: true },
  white_label: { starter: false, growth: false, business: true, enterprise: true },
  custom_integrations: { starter: false, growth: false, business: false, enterprise: true },
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
  const config = Object.values(regionConfigs).find(r => r.currency === currency) || regionConfigs.US;

  if (config.currencyPosition === "after") {
    return `${price.toLocaleString(config.locale)}${config.currencySymbol}`;
  }
  return `${config.currencySymbol}${price.toLocaleString(config.locale)}`;
}

// Get pricing for a specific region
export function getPlanPricingForRegion(tier: PlanTier, region: Region): {
  monthly: number;
  annual: number;
  annualTotal: number;
  currency: Currency;
} {
  const currency = regionConfigs[region].currency;
  const pricing = regionalPricing[tier][currency as "USD" | "BRL"] || regionalPricing[tier].USD;
  return { ...pricing, currency };
}

// Get plan with regional pricing
export function getPlanForRegion(tier: PlanTier, region: Region): PricingPlan {
  const plan = getPlanByTier(tier);
  const pricing = getPlanPricingForRegion(tier, region);
  return {
    ...plan,
    pricing: {
      ...plan.pricing,
      ...pricing,
    },
  };
}

// Get all plans for a region
export function getAllPlansForRegion(region: Region): PricingPlan[] {
  return pricingPlans.map(plan => getPlanForRegion(plan.id, region));
}

// Get region from country code or locale
export function getRegionFromLocale(locale: string): Region {
  const localeMap: Record<string, Region> = {
    "pt-BR": "BR",
    "pt": "BR",
    "en-US": "US",
    "en": "US",
    "en-GB": "EU",
    "es-ES": "EU",
    "es": "EU",
    "de": "EU",
    "fr": "EU",
    "it": "EU",
  };
  return localeMap[locale] || "GLOBAL";
}

// Get messaging channels for region
export function getMessagingChannelsForRegion(region: Region): ("whatsapp" | "sms")[] {
  return regionConfigs[region].defaultMessagingChannels;
}

// Check if SMS is available for region (US can choose, BR is WhatsApp only)
export function isSmsAvailableForRegion(region: Region): boolean {
  return regionConfigs[region].defaultMessagingChannels.includes("sms");
}

// Get the primary messaging channel for a region
export function getPrimaryMessagingChannel(region: Region): "whatsapp" | "sms" {
  // BR always WhatsApp, US defaults to WhatsApp but can choose SMS
  return regionConfigs[region].defaultMessagingChannels[0];
}

export function getPlanRecommendation(
  clientCount: number,
  locationCount: number,
  needsAI: boolean,
  needsWhatsAppBot: boolean
): PlanTier {
  // Enterprise for very large scale
  if (clientCount > 2000 || locationCount > 5) {
    return "enterprise";
  }

  // Business for AI features, WhatsApp Bot, or high volume
  if (needsAI || needsWhatsAppBot || clientCount > 500 || locationCount > 2) {
    return "business";
  }

  // Growth for growing studios
  if (clientCount > 100 || locationCount > 1) {
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
