// Plan types and feature flags for FlexiWell CRM
// 4 plans: Starter, Growth, Business, Professional
// Updated based on pricing page - January 2026

export type PlanType = "starter" | "growth" | "business" | "professional";

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

// Plan definitions based on pricing page
// https://flexiwell.net/pricing
export const plans: Record<PlanType, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "For independent instructors",
    price: {
      monthly: 99,
      yearly: 79, // ~20% discount
    },
    limits: {
      maxClients: 100,
      maxStaff: 1, // 1 team member
      maxLocations: 1,
      storageMB: 5 * 1024, // 5GB
    },
    features: {
      // Core - All included
      onlineScheduling: true,
      clientPortal: true,
      paymentProcessing: true,

      // Communication - Email only
      emailReminders: true,
      smsNotifications: false,
      whatsappNotifications: false,
      messagingBot: false,

      // AI Features - None
      aiSupportAssistant: false,

      // Health Assessment - None
      healthAssessment: false,

      // Waitlist - Basic
      smartWaitlist: false,
      aiWaitlist: false,
      customWaitlistRules: false,

      // Advanced - None
      customBranding: false,
      advancedReports: false,
      cancellationPredictions: false,

      // Integrations - None
      apiAccess: false,
      webhooks: false,

      // Multi-location - No
      multiLocation: false,

      // Support - Email only
      emailSupport: true,
      chatSupport: false,
      prioritySupport: false,
      dedicatedManager: false,
    },
    usageLimits: {
      messagingBotMessages: 0,
      aiChats: 0,
      apiCalls: 0,
    },
  },

  growth: {
    id: "growth",
    name: "Growth",
    description: "For growing studios",
    price: {
      monthly: 179,
      yearly: 143, // ~20% discount
    },
    limits: {
      maxClients: 500,
      maxStaff: -1, // unlimited
      maxLocations: 2,
      storageMB: 25 * 1024, // 25GB
    },
    features: {
      // Core - All included
      onlineScheduling: true,
      clientPortal: true,
      paymentProcessing: true,

      // Communication - SMS + WhatsApp notifications
      emailReminders: true,
      smsNotifications: true,
      whatsappNotifications: true,
      messagingBot: false,

      // AI Features - None
      aiSupportAssistant: false,

      // Health Assessment - Yes
      healthAssessment: true,

      // Waitlist - Smart (basic)
      smartWaitlist: true,
      aiWaitlist: false,
      customWaitlistRules: false,

      // Advanced - Advanced reports
      customBranding: false,
      advancedReports: true,
      cancellationPredictions: false,

      // Integrations - None
      apiAccess: false,
      webhooks: false,

      // Multi-location - Yes (2)
      multiLocation: true,

      // Support - Email + Chat
      emailSupport: true,
      chatSupport: true,
      prioritySupport: false,
      dedicatedManager: false,
    },
    usageLimits: {
      messagingBotMessages: 0,
      aiChats: 0,
      apiCalls: 0,
    },
  },

  business: {
    id: "business",
    name: "Business",
    description: "For established studios",
    price: {
      monthly: 299,
      yearly: 239, // ~20% discount
    },
    limits: {
      maxClients: 2000,
      maxStaff: -1, // unlimited
      maxLocations: 5,
      storageMB: 100 * 1024, // 100GB
    },
    features: {
      // Core - All included
      onlineScheduling: true,
      clientPortal: true,
      paymentProcessing: true,

      // Communication - Full including Bot
      emailReminders: true,
      smsNotifications: true,
      whatsappNotifications: true,
      messagingBot: true, // 5,000 msgs/month

      // AI Features - AI Support Assistant (2,000 chats/mo)
      aiSupportAssistant: true,

      // Health Assessment - Yes
      healthAssessment: true,

      // Waitlist - AI-powered smart waitlist
      smartWaitlist: true,
      aiWaitlist: true,
      customWaitlistRules: false,

      // Advanced - Custom branding + Cancellation predictions
      customBranding: true,
      advancedReports: true,
      cancellationPredictions: true,

      // Integrations - None
      apiAccess: false,
      webhooks: false,

      // Multi-location - Yes (5)
      multiLocation: true,

      // Support - Priority (24h)
      emailSupport: true,
      chatSupport: true,
      prioritySupport: true,
      dedicatedManager: false,
    },
    popular: true,
    usageLimits: {
      messagingBotMessages: 5000,
      aiChats: 2000,
      apiCalls: 0,
    },
  },

  professional: {
    id: "professional",
    name: "Professional",
    description: "For large studios and networks",
    price: {
      monthly: 499,
      yearly: 399, // ~20% discount
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
