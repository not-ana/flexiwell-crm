// Plan types and feature flags for FlexiWell CRM
// 2 plans: Retention Pro (hero, all features) + Scale (multi-location, talk to sales)
// Single offer strategy: $799/mo, $549/mo yearly. Everything included.
// Feature overrides allow per-instance customization (negotiated on sales calls)
// Aligned with pricing.ts (Hormozi Grand Slam Offer framework)

export type PlanType = "retention_pro" | "scale";

export interface PlanLimits {
  maxClients: number;
  maxStaff: number;
  maxLocations: number;
  storageMB: number;
}

export interface PlanFeatures {
  // Core features
  onlineScheduling: boolean;
  clientPortal: boolean;
  paymentProcessing: boolean;

  // Communication
  emailReminders: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  messagingBot: boolean; // WhatsApp/SMS Bot with AI

  // AI Features
  aiSupportAssistant: boolean;

  // Health Assessment
  healthAssessment: boolean; // Client health assessment forms

  // Waitlist
  smartWaitlist: boolean;
  aiWaitlist: boolean; // AI-powered smart waitlist
  customWaitlistRules: boolean;

  // Advanced features
  customBranding: boolean;
  advancedReports: boolean;
  cancellationPredictions: boolean;

  // Integrations
  apiAccess: boolean;
  webhooks: boolean;

  // Multi-location
  multiLocation: boolean;

  // Support
  emailSupport: boolean;
  chatSupport: boolean;
  prioritySupport: boolean;
  dedicatedManager: boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number; // per month when billed yearly (20% off)
  };
  limits: PlanLimits;
  features: PlanFeatures;
  popular?: boolean;
  // Usage limits for metered features
  usageLimits?: {
    messagingBotMessages?: number; // per month, -1 = unlimited
    aiChats?: number; // per month, -1 = unlimited
    apiCalls?: number; // per month, -1 = unlimited
  };
}

// Plan definitions
// Single offer: Retention Pro $799/mo ($549/mo yearly) — ALL features included
// Scale: multi-location, custom pricing via sales
export const plans: Record<PlanType, Plan> = {
  retention_pro: {
    id: "retention_pro",
    name: "Retention Pro",
    description: "The Retention Engine™ — everything you need to stop losing clients and fill your studio.",
    price: {
      monthly: 799,
      yearly: 549, // ~31% discount
    },
    limits: {
      maxClients: -1, // unlimited
      maxStaff: -1, // unlimited
      maxLocations: 1,
      storageMB: 100 * 1024, // 100GB
    },
    features: {
      // Core — All included
      onlineScheduling: true,
      clientPortal: true,
      paymentProcessing: true,

      // Communication — Full including Bot
      emailReminders: true,
      smsNotifications: true,
      whatsappNotifications: true,
      messagingBot: true,

      // AI Features — All included
      aiSupportAssistant: true,

      // Health Assessment — Yes
      healthAssessment: true,

      // Waitlist — AI-powered smart waitlist
      smartWaitlist: true,
      aiWaitlist: true,
      customWaitlistRules: false,

      // Advanced — All included
      customBranding: true,
      advancedReports: true,
      cancellationPredictions: true,

      // Integrations
      apiAccess: true,
      webhooks: true,

      // Multi-location — 1 location (single studio avatar)
      multiLocation: false,

      // Support — Priority + founder access
      emailSupport: true,
      chatSupport: true,
      prioritySupport: true,
      dedicatedManager: false,
    },
    popular: true,
    usageLimits: {
      messagingBotMessages: -1, // unlimited
      aiChats: -1, // unlimited
      apiCalls: -1, // unlimited
    },
  },

  scale: {
    id: "scale",
    name: "Scale",
    description: "For multi-location studios and franchises with unlimited everything.",
    price: {
      monthly: 0, // Custom pricing — contact sales
      yearly: 0,
    },
    limits: {
      maxClients: -1, // unlimited
      maxStaff: -1, // unlimited
      maxLocations: -1, // unlimited
      storageMB: 500 * 1024, // 500GB
    },
    features: {
      // Core - All included
      onlineScheduling: true,
      clientPortal: true,
      paymentProcessing: true,

      // Communication - Full including Bot (unlimited)
      emailReminders: true,
      smsNotifications: true,
      whatsappNotifications: true,
      messagingBot: true, // unlimited

      // AI Features - AI Support Assistant (unlimited)
      aiSupportAssistant: true,

      // Health Assessment - Yes
      healthAssessment: true,

      // Waitlist - Full with custom rules
      smartWaitlist: true,
      aiWaitlist: true,
      customWaitlistRules: true,

      // Advanced - All features
      customBranding: true,
      advancedReports: true,
      cancellationPredictions: true,

      // Integrations - Full API access
      apiAccess: true,
      webhooks: true,

      // Multi-location - Unlimited
      multiLocation: true,

      // Support - Priority (12h) + Dedicated manager
      emailSupport: true,
      chatSupport: true,
      prioritySupport: true,
      dedicatedManager: true,
    },
    usageLimits: {
      messagingBotMessages: -1, // unlimited
      aiChats: -1, // unlimited
      apiCalls: -1, // unlimited
    },
  },
};

// Helper functions

/**
 * Check if a feature is available for a given plan
 */
export function hasFeature(planId: PlanType, feature: keyof PlanFeatures): boolean {
  return plans[planId].features[feature];
}

/**
 * Check if within plan limits
 */
export function isWithinLimits(
  planId: PlanType,
  resource: keyof PlanLimits,
  currentCount: number
): boolean {
  const limit = plans[planId].limits[resource];
  return limit === -1 || currentCount < limit;
}

/**
 * Get the limit for a resource
 */
export function getLimit(planId: PlanType, resource: keyof PlanLimits): number | "unlimited" {
  const limit = plans[planId].limits[resource];
  return limit === -1 ? "unlimited" : limit;
}

/**
 * Get features that would be unlocked by upgrading to a higher plan
 */
export function getUpgradeFeatures(currentPlan: PlanType, targetPlan: PlanType): (keyof PlanFeatures)[] {
  const current = plans[currentPlan].features;
  const target = plans[targetPlan].features;

  const upgrades: (keyof PlanFeatures)[] = [];

  for (const key of Object.keys(target) as (keyof PlanFeatures)[]) {
    if (!current[key] && target[key]) {
      upgrades.push(key);
    }
  }

  return upgrades;
}

/**
 * Feature display names for UI
 */
export const featureDisplayNames: Record<keyof PlanFeatures, string> = {
  onlineScheduling: "Online Scheduling",
  clientPortal: "Client Portal",
  paymentProcessing: "Payment Processing",
  emailReminders: "Email Reminders",
  smsNotifications: "SMS Notifications",
  whatsappNotifications: "WhatsApp Notifications",
  messagingBot: "Messaging Bot",
  aiSupportAssistant: "AI Support Assistant",
  healthAssessment: "Health Assessment",
  smartWaitlist: "Smart Waitlist",
  aiWaitlist: "AI-powered Waitlist",
  customWaitlistRules: "Custom Waitlist Rules",
  customBranding: "Custom Branding",
  advancedReports: "Advanced Reports",
  cancellationPredictions: "Cancellation Predictions",
  apiAccess: "API Access",
  webhooks: "Webhooks",
  multiLocation: "Multi-Location Support",
  emailSupport: "Email Support",
  chatSupport: "Chat Support",
  prioritySupport: "Priority Support",
  dedicatedManager: "Dedicated Account Manager",
};

/**
 * Feature categories for organized display
 */
export const featureCategories = {
  core: ["onlineScheduling", "clientPortal", "paymentProcessing"] as (keyof PlanFeatures)[],
  communication: ["emailReminders", "smsNotifications", "whatsappNotifications", "messagingBot"] as (keyof PlanFeatures)[],
  ai: ["aiSupportAssistant"] as (keyof PlanFeatures)[],
  clientManagement: ["healthAssessment"] as (keyof PlanFeatures)[],
  waitlist: ["smartWaitlist", "aiWaitlist", "customWaitlistRules"] as (keyof PlanFeatures)[],
  advanced: ["customBranding", "advancedReports", "cancellationPredictions"] as (keyof PlanFeatures)[],
  integrations: ["apiAccess", "webhooks"] as (keyof PlanFeatures)[],
  infrastructure: ["multiLocation"] as (keyof PlanFeatures)[],
  support: ["emailSupport", "chatSupport", "prioritySupport", "dedicatedManager"] as (keyof PlanFeatures)[],
};

/**
 * Get usage limit for a metered feature
 */
export function getUsageLimit(
  planId: PlanType,
  type: "messagingBotMessages" | "aiChats" | "apiCalls"
): number | "unlimited" {
  const limit = plans[planId].usageLimits?.[type] ?? 0;
  return limit === -1 ? "unlimited" : limit;
}
