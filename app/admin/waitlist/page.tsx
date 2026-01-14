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
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  const handleNotify = async (entryId: string) => {
    setActionLoading(entryId);
    try {
      const response = await authFetch(`/api/waitlist/${entryId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "notify" }),
      });
      if (response.ok) {
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
        <h1 className="text-2xl font-bold text-gray-900">Waitlist</h1>
        <p className="text-gray-600 mt-1">
          Direct clients have priority over aggregators
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Protected Revenue - Key Differentiator */}
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

        {/* Filter */}
        <div className="flex items-center gap-3 mt-6">
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
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500">No clients on the waitlist</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const sourceInfo = getSourceInfo(entry.clientSource);
              const isAggregator = ["gympass", "totalpass", "classpass"].includes(entry.clientSource);

              return (
                <div
                  key={entry.id}
                  className={`bg-white border rounded-xl p-4 hover:shadow-md transition-shadow ${
                    isAggregator ? "border-gray-200" : "border-primary-200 bg-primary-50/30"
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
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{entry.className}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Joined {formatDate(entry.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.status === "waiting" && (
                        <button
                          onClick={() => handleNotify(entry.id)}
                          disabled={actionLoading === entry.id}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                          {actionLoading === entry.id ? "..." : "Notify"}
                        </button>
                      )}
                      {entry.status === "notified" && entry.expiresAt && (
                        <span className="text-xs text-blue-600">
                          Expires {formatDate(entry.expiresAt)}
                        </span>
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
