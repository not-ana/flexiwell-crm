// FlexiWell Pricing Configuration
// Grand Slam Offer — Alex Hormozi's $100M Offers framework
// Niche: Reformer Pilates studios, $20k-$40k/mo revenue, losing 20%+ clients after month 3
// Positioning: "The Retention Engine™ for Reformer Pilates Studios"
// 2 plans: Retention Pro ($799/mo, all features) + Scale (multi-location, talk to sales)
// Single offer: $799/mo or $549/mo yearly. Everything included. 60-day results guarantee.
// Pricing phases: Founding Member $499/mo → Early Adopter $649/mo → Full Price $799/mo
// Per-instance feature overrides allow customization on sales calls
// Multi-region support: BR (BRL) and US/Global (USD)

export type PlanTier = "retention_pro" | "scale";
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
    defaultMessagingChannels: ["whatsapp"],
    dateFormat: "dd/MM/yyyy",
    currencySymbol: "R$",
    currencyPosition: "before",
  },
  US: {
    currency: "USD",
    locale: "en-US",
    defaultMessagingChannels: ["whatsapp", "sms"],
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
    customPricing?: boolean;
  };
  limits: {
    clients: number | "unlimited";
    teamMembers: number | "unlimited";
    locations: number | "unlimited";
    storage: string;
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

// ---------------------------------------------------------------------------
// Grand Slam Offer — Value Stack
// Hormozi: "Make the offer so good people feel stupid saying no"
// Each bonus has a perceived value that anchors the total, making the
// actual price feel like the minimum possible investment.
// ---------------------------------------------------------------------------

export interface ValueStackItem {
  name: string;
  description: string;
  perceivedValue: number;
  deliveryMethod: "software" | "done-for-you" | "digital" | "service";
}

export interface GrandSlamOffer {
  name: string;
  subtitle: string;
  targetAvatar: string;
  dreamOutcome: string;
  minimumInvestment: {
    monthly: number;
    annual: number;
    label: string;
  };
  revenueAtRisk: {
    monthlyLoss: number;
    annualLoss: number;
    description: string;
  };
  valueStack: ValueStackItem[];
  totalPerceivedValue: number;
  guarantee: {
    type: "conditional" | "unconditional";
    headline: string;
    description: string;
    durationDays: number;
    metric?: string;
  };
  scarcity: {
    enabled: boolean;
    totalSpots: number;
    spotsClaimed: number;
    message: string;
  };
  urgency: {
    enabled: boolean;
    message: string;
    deadline?: string;
  };
}

// The Grand Slam Offer for the Retention Pro tier (single offer)
export const grandSlamOffer: GrandSlamOffer = {
  name: "The Retention Engine™",
  subtitle: "Stop Losing 20% of Your Clients Every Quarter",
  targetAvatar:
    "Reformer Pilates studio owners doing $20k–$40k/mo who lose 20%+ of clients after month 3",
  dreamOutcome:
    "A full studio with a waitlist, 80%+ retention, and zero manual follow-up",

  minimumInvestment: {
    monthly: 799,
    annual: 549,
    label: "Your minimum investment",
  },

  revenueAtRisk: {
    monthlyLoss: 3000,
    annualLoss: 36000,
    description:
      "Studios with 200 active clients at $75/mo losing 20% in 90 days leave $3,000/mo on the table — that's $36,000/year walking out the door.",
  },

  valueStack: [
    {
      name: "Automated Retention System",
      description:
        "Health Score for every client, churn-risk alerts, and a retention dashboard that shows who's about to leave before they do.",
      perceivedValue: 3588,
      deliveryMethod: "software",
    },
    {
      name: "Done-For-You SMS Sequences",
      description:
        "12 proven SMS templates built for Reformer studios — welcome series (day 1, 7, 14, 30), win-back campaigns, and post-class re-booking. Just activate, never write a word.",
      perceivedValue: 500,
      deliveryMethod: "digital",
    },
    {
      name: "90-Day Retention Playbook",
      description:
        "The exact week-by-week touchpoint framework used by studios retaining 80%+ of clients. Runs automatically inside your dashboard.",
      perceivedValue: 997,
      deliveryMethod: "digital",
    },
    {
      name: "Done-For-You Setup & Migration",
      description:
        "We migrate your data from Mindbody, GloFox, or spreadsheets, configure your Health Score thresholds, and launch your retention automations — all within 48 hours.",
      perceivedValue: 1500,
      deliveryMethod: "done-for-you",
    },
    {
      name: "Client Win-Back Campaign",
      description:
        "Automatically identifies every client who left in the last 6 months and runs a 5-step SMS sequence to bring them back — live in your first week.",
      perceivedValue: 500,
      deliveryMethod: "software",
    },
    {
      name: "Referral Engine",
      description:
        "Automated referral system — clients refer a friend, the friend gets a trial, the client gets credit. Triggered at the perfect moment (post-class, milestones).",
      perceivedValue: 997,
      deliveryMethod: "software",
    },
  ],

  totalPerceivedValue: 8082,

  guarantee: {
    type: "conditional",
    headline: "The 60-Day Results Guarantee",
    description:
      "Reduce your no-shows by 25% and retain at least 5 extra clients within 60 days — or get a full refund. No questions asked.",
    durationDays: 60,
    metric: "25% no-show reduction + 5 extra clients retained vs. your baseline",
  },

  scarcity: {
    enabled: true,
    totalSpots: 20,
    spotsClaimed: 14,
    message: "Only {remaining} spots left at this price",
  },

  urgency: {
    enabled: true,
    message: "Founding member pricing locks in for 24 months — once spots fill, the price goes to $649/mo (Early Adopter) then $799/mo",
    deadline: "2026-04-30",
  },
};

// ---------------------------------------------------------------------------
// Pricing Plans — 2 Plans (Hormozi Single Offer Strategy)
// Retention Pro ($799): The one offer — everything included, all features
// Scale (Custom): Multi-location studios, talk to sales
// Pricing phases for Retention Pro:
//   Founding Member: $499/mo locked 24 months
//   Early Adopter: $649/mo locked 12 months
//   Full Price: $799/mo
// ---------------------------------------------------------------------------

export interface RegionalPricing {
  USD: { monthly: number; annual: number; annualTotal: number };
  BRL: { monthly: number; annual: number; annualTotal: number };
}

export const regionalPricing: Record<PlanTier, RegionalPricing> = {
  retention_pro: {
    USD: { monthly: 799, annual: 549, annualTotal: 6588 },
    BRL: { monthly: 2799, annual: 1929, annualTotal: 23148 },
  },
  scale: {
    USD: { monthly: 0, annual: 0, annualTotal: 0 }, // Custom pricing — contact sales
    BRL: { monthly: 0, annual: 0, annualTotal: 0 },
  },
};

export const pricingPlans: PricingPlan[] = [
  // -----------------------------------------------------------------------
  // RETENTION PRO — The Single Offer ($799/mo)
  // Everything included. All features. 60-day results guarantee.
  // Founding Member: $499/mo. Early Adopter: $649/mo.
  // On sales calls, features can be removed for a lower custom price.
  // -----------------------------------------------------------------------
  {
    id: "retention_pro",
    name: "Retention Pro",
    description: "The Retention Engine™ — everything you need to stop losing clients and fill your studio.",
    tagline: "The Retention Engine™",
    pricing: {
      monthly: 799,
      annual: 549,
      annualTotal: 6588,
      currency: "USD",
    },
    limits: {
      clients: "unlimited",
      teamMembers: "unlimited",
      locations: 1,
      storage: "100GB",
    },
    highlighted: true,
    features: [
      // Core
      { name: "Online scheduling", included: true },
      { name: "Client portal", included: true },
      { name: "Payment processing", included: true, tooltip: "1.9% + $0.15 per transaction" },
      { name: "Email reminders", included: true },
      { name: "Calendar sync", included: true },
      // Messaging — full bot, unlimited
      { name: "SMS notifications", included: true },
      { name: "WhatsApp notifications", included: true },
      { name: "SMS Bot", included: true, limit: "Unlimited", tooltip: "Automated scheduling, confirmations, reminders, and retention sequences" },
      // Retention Engine — FULL
      { name: "Client Health Score", included: true, tooltip: "Multi-factor health score — frequency, recency, engagement, payment history" },
      { name: "Churn-risk alerts", included: true, tooltip: "Automatic alerts when a client's Health Score drops below threshold" },
      { name: "Retention dashboard", included: true, tooltip: "See who's at risk, who to save, and who's safe — at a glance" },
      { name: "SMS retention sequences", included: true, tooltip: "12 pre-built templates: welcome series, milestone check-ins, re-engagement" },
      { name: "Win-back campaigns", included: true, tooltip: "5-step SMS sequence targeting clients who left in the last 6 months" },
      { name: "Referral Engine", included: true, tooltip: "Automated referral program — refer a friend, earn credit" },
      { name: "90-Day Retention Playbook", included: true, tooltip: "Week-by-week automated touchpoints for the critical first 90 days" },
      // Waitlist & AI
      { name: "Smart Waitlist", included: true, tooltip: "AI-powered priority, auto-fill cancellations, reduce no-shows by 40%" },
      { name: "Cancellation predictions", included: true, tooltip: "ML-based predictions to proactively fill spots" },
      { name: "AI Support Assistant", included: true, limit: "Unlimited" },
      // Reports
      { name: "Basic reports", included: true },
      { name: "Advanced reports", included: true },
      { name: "Revenue analytics", included: true, tooltip: "Full cash flow predictability dashboard" },
      { name: "Monthly revenue forecast", included: true, tooltip: "30-day revenue predictions based on bookings and retention trends" },
      { name: "Data export", included: true },
      // Integrations
      { name: "Wellhub/Gympass", included: true },
      // Support
      { name: "Email support", included: true },
      { name: "Chat support", included: true },
      { name: "Priority support", included: true },
      { name: "Direct founder access", included: true },
      // Advanced
      { name: "API access", included: true },
      { name: "White-label branding", included: true },
      { name: "Custom integrations", included: true },
    ],
  },

  // -----------------------------------------------------------------------
  // SCALE — Custom/Sales Only
  // For multi-location studios and franchises. No public pricing.
  // -----------------------------------------------------------------------
  {
    id: "scale",
    name: "Scale",
    description: "For multi-location studios and franchises with unlimited everything.",
    tagline: "Multi-location mastery",
    pricing: {
      monthly: 0,
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
      // Core
      { name: "Online scheduling", included: true },
      { name: "Client portal", included: true },
      { name: "Payment processing", included: true, tooltip: "Custom rates" },
      { name: "Email reminders", included: true },
      { name: "Calendar sync", included: true },
      // Messaging — unlimited
      { name: "SMS notifications", included: true },
      { name: "WhatsApp notifications", included: true },
      { name: "SMS Bot", included: true, limit: "Unlimited" },
      // Retention Engine — full + custom rules
      { name: "Client Health Score", included: true, tooltip: "Custom scoring models per location" },
      { name: "Churn-risk alerts", included: true },
      { name: "Retention dashboard", included: true },
      { name: "SMS retention sequences", included: true },
      { name: "Win-back campaigns", included: true },
      { name: "Referral Engine", included: true },
      { name: "90-Day Retention Playbook", included: true },
      { name: "Custom retention rules", included: true, tooltip: "Define triggers and automations based on your studio's specific patterns" },
      // Waitlist & AI — unlimited
      { name: "Smart Waitlist", included: true, tooltip: "AI-powered priority with custom rules per location" },
      { name: "Cancellation predictions", included: true },
      { name: "AI Support Assistant", included: true, limit: "Unlimited" },
      // Reports — multi-location
      { name: "Basic reports", included: true },
      { name: "Advanced reports", included: true },
      { name: "Revenue analytics", included: true },
      { name: "Monthly revenue forecast", included: true },
      { name: "Multi-location analytics", included: true, tooltip: "Cross-location retention, revenue, and performance comparison" },
      { name: "Data export", included: true },
      // Integrations
      { name: "Wellhub/Gympass", included: true },
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

// ---------------------------------------------------------------------------
// Add-ons
// ---------------------------------------------------------------------------

export const addOns: AddOn[] = [
  {
    id: "additional_location",
    name: "Additional Location",
    description: "Add one more location to your account",
    price: 49,
    billingPeriod: "monthly",
    availableOn: ["retention_pro"],
  },
  {
    id: "additional_storage",
    name: "Additional Storage (50GB)",
    description: "Add 50GB of storage to your account",
    price: 15,
    billingPeriod: "monthly",
    availableOn: ["retention_pro"],
  },
  {
    id: "migration_service",
    name: "Done-For-You Setup & Migration",
    description: "We migrate all your data from Mindbody, GloFox, or spreadsheets, configure Health Scores, and launch your automations — within 48 hours.",
    price: 0, // Included free (Grand Slam bonus)
    billingPeriod: "one-time",
    availableOn: ["retention_pro", "scale"],
  },
];

// ---------------------------------------------------------------------------
// Transaction fees by plan
// ---------------------------------------------------------------------------

export const transactionFees: Record<PlanTier, { percentage: number; fixed: number }> = {
  retention_pro: { percentage: 1.9, fixed: 0.15 },
  scale: { percentage: 1.9, fixed: 0.15 },
};

// ---------------------------------------------------------------------------
// Feature availability matrix for quick lookups
// ---------------------------------------------------------------------------

export const featureMatrix: Record<string, Record<PlanTier, boolean | string | number>> = {
  // Limits
  active_clients: { retention_pro: "unlimited", scale: "unlimited" },
  team_members: { retention_pro: "unlimited", scale: "unlimited" },
  locations: { retention_pro: 1, scale: "unlimited" },
  storage: { retention_pro: "100GB", scale: "500GB" },

  // Core features
  online_scheduling: { retention_pro: true, scale: true },
  client_portal: { retention_pro: true, scale: true },
  payment_processing: { retention_pro: true, scale: true },
  email_reminders: { retention_pro: true, scale: true },
  calendar_sync: { retention_pro: true, scale: true },

  // Messaging
  sms_notifications: { retention_pro: true, scale: true },
  whatsapp_notifications: { retention_pro: true, scale: true },
  sms_bot: { retention_pro: "unlimited", scale: "unlimited" },

  // Retention Engine
  client_health_score: { retention_pro: true, scale: true },
  churn_risk_alerts: { retention_pro: true, scale: true },
  retention_dashboard: { retention_pro: true, scale: true },
  sms_retention_sequences: { retention_pro: true, scale: true },
  winback_campaigns: { retention_pro: true, scale: true },
  referral_engine: { retention_pro: true, scale: true },
  retention_playbook_90day: { retention_pro: true, scale: true },
  custom_retention_rules: { retention_pro: false, scale: true },

  // Waitlist & AI
  smart_waitlist: { retention_pro: true, scale: true },
  cancellation_predictions: { retention_pro: true, scale: true },
  ai_support_assistant: { retention_pro: "unlimited", scale: "unlimited" },

  // Integrations
  wellhub_gympass: { retention_pro: true, scale: true },

  // Reports
  basic_reports: { retention_pro: true, scale: true },
  advanced_reports: { retention_pro: true, scale: true },
  revenue_analytics: { retention_pro: true, scale: true },
  monthly_revenue_forecast: { retention_pro: true, scale: true },
  multi_location_analytics: { retention_pro: false, scale: true },
  data_export: { retention_pro: true, scale: true },

  // Support
  email_support: { retention_pro: true, scale: true },
  chat_support: { retention_pro: true, scale: true },
  priority_support: { retention_pro: true, scale: true },
  dedicated_manager: { retention_pro: false, scale: true },

  // Advanced
  api_access: { retention_pro: true, scale: true },
  white_label: { retention_pro: true, scale: true },
  custom_integrations: { retention_pro: true, scale: true },
};

// ---------------------------------------------------------------------------
// Pricing display helpers — Value Anchoring (Hormozi)
// Shows the price-to-value discrepancy so the client sees the minimum
// investment against the total value and the revenue they're losing.
// ---------------------------------------------------------------------------

export interface ValueAnchor {
  totalPerceivedValue: number;
  revenueAtRisk: number;
  minimumInvestment: number;
  roiMultiple: number;
  breakEvenClients: number;
  avgClientValue: number;
}

export function getValueAnchor(plan: PricingPlan): ValueAnchor | null {
  if (plan.id !== "retention_pro") return null;

  const avgClientValue = 175; // avg Reformer Pilates client value/mo
  const monthlyLoss = 3000;
  const minimumInvestment = plan.pricing.monthly;
  const breakEvenClients = Math.ceil(minimumInvestment / avgClientValue);
  const roiMultiple = Math.round((monthlyLoss / minimumInvestment) * 10) / 10;

  return {
    totalPerceivedValue: grandSlamOffer.totalPerceivedValue,
    revenueAtRisk: monthlyLoss,
    minimumInvestment,
    roiMultiple,
    breakEvenClients,
    avgClientValue,
  };
}

export function formatValueAnchorText(anchor: ValueAnchor): {
  headline: string;
  valueStackLine: string;
  riskLine: string;
  investmentLine: string;
  roiLine: string;
} {
  return {
    headline: "Why studios call this a no-brainer",
    valueStackLine: `Total value of everything included: $${anchor.totalPerceivedValue.toLocaleString()}`,
    riskLine: `Revenue you're losing to churn right now: $${anchor.revenueAtRisk.toLocaleString()}/mo ($${(anchor.revenueAtRisk * 12).toLocaleString()}/yr)`,
    investmentLine: `Your minimum investment: $${anchor.minimumInvestment}/mo`,
    roiLine: `Retain just ${anchor.breakEvenClients} extra clients to cover the cost — most studios retain 10+ in the first month`,
  };
}

// ---------------------------------------------------------------------------
// Founding Member Offer (Grand Slam + Scarcity/Urgency)
// ---------------------------------------------------------------------------

export const foundingMemberOffer = {
  enabled: true,
  targetTier: "retention_pro" as PlanTier,
  regularPrice: 799, // Full price (post-launch)
  foundingPrice: 499, // Founding Member price (locked 24 months)
  earlyAdopterPrice: 649, // Early Adopter price (locked 12 months)
  lockedMonths: 24,
  earlyAdopterLockedMonths: 12,
  totalSpots: 20,
  spotsClaimed: 14,

  bonuses: grandSlamOffer.valueStack
    .filter((item) => item.deliveryMethod !== "software")
    .map((item) => ({
      name: item.name,
      value: item.perceivedValue,
      description: item.description,
    })),
  totalBonusValue: grandSlamOffer.valueStack
    .filter((item) => item.deliveryMethod !== "software")
    .reduce((sum, item) => sum + item.perceivedValue, 0),

  guarantee: {
    days: grandSlamOffer.guarantee.durationDays,
    promise: grandSlamOffer.guarantee.headline,
    description: grandSlamOffer.guarantee.description,
  },

  socialProof: {
    rating: 4.9,
    reviewCount: 10,
    studiosUsing: "10",
  },

  painPoints: {
    headline: "Reformer Pilates Studios Lose $36,000/yr to Client Churn",
    subheadline: "The First 20 to Join Us Won't.",
    stats: [
      { label: "Clients lost in the first 90 days", value: "20-25%" },
      { label: "Monthly revenue walking out the door", value: "$3,000" },
      { label: "Clients retained with The Retention Engine™", value: "10+" },
    ],
  },

  competitorAnchoring: {
    mindbody: { range: "$279–$499/mo", note: "no retention tools included" },
    marianaTek: { range: "$285+/mo", note: "scheduling only" },
    average: "$400/mo for less",
  },
};

export const foundingMemberBenefits = [
  "The full Retention Engine™ — Health Score, churn alerts, retention dashboard",
  "12 pre-built SMS retention sequences for Reformer studios",
  "90-Day Retention Playbook running on autopilot",
  "Done-for-you setup & data migration (48-hour turnaround)",
  "Client Win-Back Campaign — live in your first week",
  "Referral Engine with automated credit system",
  "Smart Waitlist with AI-powered auto-fill",
  "Unlimited clients, unlimited staff, 1 location",
  "Priority support + direct founder access",
  "Price locked for 24 months",
];

// ---------------------------------------------------------------------------
// Competitor comparison data
// ---------------------------------------------------------------------------

export interface CompetitorPricing {
  name: string;
  starterEquivalent: number;
  midTierEquivalent: number;
  hasRetentionTools: boolean;
  notes: string;
}

export const competitorPricing: CompetitorPricing[] = [
  { name: "Mindbody", starterEquivalent: 139, midTierEquivalent: 279, hasRetentionTools: false, notes: "No health score, no churn alerts, no automated retention. Hidden per-client and processing fees push real cost to $400-700/mo" },
  { name: "Glofox", starterEquivalent: 110, midTierEquivalent: 250, hasRetentionTools: false, notes: "Scheduling + payments only" },
  { name: "Momence", starterEquivalent: 99, midTierEquivalent: 199, hasRetentionTools: false, notes: "Basic CRM, no retention automation" },
  { name: "Mariana Tek", starterEquivalent: 150, midTierEquivalent: 350, hasRetentionTools: false, notes: "Premium scheduling, no retention focus" },
  { name: "Walla", starterEquivalent: 139, midTierEquivalent: 249, hasRetentionTools: false, notes: "Marketing tools but no health score or churn prediction" },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getPlanByTier(tier: PlanTier): PricingPlan {
  return pricingPlans.find((p) => p.id === tier)!;
}

export function calculateAnnualSavings(plan: PricingPlan): number {
  return plan.pricing.monthly * 12 - plan.pricing.annualTotal;
}

export function calculateAnnualSavingsPercentage(plan: PricingPlan): number {
  const monthlyTotal = plan.pricing.monthly * 12;
  const savings = monthlyTotal - plan.pricing.annualTotal;
  return Math.round((savings / monthlyTotal) * 100);
}

export function getTransactionFee(tier: PlanTier, amount: number): number {
  const fees = transactionFees[tier];
  return (amount * fees.percentage) / 100 + fees.fixed;
}

export function getAvailableAddOns(tier: PlanTier): AddOn[] {
  return addOns.filter((addon) => addon.availableOn.includes(tier));
}

export function isFeatureAvailable(feature: string, tier: PlanTier): boolean | string | number {
  return featureMatrix[feature]?.[tier] ?? false;
}

export function formatPrice(price: number, currency: Currency = "USD"): string {
  const config = Object.values(regionConfigs).find((r) => r.currency === currency) || regionConfigs.US;

  if (config.currencyPosition === "after") {
    return `${price.toLocaleString(config.locale)}${config.currencySymbol}`;
  }
  return `${config.currencySymbol}${price.toLocaleString(config.locale)}`;
}

export function getPlanPricingForRegion(
  tier: PlanTier,
  region: Region
): {
  monthly: number;
  annual: number;
  annualTotal: number;
  currency: Currency;
} {
  const currency = regionConfigs[region].currency;
  const pricing = regionalPricing[tier][currency as "USD" | "BRL"] || regionalPricing[tier].USD;
  return { ...pricing, currency };
}

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

export function getAllPlansForRegion(region: Region): PricingPlan[] {
  return pricingPlans.map((plan) => getPlanForRegion(plan.id, region));
}

export function getRegionFromLocale(locale: string): Region {
  const localeMap: Record<string, Region> = {
    "pt-BR": "BR",
    pt: "BR",
    "en-US": "US",
    en: "US",
    "en-GB": "EU",
    "es-ES": "EU",
    es: "EU",
    de: "EU",
    fr: "EU",
    it: "EU",
  };
  return localeMap[locale] || "GLOBAL";
}

export function getMessagingChannelsForRegion(region: Region): ("whatsapp" | "sms")[] {
  return regionConfigs[region].defaultMessagingChannels;
}

export function isSmsAvailableForRegion(region: Region): boolean {
  return regionConfigs[region].defaultMessagingChannels.includes("sms");
}

export function getPrimaryMessagingChannel(region: Region): "whatsapp" | "sms" {
  return regionConfigs[region].defaultMessagingChannels[0];
}

export function getPlanRecommendation(
  clientCount: number,
  locationCount: number,
): PlanTier {
  if (locationCount > 1) {
    return "scale";
  }

  return "retention_pro";
}

// Free trial configuration
export const trialConfig = {
  durationDays: 30,
  requiresCreditCard: true,
  features: "full" as const,
};
