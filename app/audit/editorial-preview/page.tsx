"use client";

// EDITORIAL PROTOTYPE — Cover + Finding 01 + interactive island
// Goal: validate the report-style direction (no sidebar, serif headlines,
// prose with inline data) before refactoring the full Radar page.
// Self-contained mock data — duplicated from /audit/[token]/page.tsx on purpose.

import { useState } from "react";
import { CheckCircleIcon, ClockIcon } from "lucide-react";

const studio = {
  name: "Bella Pilates",
  city: "Austin, TX",
  reportMonth: "April 2026",
  lastRefreshedAt: "April 28, 2026",
  ownerFirstName: "Bella",
};

const stats = {
  activeMembers: 234,
  attendanceRecords: 2108,
  transactions: 156,
  classpassVisits: 87,
  totalRecoverableAnnual: 52400,
};

const failedPayments = {
  countOpen: 12,
  totalOverdue: 9420,
  estRecoverableAnnual: 8200,
  members: [
    { id: "fp1", name: "Diana R.", overdueDays: 8, amount: 199, reason: "Card expired" },
    { id: "fp2", name: "Mike T.", overdueDays: 14, amount: 249, reason: "Insufficient funds" },
    { id: "fp3", name: "Priya N.", overdueDays: 22, amount: 199, reason: "Auto-renewal failed (×2)" },
    { id: "fp4", name: "Lucas G.", overdueDays: 5, amount: 320, reason: "Pending bank verification" },
  ],
};

const thisWeek = [
  { id: "m1", name: "Sarah K.", daysSinceLastClass: 14, riskReason: "Skipped after 3-class streak", severity: "high" as const, suggestedAction: "Quick warm check-in. Offer the Wednesday 6pm spot — that's her usual." },
  { id: "m2", name: "Maria L.", daysSinceLastClass: 21, riskReason: "No-shows last 2 bookings", severity: "high" as const, suggestedAction: "Ask if something changed. Hold a Saturday spot if she wants — low-pressure." },
  { id: "m3", name: "Jen P.", daysSinceLastClass: 18, riskReason: "Used to come 3x/week, now 0", severity: "critical" as const, suggestedAction: "Personal reach-out — her 8am Tuesday is consistent. Worth a 5-min call." },
  { id: "m4", name: "Camila O.", daysSinceLastClass: 28, riskReason: "Cancelled membership renewal", severity: "critical" as const, suggestedAction: "Win-back conversation. Probe what didn't fit; offer a different format/time." },
  { id: "m5", name: "Rachel D.", daysSinceLastClass: 12, riskReason: "Health score dropped 30% this month", severity: "medium" as const, suggestedAction: "Light touch — offer a Thursday 7am spot. Don't over-explain." },
];

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const severityDot: Record<"critical" | "high" | "medium" | "low", string> = {
  critical: "bg-red-600",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-stone-400",
};

export default function EditorialPreviewPage() {
  const [contacted, setContacted] = useState<Record<string, boolean>>({});
  const toggleContacted = (id: string) =>
    setContacted((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 selection:bg-amber-200/60">
      <article className="mx-auto max-w-3xl px-6 sm:px-8 py-16 sm:py-24">
        {/* ========================================================== */}
        {/* COVER                                                       */}
        {/* ========================================================== */}
        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500">
            FlexiWell Radar · Issue 01 · {studio.reportMonth}
          </p>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight mt-10">
            {studio.ownerFirstName}, you&apos;re leaving{" "}
            <span className="text-red-700 tabular-nums">
              {fmtUSD(stats.totalRecoverableAnnual)}
            </span>{" "}
            a year on the table.
          </h1>

          <p className="font-serif text-xl sm:text-2xl text-stone-600 leading-snug mt-8 max-w-2xl">
            A diagnostic of {studio.name}&apos;s last 90 days. Three findings, one 30-day plan, and a refresh in August.
          </p>

          <hr className="border-stone-300 mt-14" />

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 mt-7">
            <CoverStat label="Active members" value={stats.activeMembers.toLocaleString()} />
            <CoverStat label="Attendance records" value={stats.attendanceRecords.toLocaleString()} />
            <CoverStat label="Transactions" value={stats.transactions.toLocaleString()} />
            <CoverStat label="ClassPass visits" value={stats.classpassVisits.toLocaleString()} />
          </dl>

          <p className="text-xs text-stone-500 mt-8">
            Refreshed {studio.lastRefreshedAt} · {studio.city}
          </p>
        </header>

        {/* ========================================================== */}
        {/* FINDING 01                                                  */}
        {/* ========================================================== */}
        <section className="mt-24 sm:mt-32">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500">
            Finding 01 · Lost Revenue
          </p>

          <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-tight mt-6 max-w-2xl">
            Twelve members are paying nothing — and they don&apos;t know it.
          </h2>

          <div className="font-serif text-lg leading-relaxed text-stone-800 space-y-6 mt-8">
            <p>
              Right now,{" "}
              <span className="font-semibold text-red-700 tabular-nums">
                {fmtUSD(failedPayments.totalOverdue)}
              </span>{" "}
              is sitting in failed-payment limbo across{" "}
              <span className="font-semibold tabular-nums">{failedPayments.countOpen} members</span>.
              Most don&apos;t know their card declined three weeks ago. They&apos;re still checking
              in, still showing up — until the system quietly stops billing them and they drift
              out in thirty to forty-five days.
            </p>
            <p>
              The pattern is mechanical: a card expires, a bank flags an auto-renewal, an
              account hits insufficient funds. None of these are cancellations. They&apos;re
              failures dressed up to look like cancellations — and they cost differently
              because they&apos;re recoverable.
            </p>
          </div>

          {/* Pull-out: four of the twelve */}
          <aside className="my-12 border-y border-stone-300 py-7">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500 mb-5">
              Four of the twelve
            </p>
            <ul className="divide-y divide-stone-200">
              {failedPayments.members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-baseline justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <span className="font-serif font-medium text-base">{m.name}</span>
                    <span className="text-sm text-stone-500">
                      {" "}
                      — {m.reason}, {m.overdueDays}d overdue
                    </span>
                  </div>
                  <span className="tabular-nums font-medium text-red-700 shrink-0">
                    {fmtUSD(m.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="font-serif text-lg leading-relaxed text-stone-800 space-y-6">
            <p>
              Recoverable in the next two weeks:{" "}
              <span className="font-semibold text-red-700 tabular-nums">
                {fmtUSD(failedPayments.estRecoverableAnnual)}
              </span>{" "}
              a year. The move depends on the failure mode. Cards expired? A one-line text saves
              most of them. Insufficient funds? That&apos;s a different conversation — and not
              one you want a system sending automatically.
            </p>
          </div>
        </section>

        {/* ========================================================== */}
        {/* INTERACTIVE ISLAND — This Week                              */}
        {/* ========================================================== */}
        <section className="mt-24 sm:mt-32">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500">
            This Week
          </p>

          <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-tight mt-6 max-w-2xl">
            The five members at the edge.
          </h2>

          <p className="font-serif text-lg text-stone-600 mt-5 max-w-2xl leading-relaxed">
            Five people who, by the numbers, are about to leave. Reach out this week — call,
            WhatsApp, email, your call. Mark each as contacted to track follow-ups.
          </p>

          <div className="mt-10 bg-white border border-stone-200 rounded-xl divide-y divide-stone-100 overflow-hidden">
            {thisWeek.map((m) => {
              const isContacted = !!contacted[m.id];
              return (
                <div
                  key={m.id}
                  className={`px-5 sm:px-6 py-4 transition-colors ${
                    isContacted ? "bg-emerald-50/40" : "hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleContacted(m.id)}
                      aria-label={isContacted ? "Mark as not contacted" : "Mark as contacted"}
                      className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isContacted
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-stone-300 hover:border-stone-500"
                      }`}
                    >
                      {isContacted && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${severityDot[m.severity]}`}
                        />
                        <h3 className="font-serif font-semibold text-stone-900 text-base">
                          {m.name}
                        </h3>
                        <span className="text-xs text-stone-500">
                          {m.daysSinceLastClass}d since last class
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mb-2 flex items-center gap-1.5">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {m.riskReason}
                      </p>
                      <p className="text-sm text-stone-700 leading-relaxed">
                        {m.suggestedAction}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleContacted(m.id)}
                      className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        isContacted
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-stone-900 text-white hover:bg-stone-800"
                      }`}
                    >
                      {isContacted ? "Contacted" : "Mark contacted"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer note */}
        <footer className="mt-24 pt-8 border-t border-stone-300">
          <p className="text-xs text-stone-500">
            Editorial prototype · cover + finding 01 + interactive island. Compare with{" "}
            <a href="/audit/preview" className="underline hover:text-stone-900">
              /audit/preview
            </a>
            .
          </p>
        </footer>
      </article>
    </div>
  );
}

function CoverStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.15em] text-stone-500">
        {label}
      </dt>
      <dd className="font-serif text-2xl font-semibold tabular-nums mt-1">{value}</dd>
    </div>
  );
}
