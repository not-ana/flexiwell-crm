"use client";

// RetentionDashboard
// ----------------------------------------------------------------------------
// The single most important UI in FlexiWell.
//
// This is the artifact that proves the positioning. It sits at the top of the
// owner's admin page and tells one story in three rows:
//
//   Row 1 — THE NUMBER.  Monthly retention rate. The thing we guarantee on.
//   Row 2 — THE PROOF.   Stickiness milestones (1mo / 3mo / 6mo).
//   Row 3 — THE WORK.    At-risk, recovered, check-ins, studio health.
//
// Discipline rules baked into this file:
//   - One fetch, one loading state, one error state. The dashboard renders as
//     a unit or not at all.
//   - No interactivity beyond the bare minimum. No tooltips that require
//     reading. No drill-downs. No filters. The owner GLANCES at this; they
//     don't analyze it.
//   - Numbers are large, labels are small, white space is generous. White
//     space IS positioning.
// ----------------------------------------------------------------------------

import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api/client";

interface MonthlyRetention {
  rate: number;
  membersAtStart: number;
  membersRetained: number;
  monthLabel: string;
  baselineRate: number | null;
}

interface CohortPoint {
  monthOffset: number;
  retention: number;
}

interface Cohort {
  cohortLabel: string;
  cohortSize: number;
  curve: CohortPoint[];
}

interface StickinessMilestone {
  label: string;
  rate: number | null;          // 0..1
  prevRate: number | null;      // previous cohort's rate at the same offset, for delta
  stayed: number;
  total: number;
  source: string;               // e.g. "Mar 2026"
}

interface AtRiskBuckets {
  critical: number;
  atRisk: number;
  watch: number;
  healthy: number;
  topAtRisk: Array<{ id: string; name: string; score: number; reason: string }>;
}

interface RevenueRetained {
  revenueRetainedThisWeek: number;
  recoveredCount: number;
  currency: string;
}

interface InterventionsRunning {
  total: number;
  byType: Array<{ type: string; count: number }>;
}

interface RetentionPayload {
  monthlyRetention: MonthlyRetention;
  cohorts: Cohort[];
  atRisk: AtRiskBuckets;
  revenueRetained: RevenueRetained;
  interventions: InterventionsRunning;
  computedAt: string;
}

function formatPct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatCohortLabel(label: string): string {
  // "2025-11" → "Nov 2025"
  const match = label.match(/^(\d{4})-(\d{2})$/);
  if (!match) return label;
  const monthIdx = parseInt(match[2], 10) - 1;
  return `${SHORT_MONTHS[monthIdx] ?? match[2]} ${match[1]}`;
}

function formatMonthLabel(label: string): string {
  // "2026-04" → "April 2026"
  const match = label.match(/^(\d{4})-(\d{2})$/);
  if (!match) return label;
  const date = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDelta(current: number, baseline: number | null): { text: string; positive: boolean } | null {
  if (baseline === null) return null;
  const delta = (current - baseline) * 100;
  if (Math.abs(delta) < 0.1) return { text: "no change", positive: true };
  const sign = delta > 0 ? "+" : "";
  return {
    text: `${sign}${delta.toFixed(1)} pts vs last year`,
    positive: delta >= 0,
  };
}

// Derive stickiness milestones from cohort data.
// For each target offset (1, 3, 6 months), find the most recent cohort that
// has data at that offset and the previous one for computing deltas.
function computeMilestones(cohorts: Cohort[]): StickinessMilestone[] {
  const MILESTONES = [
    { offset: 1, label: "After 1 month" },
    { offset: 3, label: "After 3 months" },
    { offset: 6, label: "After 6 months" },
  ];

  // Sort cohorts by label (chronological)
  const sorted = [...cohorts]
    .filter((c) => c.curve.length > 0)
    .sort((a, b) => a.cohortLabel.localeCompare(b.cohortLabel));

  return MILESTONES.map(({ offset, label }) => {
    // Find the most recent cohort with data at this offset
    const withData = sorted.filter((c) => c.curve.some((p) => p.monthOffset === offset));
    const latest = withData[withData.length - 1];
    const previous = withData.length >= 2 ? withData[withData.length - 2] : null;

    if (!latest) {
      return { label, rate: null, prevRate: null, stayed: 0, total: 0, source: "" };
    }

    const point = latest.curve.find((p) => p.monthOffset === offset)!;
    const prevPoint = previous?.curve.find((p) => p.monthOffset === offset);
    const stayed = Math.round(point.retention * latest.cohortSize);

    return {
      label,
      rate: point.retention,
      prevRate: prevPoint?.retention ?? null,
      stayed,
      total: latest.cohortSize,
      source: formatCohortLabel(latest.cohortLabel),
    };
  });
}

interface RetentionDashboardProps {
  studioHealthCard?: ReactNode;
}

export function RetentionDashboard({ studioHealthCard }: RetentionDashboardProps) {
  const [data, setData] = useState<RetentionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await api.get<RetentionPayload>("/api/admin/retention");
        if (cancelled) return;
        if (res.error) {
          setError(res.error.error);
        } else if (res.data) {
          setData(res.data);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 p-12 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-white border border-gray-200 p-8 mb-6">
        <p className="text-sm text-gray-500">Retention metrics unavailable right now.</p>
      </div>
    );
  }

  const { monthlyRetention, cohorts, atRisk, revenueRetained, interventions } = data;
  const delta = formatDelta(monthlyRetention.rate, monthlyRetention.baselineRate);

  // Breakdown for the right side of Row 1
  const membersLost = Math.max(0, monthlyRetention.membersAtStart - monthlyRetention.membersRetained);
  const retainedPct = monthlyRetention.membersAtStart > 0
    ? (monthlyRetention.membersRetained / monthlyRetention.membersAtStart) * 100
    : 0;

  // Stickiness milestones from cohort data
  const milestones = computeMilestones(cohorts);
  const hasAnyMilestone = milestones.some((m) => m.rate !== null);

  return (
    <div className="space-y-4 mb-6">
      {/* ============================================================ */}
      {/* ROW 1 — THE NUMBER                                            */}
      {/* ============================================================ */}
      <div className="rounded-2xl bg-white border border-gray-200 p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
          {/* Left: the number */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
              Monthly Member Retention
            </p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="text-6xl sm:text-7xl font-semibold text-gray-900 tabular-nums leading-none">
                {formatPct(monthlyRetention.rate)}
              </p>
              {delta && (
                <span
                  className={`text-sm font-medium ${
                    delta.positive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {delta.positive && delta.text !== "no change" ? "↑ " : delta.text !== "no change" ? "↓ " : ""}
                  {delta.text}
                </span>
              )}
            </div>
            <p className="mt-3 text-xs text-gray-500">{formatMonthLabel(monthlyRetention.monthLabel)}</p>
          </div>

          {/* Right: visual breakdown */}
          <div className="md:border-l md:border-gray-100 md:pl-10">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Started with</span>
                <span className="text-lg font-semibold text-gray-900 tabular-nums">{monthlyRetention.membersAtStart}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-green-700">Retained</span>
                <span className="text-lg font-semibold text-green-700 tabular-nums">{monthlyRetention.membersRetained}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-red-700">Lost</span>
                <span className="text-lg font-semibold text-red-700 tabular-nums">{membersLost}</span>
              </div>
              {/* Stacked bar */}
              <div className="pt-2">
                <div className="h-2 w-full bg-red-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${retainedPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ROW 2 — THE PROOF (stickiness milestones)                     */}
      {/* ============================================================ */}
      {hasAnyMilestone && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {milestones.map((m) => {
            if (m.rate === null) {
              return (
                <div key={m.label} className="rounded-2xl bg-white border border-gray-200 p-5 flex flex-col">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">{m.label}</p>
                  <p className="text-sm text-gray-400 mt-2">Not enough data yet</p>
                </div>
              );
            }
            const pctDelta = m.prevRate !== null ? (m.rate - m.prevRate) * 100 : null;
            return (
              <div key={m.label} className="rounded-2xl bg-white border border-gray-200 p-5 flex flex-col">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">{m.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-semibold text-gray-900 tabular-nums leading-none">
                    {formatPct(m.rate)}
                  </p>
                  {pctDelta !== null && Math.abs(pctDelta) >= 0.1 && (
                    <span className={`text-sm font-medium ${pctDelta >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {pctDelta > 0 ? "↑" : "↓"} {Math.abs(pctDelta).toFixed(0)} pts
                    </span>
                  )}
                  {pctDelta !== null && Math.abs(pctDelta) < 0.1 && (
                    <span className="text-sm text-gray-400">no change</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {m.stayed} of {m.total} members from {m.source} still active
                </p>
              </div>
            );
          })}
        </div>
      )}

      {!hasAnyMilestone && (
        <div className="rounded-2xl bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900">New member stickiness</h3>
          <p className="text-sm text-gray-400 mt-2">
            Not enough data yet — check back after your first full month.
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* ROW 3 — THE WORK                                              */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* At risk this week */}
        <div className="rounded-2xl bg-white border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              At risk this week
            </p>
            {(atRisk.critical + atRisk.atRisk) > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </div>
          <p className="text-4xl font-semibold text-gray-900 tabular-nums leading-none">
            {atRisk.critical + atRisk.atRisk}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {atRisk.critical} critical · {atRisk.atRisk} at risk
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex-1">
            {atRisk.topAtRisk.length > 0 ? (
              <ul className="space-y-2">
                {atRisk.topAtRisk.map((c) => (
                  <li key={c.id} className="text-xs flex justify-between gap-2">
                    <span className="truncate font-medium text-gray-900">{c.name}</span>
                    <span className="text-gray-400 truncate">{c.reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 leading-relaxed">
                Nobody slipping right now. We&apos;ll flag members the moment their attendance pattern breaks.
              </p>
            )}
          </div>
        </div>

        {/* Recovered this week */}
        <div className="rounded-2xl bg-white border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Recovered this week
            </p>
            {revenueRetained.recoveredCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-green-500" />
            )}
          </div>
          <p className="text-4xl font-semibold text-gray-900 tabular-nums leading-none">
            {revenueRetained.recoveredCount}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {revenueRetained.currency} {revenueRetained.revenueRetainedThisWeek.toLocaleString()} retained
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex-1">
            <p className="text-xs text-gray-500 leading-relaxed">
              Members who were drifting and came back. The dollar number is what you would have lost if no one had reached out.
            </p>
          </div>
        </div>

        {/* Check-ins this week */}
        <div className="rounded-2xl bg-white border border-gray-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Check-ins this week
            </p>
            {interventions.total > 0 && (
              <span className="w-2 h-2 rounded-full bg-primary-500" />
            )}
          </div>
          <p className="text-4xl font-semibold text-gray-900 tabular-nums leading-none">
            {interventions.total}
          </p>
          <p className="text-xs text-gray-400 mt-2">texts you sent from the Copilot</p>
          <div className="mt-4 pt-4 border-t border-gray-100 flex-1">
            {interventions.byType.length > 0 ? (
              <ul className="space-y-2">
                {interventions.byType.map((t) => (
                  <li key={t.type} className="text-xs flex justify-between gap-2">
                    <span className="truncate text-gray-600">{t.type}</span>
                    <span className="text-gray-900 font-medium tabular-nums">{t.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 leading-relaxed">
                No outreach needed yet. We&apos;ll send check-ins automatically when members start to drift.
              </p>
            )}
          </div>
        </div>

        {/* Studio Health — passed in from admin page */}
        {studioHealthCard}
      </div>
    </div>
  );
}
