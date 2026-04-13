// GET /api/admin/usage-alerts - Check usage approaching quota limits
// Returns alerts for messaging bot, AI chats, API calls, storage, and resource counts

import { NextRequest, NextResponse } from "next/server";
import { getUserPlan, getUsageStats } from "@/lib/plans/enforcement";
import { plans } from "@/lib/plans/index";

interface UsageAlert {
  type: string;
  label: string;
  current: number;
  limit: number | "unlimited";
  percentage: number;
  severity: "info" | "warning" | "critical";
}

// Alert thresholds
const WARNING_THRESHOLD = 0.8; // 80%
const CRITICAL_THRESHOLD = 0.95; // 95%

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const [planId, stats] = await Promise.all([
      getUserPlan(userId),
      getUsageStats(userId),
    ]);

    const plan = plans[planId];
    const alerts: UsageAlert[] = [];

    // Check resource limits
    const resourceChecks: Array<{
      type: string;
      label: string;
      current: number;
      limitKey: keyof typeof plan.limits;
    }> = [
      { type: "clients", label: "Active Clients", current: stats.clients, limitKey: "maxClients" },
      { type: "staff", label: "Team Members", current: stats.staff, limitKey: "maxStaff" },
      { type: "storage", label: "Storage (MB)", current: stats.storageUsedMB, limitKey: "storageMB" },
    ];

    for (const check of resourceChecks) {
      const limit = plan.limits[check.limitKey];
      if (limit === -1) continue; // unlimited

      const percentage = limit > 0 ? check.current / limit : 0;
      let severity: UsageAlert["severity"] = "info";
      if (percentage >= CRITICAL_THRESHOLD) severity = "critical";
      else if (percentage >= WARNING_THRESHOLD) severity = "warning";

      if (percentage >= WARNING_THRESHOLD) {
        alerts.push({
          type: check.type,
          label: check.label,
          current: check.current,
          limit,
          percentage: Math.round(percentage * 100),
          severity,
        });
      }
    }

    // Check usage limits (metered)
    const usageChecks: Array<{
      type: string;
      label: string;
      current: number;
      limitKey: "messagingBotMessages" | "aiChats" | "apiCalls";
    }> = [
      { type: "messagingBotMessages", label: "Bot Messages (monthly)", current: stats.messagingBotMessages, limitKey: "messagingBotMessages" },
      { type: "aiChats", label: "AI Chats (monthly)", current: stats.aiChats, limitKey: "aiChats" },
      { type: "apiCalls", label: "API Calls (monthly)", current: stats.apiCalls, limitKey: "apiCalls" },
    ];

    for (const check of usageChecks) {
      const limit = plan.usageLimits?.[check.limitKey] ?? 0;
      if (limit === -1 || limit === 0) continue; // unlimited or unavailable

      const percentage = check.current / limit;
      let severity: UsageAlert["severity"] = "info";
      if (percentage >= CRITICAL_THRESHOLD) severity = "critical";
      else if (percentage >= WARNING_THRESHOLD) severity = "warning";

      if (percentage >= WARNING_THRESHOLD) {
        alerts.push({
          type: check.type,
          label: check.label,
          current: check.current,
          limit,
          percentage: Math.round(percentage * 100),
          severity,
        });
      }
    }

    // Sort: critical first, then warning
    alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return NextResponse.json({
      plan: { id: planId, name: plan.name },
      alerts,
      hasAlerts: alerts.length > 0,
      hasCritical: alerts.some(a => a.severity === "critical"),
      usage: {
        clients: { current: stats.clients, limit: plan.limits.maxClients === -1 ? "unlimited" : plan.limits.maxClients },
        staff: { current: stats.staff, limit: plan.limits.maxStaff === -1 ? "unlimited" : plan.limits.maxStaff },
        storage: { current: stats.storageUsedMB, limit: plan.limits.storageMB === -1 ? "unlimited" : plan.limits.storageMB },
        messagingBotMessages: { current: stats.messagingBotMessages, limit: plan.usageLimits?.messagingBotMessages === -1 ? "unlimited" : (plan.usageLimits?.messagingBotMessages ?? 0) },
        aiChats: { current: stats.aiChats, limit: plan.usageLimits?.aiChats === -1 ? "unlimited" : (plan.usageLimits?.aiChats ?? 0) },
        apiCalls: { current: stats.apiCalls, limit: plan.usageLimits?.apiCalls === -1 ? "unlimited" : (plan.usageLimits?.apiCalls ?? 0) },
      },
    });
  } catch (error) {
    console.error("Error checking usage alerts:", error);
    return NextResponse.json({ error: "Failed to check usage alerts" }, { status: 500 });
  }
}
