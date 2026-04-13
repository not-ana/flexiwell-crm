// Server-side plan enforcement utilities
// Use these in API routes to check plan limits and features

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { plans, type PlanType, type PlanFeatures, type PlanLimits } from "./index";

export interface PlanCheckResult {
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number | "unlimited";
  upgradeRequired?: PlanType;
}

export interface UsageStats {
  clients: number;
  staff: number;
  messagingBotMessages: number;
  aiChats: number;
  apiCalls: number;
  storageUsedMB: number;
}

// Default plan for trial users - Retention Pro plan during trial
const DEFAULT_TRIAL_PLAN: PlanType = "retention_pro";

/**
 * Get user's current plan from database
 */
export async function getUserPlan(userId: string): Promise<PlanType> {
  const db = await getDatabase();
  const user = await db.collection("users").findOne({
    _id: new ObjectId(userId),
  });

  if (!user) {
    return "retention_pro"; // Default fallback
  }

  // During trial, give access to business plan features
  // Must also check trialEndDate to prevent stale flags granting indefinite access
  if (user.trialStatus === "active" || user.subscriptionStatus === "trialing") {
    const trialEnd = user.trialEndDate ? new Date(user.trialEndDate) : null;
    if (trialEnd && trialEnd < new Date()) {
      // Trial expired but flag wasn't updated — fix it now
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: { trialStatus: "expired", subscriptionStatus: "none", updatedAt: new Date() } }
      );
      return (user.planTier as PlanType) || "retention_pro";
    }
    return DEFAULT_TRIAL_PLAN;
  }

  return (user.planTier as PlanType) || "retention_pro";
}

/**
 * Get current usage stats for a user/admin
 */
export async function getUsageStats(userId: string): Promise<UsageStats> {
  const db = await getDatabase();

  const [clientCount, staffCount, usageDoc] = await Promise.all([
    // Count clients
    db.collection("clients").countDocuments({ adminId: userId }),
    // Count staff
    db.collection("staff").countDocuments({
      $or: [
        { adminId: userId },
        { establishmentId: { $in: await getEstablishmentIds(db, userId) } },
      ],
    }),
    // Get usage tracking document
    db.collection("usage_tracking").findOne({ userId }),
  ]);

  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-01"

  return {
    clients: clientCount,
    staff: staffCount,
    messagingBotMessages: usageDoc?.monthly?.[currentMonth]?.messagingBotMessages || 0,
    aiChats: usageDoc?.monthly?.[currentMonth]?.aiChats || 0,
    apiCalls: usageDoc?.monthly?.[currentMonth]?.apiCalls || 0,
    storageUsedMB: usageDoc?.storageUsedMB || 0,
  };
}

/**
 * Check if user can add more of a resource (clients, staff)
 */
export async function checkResourceLimit(
  userId: string,
  resource: keyof PlanLimits
): Promise<PlanCheckResult> {
  const planId = await getUserPlan(userId);
  const plan = plans[planId];
  const limit = plan.limits[resource];

  if (limit === -1) {
    return { allowed: true, limit: "unlimited" };
  }

  const stats = await getUsageStats(userId);
  let currentCount: number;

  switch (resource) {
    case "maxClients":
      currentCount = stats.clients;
      break;
    case "maxStaff":
      currentCount = stats.staff;
      break;
    case "storageMB":
      currentCount = stats.storageUsedMB;
      break;
    default:
      currentCount = 0;
  }

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `You've reached your ${plan.name} plan limit of ${formatLimit(resource, limit)}.`,
      currentCount,
      limit,
    };
  }

  return {
    allowed: true,
    currentCount,
    limit,
  };
}

/**
 * Check if user has access to a feature
 * Checks per-instance featureOverrides first, then falls back to plan defaults
 */
export async function checkFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures
): Promise<PlanCheckResult> {
  const db = await getDatabase();
  const user = await db.collection("users").findOne({
    _id: new ObjectId(userId),
  });

  const planId = (user?.planTier as PlanType) || "retention_pro";
  const plan = plans[planId];

  // Per-instance override takes priority (set during sales calls)
  const overrides = user?.featureOverrides as Partial<Record<string, boolean>> | undefined;
  if (overrides && feature in overrides) {
    if (overrides[feature]) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `The ${formatFeatureName(feature)} feature has been disabled for your account. Contact support to enable it.`,
    };
  }

  // Fall back to plan defaults
  if (plan.features[feature]) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `The ${formatFeatureName(feature)} feature is not available on your ${plan.name} plan.`,
  };
}

/**
 * Track usage for metered features (Messaging Bot, AI, API)
 */
export async function trackUsage(
  userId: string,
  type: "messagingBotMessages" | "aiChats" | "apiCalls",
  count: number = 1
): Promise<void> {
  const db = await getDatabase();
  const currentMonth = new Date().toISOString().slice(0, 7);

  await db.collection("usage_tracking").updateOne(
    { userId },
    {
      $inc: {
        [`monthly.${currentMonth}.${type}`]: count,
        [`total.${type}`]: count,
      },
      $set: { updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
}

/**
 * Check usage limits for metered features
 */
export async function checkUsageLimit(
  userId: string,
  type: "messagingBotMessages" | "aiChats" | "apiCalls"
): Promise<PlanCheckResult> {
  const planId = await getUserPlan(userId);
  const plan = plans[planId];
  const stats = await getUsageStats(userId);

  // Get limit from plan definition
  const limit = plan.usageLimits?.[type] ?? 0;

  // Feature not available
  if (limit === 0) {
    return {
      allowed: false,
      reason: `This feature is not available on your ${plan.name} plan.`,
      currentCount: 0,
      limit: 0,
    };
  }

  // Unlimited
  if (limit === -1) {
    return { allowed: true, limit: "unlimited" };
  }

  const currentCount = stats[type];

  if (currentCount >= limit) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${limit.toLocaleString()} ${formatUsageType(type)}.`,
      currentCount,
      limit,
    };
  }

  return {
    allowed: true,
    currentCount,
    limit,
  };
}

// Helper functions

async function getEstablishmentIds(
  db: Awaited<ReturnType<typeof getDatabase>>,
  userId: string
): Promise<string[]> {
  const establishments = await db
    .collection("establishments")
    .find({ ownerId: userId })
    .project({ _id: 1 })
    .toArray();

  return establishments.map((e) => e._id.toString());
}

function formatLimit(resource: keyof PlanLimits, limit: number): string {
  switch (resource) {
    case "maxClients":
      return `${limit} clients`;
    case "maxStaff":
      return `${limit} team members`;
    case "storageMB":
      return limit >= 1024 ? `${Math.floor(limit / 1024)}GB` : `${limit}MB`;
    default:
      return `${limit}`;
  }
}

function formatFeatureName(feature: keyof PlanFeatures): string {
  const names: Partial<Record<keyof PlanFeatures, string>> = {
    messagingBot: "Messaging Bot",
    aiSupportAssistant: "AI Support Assistant",
    smartWaitlist: "Smart Waitlist",
    aiWaitlist: "AI-powered Waitlist",
    customWaitlistRules: "Custom Waitlist Rules",
    customBranding: "Custom Branding",
    advancedReports: "Advanced Reports",
    cancellationPredictions: "Cancellation Predictions",
    apiAccess: "API Access",
  };

  return names[feature] || feature;
}

function formatUsageType(type: string): string {
  switch (type) {
    case "messagingBotMessages":
      return "bot messages";
    case "aiChats":
      return "AI chats";
    case "apiCalls":
      return "API calls";
    default:
      return type;
  }
}

/**
 * Middleware helper - returns error response if check fails
 */
export function createPlanErrorResponse(result: PlanCheckResult): {
  error: string;
  code: string;
  upgradeRequired?: PlanType;
  currentCount?: number;
  limit?: number | "unlimited";
} {
  return {
    error: result.reason || "Plan limit exceeded",
    code: "PLAN_LIMIT_EXCEEDED",
    upgradeRequired: result.upgradeRequired,
    currentCount: result.currentCount,
    limit: result.limit,
  };
}
