"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";

// ============================================
// Types (mirrors backend)
// ============================================

interface ChurnIntervention {
  signal: string;
  severity: "low" | "medium" | "high" | "critical";
  action: string;
  reason: string;
  messageTemplate: { en: string; pt: string };
  templateData?: Record<string, string | number>;
}

interface ClientCheckup {
  clientId: string;
  clientName: string;
  email: string;
  phone: string;
  healthScore: number;
  riskLevel: string;
  planType: string;
  lastClassDate: string | null;
  daysSinceLastClass: number;
  currentStreak: number;
  interventions: ChurnIntervention[];
  primaryIntervention: ChurnIntervention;
}

interface CheckupReport {
  generatedAt: string;
  summary: {
    totalAtRisk: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    newlyAtRisk: number;
    improved: number;
  };
  clients: ClientCheckup[];
  topInsight: string;
}

interface PendingFollowup {
  id: string;
  clientId: string;
  clientName: string;
  signal: string;
  message: string;
  sentAt: string;
}

type Outcome = "rebooked" | "in_conversation" | "no_response" | "lost";

// ============================================
// Helpers
// ============================================

const severityConfig = {
  critical: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", dot: "bg-red-500", label: "Critical" },
  high: { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-700", dot: "bg-orange-500", label: "High" },
  medium: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500", label: "Medium" },
  low: { bg: "bg-gray-50", border: "border-gray-200", badge: "bg-gray-100 text-gray-700", dot: "bg-gray-400", label: "Low" },
};

const signalLabels: Record<string, string> = {
  attendance_dropping: "Attendance dropping",
  plan_underutilized: "Not using their plan",
  gone_cold: "Haven't visited in a while",
  no_shows_spiking: "Missing booked classes",
  payment_failed: "Payment issue",
  new_not_activated: "New — hasn't started yet",
  streak_broken: "Lost their streak",
};

const actionLabels: Record<string, string> = {
  schedule_checkin: "Send schedule check-in",
  personal_booking: "Book a class for them",
  miss_you_message: "Send a check-in message",
  offer_pause: "Offer a plan pause",
  payment_outreach: "Reach out about payment",
  instructor_nudge: "Have instructor reach out",
  milestone_reminder: "Send streak reminder",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
}

// ============================================
// Components
// ============================================

function SummaryCards({ summary }: { summary: CheckupReport["summary"] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-sm text-gray-500">Need attention</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalAtRisk}</p>
      </div>
      <div className="bg-white border border-red-200 rounded-xl p-4">
        <p className="text-sm text-red-600">Critical</p>
        <p className="text-2xl font-bold text-red-700 mt-1">{summary.critical}</p>
      </div>
      <div className="bg-white border border-green-200 rounded-xl p-4">
        <p className="text-sm text-green-600">Improved this week</p>
        <p className="text-2xl font-bold text-green-700 mt-1">{summary.improved}</p>
      </div>
      <div className="bg-white border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-600">Newly at risk</p>
        <p className="text-2xl font-bold text-amber-700 mt-1">{summary.newlyAtRisk}</p>
      </div>
    </div>
  );
}

// Follow-up panel: yesterday (and earlier) the owner sent texts via the Copilot.
// Today she comes back and tells us what happened with one tap. This is the
// closed loop that turns the Copilot into a real retention engine.
function PendingFollowupsPanel({
  followups,
  onResolve,
}: {
  followups: PendingFollowup[];
  onResolve: (id: string, outcome: Outcome) => void;
}) {
  if (followups.length === 0) return null;

  const outcomes: Array<{ key: Outcome; label: string; emoji: string; tone: string }> = [
    { key: "rebooked", label: "Rebooked", emoji: "✓", tone: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
    { key: "in_conversation", label: "Still talking", emoji: "💬", tone: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
    { key: "no_response", label: "No reply yet", emoji: "…", tone: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100" },
    { key: "lost", label: "Not coming back", emoji: "✕", tone: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
  ];

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
        <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Quick check-in</p>
        <h2 className="text-base font-semibold text-gray-900 mt-0.5">
          {followups.length === 1 ? "How did your message land?" : `How did your ${followups.length} messages land?`}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          One tap each — we&apos;ll measure what&apos;s working and stop nudging the ones who are gone.
        </p>
      </div>
      <ul className="divide-y divide-gray-100">
        {followups.map((f) => {
          const firstName = f.clientName.split(" ")[0] || f.clientName;
          const sentDays = Math.max(0, Math.floor((Date.now() - new Date(f.sentAt).getTime()) / (1000 * 60 * 60 * 24)));
          const sentLabel = sentDays === 0 ? "today" : sentDays === 1 ? "yesterday" : `${sentDays} days ago`;
          return (
            <li key={f.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{firstName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">You texted {sentLabel}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {outcomes.map((o) => (
                  <button
                    key={o.key}
                    onClick={() => onResolve(f.id, o.key)}
                    className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${o.tone}`}
                  >
                    <span className="mr-1">{o.emoji}</span>
                    {o.label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ClientCard({ client, onSend }: { client: ClientCheckup; onSend: (client: ClientCheckup, intervention: ChurnIntervention) => void }) {
  const [expanded, setExpanded] = useState(false);
  const primary = client.primaryIntervention;
  const config = severityConfig[primary.severity];

  return (
    <div className={`${config.bg} border ${config.border} rounded-xl overflow-hidden transition-all`}>
      {/* Main row */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Severity dot + Avatar */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-700">
                {client.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <span className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${config.dot}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900">{client.clientName}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
                {config.label}
              </span>
              <span className="text-xs text-gray-500 capitalize">{client.planType} plan</span>
            </div>
            <p className="text-sm text-gray-700 mt-1">{primary.reason}</p>
            <p className="text-xs text-gray-500 mt-1">
              Last visit: {timeAgo(client.lastClassDate)}
              {client.currentStreak > 0 && ` · ${client.currentStreak}-week streak`}
            </p>
          </div>

          {/* Action button */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            <button
              onClick={() => onSend(client, primary)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm whitespace-nowrap"
            >
              {actionLabels[primary.action] || "Send message"}
            </button>
            {client.interventions.length > 1 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {expanded ? "Less" : `+${client.interventions.length - 1} more`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded: additional interventions */}
      {expanded && client.interventions.length > 1 && (
        <div className="border-t border-gray-200/50 bg-white/50 px-4 sm:px-5 py-3 space-y-2">
          {client.interventions.slice(1).map((intervention, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${severityConfig[intervention.severity].dot}`} />
                  {signalLabels[intervention.signal] || intervention.signal}
                </p>
                <p className="text-xs text-gray-500 ml-4">{intervention.reason}</p>
              </div>
              <button
                onClick={() => onSend(client, intervention)}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
              >
                {actionLabels[intervention.action] || "Send"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SendModal({
  client,
  intervention,
  onClose,
  onSent,
}: {
  client: ClientCheckup;
  intervention: ChurnIntervention;
  onClose: () => void;
  onSent: () => void;
}) {
  const [message, setMessage] = useState(intervention.messageTemplate.en);
  const [logging, setLogging] = useState(false);
  const [sent, setSent] = useState(false);

  const smsHref = `sms:${client.phone.replace(/[^0-9+]/g, "")}?&body=${encodeURIComponent(message)}`;

  // Simple client-side template fill for preview
  useEffect(() => {
    const firstName = client.clientName.split(" ")[0];
    let filled = intervention.messageTemplate.en;
    filled = filled.replace("{clientName}", firstName);
    filled = filled.replace("{studioName}", "our studio");
    filled = filled.replace("{instructorName}", "your instructor");
    filled = filled.replace("{nextClassName}", "our next class");
    filled = filled.replace("{nextClassDay}", "this week");
    if (intervention.templateData) {
      Object.entries(intervention.templateData).forEach(([key, val]) => {
        filled = filled.replace(`{${key}}`, String(val));
      });
    }
    setMessage(filled);
  }, [client, intervention]);

  const handleMarkContacted = async () => {
    setLogging(true);
    try {
      await api.post<{ success: boolean }>("/api/admin/churn-checkup/send", {
        clientId: client.clientId,
        signal: intervention.signal,
        messageTemplate: message,
        templateData: intervention.templateData,
        channel: "sms",
      });
      setSent(true);
      setTimeout(() => {
        onSent();
        onClose();
      }, 1200);
    } catch {
      // error handled by api client
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Text {client.clientName.split(" ")[0]}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                SMS · {client.phone}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Signal context */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Why</p>
          <p className="text-sm text-gray-700 mt-0.5">{intervention.reason}</p>
        </div>

        {/* Editable message */}
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Suggested message — edit before sending</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            {message.length} characters · Opens your phone&apos;s SMS app — sent from your number, not a bot
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <a
            href={smsHref}
            onClick={handleMarkContacted}
            aria-disabled={logging || sent || !message.trim()}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors text-center ${
              sent ? "bg-green-600" : "bg-primary-600 hover:bg-primary-700"
            } ${(logging || sent || !message.trim()) ? "opacity-50 pointer-events-none" : ""}`}
          >
            {sent ? "Logged" : logging ? "Opening..." : "Open SMS app"}
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function ClientCheckupPage() {
  const [report, setReport] = useState<CheckupReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendModal, setSendModal] = useState<{ client: ClientCheckup; intervention: ChurnIntervention } | null>(null);
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "medium" | "low">("all");
  const [sentClientIds, setSentClientIds] = useState<Set<string>>(new Set());
  const [pendingFollowups, setPendingFollowups] = useState<PendingFollowup[]>([]);

  const fetchPendingFollowups = async () => {
    try {
      const result = await api.get<{ interventions: PendingFollowup[] }>(
        "/api/admin/churn-checkup/outcome",
      );
      if (result.data?.interventions) {
        setPendingFollowups(result.data.interventions);
      }
    } catch {
      // non-fatal — the panel just stays empty
    }
  };

  const handleResolveFollowup = async (id: string, outcome: Outcome) => {
    // Optimistic remove
    setPendingFollowups((prev) => prev.filter((f) => f.id !== id));
    try {
      await api.post("/api/admin/churn-checkup/outcome", { interventionId: id, outcome });
    } catch {
      // If it fails, refetch so the user can try again
      fetchPendingFollowups();
    }
  };

  const fetchReport = async (force = false) => {
    if (force) setRefreshing(true); else setLoading(true);
    try {
      const endpoint = force ? "/api/admin/churn-checkup" : "/api/admin/churn-checkup";
      const method = force ? "post" : "get";
      const result = method === "post"
        ? await api.post<CheckupReport>(endpoint, {})
        : await api.get<CheckupReport>(endpoint);
      if (result.data) setReport(result.data);
    } catch {
      // handled
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
    fetchPendingFollowups();
  }, []);

  // Deep link from the daily digest email: /admin/client-checkup?client=<id>
  // auto-opens the SendModal for that specific client. Runs whenever the
  // report finishes loading so the link works on a fresh page load.
  useEffect(() => {
    if (!report) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("client");
    if (!targetId) return;
    const target = report.clients.find((c) => c.clientId === targetId);
    if (target) {
      setSendModal({ client: target, intervention: target.primaryIntervention });
      // Clean the query string so a refresh doesn't keep re-opening the modal.
      const url = new URL(window.location.href);
      url.searchParams.delete("client");
      window.history.replaceState({}, "", url.toString());
    }
  }, [report]);

  const handleSend = (client: ClientCheckup, intervention: ChurnIntervention) => {
    setSendModal({ client, intervention });
  };

  const handleSent = () => {
    if (sendModal) {
      setSentClientIds(prev => new Set(prev).add(sendModal.client.clientId));
    }
  };

  const filteredClients = report?.clients.filter(c => {
    if (filter === "all") return true;
    return c.primaryIntervention.severity === filter;
  }) || [];

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Retention Copilot</h1>
            <p className="text-sm text-gray-500 mt-1">
              Who to text this week, and exactly what to say
            </p>
          </div>
          <button
            onClick={() => fetchReport(true)}
            disabled={refreshing}
            className="self-start sm:self-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        )}

        {!loading && report && (
          <>
            {/* Pending follow-ups from yesterday's texts */}
            <PendingFollowupsPanel
              followups={pendingFollowups}
              onResolve={handleResolveFollowup}
            />

            {/* Top insight */}
            {report.topInsight && (
              <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">This week&apos;s insight</p>
                    <p className="text-sm text-gray-700 mt-0.5">{report.topInsight}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary cards */}
            <SummaryCards summary={report.summary} />

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              {(["all", "critical", "high", "medium", "low"] as const).map((f) => {
                const count = f === "all"
                  ? report.summary.totalAtRisk
                  : report.summary[f];
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      filter === f
                        ? "bg-gray-900 text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {f === "all" ? "All" : severityConfig[f].label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Client list */}
            {filteredClients.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">All clear!</h3>
                <p className="text-sm text-gray-500">No clients need attention in this category. Keep it up.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <div key={client.clientId} className="relative">
                    {sentClientIds.has(client.clientId) && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full z-10">
                        Message sent
                      </div>
                    )}
                    <ClientCard client={client} onSend={handleSend} />
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Report generated {new Date(report.generatedAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                {" · "}
                <Link href="/admin" className="text-primary-600 hover:text-primary-700">Back to dashboard</Link>
              </p>
            </div>
          </>
        )}

        {!loading && !report && (
          <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No check-up data yet</h3>
            <p className="text-sm text-gray-500 mb-4">Add clients and track their activity to see who needs attention.</p>
            <Link
              href="/admin/clients"
              className="inline-flex px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Go to Clients
            </Link>
          </div>
        )}
      </div>

      {/* Send Modal */}
      {sendModal && (
        <SendModal
          client={sendModal.client}
          intervention={sendModal.intervention}
          onClose={() => setSendModal(null)}
          onSent={handleSent}
        />
      )}
    </div>
  );
}
