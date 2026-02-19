"use client";

import { useState, useEffect, useCallback } from "react";
import { getStoredTokens } from "@/lib/api/client";
import { sourcePriorities, type ClientSource } from "@/lib/config/waitlist";

function authFetch(url: string, options: RequestInit = {}) {
  const { accessToken } = getStoredTokens();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
}

interface WaitlistEntry {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientSource: ClientSource;
  classId: string;
  className: string;
  priority: number;
  position: number;
  status: "waiting" | "notified" | "confirmed" | "expired";
  notifiedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface ProtectedRevenue {
  thisMonth: number;
  directClientsServed: number;
  aggregatorsWaiting: number;
}

const statusConfig = {
  waiting: { label: "Waiting", color: "bg-yellow-100 text-yellow-700" },
  notified: { label: "Notified", color: "bg-blue-100 text-blue-700" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-500" },
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

function getSourceInfo(source: ClientSource) {
  return sourcePriorities.find((s) => s.source === source) || sourcePriorities[0];
}

// Countdown hook for notified entries
function useCountdown(expiresAt: string | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "warning" | "critical">("normal");

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        setUrgency("critical");
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
      if (m < 5) setUrgency("critical");
      else if (m < 15) setUrgency("warning");
      else setUrgency("normal");
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return { timeLeft, urgency };
}

function CountdownBadge({ expiresAt }: { expiresAt?: string }) {
  const { timeLeft, urgency } = useCountdown(expiresAt);
  if (!expiresAt || !timeLeft) return null;

  const colors = {
    normal: "bg-blue-100 text-blue-700 border-blue-200",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
    critical: "bg-red-100 text-red-700 border-red-200 animate-pulse",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold tabular-nums border ${colors[urgency]}`}>
      {timeLeft}
    </span>
  );
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({ waiting: 0, notified: 0, confirmed: 0 });
  const [protectedRevenue, setProtectedRevenue] = useState<ProtectedRevenue>({
    thisMonth: 0,
    directClientsServed: 0,
    aggregatorsWaiting: 0,
  });
  const [waitlistByClass, setWaitlistByClass] = useState<Record<string, number>>({});
  const [waitlistClassNames, setWaitlistClassNames] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);

  const fetchWaitlist = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);

      const response = await authFetch(`/api/waitlist?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setEntries(data.entries);
      setStats(data.stats);
      setProtectedRevenue(data.protectedRevenue);
      if (data.waitlistByClass) setWaitlistByClass(data.waitlistByClass);
      if (data.waitlistClassNames) setWaitlistClassNames(data.waitlistClassNames);
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  const handleNotify = async (entry: WaitlistEntry) => {
    setActionLoading(entry.id);
    try {
      const response = await authFetch(`/api/waitlist/${entry.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "notify" }),
      });
      if (response.ok) {
        setNotifySuccess(entry.clientName);
        setTimeout(() => setNotifySuccess(null), 3000);
        fetchWaitlist();
      }
    } catch (error) {
      console.error("Error notifying:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (entryId: string) => {
    if (!confirm("Remove from waitlist?")) return;

    setActionLoading(entryId);
    try {
      const response = await authFetch(`/api/waitlist/${entryId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchWaitlist();
      }
    } catch (error) {
      console.error("Error removing:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Sort: notified first (needs action), then by position
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.status === "notified" && b.status !== "notified") return -1;
    if (b.status === "notified" && a.status !== "notified") return 1;
    return a.position - b.position;
  });

  // Group entries by class for demand visibility
  const classDemand = Object.entries(waitlistByClass)
    .map(([classId, count]) => ({
      classId,
      className: waitlistClassNames[classId] || entries.find((e) => e.classId === classId)?.className || "Class",
      count,
    }))
    .filter((cls) => cls.className && cls.className !== "null")
    .sort((a, b) => b.count - a.count);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 lg:p-8 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Never Lose a Client to a Full Class</h1>
        <p className="text-gray-600 mt-1">
          Direct clients get priority. Every spot goes to your highest-value clients first.
        </p>

        {/* Notify Success Toast */}
        {notifySuccess && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-700">
              <span className="font-medium">{notifySuccess}</span> has been notified via WhatsApp and SMS. They have 30 minutes to confirm.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Protected Revenue */}
          <div className="col-span-2 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium text-white/80">Protected Revenue</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(protectedRevenue.thisMonth)}</p>
            <p className="text-sm text-white/70 mt-1">
              {protectedRevenue.directClientsServed} direct clients served before aggregators
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm font-medium text-yellow-700">In Queue</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.waiting}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-medium text-green-700">Confirmed</p>
            <p className="text-2xl font-bold text-green-900">{stats.confirmed}</p>
          </div>
        </div>

        {/* Class Demand Bar - Social proof for admin */}
        {classDemand.length > 0 && (
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-gray-500">Demand:</span>
            {classDemand.slice(0, 5).map((cls) => (
              <span
                key={cls.classId}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  cls.count >= 3
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {cls.className} ({cls.count} waiting)
              </span>
            ))}
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-3 mt-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All</option>
            <option value="waiting">Waiting</option>
            <option value="notified">Notified</option>
            <option value="confirmed">Confirmed</option>
          </select>

          {protectedRevenue.aggregatorsWaiting > 0 && (
            <span className="text-sm text-gray-500">
              {protectedRevenue.aggregatorsWaiting} aggregators waiting behind direct clients
            </span>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 font-medium">No clients on the waitlist</p>
            <p className="text-sm text-gray-400 mt-1">Clients will appear here when classes are full</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEntries.map((entry) => {
              const sourceInfo = getSourceInfo(entry.clientSource);
              const isAggregator = ["gympass", "classpass"].includes(entry.clientSource);
              const isNotified = entry.status === "notified";

              return (
                <div
                  key={entry.id}
                  className={`bg-white border rounded-xl p-4 transition-all ${
                    isNotified
                      ? "border-blue-300 bg-blue-50/50 shadow-md shadow-blue-100"
                      : isAggregator
                      ? "border-gray-200 hover:shadow-md"
                      : "border-primary-200 bg-primary-50/30 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {/* Position */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            entry.position === 1
                              ? "bg-yellow-500 text-white"
                              : entry.position === 2
                              ? "bg-gray-400 text-white"
                              : entry.position === 3
                              ? "bg-orange-400 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {entry.position}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{entry.priority}pts</span>
                      </div>

                      {/* Client Info */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{entry.clientName}</h3>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${sourceInfo.color}20`, color: sourceInfo.color }}
                          >
                            {sourceInfo.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[entry.status].color}`}>
                            {statusConfig[entry.status].label}
                          </span>
                          {isNotified && <CountdownBadge expiresAt={entry.expiresAt} />}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{entry.className}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Joined {formatDate(entry.createdAt)}
                        </p>
                        {isNotified && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">
                            Waiting for client to confirm their spot
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.status === "waiting" && (
                        <button
                          onClick={() => handleNotify(entry)}
                          disabled={actionLoading === entry.id}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                          {actionLoading === entry.id ? "Sending..." : "Notify"}
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(entry.id)}
                        disabled={actionLoading === entry.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-50"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Priority explanation for aggregators */}
                  {isAggregator && entry.position > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Direct clients ahead have automatic priority
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Priority Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-6 justify-center flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Priority:</span>
          {sourcePriorities.map((source) => (
            <div key={source.source} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: source.color }}
              />
              <span className="text-xs text-gray-600">
                {source.label} ({source.points}pts)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
