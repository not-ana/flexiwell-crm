"use client";

import { useState, useRef, useEffect, memo, useCallback } from "react";
import { SearchIcon, FilterIcon, ChevronIcon, UploadIcon } from "@/components/icons";
import { useClients } from "@/hooks/useData";
import { LoadingSpinner, LoadingTable } from "@/components/ui/LoadingSpinner";
import { ErrorMessage, EmptyState } from "@/components/ui/ErrorMessage";
import type { Client, ClientLifecycleStage, ClientMetrics } from "@/lib/api/client";
import { clientsApi } from "@/lib/api/client";
import { formatCurrency, getInitials } from "@/lib/utils/formatters";

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
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
});

const StatusBadge = memo(function StatusBadge({ status }: { status: ClientStatus }) {
  const style = statusStyles[status] || statusStyles.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
});

// ============================================
// Upgrade Suggestion Chip
// ============================================
function UpgradeChip({ client }: { client: Client }) {
  const plan = typeof client.plan === "object" ? client.plan : null;
  if (!plan) return null;

  const utilization = plan.totalClasses > 0 ? plan.usedClasses / plan.totalClasses : 0;

  // Simple ascension logic
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
// Client Row (Desktop Table)
// ============================================
const ClientRow = memo(function ClientRow({ client, onApprove, onReject, onEdit, onDelete, onWinBack }: {
  client: Client;
  onApprove?: () => void;
  onReject?: () => void;
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

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${lifecycle === "at_risk" ? "bg-orange-50/30" : lifecycle === "churned" ? "bg-red-50/20" : ""}`}>
      {/* Client info */}
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
              <p className="font-medium text-gray-900 truncate">{client.name}</p>
              <StreakBadge streak={client.currentStreak || 0} />
            </div>
            <p className="text-sm text-gray-500 truncate">{client.email}</p>
          </div>
        </div>
      </td>
      {/* Lifecycle Stage */}
      <td className="px-4 py-3">
        <LifecycleBadge stage={lifecycle} />
      </td>
      {/* Plan + Upgrade */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-900">{typeof client.plan === "string" ? client.plan : (client.plan?.type || "No plan")}</p>
          <UpgradeChip client={client} />
        </div>
        {classesTotal > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
        <p className="text-sm font-medium text-gray-900">{formatCurrency(client.totalLifetimeRevenue || client.revenue || 0)}</p>
      </td>
      {/* Last Activity */}
      <td className="px-4 py-3">
        <p className="text-sm text-gray-500">{client.lastActivity || "—"}</p>
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        {status === "pending" ? (
          <div className="flex items-center gap-2">
            <button onClick={onApprove} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
              Approve
            </button>
            <button onClick={onReject} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Reject
            </button>
          </div>
        ) : lifecycle === "churned" ? (
          <div className="flex items-center gap-1">
            <button onClick={onWinBack} className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              Win Back
            </button>
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
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
      </td>
    </tr>
  );
});

// ============================================
// Client Card (Mobile)
// ============================================
function ClientCard({ client, onApprove, onReject, onEdit, onDelete, onWinBack }: {
  client: Client;
  onApprove?: () => void;
  onReject?: () => void;
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

  return (
    <div className={`p-4 border-b border-gray-100 last:border-b-0 ${lifecycle === "at_risk" ? "bg-orange-50/30" : lifecycle === "churned" ? "bg-red-50/20" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {healthScore !== null ? (
            <HealthScoreBadge score={healthScore} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary-700">{getInitials(client.name)}</span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">{client.name}</p>
              <StreakBadge streak={client.currentStreak || 0} />
            </div>
            <p className="text-xs text-gray-500">{client.email}</p>
          </div>
        </div>
        <LifecycleBadge stage={lifecycle} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <p className="text-gray-500 text-xs">Plan</p>
          <div className="flex items-center gap-1">
            <p className="font-medium text-gray-900 truncate">{typeof client.plan === "string" ? client.plan : (client.plan?.type || "No plan")}</p>
            <UpgradeChip client={client} />
          </div>
          {classesTotal > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${progressPercent > 50 ? "bg-green-500" : progressPercent > 20 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{classesRemaining}/{classesTotal}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-gray-500 text-xs">Lifetime Revenue</p>
          <p className="font-medium text-green-600">{formatCurrency(client.totalLifetimeRevenue || client.revenue || 0)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Last Activity</p>
          <p className="font-medium text-gray-900">{client.lastActivity || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Health Score</p>
          <p className="font-medium text-gray-900">{healthScore !== null ? `${healthScore}/100` : "—"}</p>
        </div>
      </div>

      {status === "pending" ? (
        <div className="flex items-center gap-2">
          <button onClick={onApprove} className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
            Approve
          </button>
          <button onClick={onReject} className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Reject
          </button>
        </div>
      ) : lifecycle === "churned" ? (
        <button onClick={onWinBack} className="w-full px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
          Send Win-Back Offer
        </button>
      ) : (
        <div className="flex items-center justify-end gap-1">
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Offer Stack Plan Options (Hormozi Value Stack)
// ============================================
const planOptions = [
  {
    id: "monthly-8", name: "Monthly - 8 classes", price: 299,
    bonuses: [
      { name: "8 group classes", value: 400 },
      { name: "Health Assessment", value: 75 },
      { name: "Priority waitlist", value: 50 },
      { name: "WhatsApp booking", value: 0 },
    ],
    totalValue: 525,
  },
  {
    id: "monthly-12", name: "Monthly - 12 classes", price: 399,
    bonuses: [
      { name: "12 group classes", value: 600 },
      { name: "Health Assessment", value: 75 },
      { name: "Priority waitlist", value: 50 },
      { name: "WhatsApp booking", value: 0 },
    ],
    totalValue: 725,
  },
  {
    id: "quarterly-24", name: "Quarterly - 24 classes", price: 799,
    bonuses: [
      { name: "24 group classes", value: 1200 },
      { name: "Health Assessment + Review", value: 150 },
      { name: "Priority waitlist", value: 50 },
      { name: "Goal tracking", value: 100 },
    ],
    totalValue: 1500,
  },
  {
    id: "semiannual-48", name: "Semi-annual - 48 classes", price: 1499,
    bonuses: [
      { name: "48 group classes", value: 2400 },
      { name: "2 Health Assessments", value: 150 },
      { name: "VIP waitlist priority", value: 100 },
      { name: "Goal tracking + Reviews", value: 200 },
    ],
    totalValue: 2850,
  },
  {
    id: "annual-96", name: "Annual - 96 classes", price: 2499,
    bonuses: [
      { name: "96 group classes", value: 4800 },
      { name: "Quarterly Health Assessments", value: 300 },
      { name: "VIP priority everything", value: 200 },
      { name: "1:1 onboarding session", value: 150 },
    ],
    totalValue: 5450,
  },
];

// ============================================
// Add Client Modal with Value Stack
// ============================================
function AddClientModal({
  isOpen, onClose, onSubmit, isSubmitting,
}: {
  isOpen: boolean; onClose: () => void;
  onSubmit: (data: Partial<Client>) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "",
    plan: planOptions[0].id,
    unit: "FlexiWell Downtown", notes: "",
  });

  const selectedPlan = planOptions.find((p) => p.id === formData.plan) || planOptions[0];

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in name and email");
      return;
    }
    await onSubmit({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      plan: selectedPlan.name,
      unit: formData.unit,
      status: "active",
    });
    setFormData({ name: "", email: "", phone: "", plan: planOptions[0].id, unit: "FlexiWell Downtown", notes: "" });
    onClose();
  };

  if (!isOpen) return null;

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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="(555) 123-4567" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan *</label>
            <select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              {planOptions.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name} - ${plan.price}</option>
              ))}
            </select>
          </div>

          {/* Hormozi Value Stack */}
          <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl p-4 border border-primary-100">
            <p className="text-sm font-semibold text-gray-900 mb-3">What&apos;s included:</p>
            <div className="space-y-2">
              {selectedPlan.bonuses.map((bonus, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-gray-700">{bonus.name}</span>
                  </div>
                  {bonus.value > 0 && (
                    <span className="text-gray-400 line-through text-xs">${bonus.value}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-primary-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total value: <span className="line-through">${selectedPlan.totalValue}</span></span>
              <span className="text-lg font-bold text-primary-700">${selectedPlan.price}/mo</span>
            </div>
            <p className="text-xs text-green-600 font-medium mt-1">
              Save {Math.round(((selectedPlan.totalValue - selectedPlan.price) / selectedPlan.totalValue) * 100)}%
            </p>
          </div>

          {/* Onboarding auto-triggers info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Auto-Onboarding Sequence</p>
                <p className="text-sm text-blue-700 mt-1">
                  Welcome email + Health Assessment invite + first class nudge + Week 1 check-in will be sent automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="w-full sm:w-auto px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? <LoadingSpinner size="sm" className="text-white" /> : null}
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Import Modal (unchanged)
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
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-4 sm:mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-orange-900">{atRiskClients.length} client{atRiskClients.length !== 1 ? "s" : ""} at risk of churning</p>
            <p className="text-sm text-orange-700">
              {atRiskClients.slice(0, 3).map(c => c.name).join(", ")}
              {atRiskClients.length > 3 ? ` +${atRiskClients.length - 3} more` : ""}
            </p>
          </div>
        </div>
        <button onClick={onViewAtRisk}
          className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors whitespace-nowrap">
          View at-risk
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================
export default function AdminClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all");
  const [lifecycleFilter, setLifecycleFilter] = useState<"all" | ClientLifecycleStage>("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);

  // Fetch clients
  const { clients, isLoading, error, refetch, createClient, updateClient, deleteClient } = useClients({
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  // Fetch Hormozi metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await clientsApi.getMetrics();
      if (response.data) setMetrics(response.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const handleAddClient = async (data: Partial<Client>) => {
    setIsSubmitting(true);
    try {
      const result = await createClient(data);
      if (!result.success) alert(result.error || "Failed to add client");
    } finally { setIsSubmitting(false); }
  };

  const handleApprove = async (id: string) => {
    const result = await updateClient(id, { status: "active" });
    if (!result.success) alert(result.error || "Failed to approve client");
  };

  const handleReject = async (id: string) => {
    if (confirm("Are you sure you want to reject this client?")) {
      const result = await deleteClient(id);
      if (!result.success) alert(result.error || "Failed to reject client");
    }
  };

  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleUpdateClient = async (data: Partial<Client>) => {
    if (!editingClient) return;
    setIsSubmitting(true);
    try {
      const result = await updateClient(editingClient._id, data);
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
    return c.lifecycleStage === lifecycleFilter;
  });

  // Stats
  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter(c => c.status === "active").length || 0;
  const atRiskCount = clients?.filter(c => c.lifecycleStage === "at_risk" || (c.healthScore && c.healthScore.overall < 40)).length || 0;
  const totalRevenue = clients?.reduce((sum, c) => sum + (c.totalLifetimeRevenue || c.revenue || 0), 0) || 0;

  if (error) {
    return <div className="p-4 sm:p-6 lg:p-8"><ErrorMessage message={error} onRetry={refetch} /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-600 mt-1 hidden lg:block">Manage client lifecycle, health scores & revenue</p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <button onClick={() => setShowImportModal(true)}
            className="p-2 lg:px-4 lg:py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <UploadIcon className="w-5 h-5" /><span className="hidden lg:inline">Import</span>
          </button>
          <button onClick={() => setShowAddClientModal(true)}
            className="px-3 py-2 lg:px-4 lg:py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <span className="hidden lg:inline">Add</span>
          </button>
        </div>
      </div>

      {/* Hormozi LTV Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Total Clients</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{isLoading ? "—" : totalClients}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Active</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{isLoading ? "—" : activeClients}</p>
        </div>
        <div className="bg-white border border-orange-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-orange-600">At Risk</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg sm:text-2xl font-bold text-orange-600">{isLoading ? "—" : atRiskCount}</p>
            {atRiskCount > 0 && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full animate-pulse">Alert</span>}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Avg LTV</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{metrics ? formatCurrency(metrics.avgLTV) : "—"}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hidden lg:block">
          <p className="text-xs sm:text-sm text-gray-600">Churn Rate</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{metrics ? `${metrics.monthlyChurnRate}%` : "—"}</p>
          <p className="text-xs text-gray-500">monthly</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hidden lg:block">
          <p className="text-xs sm:text-sm text-gray-600">Rev/Client/Mo</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{metrics ? formatCurrency(metrics.revenuePerClientPerMonth) : "—"}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{isLoading ? "—" : formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* At-Risk Alert Banner */}
      <AtRiskBanner
        clients={clients || []}
        onViewAtRisk={() => setLifecycleFilter("at_risk")}
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6 bg-white rounded-xl p-3 sm:p-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search by name, email or instructor..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 sm:bg-transparent border border-gray-200 sm:border-0 rounded-lg sm:rounded-none focus:outline-none focus:ring-2 sm:focus:ring-0 focus:ring-primary-500 text-gray-900 placeholder-gray-500" />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 sm:flex-none min-w-0">
            <FilterIcon className="w-5 h-5 text-gray-400 hidden lg:block flex-shrink-0" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          {/* Lifecycle Stage Filter */}
          <select value={lifecycleFilter} onChange={(e) => setLifecycleFilter(e.target.value as typeof lifecycleFilter)}
            className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="all">All lifecycle stages</option>
            <option value="lead">Lead</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="at_risk">At Risk</option>
            <option value="churned">Churned</option>
            <option value="won_back">Won Back</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingTable rows={5} />
      ) : filteredClients.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LTV</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client) => (
                  <ClientRow
                    key={client._id}
                    client={client}
                    onApprove={() => handleApprove(client._id)}
                    onReject={() => handleReject(client._id)}
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
                onApprove={() => handleApprove(client._id)}
                onReject={() => handleReject(client._id)}
                onEdit={() => setEditingClient(client)}
                onDelete={() => handleDeleteClick(client)}
                onWinBack={() => handleWinBack(client._id)}
              />
            ))}
          </div>
        </div>
      ) : (
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
      )}

      {/* Modals */}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onSuccess={refetch} />
      <AddClientModal isOpen={showAddClientModal} onClose={() => setShowAddClientModal(false)} onSubmit={handleAddClient} isSubmitting={isSubmitting} />
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
  });

  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        plan: typeof client.plan === "string" ? client.plan : (client.plan?.type || ""),
        status: (client.status as ClientStatus) || "active",
        lifecycleStage: client.lifecycleStage || "active",
      });
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, client]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) { alert("Please fill in name and email"); return; }
    await onSubmit({
      name: formData.name, email: formData.email, phone: formData.phone,
      plan: formData.plan, status: formData.status,
      lifecycleStage: formData.lifecycleStage,
    });
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
              {planOptions.map((plan) => <option key={plan.id} value={plan.name}>{plan.name} - ${plan.price}</option>)}
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
                <option value="pending">Pending</option>
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
