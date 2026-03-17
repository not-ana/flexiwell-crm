"use client";

import { useState, useRef, useEffect, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, UploadIcon } from "@/components/icons";
import { useClients } from "@/hooks/useData";
import { LoadingSpinner, LoadingTable } from "@/components/ui/LoadingSpinner";
import { ErrorMessage, EmptyState } from "@/components/ui/ErrorMessage";
import { StatCard } from "@/components/ui/StatCard";
import type { Client, ClientLifecycleStage } from "@/lib/api/client";
import type { IntakeStatus, OnboardingPhase } from "@/lib/db/schemas";
import { authFetch } from "@/lib/api/auth-fetch";
import { clientsApi } from "@/lib/api/client";
import { formatCurrency, getInitials } from "@/lib/utils/formatters";
import { INITIAL_PLANS } from "@/components/settings/PlansSettings";
import type { Plan } from "@/components/settings/PlansSettings";
import { Badge } from "@/components/ui/Badge";

type ClientStatus = "active" | "paused" | "expired" | "pending";

// ============================================
// Hormozi Lifecycle Stage Config
// ============================================
const lifecycleStyles: Record<ClientLifecycleStage, { bg: string; text: string; dot: string; label: string }> = {
  lead: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400", label: "Lead" },
  trial: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Trial" },
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Active" },
  at_risk: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", label: "At Risk" },
  churned: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Churned" },
  won_back: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", label: "Won Back" },
};

const statusStyles = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Active" },
  paused: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Paused" },
  expired: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Expired" },
  pending: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Pending" },
};

// ============================================
// Health Score Component
// ============================================
function HealthScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  const getColor = (s: number) => {
    if (s >= 70) return { ring: "text-green-500", bg: "bg-green-50", text: "text-green-700" };
    if (s >= 50) return { ring: "text-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700" };
    if (s >= 30) return { ring: "text-orange-500", bg: "bg-orange-50", text: "text-orange-700" };
    return { ring: "text-red-500", bg: "bg-red-50", text: "text-red-700" };
  };
  const colors = getColor(score);
  const dim = size === "sm" ? "w-9 h-9" : "w-11 h-11";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={`relative ${dim} flex items-center justify-center`} title={`Health Score: ${score}/100`}>
      <svg className={`absolute inset-0 ${dim}`} viewBox="0 0 36 36">
        <path
          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="#e5e7eb" strokeWidth="3"
        />
        <path
          d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="currentColor" strokeWidth="3"
          strokeDasharray={`${score}, 100`}
          className={colors.ring}
        />
      </svg>
      <span className={`${textSize} font-bold ${colors.text}`}>{score}</span>
    </div>
  );
}

// ============================================
// Streak Badge Component
// ============================================
function StreakBadge({ streak }: { streak: number }) {
  if (!streak || streak === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700" title={`${streak} week streak`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
      {streak}w
    </span>
  );
}

// ============================================
// Lifecycle Stage Badge
// ============================================
const LifecycleBadge = memo(function LifecycleBadge({ stage }: { stage: ClientLifecycleStage }) {
  const style = lifecycleStyles[stage] || lifecycleStyles.active;
  return <Badge style={style} />;
});

const StatusBadge = memo(function StatusBadge({ status }: { status: ClientStatus }) {
  const style = statusStyles[status] || statusStyles.active;
  return <Badge style={style} />;
});

// ============================================
// Intake Pipeline Badge
// ============================================
const intakeStyles: Record<IntakeStatus, { bg: string; text: string; ring: string; label: string; icon: string }> = {
  not_sent: { bg: "bg-gray-50", text: "text-gray-500", ring: "ring-gray-300/50", label: "Intake not sent", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  sent: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-600/10", label: "Intake sent", icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" },
  opened: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-600/10", label: "Intake opened", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
  completed: { bg: "bg-green-50", text: "text-green-600", ring: "ring-green-600/10", label: "Intake completed", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
};

function IntakePipelineBadge({ status, compact }: { status: IntakeStatus; compact?: boolean }) {
  const style = intakeStyles[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text} ring-1 ring-inset ${style.ring}`} title={style.label}>
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={style.icon} /></svg>
      {!compact && style.label}
    </span>
  );
}

// ============================================
// Onboarding Phase Badge (behavior-based)
// ============================================
const onboardingPhaseStyles: Record<OnboardingPhase, { bg: string; text: string; ring: string; label: string }> = {
  welcome: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-600/10", label: "Welcome" },
  health_assessment: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-600/10", label: "Health form" },
  first_booking: { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-600/10", label: "Needs booking" },
  pre_class: { bg: "bg-cyan-50", text: "text-cyan-600", ring: "ring-cyan-600/10", label: "Pre-class" },
  post_class: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-600/10", label: "Feedback" },
  week_one: { bg: "bg-teal-50", text: "text-teal-600", ring: "ring-teal-600/10", label: "Week 1" },
  goal_review: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-600/10", label: "Goal review" },
  completed: { bg: "bg-green-50", text: "text-green-600", ring: "ring-green-600/10", label: "Onboarded" },
};

function OnboardingBadge({ phase, hasStaffAlert }: { phase?: OnboardingPhase; hasStaffAlert?: boolean }) {
  if (!phase || phase === "completed") return null;
  const style = onboardingPhaseStyles[phase];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text} ring-1 ring-inset ${style.ring}`} title={`Onboarding: ${style.label}`}>
      {hasStaffAlert && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
      )}
      {style.label}
    </span>
  );
}

// ============================================
// Upgrade Suggestion Chip
// ============================================
function UpgradeChip({ client }: { client: Client }) {
  const plan = typeof client.plan === "object" ? client.plan : null;
  if (!plan) return null;

  const utilization = plan.totalClasses > 0 ? plan.usedClasses / plan.totalClasses : 0;

  if (plan.type === "drop-in") {
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded-full whitespace-nowrap">
        Suggest monthly
      </span>
    );
  }
  if (plan.type === "monthly" && utilization > 0.8) {
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded-full whitespace-nowrap">
        Suggest quarterly
      </span>
    );
  }
  if (plan.type === "quarterly" && (client.currentStreak || 0) >= 12) {
    return (
      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded-full whitespace-nowrap">
        Suggest annual
      </span>
    );
  }
  return null;
}

// ============================================
// Client Row (Desktop Table) - Redesigned
// ============================================
const ClientRow = memo(function ClientRow({ client, onSendIntake, onEdit, onDelete, onWinBack }: {
  client: Client;
  onSendIntake?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onWinBack?: () => void;
}) {
  const status = (client.status as ClientStatus) || "active";
  const lifecycle = client.lifecycleStage || "active";
  const classesRemaining = client.classesRemaining || 0;
  const classesTotal = client.classesTotal || 0;
  const progressPercent = classesTotal > 0 ? (classesRemaining / classesTotal) * 100 : 0;
  const healthScore = client.healthScore?.overall ?? null;
  const planName = typeof client.plan === "string" ? client.plan : (client.plan?.type || "—");
  const planObj = typeof client.plan === "object" ? client.plan : null;
  const hasDiscount = !!(planObj?.discountType);
  const ltv = client.totalLifetimeRevenue || client.revenue || 0;

  return (
    <tr
      className={`hover:bg-gray-50/80 transition-colors group cursor-pointer ${lifecycle === "at_risk" ? "bg-orange-50/30" : lifecycle === "churned" ? "bg-red-50/20" : ""}`}
      onClick={() => window.location.href = `/admin/clients/${client._id}`}
    >
      {/* Client info + health score */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {healthScore !== null ? (
            <HealthScoreBadge score={healthScore} />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary-700">{getInitials(client.name)}</span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">{client.name}</span>
              <StreakBadge streak={client.currentStreak || 0} />
            </div>
            <p className="text-xs text-gray-500 truncate">{client.email}</p>
          </div>
        </div>
      </td>
      {/* Stage + Status combined */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <LifecycleBadge stage={lifecycle} />
          {status !== "active" && status !== "pending" && <StatusBadge status={status} />}
          <OnboardingBadge
            phase={client.onboarding?.currentPhase as OnboardingPhase}
            hasStaffAlert={client.onboarding?.staffAlertActive}
          />
        </div>
      </td>
      {/* Plan + Classes progress */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-900 capitalize">{planName}</p>
          {hasDiscount && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-50 text-green-600 rounded-full whitespace-nowrap" title={planObj?.discountReason || "Custom price"}>
              {planObj?.discountType === "percentage" ? `−${planObj.discountValue}%` : planObj?.discountType === "fixed" ? `−$${planObj.discountValue}` : `$${planObj?.price}`}
            </span>
          )}
          <UpgradeChip client={client} />
        </div>
        {classesTotal > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${progressPercent > 50 ? "bg-green-500" : progressPercent > 20 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{classesRemaining}/{classesTotal}</span>
          </div>
        )}
      </td>
      {/* LTV */}
      <td className="px-4 py-3">
        <p className={`text-sm font-medium ${ltv > 0 ? "text-gray-900" : "text-gray-400"}`}>
          {ltv > 0 ? formatCurrency(ltv) : "—"}
        </p>
      </td>
      {/* Last Activity */}
      <td className="px-4 py-3">
        <p className={`text-sm ${client.lastActivity ? "text-gray-700" : "text-gray-400"}`}>
          {client.lastActivity || "—"}
        </p>
      </td>
      {/* Actions */}
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        {!client.onboarding?.healthAssessmentCompleted && client.onboarding?.intakeStatus !== "completed" ? (
          <button onClick={onSendIntake} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors ring-1 ring-inset ring-blue-600/10">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            {client.onboarding?.intakeStatus === "sent" || client.onboarding?.intakeStatus === "opened" ? "Resend" : "Send intake"}
          </button>
        ) : lifecycle === "churned" ? (
          <button onClick={onWinBack} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-xs">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>
            Win Back
          </button>
        ) : (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
});

// ============================================
// Client Card (Mobile) - Redesigned
// ============================================
function ClientCard({ client, onSendIntake, onEdit, onDelete, onWinBack }: {
  client: Client;
  onSendIntake?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onWinBack?: () => void;
}) {
  const status = (client.status as ClientStatus) || "active";
  const lifecycle = client.lifecycleStage || "active";
  const classesRemaining = client.classesRemaining || 0;
  const classesTotal = client.classesTotal || 0;
  const progressPercent = classesTotal > 0 ? (classesRemaining / classesTotal) * 100 : 0;
  const healthScore = client.healthScore?.overall ?? null;
  const planName = typeof client.plan === "string" ? client.plan : (client.plan?.type || "—");
  const planObj = typeof client.plan === "object" ? client.plan : null;
  const hasDiscount = !!(planObj?.discountType);
  const ltv = client.totalLifetimeRevenue || client.revenue || 0;

  return (
    <div
      className={`p-4 border-b border-gray-100 last:border-b-0 cursor-pointer active:bg-gray-50 ${lifecycle === "at_risk" ? "bg-orange-50/30" : lifecycle === "churned" ? "bg-red-50/20" : ""}`}
      onClick={() => window.location.href = `/admin/clients/${client._id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          {healthScore !== null ? (
            <HealthScoreBadge score={healthScore} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary-700">{getInitials(client.name)}</span>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">{client.name}</span>
              <StreakBadge streak={client.currentStreak || 0} />
            </div>
            <p className="text-xs text-gray-500 truncate">{client.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <LifecycleBadge stage={lifecycle} />
          <OnboardingBadge
            phase={client.onboarding?.currentPhase as OnboardingPhase}
            hasStaffAlert={client.onboarding?.staffAlertActive}
          />
        </div>
      </div>

      {/* Key info row */}
      <div className="flex items-center gap-4 text-sm ml-[52px]">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 text-xs">Plan</span>
          <span className="font-medium text-gray-700 capitalize">{planName}</span>
          {hasDiscount && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-50 text-green-600 rounded-full whitespace-nowrap">
              {planObj?.discountType === "percentage" ? `−${planObj.discountValue}%` : planObj?.discountType === "fixed" ? `−$${planObj.discountValue}` : `$${planObj?.price}`}
            </span>
          )}
          <UpgradeChip client={client} />
        </div>
        {classesTotal > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${progressPercent > 50 ? "bg-green-500" : progressPercent > 20 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{classesRemaining}/{classesTotal}</span>
          </div>
        )}
        {ltv > 0 && (
          <span className="text-xs font-medium text-emerald-600">{formatCurrency(ltv)}</span>
        )}
      </div>

      {/* Actions */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="mt-3 ml-[52px]" onClick={(e) => e.stopPropagation()}>
        {!client.onboarding?.healthAssessmentCompleted && client.onboarding?.intakeStatus !== "completed" ? (
          <button onClick={onSendIntake} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors ring-1 ring-inset ring-blue-600/10">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            {client.onboarding?.intakeStatus === "sent" || client.onboarding?.intakeStatus === "opened" ? "Resend" : "Send intake"}
          </button>
        ) : lifecycle === "churned" ? (
          <button onClick={onWinBack} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-xs">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>
            Win Back
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Plans (from Settings)
// ============================================
const activePlans = INITIAL_PLANS.filter((p) => p.isActive);

// ============================================
// Add Client Modal
// ============================================
function AddClientModal({
  isOpen, onClose, onSubmit, isSubmitting, apiError,
}: {
  isOpen: boolean; onClose: () => void;
  onSubmit: (data: Partial<Client> & { _sendIntake?: boolean; _intakeChannel?: string; _intakeStatus?: string }) => Promise<void>;
  isSubmitting: boolean;
  apiError?: string;
}) {
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "",
    plan: activePlans[0]?.id || "",
    unit: "FlexiWell Downtown", notes: "",
    hasDiscount: false,
    discountType: "percentage" as "percentage" | "fixed" | "custom",
    discountValue: 0,
    customPrice: 0,
    discountReason: "",
  });
  const [sendIntakeForm, setSendIntakeForm] = useState(true);
  const [intakeChannel, setIntakeChannel] = useState<"whatsapp" | "email" | "sms">("whatsapp");
  const [formError, setFormError] = useState("");

  const selectedPlan = activePlans.find((p) => p.id === formData.plan) || activePlans[0];

  const calculatedPrice = (() => {
    const base = selectedPlan?.price || 0;
    if (!formData.hasDiscount) return base;
    if (formData.discountType === "percentage") return Math.round(base * (1 - formData.discountValue / 100) * 100) / 100;
    if (formData.discountType === "fixed") return Math.max(0, base - formData.discountValue);
    return formData.customPrice || base; // custom
  })();

  const handleSubmit = async () => {
    setFormError("");
    if (!formData.name || !formData.email) {
      setFormError("Please fill in name and email");
      return;
    }
    if (sendIntakeForm && (intakeChannel === "whatsapp" || intakeChannel === "sms") && !formData.phone) {
      setFormError("Phone number is required for WhatsApp/SMS");
      return;
    }
    const clientData: Partial<Client> & { _sendIntake?: boolean; _intakeChannel?: string; _intakeStatus?: string } = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      plan: selectedPlan.name,
      unit: formData.unit,
      status: "active",
      _sendIntake: sendIntakeForm,
      _intakeChannel: intakeChannel,
      _intakeStatus: sendIntakeForm ? "sent" : "not_sent",
    };
    if (formData.hasDiscount) {
      (clientData as Record<string, unknown>)._discount = {
        type: formData.discountType,
        value: formData.discountType === "custom" ? undefined : formData.discountValue,
        customPrice: formData.discountType === "custom" ? formData.customPrice : undefined,
        reason: formData.discountReason,
        finalPrice: calculatedPrice,
        originalPrice: selectedPlan?.price || 0,
      };
    }
    await onSubmit(clientData);
  };

  if (!isOpen) return null;

  const channelOptions = [
    { value: "whatsapp" as const, label: "WhatsApp", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    { value: "email" as const, label: "Email", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
    { value: "sms" as const, label: "SMS", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Add Client</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {(formError || apiError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{formError || apiError}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input type="text" value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFormError(""); }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter client's full name" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone {sendIntakeForm && intakeChannel !== "email" ? "*" : ""}
              </label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="(555) 123-4567" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan *</label>
            <select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              {activePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price}/{plan.period}
                  {plan.classes === -1 ? " (Unlimited)" : ` (${plan.classes} classes)`}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Pricing Section */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasDiscount}
                onChange={(e) => setFormData({ ...formData, hasDiscount: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Custom pricing</span>
                <p className="text-xs text-gray-500">Apply a discount or set a custom price for this client</p>
              </div>
            </label>

            {formData.hasDiscount && (
              <div className="mt-3 ml-7 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount type</label>
                  <div className="flex gap-2">
                    {([
                      { value: "percentage" as const, label: "%" },
                      { value: "fixed" as const, label: "$" },
                      { value: "custom" as const, label: "Custom" },
                    ]).map((opt) => (
                      <button key={opt.value} type="button"
                        onClick={() => setFormData({ ...formData, discountType: opt.value })}
                        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                          formData.discountType === opt.value
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>

                {formData.discountType !== "custom" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.discountType === "percentage" ? "Discount (%)" : "Discount ($)"}
                    </label>
                    <input type="number" min="0" max={formData.discountType === "percentage" ? 100 : selectedPlan?.price || 9999}
                      value={formData.discountValue || ""}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={formData.discountType === "percentage" ? "e.g. 20" : "e.g. 50"} />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Final price ($)</label>
                    <input type="number" min="0"
                      value={formData.customPrice || ""}
                      onChange={(e) => setFormData({ ...formData, customPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g. 199" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                  <input type="text"
                    value={formData.discountReason}
                    onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. early bird, family, partner" />
                </div>

                {/* Price summary */}
                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">List price</p>
                    <p className="text-sm text-gray-400 line-through">${selectedPlan?.price || 0}/{selectedPlan?.period || "month"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Final price</p>
                    <p className="text-lg font-semibold text-green-600">${calculatedPrice}/{selectedPlan?.period || "month"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Intake Form Section */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendIntakeForm}
                onChange={(e) => setSendIntakeForm(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Send intake form (health assessment)</span>
                <p className="text-xs text-gray-500">Client will receive a link to complete their health assessment</p>
              </div>
            </label>

            {sendIntakeForm && (
              <div className="mt-3 ml-7">
                <label className="block text-sm font-medium text-gray-700 mb-2">Send via</label>
                <div className="flex gap-2">
                  {channelOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setIntakeChannel(option.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        intakeChannel === option.value
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {option.icon} {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? <LoadingSpinner size="sm" className="text-white" /> : null}
            {sendIntakeForm ? "Add & Send Form" : "Add Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Import Modal
// ============================================
function ImportModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors?: { row: number; email: string; error: string }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setFile(e.target.files[0]); };

  const parseCSV = (content: string): Record<string, string>[] => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ""; });
      return { name: row.name || "", email: row.email || "", phone: row.phone || "", planType: row.plan?.includes("quarterly") ? "quarterly" : row.plan?.includes("annual") ? "annual" : "monthly" };
    });
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const content = await file.text();
      const clientsData = parseCSV(content);
      if (clientsData.length === 0) { setImportResult({ success: 0, failed: 0, errors: [{ row: 0, email: "", error: "No valid data found" }] }); setImporting(false); return; }
      const response = await fetch("/api/clients/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientsData }) });
      const result = await response.json();
      if (response.ok) { setImportResult({ success: result.results.success, failed: result.results.failed, errors: result.results.errors }); if (result.results.success > 0 && onSuccess) onSuccess(); }
      else { setImportResult({ success: 0, failed: clientsData.length, errors: [{ row: 0, email: "", error: result.error || "Import failed" }] }); }
    } catch { setImportResult({ success: 0, failed: 0, errors: [{ row: 0, email: "", error: "Failed to process import" }] }); }
    finally { setImporting(false); }
  };

  const resetModal = () => { setFile(null); setImportResult(null); onClose(); };
  const downloadTemplate = () => {
    const blob = new Blob(["Name,Email,Phone,Plan\nJohn Smith,john@email.com,(555) 123-4567,Monthly - 8 classes\nJane Doe,jane@email.com,(555) 234-5678,Quarterly - 24 classes"], { type: "text/csv" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "client_import_template.csv"; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Import Clients</h2>
            <button onClick={resetModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {!importResult ? (
            <>
              <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-gray-400"}`}>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg></div>
                    <div className="text-left"><p className="font-medium text-gray-900">{file.name}</p><p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p></div>
                    <button onClick={() => setFile(null)} className="p-1 text-gray-400 hover:text-red-500"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4"><UploadIcon className="w-6 h-6 text-gray-400" /></div>
                    <p className="text-gray-600 mb-2"><button onClick={() => fileInputRef.current?.click()} className="text-primary-600 font-medium hover:text-primary-700">Click to upload</button> or drag and drop</p>
                    <p className="text-sm text-gray-500">CSV or Excel file (max 10MB)</p>
                  </>
                )}
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center"><svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg></div>
                    <div><p className="text-sm font-medium text-gray-900">Download template</p><p className="text-xs text-gray-500">Use our template for best results</p></div>
                  </div>
                  <button onClick={downloadTemplate} className="text-sm text-primary-600 font-medium hover:text-primary-700">Download</button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <div className={`w-16 h-16 ${importResult.success > 0 ? "bg-green-100" : "bg-red-100"} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {importResult.success > 0 ? <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> : <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{importResult.success > 0 ? "Import Complete!" : "Import Failed"}</h3>
              <div className="flex items-center justify-center gap-6 mb-4">
                {importResult.success > 0 && <div><p className="text-2xl font-bold text-green-600">{importResult.success}</p><p className="text-sm text-gray-500">Imported</p></div>}
                {importResult.failed > 0 && <div><p className="text-2xl font-bold text-red-600">{importResult.failed}</p><p className="text-sm text-gray-500">Failed</p></div>}
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4 max-h-32 overflow-y-auto text-left">
                  <p className="text-sm font-medium text-gray-700 mb-2">Errors:</p>
                  {importResult.errors.slice(0, 5).map((err, idx) => (
                    <p key={idx} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mb-1">{err.row > 0 ? `Row ${err.row}` : ""}{err.email ? ` (${err.email})` : ""}: {err.error}</p>
                  ))}
                  {importResult.errors.length > 5 && <p className="text-xs text-gray-500">...and {importResult.errors.length - 5} more</p>}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white">
          <button onClick={resetModal} className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50">{importResult ? "Close" : "Cancel"}</button>
          {!importResult && (
            <button onClick={handleImport} disabled={!file || importing}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 flex items-center justify-center gap-2">
              {importing ? <LoadingSpinner size="sm" className="text-white" /> : null}
              {importing ? "Importing..." : "Import Clients"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// At-Risk Alert Banner
// ============================================
function AtRiskBanner({ clients, onViewAtRisk }: { clients: Client[]; onViewAtRisk: () => void }) {
  const atRiskClients = clients.filter(c => c.lifecycleStage === "at_risk" || (c.healthScore && c.healthScore.overall < 40));
  if (atRiskClients.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-orange-900">{atRiskClients.length} client{atRiskClients.length !== 1 ? "s" : ""} at risk</p>
            <p className="text-sm text-orange-700">
              {atRiskClients.slice(0, 3).map(c => c.name).join(", ")}
              {atRiskClients.length > 3 ? ` +${atRiskClients.length - 3} more` : ""}
            </p>
          </div>
        </div>
        <button onClick={onViewAtRisk}
          className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors whitespace-nowrap">
          View
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Page Component - Redesigned
// ============================================
export default function AdminClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<"all" | ClientLifecycleStage>("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const { clients, isLoading, error, refetch, createClient, updateClient, deleteClient } = useClients({
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const [addClientError, setAddClientError] = useState("");
  const handleAddClient = async (data: Partial<Client> & { _sendIntake?: boolean; _intakeChannel?: string; _intakeStatus?: string }) => {
    setIsSubmitting(true);
    setAddClientError("");
    try {
      // Extract discount data and build plan object with pricing
      const discount = (data as Record<string, unknown>)._discount as { type?: string; value?: number; customPrice?: number; reason?: string; finalPrice?: number; originalPrice?: number } | undefined;
      const planName = typeof data.plan === "string" ? data.plan : "";
      const selectedPlanDef = activePlans.find((p) => p.name === planName) || activePlans.find((p) => p.id === planName) || activePlans[0];

      const planPayload: Record<string, unknown> = {
        type: selectedPlanDef?.id || "monthly",
        totalClasses: selectedPlanDef?.classes === -1 ? 999 : (selectedPlanDef?.classes || 8),
        usedClasses: 0,
        remainingClasses: selectedPlanDef?.classes === -1 ? 999 : (selectedPlanDef?.classes || 8),
        startDate: new Date(),
        endDate: new Date(Date.now() + (selectedPlanDef?.period === "year" ? 365 : 30) * 86_400_000),
        price: discount ? discount.finalPrice : (selectedPlanDef?.price || 299),
      };
      if (discount && discount.type) {
        planPayload.originalPrice = discount.originalPrice || selectedPlanDef?.price || 0;
        planPayload.discountType = discount.type;
        if (discount.type !== "custom") planPayload.discountValue = discount.value;
        if (discount.reason) planPayload.discountReason = discount.reason;
      }

      if (data._sendIntake) {
        const response = await authFetch("/api/clients/send-intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
            plan: planPayload,
            unit: data.unit,
            channel: data._intakeChannel || "whatsapp",
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          setAddClientError(result.error || "Failed to add client");
        } else {
          setShowAddClientModal(false);
          refetch();
        }
      } else {
        const result = await createClient({ name: data.name, email: data.email, phone: data.phone, plan: planPayload as unknown as Client["plan"], unit: data.unit, status: data.status });
        if (!result.success) {
          setAddClientError(result.error || "Failed to add client");
        } else {
          setShowAddClientModal(false);
        }
      }
    } finally { setIsSubmitting(false); }
  };

  const handleSendIntake = async (client: Client) => {
    try {
      const response = await authFetch("/api/clients/send-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client._id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          channel: client.onboarding?.intakeSentVia || "email",
        }),
      });
      if (!response.ok) {
        const result = await response.json();
        alert(result.error || "Failed to send intake");
      } else {
        refetch();
      }
    } catch { alert("Failed to send intake form"); }
  };

  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleUpdateClient = async (data: Partial<Client> & { _discount?: Record<string, unknown> }) => {
    if (!editingClient) return;
    setIsSubmitting(true);
    try {
      const discount = data._discount as { clear?: boolean; type?: string; value?: number; customPrice?: number; reason?: string; finalPrice?: number; originalPrice?: number } | undefined;
      const updateData: Partial<Client> = { name: data.name, email: data.email, phone: data.phone, status: data.status, lifecycleStage: data.lifecycleStage };

      // Build plan update with discount
      const existingPlan = typeof editingClient.plan === "object" ? editingClient.plan : null;
      if (discount && !discount.clear) {
        updateData.plan = {
          ...(existingPlan || {}),
          price: discount.finalPrice || existingPlan?.price || 0,
          originalPrice: discount.originalPrice || existingPlan?.price || 0,
          discountType: discount.type as "percentage" | "fixed" | "custom",
          discountValue: discount.type !== "custom" ? (discount.value as number) : undefined,
          discountReason: discount.reason as string,
        } as Client["plan"];
      } else if (discount?.clear && existingPlan) {
        updateData.plan = {
          ...existingPlan,
          price: existingPlan.originalPrice || existingPlan.price,
          originalPrice: undefined,
          discountType: undefined,
          discountValue: undefined,
          discountReason: undefined,
        } as Client["plan"];
      }

      // Update plan type if changed
      const planName = typeof data.plan === "string" ? data.plan : "";
      const newPlanDef = activePlans.find((p) => p.name === planName) || activePlans.find((p) => p.id === planName);
      if (newPlanDef && updateData.plan) {
        (updateData.plan as unknown as Record<string, unknown>).type = newPlanDef.id;
      } else if (newPlanDef) {
        updateData.plan = planName as unknown as Client["plan"];
      }

      const result = await updateClient(editingClient._id, updateData);
      if (!result.success) alert(result.error || "Failed to update client");
      else setEditingClient(null);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteClick = (client: Client) => setClientToDelete(client);
  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    const result = await deleteClient(clientToDelete._id);
    if (!result.success) alert(result.error || "Failed to delete client");
    setClientToDelete(null);
  };

  const handleWinBack = async (clientId: string) => {
    try {
      await clientsApi.sendWinBack([clientId]);
      alert("Win-back campaign sent!");
    } catch { alert("Failed to send win-back campaign"); }
  };

  // Filter by lifecycle
  const filteredClients = (clients || []).filter(c => {
    if (lifecycleFilter === "all") return true;
    return (c.lifecycleStage || "active") === lifecycleFilter;
  });

  // Summary metrics
  const metrics = useMemo(() => {
    const all = clients || [];
    const totalRevenue = all.reduce((sum, c) => sum + (c.totalLifetimeRevenue || c.revenue || 0), 0);
    const atRisk = all.filter(c => c.lifecycleStage === "at_risk").length;
    const active = all.filter(c => (c.lifecycleStage || "active") === "active").length;
    const healthScores = all.filter(c => c.healthScore?.overall != null).map(c => c.healthScore!.overall);
    const avgHealth = healthScores.length > 0 ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length) : 0;
    return { total: all.length, totalRevenue, atRisk, active, avgHealth };
  }, [clients]);

  // Lifecycle counts for filter tabs
  const lifecycleCounts = useMemo(() => {
    const all = clients || [];
    const counts: Record<string, number> = { all: all.length };
    for (const c of all) {
      const stage = c.lifecycleStage || "active";
      counts[stage] = (counts[stage] || 0) + 1;
    }
    return counts;
  }, [clients]);

  if (error) {
    return <div className="p-4 sm:p-6 lg:p-8"><ErrorMessage message={error} onRetry={refetch} /></div>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-8 pb-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Clients</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImportModal(true)}
              className="p-2 lg:px-3 lg:py-2 text-gray-600 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <UploadIcon className="w-4 h-4" /><span className="hidden lg:inline text-sm">Import</span>
            </button>
            <button onClick={() => setShowAddClientModal(true)}
              className="px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              <span className="hidden sm:inline">Add Client</span>
            </button>
          </div>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <StatCard label="Total" value={metrics.total} />
          <StatCard label="Active" value={metrics.active} accent="emerald" />
          <StatCard label="At Risk" value={metrics.atRisk} accent={metrics.atRisk > 0 ? "orange" : "default"} muted={metrics.atRisk === 0} />
          <StatCard label="Avg Health" value={metrics.avgHealth > 0 ? metrics.avgHealth : "—"} muted={metrics.avgHealth === 0} />
          <StatCard label="Total LTV" value={metrics.totalRevenue > 0 ? formatCurrency(metrics.totalRevenue) : "—"} muted={metrics.totalRevenue === 0} />
        </div>

        {/* At-Risk Banner */}
        <AtRiskBanner
          clients={clients || []}
          onViewAtRisk={() => setLifecycleFilter("at_risk")}
        />

        {/* Search + status filter */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search clients..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-400" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Lifecycle tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-gray-50 p-1 ring-1 ring-inset ring-gray-200 w-fit overflow-x-auto">
          {[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "trial", label: "Trial" },
            { value: "at_risk", label: "At Risk" },
            { value: "churned", label: "Churned" },
            { value: "lead", label: "Lead" },
            { value: "won_back", label: "Won Back" },
          ].filter(tab => tab.value === "all" || (lifecycleCounts[tab.value] || 0) > 0).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setLifecycleFilter(tab.value as typeof lifecycleFilter)}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                lifecycleFilter === tab.value
                  ? "bg-white text-gray-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {(lifecycleCounts[tab.value] || 0) > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  lifecycleFilter === tab.value ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {lifecycleCounts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 sm:p-6 lg:p-8"><LoadingTable rows={5} /></div>
        ) : filteredClients.length > 0 ? (
          <div className="bg-white">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LTV</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClients.map((client) => (
                    <ClientRow
                      key={client._id}
                      client={client}
                      onSendIntake={() => handleSendIntake(client)}
                      onEdit={() => setEditingClient(client)}
                      onDelete={() => handleDeleteClick(client)}
                      onWinBack={() => handleWinBack(client._id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredClients.map((client) => (
                <ClientCard
                  key={client._id}
                  client={client}
                  onSendIntake={() => handleSendIntake(client)}
                  onEdit={() => setEditingClient(client)}
                  onDelete={() => handleDeleteClick(client)}
                  onWinBack={() => handleWinBack(client._id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 lg:p-8">
            <EmptyState
              title="No clients found"
              description={searchQuery || statusFilter !== "all" || lifecycleFilter !== "all" ? "Try adjusting your search filters" : "Add your first client to get started"}
              icon={
                <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              action={!searchQuery && statusFilter === "all" && lifecycleFilter === "all" ? { label: "Add Client", onClick: () => setShowAddClientModal(true) } : undefined}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onSuccess={refetch} />
      <AddClientModal isOpen={showAddClientModal} onClose={() => { setShowAddClientModal(false); setAddClientError(""); }} onSubmit={handleAddClient} isSubmitting={isSubmitting} apiError={addClientError} />
      <EditClientModal client={editingClient} isOpen={!!editingClient} onClose={() => setEditingClient(null)} onSubmit={handleUpdateClient} isSubmitting={isSubmitting} />

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Client</h3>
              <p className="text-sm text-gray-600 text-center">
                Are you sure you want to delete <span className="font-medium text-gray-900">{clientToDelete.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setClientToDelete(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleDeleteConfirm} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Edit Client Modal with Lifecycle Stage
// ============================================
function EditClientModal({
  client, isOpen, onClose, onSubmit, isSubmitting,
}: {
  client: Client | null; isOpen: boolean; onClose: () => void;
  onSubmit: (data: Partial<Client>) => Promise<void>; isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", plan: "", status: "active" as ClientStatus,
    lifecycleStage: "active" as ClientLifecycleStage,
    hasDiscount: false,
    discountType: "percentage" as "percentage" | "fixed" | "custom",
    discountValue: 0,
    customPrice: 0,
    discountReason: "",
    originalPrice: 0,
  });

  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && client) {
      const planObj = typeof client.plan === "object" ? client.plan : null;
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        plan: typeof client.plan === "string" ? client.plan : (client.plan?.type || ""),
        status: (client.status as ClientStatus) || "active",
        lifecycleStage: client.lifecycleStage || "active",
        hasDiscount: !!(planObj?.discountType),
        discountType: (planObj?.discountType as "percentage" | "fixed" | "custom") || "percentage",
        discountValue: planObj?.discountValue || 0,
        customPrice: planObj?.discountType === "custom" ? (planObj?.price || 0) : 0,
        discountReason: planObj?.discountReason || "",
        originalPrice: planObj?.originalPrice || planObj?.price || 0,
      });
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, client]);

  const selectedPlanDef = activePlans.find((p) => p.name === formData.plan) || activePlans.find((p) => p.id === formData.plan);
  const basePrice = formData.originalPrice || selectedPlanDef?.price || 0;

  const editCalculatedPrice = (() => {
    if (!formData.hasDiscount) return basePrice;
    if (formData.discountType === "percentage") return Math.round(basePrice * (1 - formData.discountValue / 100) * 100) / 100;
    if (formData.discountType === "fixed") return Math.max(0, basePrice - formData.discountValue);
    return formData.customPrice || basePrice;
  })();

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) { alert("Please fill in name and email"); return; }
    const data: Partial<Client> & { _discount?: Record<string, unknown> } = {
      name: formData.name, email: formData.email, phone: formData.phone,
      plan: formData.plan, status: formData.status,
      lifecycleStage: formData.lifecycleStage,
    };
    if (formData.hasDiscount) {
      data._discount = {
        type: formData.discountType,
        value: formData.discountType === "custom" ? undefined : formData.discountValue,
        customPrice: formData.discountType === "custom" ? formData.customPrice : undefined,
        reason: formData.discountReason,
        finalPrice: editCalculatedPrice,
        originalPrice: basePrice,
      };
    } else {
      data._discount = { clear: true };
    }
    await onSubmit(data);
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Edit Client</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="">No plan</option>
              {activePlans.map((plan) => <option key={plan.id} value={plan.name}>{plan.name} - ${plan.price}/{plan.period}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
                  </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lifecycle Stage</label>
              <select value={formData.lifecycleStage} onChange={(e) => setFormData({ ...formData, lifecycleStage: e.target.value as ClientLifecycleStage })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="lead">Lead</option>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="at_risk">At Risk</option>
                <option value="churned">Churned</option>
                <option value="won_back">Won Back</option>
              </select>
            </div>
          </div>

          {/* Custom Pricing */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.hasDiscount}
                onChange={(e) => setFormData({ ...formData, hasDiscount: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <div>
                <span className="text-sm font-medium text-gray-900">Custom pricing</span>
                <p className="text-xs text-gray-500">Apply a discount or custom price</p>
              </div>
            </label>
            {formData.hasDiscount && (
              <div className="mt-3 ml-7 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount type</label>
                  <div className="flex gap-2">
                    {([
                      { value: "percentage" as const, label: "%" },
                      { value: "fixed" as const, label: "$" },
                      { value: "custom" as const, label: "Custom" },
                    ]).map((opt) => (
                      <button key={opt.value} type="button"
                        onClick={() => setFormData({ ...formData, discountType: opt.value })}
                        className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                          formData.discountType === opt.value
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>
                {formData.discountType !== "custom" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.discountType === "percentage" ? "Discount (%)" : "Discount ($)"}
                    </label>
                    <input type="number" min="0" max={formData.discountType === "percentage" ? 100 : basePrice}
                      value={formData.discountValue || ""}
                      onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Final price ($)</label>
                    <input type="number" min="0"
                      value={formData.customPrice || ""}
                      onChange={(e) => setFormData({ ...formData, customPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <input type="text" value={formData.discountReason}
                    onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g. early bird, family" />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">List price</p>
                    <p className="text-sm text-gray-400 line-through">${basePrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Final price</p>
                    <p className="text-lg font-semibold text-green-600">${editCalculatedPrice}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Health Score Display */}
          {client.healthScore && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Health Score Breakdown</p>
              <div className="flex items-center gap-4">
                <HealthScoreBadge score={client.healthScore.overall} size="md" />
                <div className="flex-1 space-y-1">
                  {Object.entries(client.healthScore.breakdown).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-24 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(val / 25) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-600 w-8 text-right">{val}/25</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? <LoadingSpinner size="sm" className="text-white" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
