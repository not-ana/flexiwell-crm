"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";

interface StudioRow {
  id: string;
  name: string;
  ownerEmail: string | null;
  ownerName: string | null;
  planTier: string | null;
  subscriptionStatus: string | null;
  trialStatus: string | null;
  trialEndDate: string | null;
  trialDaysLeft: number | null;
  clientCount: number;
  activeCount: number;
  atRiskCount: number;
  mrr: number;
  lastActivity: string | null;
  risk: "red" | "yellow" | "green";
  summary: string;
  createdAt: string;
}

interface StudioDetail {
  id: string;
  name: string;
  location: string;
  createdAt: string;
  owner: {
    email: string;
    name: string;
    phone?: string;
    planTier?: string;
    subscriptionStatus?: string;
    trialStatus?: string;
    trialEndDate?: string;
    joinedAt?: string;
    lastLoginAt?: string | null;
  } | null;
  metrics: {
    newThisMonth: number;
    retention30d: number | null;
    retentionCohortSize: number;
  };
  topAtRisk: Array<{ id: string; name: string; score: number; reason: string }>;
  recentActivity: Array<{ type: string; description: string; createdAt: string }>;
  integrations: { stripe: boolean; smsBot: boolean };
}

type RiskFilter = "all" | "at_risk" | "healthy";
type StatusFilter = "all" | "trial" | "active" | "past_due" | "canceled";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatMoney(n: number): string {
  if (n === 0) return "—";
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1)}k`;
  return `R$ ${n.toFixed(0)}`;
}

const riskDot: Record<StudioRow["risk"], string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
};

const riskOrder: Record<StudioRow["risk"], number> = { red: 0, yellow: 1, green: 2 };

export default function OperatorPage() {
  const { logout, user } = useAuth();
  const [studios, setStudios] = useState<StudioRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, StudioDetail | "loading" | "error">>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.get<{ studios: StudioRow[] }>("/api/operator/studios");
      if (cancelled) return;
      if (res.error) {
        setLoadError(res.error.error);
        setStudios([]);
      } else {
        setStudios(res.data?.studios ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!studios) return [];
    const q = search.trim().toLowerCase();
    return studios
      .filter((s) => {
        if (q) {
          const hay = `${s.name} ${s.ownerEmail ?? ""} ${s.ownerName ?? ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (riskFilter === "at_risk" && s.risk === "green") return false;
        if (riskFilter === "healthy" && s.risk !== "green") return false;
        if (statusFilter !== "all") {
          if (statusFilter === "trial" && s.trialStatus !== "active") return false;
          if (statusFilter !== "trial" && s.subscriptionStatus !== statusFilter) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const r = riskOrder[a.risk] - riskOrder[b.risk];
        if (r !== 0) return r;
        const aT = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        const bT = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
        return bT - aT;
      });
  }, [studios, search, riskFilter, statusFilter]);

  // Aggregate strip on top — these are the only operator-level numbers worth
  // showing. Single-glance answers to "how is the fleet doing?".
  const fleet = useMemo(() => {
    if (!studios) return null;
    return {
      total: studios.length,
      atRisk: studios.filter((s) => s.risk !== "green").length,
      mrr: studios.reduce((sum, s) => sum + (s.mrr || 0), 0),
      activeClients: studios.reduce((sum, s) => sum + (s.activeCount || 0), 0),
    };
  }, [studios]);

  async function toggleExpand(studio: StudioRow) {
    if (expandedId === studio.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(studio.id);
    if (!details[studio.id] || details[studio.id] === "error") {
      setDetails((d) => ({ ...d, [studio.id]: "loading" }));
      const res = await api.get<{ studio: StudioDetail }>(`/api/operator/studios/${studio.id}`);
      if (res.error || !res.data) {
        setDetails((d) => ({ ...d, [studio.id]: "error" }));
      } else {
        setDetails((d) => ({ ...d, [studio.id]: res.data!.studio }));
      }
    }
  }

  async function enterStudio(studio: StudioRow, e: React.MouseEvent) {
    e.stopPropagation();
    setEnteringId(studio.id);
    const res = await api.post<{ tokens: { accessToken: string; refreshToken: string } }>(
      "/api/operator/impersonate",
      { establishmentId: studio.id }
    );
    if (res.error || !res.data) {
      setEnteringId(null);
      alert(`Could not enter studio: ${res.error?.error ?? "unknown error"}`);
      return;
    }
    const { storeTokens } = await import("@/lib/api/client");
    storeTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
    window.location.href = "/admin";
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Studios</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.email ? `Signed in as ${user.email}` : ""}
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Sign out
        </button>
      </header>

      {/* Fleet-level summary strip */}
      {fleet && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="Studios" value={fleet.total.toString()} />
          <SummaryCard
            label="At risk"
            value={fleet.atRisk.toString()}
            tone={fleet.atRisk > 0 ? "warn" : "ok"}
          />
          <SummaryCard label="Active clients" value={fleet.activeClients.toString()} />
          <SummaryCard label="Total MRR" value={formatMoney(fleet.mrr)} />
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by studio name or owner email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[260px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="all">All statuses</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="past_due">Past due</option>
            <option value="canceled">Canceled</option>
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          >
            <option value="all">All risk</option>
            <option value="at_risk">At risk</option>
            <option value="healthy">Healthy</option>
          </select>
        </div>

        {loadError ? (
          <div className="p-12 text-center text-sm text-red-600">{loadError}</div>
        ) : !studios ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading studios…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            {studios.length === 0
              ? "No studios yet. As soon as a customer signs up, they'll appear here."
              : "No studios match these filters."}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((s) => {
              const isExpanded = expandedId === s.id;
              const detail = details[s.id];
              return (
                <li key={s.id}>
                  <div
                    onClick={() => toggleExpand(s)}
                    className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4 cursor-pointer"
                  >
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${riskDot[s.risk]}`}
                      title={`Risk: ${s.risk}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="font-medium text-gray-900 truncate">{s.name}</span>
                        {s.trialStatus === "active" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            Trial
                          </span>
                        )}
                        <span className="text-xs text-gray-500 truncate">{s.ownerEmail ?? "no owner"}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1 flex items-center gap-3 flex-wrap">
                        <span><strong className="text-gray-900">{s.activeCount}</strong>/{s.clientCount} clients</span>
                        <span><strong className="text-gray-900">{formatMoney(s.mrr)}</strong> MRR</span>
                        {s.atRiskCount > 0 && (
                          <span className="text-orange-600">{s.atRiskCount} at risk</span>
                        )}
                        <span className="text-gray-500">· {s.summary}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex-shrink-0 hidden md:block">
                      {timeAgo(s.lastActivity)}
                    </div>
                    <button
                      onClick={(e) => enterStudio(s, e)}
                      disabled={enteringId === s.id}
                      className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex-shrink-0 disabled:opacity-50"
                    >
                      {enteringId === s.id ? "Entering…" : "Enter"}
                    </button>
                    <span className={`text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                      ▾
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100 px-6 py-5">
                      {detail === "loading" || !detail ? (
                        <div className="text-sm text-gray-500">Loading details…</div>
                      ) : detail === "error" ? (
                        <div className="text-sm text-red-600">Failed to load details.</div>
                      ) : (
                        <StudioDetailView detail={detail} />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  const toneClass =
    tone === "warn"
      ? "text-orange-600"
      : tone === "ok"
      ? "text-green-600"
      : "text-gray-900";
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
}

function StudioDetailView({ detail }: { detail: StudioDetail }) {
  const retentionPct =
    detail.metrics.retention30d !== null
      ? `${Math.round(detail.metrics.retention30d * 100)}%`
      : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: metrics */}
      <div className="lg:col-span-1 space-y-4">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Owner</div>
          <div className="text-sm text-gray-900 mt-1">
            {detail.owner?.name ?? "—"}
            <div className="text-xs text-gray-500">{detail.owner?.email}</div>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Plan</div>
          <div className="text-sm text-gray-900 mt-1 capitalize">
            {detail.owner?.planTier?.replace("_", " ") ?? "—"}
            {detail.owner?.subscriptionStatus && (
              <span className="text-xs text-gray-500 ml-2">({detail.owner.subscriptionStatus})</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <div className="text-xs text-gray-500">New this month</div>
            <div className="text-lg font-semibold text-gray-900">{detail.metrics.newThisMonth}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">30d retention</div>
            <div className="text-lg font-semibold text-gray-900">
              {retentionPct}
              {detail.metrics.retentionCohortSize > 0 && (
                <span className="text-xs text-gray-500 font-normal ml-1">
                  (n={detail.metrics.retentionCohortSize})
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="pt-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Integrations</div>
          <div className="flex gap-3 text-xs">
            <span className={detail.integrations.stripe ? "text-green-700" : "text-gray-400"}>
              {detail.integrations.stripe ? "✓" : "○"} Stripe
            </span>
            <span className={detail.integrations.smsBot ? "text-green-700" : "text-gray-400"}>
              {detail.integrations.smsBot ? "✓" : "○"} SMS bot
            </span>
          </div>
        </div>
      </div>

      {/* Middle: at-risk clients */}
      <div className="lg:col-span-1">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">At risk now</div>
        {detail.topAtRisk.length === 0 ? (
          <div className="text-sm text-gray-500">No clients flagged.</div>
        ) : (
          <ul className="space-y-2">
            {detail.topAtRisk.map((c) => (
              <li key={c.id} className="text-sm">
                <div className="text-gray-900">{c.name}</div>
                <div className="text-xs text-gray-500">{c.reason}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right: recent activity */}
      <div className="lg:col-span-1">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Recent activity</div>
        {detail.recentActivity.length === 0 ? (
          <div className="text-sm text-gray-500">No recent activity.</div>
        ) : (
          <ul className="space-y-2">
            {detail.recentActivity.map((a, i) => (
              <li key={i} className="text-sm">
                <div className="text-gray-900">{a.description}</div>
                <div className="text-xs text-gray-500">{timeAgo(a.createdAt)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
