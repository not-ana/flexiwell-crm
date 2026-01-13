// Plan types and feature flags for FlexiWell CRM
// 4 plans: Starter, Growth, Business, Enterprise (professional removed)

export type PlanType = "starter" | "growth" | "business" | "enterprise";

export interface PlanLimits {
  maxClients: number;
  maxStaff: number;
  maxLocations: number;
}

export interface PlanFeatures {
  // Core features
  basicScheduling: boolean;
  classManagement: boolean;
  clientProfiles: boolean;

  // Communication
  emailReminders: boolean;
  whatsappReminders: boolean;
  whatsappBot: boolean;
  instagramBot: boolean;
  smsReminders: boolean;

  // Reporting
  basicReports: boolean;
  advancedReports: boolean;
  revenueAnalytics: boolean;
  instructorAnalytics: boolean;
  exportReports: boolean;

  // Advanced features
  waitlist: boolean;
  makeupClasses: boolean;
  packages: boolean;
  memberships: boolean;

  // Integrations
  calendarSync: boolean;
  paymentIntegration: boolean;
  apiAccess: boolean;
  webhooks: boolean;

  // Multi-location
  multiLocation: boolean;

  // Support
  emailSupport: boolean;
  chatSupport: boolean;
  phoneSupport: boolean;
  prioritySupport: boolean;
  dedicatedManager: boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number; // per month when billed yearly
  };
  limits: PlanLimits;
  features: PlanFeatures;
  popular?: boolean;
}

// Plan definitions
// Updated January 2026 - 4 plans, unlimited team members
export const plans: Record<PlanType, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "Perfect for solo instructors and small studios just getting started",
    price: {
      monthly: 49,
      yearly: 39, // ~20% discount
    },
    limits: {
      maxClients: 100,
      maxStaff: -1, // unlimited
      maxLocations: 1,
    },
    features: {
      // Core - Basic
      basicScheduling: true,
      classManagement: true,
      clientProfiles: true,

      // Communication - Email only
      emailReminders: true,
      whatsappReminders: false,
      whatsappBot: false,
      instagramBot: false,
      smsReminders: false,

      // Reporting - Basic only
      basicReports: true,
      advancedReports: false,
      revenueAnalytics: false,
      instructorAnalytics: false,
      exportReports: true,

      // Advanced - Limited
      waitlist: true,
      makeupClasses: false,
      packages: true,
      memberships: false,

      // Integrations - Basic
      calendarSync: true,
      paymentIntegration: true,
      apiAccess: false,
      webhooks: false,

      // Multi-location - No
      multiLocation: false,

      // Support - Email only
      emailSupport: true,
      chatSupport: false,
      phoneSupport: false,
      prioritySupport: false,
      dedicatedManager: false,
    },
  },

  growth: {
    id: "growth",
    name: "Growth",
    description: "For growing studios ready to scale with smart automation",
    price: {
      monthly: 99,
      yearly: 79, // ~20% discount
    },
    limits: {
      maxClients: 500,
      maxStaff: -1, // unlimited
      maxLocations: 2,
    },
    features: {
      // Core - Full
      basicScheduling: true,
      classManagement: true,
      clientProfiles: true,

      // Communication - SMS + WhatsApp notifications (no bot)
      emailReminders: true,
      whatsappReminders: true,
      whatsappBot: false,
      instagramBot: false,
      smsReminders: true,

      // Reporting - Full
      basicReports: true,
      advancedReports: true,
      revenueAnalytics: true,
      instructorAnalytics: true,
      exportReports: true,

      // Advanced - Full
      waitlist: true,
      makeupClasses: true,
      packages: true,
      memberships: true,

      // Integrations - Basic + Wellhub
      calendarSync: true,
      paymentIntegration: true,
      apiAccess: false,
      webhooks: false,

      // Multi-location - Yes (2)
      multiLocation: true,

      // Support - Email + Chat
      emailSupport: true,
      chatSupport: true,
      phoneSupport: false,
      prioritySupport: false,
      dedicatedManager: false,
    },
  },

  business: {
    id: "business",
    name: "Business",
    description: "For established studios with AI-powered automation",
    price: {
      monthly: 249,
      yearly: 199, // ~20% discount
    },
    limits: {
      maxClients: 2000,
      maxStaff: -1, // unlimited
      maxLocations: 5,
    },
    features: {
      // Core - Full
      basicScheduling: true,
      classManagement: true,
      clientProfiles: true,

      // Communication - Full including WhatsApp Bot
      emailReminders: true,
      whatsappReminders: true,
      whatsappBot: true,
      instagramBot: true,
      smsReminders: true,

      // Reporting - Full
      basicReports: true,
      advancedReports: true,
      revenueAnalytics: true,
      instructorAnalytics: true,
      exportReports: true,

      // Advanced - Full
      waitlist: true,
      makeupClasses: true,
      packages: true,
      memberships: true,

      // Integrations - Full except custom
      calendarSync: true,
      paymentIntegration: true,
      apiAccess: true,
      webhooks: true,

      // Multi-location - Yes (5)
      multiLocation: true,

      // Support - Full except dedicated manager
      emailSupport: true,
      chatSupport: true,
      phoneSupport: false,
      prioritySupport: true,
      dedicatedManager: false,
    },
    popular: true,
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For studio networks and franchises requiring unlimited scale and customization",
    price: {
      monthly: 0, // Custom pricing
      yearly: 0,
    },
    limits: {
      maxClients: -1, // unlimited
      maxStaff: -1, // unlimited
      maxLocations: -1, // unlimited
    },
    features: {
      // Core - Full
      basicScheduling: true,
      classManagement: true,
      clientProfiles: true,

      // Communication - Full
      emailReminders: true,
      whatsappReminders: true,
      whatsappBot: true,
      instagramBot: true,
      smsReminders: true,

      // Reporting - Full
      basicReports: true,
      advancedReports: true,
      revenueAnalytics: true,
      instructorAnalytics: true,
      exportReports: true,

      // Advanced - Full
      waitlist: true,
      makeupClasses: true,
      packages: true,
      memberships: true,

      // Integrations - Full including custom
      calendarSync: true,
      paymentIntegration: true,
      apiAccess: true,
      webhooks: true,

      // Multi-location - Yes (unlimited)
      multiLocation: true,

      // Support - Full
      emailSupport: true,
      chatSupport: true,
      phoneSupport: true,
      prioritySupport: true,
      dedicatedManager: true,
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
  basicScheduling: "Basic Scheduling",
  classManagement: "Class Management",
  clientProfiles: "Client Profiles",
  emailReminders: "Email Reminders",
  whatsappReminders: "WhatsApp Reminders",
  whatsappBot: "WhatsApp Bot",
  instagramBot: "Instagram Bot",
  smsReminders: "SMS Reminders",
  basicReports: "Basic Reports",
  advancedReports: "Advanced Reports",
  revenueAnalytics: "Revenue Analytics",
  instructorAnalytics: "Instructor Analytics",
  exportReports: "Export Reports",
  waitlist: "Waitlist Management",
  makeupClasses: "Makeup Classes",
  packages: "Class Packages",
  memberships: "Memberships",
  calendarSync: "Calendar Sync",
  paymentIntegration: "Payment Integration",
  apiAccess: "API Access",
  webhooks: "Webhooks",
  multiLocation: "Multi-Location Support",
  emailSupport: "Email Support",
  chatSupport: "Chat Support",
  phoneSupport: "Phone Support",
  prioritySupport: "Priority Support",
  dedicatedManager: "Dedicated Account Manager",
};

/**
 * Feature categories for organized display
 */
export const featureCategories = {
  core: ["basicScheduling", "classManagement", "clientProfiles"] as (keyof PlanFeatures)[],
  communication: ["emailReminders", "whatsappReminders", "whatsappBot", "instagramBot", "smsReminders"] as (keyof PlanFeatures)[],
  reporting: ["basicReports", "advancedReports", "revenueAnalytics", "instructorAnalytics", "exportReports"] as (keyof PlanFeatures)[],
  advanced: ["waitlist", "makeupClasses", "packages", "memberships"] as (keyof PlanFeatures)[],
  integrations: ["calendarSync", "paymentIntegration", "apiAccess", "webhooks"] as (keyof PlanFeatures)[],
  infrastructure: ["multiLocation"] as (keyof PlanFeatures)[],
  support: ["emailSupport", "chatSupport", "phoneSupport", "prioritySupport", "dedicatedManager"] as (keyof PlanFeatures)[],
};
