// FlexiWell Pricing Configuration
// US Market Pricing in USD

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
  };
  instructorLimit: number | "unlimited";
  additionalInstructor: number; // price per additional instructor
  clientLimit: number | "unlimited";
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
  billingPeriod: BillingPeriod;
  availableOn: PlanTier[];
}

// Core pricing plans for US market
// Updated 2025 pricing from IMPLEMENTATION_GUIDE.md
export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for solo instructors and small studios just getting started",
    tagline: "For solo practitioners",
    pricing: {
      monthly: 49,
      annual: 39,
      annualTotal: 468,
      currency: "USD",
    },
    instructorLimit: 1,
    additionalInstructor: 0, // Can't add more on starter
    clientLimit: 100,
    features: [
      { name: "Online booking", included: true },
      { name: "Class scheduling", included: true },
      { name: "Client management", included: true, limit: 100 },
      { name: "Basic analytics", included: true },
      { name: "Email reminders", included: true },
      { name: "Payment processing", included: true, tooltip: "2.9% + $0.30 per transaction" },
      { name: "Mobile app access", included: true },
      { name: "WhatsApp notifications", included: false },
      { name: "Waitlist management", included: false },
      { name: "Multiple locations", included: false },
      { name: "Custom branding", included: false },
      { name: "API access", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing studios with a small team of instructors",
    tagline: "Most popular",
    pricing: {
      monthly: 99,
      annual: 79,
      annualTotal: 948,
      currency: "USD",
    },
    instructorLimit: 3,
    additionalInstructor: 25,
    clientLimit: 500,
    highlighted: true,
    badge: "Most Popular",
    features: [
      { name: "Online booking", included: true },
      { name: "Class scheduling", included: true },
      { name: "Client management", included: true, limit: 500 },
      { name: "Advanced analytics", included: true },
      { name: "Email & SMS reminders", included: true },
      { name: "Payment processing", included: true, tooltip: "2.5% + $0.25 per transaction" },
      { name: "Mobile app access", included: true },
      { name: "WhatsApp notifications", included: true },
      { name: "Waitlist management", included: true },
      { name: "Multiple locations", included: true, limit: 2 },
      { name: "Custom branding", included: false },
      { name: "API access", included: false },
      { name: "Priority support", included: true, tooltip: "Response within 24 hours" },
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "For established studios looking to scale with intelligent automation",
    tagline: "Most popular",
    pricing: {
      monthly: 179,
      annual: 149,
      annualTotal: 1788,
      currency: "USD",
    },
    instructorLimit: 3,
    additionalInstructor: 20,
    clientLimit: 500,
    highlighted: true,
    badge: "Most Popular",
    features: [
      { name: "Online booking", included: true },
      { name: "Class scheduling", included: true },
      { name: "Client management", included: true, limit: 500 },
      { name: "Advanced analytics", included: true },
      { name: "Email, SMS & WhatsApp", included: true },
      { name: "Payment processing", included: true, tooltip: "2.2% + $0.20 per transaction" },
      { name: "Mobile app access", included: true },
      { name: "AI Support Basic (500 chats/mo)", included: true },
      { name: "WhatsApp Bot (1,000 msgs/month)", included: true },
      { name: "Instagram Bot", included: false },
      { name: "AI-powered smart waitlist", included: true },
      { name: "Multiple locations", included: true, limit: 2 },
      { name: "Custom branding", included: false },
      { name: "Custom workflows (5)", included: true },
      { name: "API access", included: false },
      { name: "Priority support", included: true, tooltip: "Response within 24 hours" },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "For established studios with multiple instructors and locations",
    tagline: "Full-featured",
    pricing: {
      monthly: 199,
      annual: 159,
      annualTotal: 1908,
      currency: "USD",
    },
    instructorLimit: 10,
    additionalInstructor: 20,
    clientLimit: 2000,
    features: [
      { name: "Online booking", included: true },
      { name: "Class scheduling", included: true },
      { name: "Client management", included: true, limit: 2000 },
      { name: "Advanced analytics", included: true },
      { name: "Email, SMS & WhatsApp", included: true },
      { name: "Payment processing", included: true, tooltip: "2.2% + $0.20 per transaction" },
      { name: "Mobile app access", included: true },
      { name: "WhatsApp automation", included: true },
      { name: "Smart waitlist", included: true, tooltip: "With priority tiers" },
      { name: "Multiple locations", included: true, limit: 5 },
      { name: "Custom branding", included: true },
      { name: "API access", included: true },
      { name: "Priority support", included: true, tooltip: "Response within 4 hours" },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large studio networks and franchises with custom needs",
    tagline: "Custom solution",
    pricing: {
      monthly: 399,
      annual: 319,
      annualTotal: 3828,
      currency: "USD",
    },
    instructorLimit: "unlimited",
    additionalInstructor: 0,
    clientLimit: "unlimited",
    features: [
      { name: "Everything in Professional", included: true },
      { name: "Unlimited clients", included: true },
      { name: "Unlimited instructors", included: true },
      { name: "Unlimited locations", included: true },
      { name: "Custom integrations", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "Custom reporting", included: true },
      { name: "SLA guarantee", included: true, tooltip: "99.9% uptime" },
      { name: "White label", included: true },
      { name: "Custom contract", included: true },
      { name: "On-site training", included: true },
      { name: "24/7 phone support", included: true },
    ],
  },
];

// Add-ons available for purchase
export const addOns: AddOn[] = [
  {
    id: "white_label",
    name: "White Label",
    description: "Remove FlexiWell branding and use your own logo, colors, and custom domain",
    price: 39,
    billingPeriod: "monthly",
    availableOn: ["growth", "professional"],
  },
  {
    id: "ai_assistant",
    name: "AI Support Assistant",
    description: "AI-powered chatbot for client support, available 24/7",
    price: 29,
    billingPeriod: "monthly",
    availableOn: ["growth", "professional", "enterprise"],
  },
  {
    id: "advanced_analytics",
    name: "Advanced Analytics",
    description: "Detailed revenue forecasting, client retention analysis, and custom reports",
    price: 19,
    billingPeriod: "monthly",
    availableOn: ["starter", "growth"],
  },
  {
    id: "sms_bundle",
    name: "SMS Bundle (1000)",
    description: "1000 SMS credits for notifications and reminders",
    price: 25,
    billingPeriod: "monthly",
    availableOn: ["starter", "growth", "professional", "enterprise"],
  },
  {
    id: "migration_service",
    name: "White Glove Migration",
    description: "Full-service data migration from your current platform",
    price: 299,
    billingPeriod: "monthly", // One-time, but stored as monthly for consistency
    availableOn: ["starter", "growth", "professional", "enterprise"],
  },
  {
    id: "additional_location",
    name: "Additional Location",
    description: "Add one more location to your account",
    price: 49,
    billingPeriod: "monthly",
    availableOn: ["growth", "professional"],
  },
];

// Transaction fees by plan
export const transactionFees: Record<PlanTier, { percentage: number; fixed: number }> = {
  starter: { percentage: 2.9, fixed: 0.30 },
  growth: { percentage: 2.5, fixed: 0.25 },
  business: { percentage: 2.3, fixed: 0.22 },
  professional: { percentage: 2.2, fixed: 0.20 },
  enterprise: { percentage: 1.9, fixed: 0.15 },
};

// Feature availability matrix
export const featureMatrix: Record<string, Record<PlanTier, boolean | string | number>> = {
  online_booking: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  class_scheduling: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  client_management: { starter: 100, growth: 150, business: 500, professional: 2000, enterprise: "unlimited" },
  instructor_limit: { starter: 1, growth: 3, business: 3, professional: 10, enterprise: "unlimited" },
  locations: { starter: 1, growth: 2, business: 2, professional: 5, enterprise: "unlimited" },
  analytics_basic: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  analytics_advanced: { starter: false, growth: true, business: true, professional: true, enterprise: true },
  email_notifications: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  sms_notifications: { starter: false, growth: true, business: true, professional: true, enterprise: true },
  whatsapp_notifications: { starter: false, growth: true, business: true, professional: true, enterprise: true },
  whatsapp_automation: { starter: false, growth: false, business: true, professional: true, enterprise: true },
  waitlist_basic: { starter: false, growth: true, business: true, professional: true, enterprise: true },
  waitlist_smart: { starter: false, growth: false, business: true, professional: true, enterprise: true },
  custom_branding: { starter: false, growth: false, business: false, professional: true, enterprise: true },
  white_label: { starter: false, growth: "add-on", business: "add-on", professional: "add-on", enterprise: true },
  api_access: { starter: false, growth: false, business: false, professional: true, enterprise: true },
  mobile_app: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  support_email: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  support_chat: { starter: false, growth: true, business: true, professional: true, enterprise: true },
  support_priority: { starter: false, growth: "24h", business: "24h", professional: "4h", enterprise: "1h" },
  support_phone: { starter: false, growth: false, business: false, professional: false, enterprise: true },
  support_dedicated: { starter: false, growth: false, business: false, professional: false, enterprise: true },
  integrations_basic: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  integrations_custom: { starter: false, growth: false, business: false, professional: false, enterprise: true },
  reports_standard: { starter: true, growth: true, business: true, professional: true, enterprise: true },
  reports_custom: { starter: false, growth: false, business: true, professional: true, enterprise: true },
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
  instructorCount: number,
  clientCount: number,
  locationCount: number,
  needsWhiteLabel: boolean
): PlanTier {
  if (
    instructorCount > 10 ||
    clientCount > 2000 ||
    locationCount > 5 ||
    needsWhiteLabel
  ) {
    return "enterprise";
  }

  if (
    instructorCount > 3 ||
    clientCount > 500 ||
    locationCount > 2
  ) {
    return "professional";
  }

  if (
    instructorCount > 1 ||
    clientCount > 100 ||
    locationCount > 1
  ) {
    return "growth";
  }

  return "starter";
}

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
