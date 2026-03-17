"use client";

import { useState, useEffect, useCallback } from "react";
import { getStoredTokens } from "@/lib/api/client";
import { sourcePriorities, type ClientSource } from "@/lib/config/waitlist";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";

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

interface NotificationStatus {
  sent: boolean;
  smsSent: boolean;
  emailSent: boolean;
  error?: string;
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
  status: "waiting" | "notified" | "confirmed" | "expired" | "removed";
  removedAt?: string;
  notifiedAt?: string;
  expiresAt?: string;
  createdAt: string;
  notificationStatus?: NotificationStatus;
}

interface ProtectedRevenue {
  thisMonth: number;
  directClientsServed: number;
  aggregatorsWaiting: number;
}

interface NotifyResult {
  name: string;
  sms: boolean;
  email: boolean;
  channels?: { name: string; sent: boolean; error?: string; disabled?: boolean }[];
  noChannelsEnabled?: boolean;
  error?: string;
}

// -- Untitled UI color tokens --
const statusConfig = {
  waiting: {
    label: "In Queue",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  notified: {
    label: "Notified",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  expired: {
    label: "Expired",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  removed: {
    label: "Removed",
    bg: "bg-gray-50",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
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

// -- Hooks --
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

// -- Icons (outline, stroke-2, Untitled UI style) --
function SMSIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function CheckCircleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertTriangleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function InfoIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TrashIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function ClipboardIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

// -- Sub-components --
function CountdownBadge({ expiresAt }: { expiresAt?: string }) {
  const { timeLeft, urgency } = useCountdown(expiresAt);
  if (!expiresAt || !timeLeft) return null;

  const colors = {
    normal: "bg-blue-50 text-blue-700 ring-blue-700/10",
    warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
    critical: "bg-red-50 text-red-700 ring-red-600/10 animate-pulse",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums ring-1 ring-inset ${colors[urgency]}`}>
      {timeLeft}
    </span>
  );
}

function EmailIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function NotificationChannels({ status }: { status?: NotificationStatus }) {
  if (!status) return null;

  return (
    <div className="flex items-center gap-1.5">
      {status.smsSent && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10">
          <SMSIcon className="size-3" />
        </span>
      )}
      {status.emailSent && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20">
          <EmailIcon className="size-3" />
        </span>
      )}
      {status.error && !status.sent && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-600 ring-1 ring-inset ring-red-600/10" title={status.error}>
          <AlertTriangleIcon className="size-3" />
          Failed
        </span>
      )}
    </div>
  );
}

function NotifyToast({ result, onDismiss }: { result: NotifyResult; onDismiss: () => void }) {
  const isError = result.error && !result.sms && !result.email;
  const isNoChannels = result.noChannelsEnabled;

  return (
    <div className={`px-4 py-3 rounded-xl ring-1 ring-inset flex items-start gap-3 ${
      isError
        ? "bg-red-50 ring-red-600/10"
        : isNoChannels
        ? "bg-amber-50 ring-amber-600/20"
        : "bg-emerald-50 ring-emerald-600/20"
    }`}>
      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
        isError
          ? "bg-red-100"
          : isNoChannels
          ? "bg-amber-100"
          : "bg-emerald-100"
      }`}>
        {isError ? (
          <AlertTriangleIcon className={`size-5 ${isError ? "text-red-600" : ""}`} />
        ) : isNoChannels ? (
          <InfoIcon className="size-5 text-amber-600" />
        ) : (
          <CheckCircleIcon className="size-5 text-emerald-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {isError ? (
          <p className="text-sm font-semibold text-red-900">
            Failed to notify {result.name}
          </p>
        ) : isNoChannels ? (
          <p className="text-sm font-semibold text-amber-900">
            No channels enabled
          </p>
        ) : (
          <p className="text-sm font-semibold text-emerald-900">
            {result.name} notified
          </p>
        )}
        <p className="text-sm text-gray-600 mt-0.5">
          {isError
            ? result.error
            : isNoChannels
            ? `${result.name} has all notification channels disabled`
            : "30 minutes to confirm the spot"
          }
        </p>
        {result.channels && (
          <div className="flex items-center gap-2 mt-2">
            {result.channels.map((ch) => {
              const label = ch.name === "sms" ? "SMS" : "Email";
              const icon = ch.name === "sms" ? <SMSIcon className="size-3.5" /> : <EmailIcon className="size-3.5" />;
              const sentColor = ch.name === "sms" ? "text-blue-700" : "text-violet-700";

              return (
                <span
                  key={ch.name}
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    ch.disabled
                      ? "text-gray-400 line-through"
                      : ch.sent
                      ? sentColor
                      : ch.error
                      ? "text-red-600"
                      : "text-gray-400"
                  }`}
                >
                  {icon}
                  {ch.disabled
                    ? `${label} off`
                    : ch.sent
                    ? `${label} sent`
                    : ch.error
                    ? `${label} failed`
                    : `${label} pending`
                  }
                </span>
              );
            })}
          </div>
        )}
      </div>
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1 shrink-0">
        <XIcon className="size-4" />
      </button>
    </div>
  );
}

// -- Expandable Entry Row --
function EntryRow({
  entry,
  actionLoading,
  onNotify,
}: {
  entry: WaitlistEntry;
  actionLoading: string | null;
  onNotify: (entry: WaitlistEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sourceInfo = getSourceInfo(entry.clientSource);
  const isNotified = entry.status === "notified";
  const isWaiting = entry.status === "waiting";
  const isExpired = entry.status === "expired";
  const isConfirmed = entry.status === "confirmed";

  return (
    <div
      className={`rounded-xl ring-1 ring-inset transition-all ${
        isNotified
          ? "bg-blue-50/50 ring-blue-200"
          : isConfirmed
          ? "bg-emerald-50/30 ring-emerald-200"
          : isExpired
          ? "bg-gray-50 ring-gray-200 opacity-70"
          : "bg-white ring-gray-200"
      }`}
    >
      {/* Compact row: name, class, status, action */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Position */}
          <div
            className={`size-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
              entry.position === 1
                ? "bg-amber-400 text-white"
                : entry.position === 2
                ? "bg-gray-300 text-gray-700"
                : entry.position === 3
                ? "bg-orange-300 text-orange-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {entry.position}
          </div>

          {/* Name + class */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 truncate">{entry.clientName}</span>
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ring-1 ring-inset shrink-0"
                style={{
                  backgroundColor: `${sourceInfo.color}10`,
                  color: sourceInfo.color,
                  // @ts-expect-error CSS custom property
                  "--tw-ring-color": `${sourceInfo.color}30`,
                }}
              >
                {sourceInfo.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">{entry.className}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <Badge style={statusConfig[entry.status]} />

          {/* Countdown for notified */}
          {isNotified && <CountdownBadge expiresAt={entry.expiresAt} />}

          {/* Notify action */}
          {isWaiting && (
            <button
              onClick={(e) => { e.stopPropagation(); onNotify(entry); }}
              disabled={actionLoading === entry.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors"
            >
              {actionLoading === entry.id ? (
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <SMSIcon className="size-3.5" />
              )}
              {actionLoading === entry.id ? "Sending..." : "Notify"}
            </button>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title={expanded ? "Collapse" : "Show details"}
          >
            <svg className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-3 pt-0 border-t border-gray-100 mt-0">
          <div className="pt-3 space-y-2">
            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
              <span>Joined {formatDate(entry.createdAt)}</span>
              <span>{entry.priority}pts priority</span>
              {entry.clientPhone && <span>{entry.clientPhone}</span>}
            </div>

            {(isNotified || isConfirmed || isExpired) && entry.notifiedAt && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <NotificationChannels status={entry.notificationStatus} />
                {!entry.notificationStatus && (
                  <span className="inline-flex items-center gap-1">
                    <SMSIcon className="size-3 text-blue-500" />
                    <EmailIcon className="size-3 text-violet-500" />
                    Sent {formatDate(entry.notifiedAt)}
                  </span>
                )}
              </div>
            )}

            {isNotified && (
              <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                Waiting for confirmation
              </p>
            )}

            {entry.status === "removed" && entry.removedAt && (
              <p className="text-xs text-gray-500">
                Removed {formatDate(entry.removedAt)} — auto-deletes in{" "}
                {Math.max(0, 7 - Math.floor((Date.now() - new Date(entry.removedAt).getTime()) / 86400000))} days
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -- Main Page --
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
  const [filterStatus, setFilterStatus] = useState<string>("waiting");
  const [filterClassId, setFilterClassId] = useState<string | null>(null);
  const [notifyResult, setNotifyResult] = useState<NotifyResult | null>(null);
  const [resolvedExpanded, setResolvedExpanded] = useState(false);

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
      const data = await response.json();
      if (response.ok) {
        const notif = data.notification || {};
        setNotifyResult({
          name: entry.clientName,
          sms: notif.smsSent || false,
          email: notif.emailSent || false,
          channels: notif.channels,
          noChannelsEnabled: notif.noChannelsEnabled,
          error: !notif.sent ? (notif.error || "Notification failed") : undefined,
        });
        setTimeout(() => setNotifyResult(null), 6000);
        fetchWaitlist();
      } else {
        setNotifyResult({
          name: entry.clientName,
          sms: false,
          email: false,
          error: data.error || "Failed to notify client",
        });
        setTimeout(() => setNotifyResult(null), 6000);
      }
    } catch (error) {
      console.error("Error notifying:", error);
      setNotifyResult({
        name: entry.clientName,
        sms: false,
        email: false,
        error: "Network error — could not send notification",
      });
      setTimeout(() => setNotifyResult(null), 6000);
    } finally {
      setActionLoading(null);
    }
  };

  // Group entries by urgency: waiting (needs action) first, then notified (awaiting response), then rest
  const groupedEntries = [...entries].sort((a, b) => {
    const order: Record<string, number> = { waiting: 0, notified: 1, confirmed: 2, expired: 3, removed: 4 };
    const orderDiff = (order[a.status] ?? 5) - (order[b.status] ?? 5);
    if (orderDiff !== 0) return orderDiff;
    return a.position - b.position;
  });

  const filteredEntries = filterClassId
    ? groupedEntries.filter((e) => e.classId === filterClassId)
    : groupedEntries;

  // Split into urgency groups for section headers
  const needsAction = filteredEntries.filter((e) => e.status === "waiting");
  const awaitingResponse = filteredEntries.filter((e) => e.status === "notified");
  const resolved = filteredEntries.filter((e) => !["waiting", "notified"].includes(e.status));

  const classDemand = Object.entries(waitlistByClass)
    .map(([classId, count]) => ({
      classId,
      className: waitlistClassNames[classId] || entries.find((e) => e.classId === classId)?.className || "Class",
      count,
    }))
    .filter((cls) => cls.className && cls.className !== "null")
    .sort((a, b) => b.count - a.count);

  const totalWaiting = stats.waiting + stats.notified;
  const conversionRate = stats.confirmed + totalWaiting > 0
    ? Math.round((stats.confirmed / (stats.confirmed + totalWaiting)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full size-8 border-2 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="p-4 sm:p-6 lg:p-8 pb-4 border-b border-gray-200 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Smart Waitlist</h1>
              {totalWaiting > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600/20">
                  {totalWaiting} in queue
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Direct clients get priority. Every spot fills with your highest-value clients first.
            </p>
          </div>

        </div>

        {/* Toast */}
        {notifyResult && (
          <div className="pt-3">
            <NotifyToast result={notifyResult} onDismiss={() => setNotifyResult(null)} />
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-4 mb-4">
          <StatCard label="Revenue Protected" value={formatCurrency(protectedRevenue.thisMonth)} />
          <StatCard label="In Queue" value={totalWaiting} accent={totalWaiting > 0 ? "orange" : "default"} muted={totalWaiting === 0} />
          <StatCard label="Confirmed" value={stats.confirmed} subtitle={conversionRate > 0 ? `${conversionRate}% conversion` : undefined} accent="emerald" muted={stats.confirmed === 0} />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-gray-50 p-1 ring-1 ring-inset ring-gray-200 w-fit">
          {[
            { value: "all", label: "All" },
            { value: "waiting", label: "Waiting" },
            { value: "notified", label: "Notified" },
            { value: "confirmed", label: "Confirmed" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                filterStatus === tab.value
                  ? "bg-white text-gray-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Class filter pills */}
        {classDemand.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {classDemand.slice(0, 5).map((cls) => (
              <button
                key={cls.classId}
                onClick={() => setFilterClassId(filterClassId === cls.classId ? null : cls.classId)}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ring-1 ring-inset cursor-pointer ${
                  filterClassId === cls.classId
                    ? "bg-primary-50 text-primary-700 ring-primary-600/20"
                    : cls.count >= 3
                    ? "bg-amber-50 text-amber-700 ring-amber-600/20 hover:bg-amber-100"
                    : "bg-gray-50 text-gray-700 ring-gray-500/10 hover:bg-gray-100"
                }`}
              >
                {cls.className} ({cls.count})
              </button>
            ))}
            {filterClassId && (
              <button
                onClick={() => setFilterClassId(null)}
                className="text-xs font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Entry List — grouped by urgency */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        {/* Trash banner */}
        {filterStatus === "removed" && filteredEntries.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-gray-50 ring-1 ring-inset ring-gray-200 flex items-center gap-3">
            <TrashIcon className="size-5 text-gray-400 shrink-0" />
            <p className="text-sm text-gray-600">
              Removed entries are automatically deleted after 7 days.
            </p>
          </div>
        )}

        {filteredEntries.length === 0 ? (
          <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center py-16">
            <div className="size-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
              {filterStatus === "removed" ? (
                <TrashIcon className="size-6 text-gray-400" />
              ) : (
                <ClipboardIcon className="size-6 text-gray-400" />
              )}
            </div>
            <h3 className="text-md font-semibold text-gray-900">
              {filterStatus === "removed" ? "Trash is empty" : "No clients in queue"}
            </h3>
            <p className="text-sm text-gray-600 text-center mt-1">
              {filterStatus === "removed"
                ? "Removed entries will appear here for 7 days."
                : "When classes fill up, clients appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Section: Needs action */}
            {needsAction.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="size-2 rounded-full bg-amber-500" />
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Needs action ({needsAction.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {needsAction.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} actionLoading={actionLoading} onNotify={handleNotify} />
                  ))}
                </div>
              </div>
            )}

            {/* Section: Awaiting response */}
            {awaitingResponse.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="size-2 rounded-full bg-blue-500" />
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Awaiting response ({awaitingResponse.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {awaitingResponse.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} actionLoading={actionLoading} onNotify={handleNotify} />
                  ))}
                </div>
              </div>
            )}

            {/* Section: Resolved — collapsed by default */}
            {resolved.length > 0 && (
              <div>
                <button
                  onClick={() => setResolvedExpanded(!resolvedExpanded)}
                  className="flex items-center gap-2 mb-2 group cursor-pointer"
                >
                  <span className="size-2 rounded-full bg-gray-400" />
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Resolved ({resolved.length})
                  </h2>
                  <svg className={`size-3.5 text-gray-400 group-hover:text-gray-600 transition-transform ${resolvedExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {resolvedExpanded && (
                  <div className="space-y-2">
                    {resolved.map((entry) => (
                      <EntryRow key={entry.id} entry={entry} actionLoading={actionLoading} onNotify={handleNotify} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
