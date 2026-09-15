"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { InteractiveOnboarding, useInteractiveOnboarding } from "@/components/onboarding";
import type { OnboardingPath } from "@/components/onboarding";
import { useCurrency } from "@/hooks/useCurrency";
import { api, clientsApi } from "@/lib/api/client";
import type { ClientMetrics } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";

interface CheckupSummary {
  totalAtRisk: number;
  critical: number;
  high: number;
  newlyAtRisk: number;
  improved: number;
}

interface CheckupPreview {
  summary: CheckupSummary;
  topInsight: string;
  clients: Array<{
    clientName: string;
    primaryIntervention: { severity: string; reason: string; action: string };
  }>;
}

interface DashboardStats {
  revenue: number;
  revenueChange: string;
  clients: number;
  clientsChange: string;
  classes: number;
  classesChange: string;
  attendance: string;
  previousAttendance: string;
  noShowRate: string;
  previousNoShowRate: string;
  noShows: number;
  waitlistFills: number;
  waitlistSpotsGenerated: number;
  waitlistFillRate: number;
  revenueRecovered: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: Array<{
    id: number;
    action: string;
    name: string;
    time: string;
    type: string;
  }>;
  todayClasses: Array<{
    id: string;
    name: string;
    time: string;
    instructor: string;
    enrolled: number;
    capacity: number;
  }>;
}

type TimePeriod = "week" | "month" | "year";

// Health level based on metrics
function computeHealthLevel(stats: DashboardStats, cm: ClientMetrics | null): "good" | "warning" | "critical" {
  let score = 0;
  let factors = 0;

  const revChange = parseFloat(stats.revenueChange);
  if (!isNaN(revChange)) { factors++; score += revChange >= 0 ? 2 : 0; }

  const att = parseFloat(stats.attendance);
  if (!isNaN(att) && att > 0) { factors++; score += att >= 80 ? 2 : att >= 60 ? 1 : 0; }

  const noShow = parseFloat(stats.noShowRate);
  if (!isNaN(noShow)) { factors++; score += noShow <= 10 ? 2 : noShow <= 20 ? 1 : 0; }

  if (cm && cm.monthlyChurnRate > 0) { factors++; score += cm.monthlyChurnRate <= 5 ? 2 : cm.monthlyChurnRate <= 10 ? 1 : 0; }

  const ratio = factors > 0 ? score / (factors * 2) : 0.5;
  return ratio >= 0.65 ? "good" : ratio >= 0.35 ? "warning" : "critical";
}

// Format the period label for the navigation display
function getPeriodLabel(period: TimePeriod, refDate: Date): string {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (period === "year") return `${refDate.getFullYear()}`;
  if (period === "month") return `${monthNames[refDate.getMonth()]} ${refDate.getFullYear()}`;
  // week: show range
  const weekStart = new Date(refDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const startStr = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}`;
  const endStr = weekEnd.getMonth() !== weekStart.getMonth()
    ? `${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}`
    : `${weekEnd.getDate()}`;
  return `${startStr}–${endStr}, ${weekStart.getFullYear()}`;
}

// Check if the reference date is the current period (can't go forward)
function isCurrentPeriod(period: TimePeriod, refDate: Date): boolean {
  const now = new Date();
  if (period === "year") return refDate.getFullYear() === now.getFullYear();
  if (period === "month") return refDate.getFullYear() === now.getFullYear() && refDate.getMonth() === now.getMonth();
  // week
  const getWeekStart = (d: Date) => { const s = new Date(d); s.setDate(s.getDate() - s.getDay() + 1); s.setHours(0,0,0,0); return s; };
  return getWeekStart(refDate).getTime() === getWeekStart(now).getTime();
}

// Navigate to previous/next period
function shiftPeriod(period: TimePeriod, refDate: Date, direction: -1 | 1): Date {
  const d = new Date(refDate);
  if (period === "year") d.setFullYear(d.getFullYear() + direction);
  else if (period === "month") d.setMonth(d.getMonth() + direction);
  else d.setDate(d.getDate() + direction * 7);
  return d;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month");
  const [refTimestamp, setRefTimestamp] = useState<number>(Date.now());
  const referenceDate = new Date(refTimestamp);
  const setReferenceDate = (d: Date) => setRefTimestamp(d.getTime());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [clientMetrics, setClientMetrics] = useState<ClientMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [checkup, setCheckup] = useState<CheckupPreview | null>(null);
  const [retentionRate, setRetentionRate] = useState<{ rate: number; monthLabel: string } | null>(null);

  // Onboarding
  const { shouldShow: showOnboardingRaw, markComplete } = useInteractiveOnboarding("admin");
  const showOnboarding = showOnboardingRaw;

  const handleOnboardingPath = (path: OnboardingPath) => {
    if (path === "import") {
      markComplete();
      selectStudioOrigin("migrating");
      window.location.href = "/admin/settings?tab=integrations";
    } else if (path === "fresh") {
      markComplete();
      selectStudioOrigin("fresh");
    }
    // "tour" — do nothing here, the WelcomeModal's onStart handles it
    // by closing the welcome and starting the spotlight steps
  };

  // Setup checklist
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [studioOrigin, setStudioOrigin] = useState<"fresh" | "migrating" | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem("admin_setup_completed_steps");
    if (saved) setCompletedSteps(new Set(JSON.parse(saved)));
    const origin = localStorage.getItem("admin_studio_origin");
    if (origin === "fresh" || origin === "migrating") setStudioOrigin(origin);
  }, []);
  const selectStudioOrigin = (origin: "fresh" | "migrating") => {
    setStudioOrigin(origin);
    localStorage.setItem("admin_studio_origin", origin);
    // Reset completed steps when switching origin
    setCompletedSteps(new Set());
    localStorage.setItem("admin_setup_completed_steps", "[]");
  };
  const toggleStepComplete = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      localStorage.setItem("admin_setup_completed_steps", JSON.stringify([...next]));
      return next;
    });
  };

  const freshSteps = [
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, title: "Create your first class", desc: "Schedule, capacity and instructor", href: "/admin/classes", cta: "Create" },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>, title: "Add your first client", desc: "Name, email and phone", href: "/admin/clients", cta: "Add" },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, title: "Set up plans", desc: "Price your client subscriptions", href: "/admin/settings?tab=plans", cta: "Set up" },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: "Enable waitlist", desc: "Fill cancelled spots automatically", href: "/admin/waitlist", cta: "Enable" },
  ];

  const migratingSteps = [
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, title: "Import your clients", desc: "From Mindbody, GloFox, Tecnofit or CSV", href: "/admin/settings?tab=integrations", cta: "Import" },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, title: "Import your schedule", desc: "Recreate your classes and instructors", href: "/admin/classes", cta: "Set up" },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>, title: "Set up plans", desc: "Recreate or update your pricing", href: "/admin/settings?tab=plans", cta: "Set up" },
    { icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: "Enable waitlist", desc: "Fill cancelled spots automatically", href: "/admin/waitlist", cta: "Enable" },
  ];

  const setupSteps = studioOrigin === "migrating" ? migratingSteps : freshSteps;

  const { formatCurrency } = useCurrency();

  const [refreshing, setRefreshing] = useState(false);

  // Reset reference date to now when switching period type
  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    setRefTimestamp(Date.now());
  };

  const canGoForward = !isCurrentPeriod(selectedPeriod, referenceDate);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      if (!dashboardData) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      try {
        const params = new URLSearchParams({
          period: selectedPeriod,
          year: String(referenceDate.getFullYear()),
          month: String(referenceDate.getMonth()),
        });
        if (selectedPeriod === "week") {
          params.set("weekRef", referenceDate.toISOString());
        }
        const response = await api.get<DashboardData>(`/api/admin/dashboard?${params}`);
        if (response.data) setDashboardData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
    fetchDashboardData();
  }, [selectedPeriod, refTimestamp]);

  // Fetch client metrics
  useEffect(() => {
    async function fetchClientMetrics() {
      try {
        const response = await clientsApi.getMetrics();
        if (response.data) setClientMetrics(response.data);
      } catch { /* ignore */ }
    }
    fetchClientMetrics();
  }, []);

  // Fetch client checkup
  useEffect(() => {
    async function fetchCheckup() {
      try {
        const response = await api.get<CheckupPreview>("/api/admin/churn-checkup");
        if (response.data) setCheckup(response.data);
      } catch { /* ignore */ }
    }
    fetchCheckup();
  }, []);

  // Fetch retention rate
  useEffect(() => {
    async function fetchRetention() {
      try {
        const response = await api.get<{ monthlyRetention: { rate: number; monthLabel: string } }>("/api/admin/retention");
        if (response.data?.monthlyRetention?.monthLabel) {
          const { rate, monthLabel } = response.data.monthlyRetention;
          setRetentionRate({ rate, monthLabel });
        }
      } catch { /* ignore */ }
    }
    fetchRetention();
  }, []);

  // Fetch AI summary when data changes
  useEffect(() => {
    if (!dashboardData || loading) return;
    const stats = dashboardData.stats;
    if (stats.clients === 0 && stats.classes === 0) return;

    async function fetchAiSummary() {
      setAiLoading(true);
      try {
        const response = await api.post<{ summary: string; provider: string | null }>("/api/admin/dashboard/summary", {
            revenue: stats.revenue,
            revenueChange: stats.revenueChange,
            clients: stats.clients,
            clientsChange: stats.clientsChange,
            attendance: stats.attendance,
            noShowRate: stats.noShowRate,
            churnRate: clientMetrics?.monthlyChurnRate ?? "N/A",
            waitlistFills: stats.waitlistFills,
            waitlistSpotsGenerated: stats.waitlistSpotsGenerated,
            waitlistFillRate: stats.waitlistFillRate,
            revenueRecovered: stats.revenueRecovered,
            avgLTV: clientMetrics?.avgLTV ?? "N/A",
            period: selectedPeriod,
        });
        if (response.data?.summary) setAiSummary(response.data.summary);
      } catch {
        setAiSummary("");
      } finally {
        setAiLoading(false);
      }
    }
    fetchAiSummary();
  }, [dashboardData, loading, selectedPeriod, clientMetrics]);

  const stats = dashboardData?.stats || {
    revenue: 0, revenueChange: "+0%", clients: 0, clientsChange: "+0",
    classes: 0, classesChange: "+0%", attendance: "0%", previousAttendance: "0%",
    noShowRate: "0%", previousNoShowRate: "0%", noShows: 0,
    waitlistFills: 0, waitlistSpotsGenerated: 0, waitlistFillRate: 0, revenueRecovered: 0,
  };

  const recentActivity = dashboardData?.recentActivity || [];
  const todayClasses = dashboardData?.todayClasses || [];

  // Health level
  const healthLevel = computeHealthLevel(stats, clientMetrics);
  const healthConfig = {
    good: { bg: "bg-green-50", border: "border-green-200", label: "Healthy", dot: "bg-green-500", text: "text-green-700" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", label: "Needs attention", dot: "bg-amber-500", text: "text-amber-700" },
    critical: { bg: "bg-red-50", border: "border-red-200", label: "Critical", dot: "bg-red-500", text: "text-red-700" },
  }[healthLevel];

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "";

  // Format month label: "2026-04" → "April 2026"
  const formatMonth = (label: string) => {
    const m = label.match(/^(\d{4})-(\d{2})$/);
    if (!m) return label;
    return new Date(+m[1], +m[2] - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <InteractiveOnboarding role="admin" isOpen={showOnboarding} onComplete={markComplete} onChoosePath={handleOnboardingPath} />
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
                {greeting}{firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Your studio overview</p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-auto">
              {/* Time navigation */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setReferenceDate(shiftPeriod(selectedPeriod, referenceDate, -1))}
                  disabled={refreshing}
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                  {getPeriodLabel(selectedPeriod, referenceDate)}
                </span>
                <button
                  onClick={() => canGoForward && setReferenceDate(shiftPeriod(selectedPeriod, referenceDate, 1))}
                  disabled={refreshing || !canGoForward}
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-30"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              {/* Period type selector */}
              <div className="flex items-center gap-1 rounded-xl bg-gray-50 p-1 ring-1 ring-inset ring-gray-200 w-fit">
                {(["week", "month", "year"] as TimePeriod[]).map((period) => (
                  <button key={period} onClick={() => handlePeriodChange(period)} disabled={refreshing}
                    className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                      selectedPeriod === period ? "bg-white text-gray-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    } ${refreshing ? "cursor-wait" : ""}`}>
                    {period === "week" ? "Week" : period === "month" ? "Month" : "Year"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        )}

        {!loading && (
          <>
            {/* Setup Checklist — only for empty studios */}
            {stats.clients === 0 && stats.classes === 0 && studioOrigin && (
              <div className="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-5 sm:px-6 py-5 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold">Set up your studio</h2>
                    <span className="text-sm text-white/80">{completedSteps.size}/{setupSteps.length}</span>
                  </div>
                  <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${(completedSteps.size / setupSteps.length) * 100}%` }} />
                  </div>
                  <p className="text-sm text-white mt-2">Studios recover $2,300+/month in lost revenue with FlexiWell.</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {setupSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50 transition-colors group">
                      <button onClick={(e) => toggleStepComplete(i, e)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${completedSteps.has(i) ? "bg-green-100 text-green-600" : "bg-primary-50 text-primary-600 group-hover:bg-primary-100"}`}>
                        {completedSteps.has(i)
                          ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          : step.icon}
                      </button>
                      <Link href={step.href} className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${completedSteps.has(i) ? "text-gray-400 line-through" : "text-gray-900"}`}>{step.title}</p>
                        <p className={`text-sm ${completedSteps.has(i) ? "text-gray-400" : "text-gray-500"}`}>{step.desc}</p>
                      </Link>
                      {!completedSteps.has(i) && (
                        <Link href={step.href} className="flex items-center gap-1 text-sm font-medium text-primary-600 shrink-0">
                          <span className="hidden sm:inline">{step.cta}</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </Link>
                      )}
                    </div>
                  ))}
                  <div className="px-5 sm:px-6 py-3 flex justify-end">
                    <button onClick={() => selectStudioOrigin(studioOrigin === "fresh" ? "migrating" : "fresh")}
                      className="text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors">
                      {studioOrigin === "fresh" ? "Switching from another platform?" : "Starting from scratch instead?"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STATS BAR — one glanceable row                               */}
            {/* ============================================================ */}
            <div data-onboarding="admin-metrics" className={`grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 transition-opacity duration-300 ${refreshing ? "opacity-50" : "opacity-100"}`}>
              {/* Retention */}
              <div className="rounded-2xl bg-white border border-gray-200 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Retention</p>
                <p className="text-3xl font-semibold text-gray-900 tabular-nums leading-none">
                  {retentionRate ? `${Math.round(retentionRate.rate * 100)}%` : "—"}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {retentionRate ? formatMonth(retentionRate.monthLabel) : "Loading..."}
                </p>
              </div>

              {/* Studio Health */}
              <div className={`rounded-2xl ${healthConfig.bg} border ${healthConfig.border} p-5`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Studio Health</p>
                  <span className={`w-2 h-2 rounded-full ${healthConfig.dot}`} />
                </div>
                <p className={`text-xl font-semibold leading-none ${healthConfig.text}`}>
                  {healthConfig.label}
                </p>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {aiSummary || (aiLoading ? "Analyzing..." : "")}
                </p>
              </div>

              {/* Clients */}
              <Link href="/admin/clients" className="rounded-2xl bg-white border border-gray-200 p-5 hover:border-gray-300 transition-colors">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Clients</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-semibold text-gray-900 tabular-nums leading-none">{stats.clients}</p>
                  <span className="text-sm text-gray-500">active</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">{stats.clientsChange} new this month</p>
              </Link>

              {/* Waitlist */}
              <Link href="/admin/waitlist" className="rounded-2xl bg-white border border-gray-200 p-5 hover:border-gray-300 transition-colors">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">Waitlist</p>
                <p className="text-3xl font-semibold text-gray-900 tabular-nums leading-none">
                  {formatCurrency(stats.revenueRecovered)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {stats.waitlistFills} of {stats.waitlistSpotsGenerated} spots · {stats.waitlistFillRate}% fill
                </p>
              </Link>
            </div>

            {/* ============================================================ */}
            {/* CLIENT CHECK-UP — the action of the day                      */}
            {/* ============================================================ */}
            {checkup && checkup.summary.totalAtRisk > 0 && (
              <div className="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">Client Check-up</h2>
                      {checkup.summary.critical > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          {checkup.summary.critical} critical
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{checkup.topInsight}</p>
                  </div>
                  <Link href="/admin/client-checkup" className="text-sm text-primary-600 hover:text-primary-700 font-medium shrink-0">
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {checkup.clients.slice(0, 3).map((client) => {
                    const severity = client.primaryIntervention.severity;
                    const dotColor = severity === "critical" ? "bg-red-500" : severity === "high" ? "bg-orange-500" : severity === "medium" ? "bg-amber-500" : "bg-gray-400";
                    return (
                      <div key={client.clientName} className="px-5 sm:px-6 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{client.clientName}</p>
                          <p className="text-xs text-gray-500 truncate">{client.primaryIntervention.reason}</p>
                        </div>
                        <Link
                          href="/admin/client-checkup"
                          className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                        >
                          Take action
                        </Link>
                      </div>
                    );
                  })}
                  {checkup.summary.totalAtRisk > 3 && (
                    <div className="px-5 sm:px-6 py-3 text-center">
                      <Link href="/admin/client-checkup" className="text-sm text-gray-500 hover:text-primary-600 font-medium">
                        +{checkup.summary.totalAtRisk - 3} more clients need attention
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* CLASSES + ACTIVITY                                           */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Classes */}
              <div data-onboarding="admin-upcoming" className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl">
                <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Upcoming Classes</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Scheduled classes</p>
                  </div>
                  <Link href="/admin/classes" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all →</Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {todayClasses.length === 0 ? (
                    <div className="py-12 px-4 text-center">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">No classes scheduled</h3>
                      <p className="text-sm text-gray-500">Create your first class to see it here.</p>
                    </div>
                  ) : todayClasses.map((cls) => (
                    <div key={cls.id} className="px-4 sm:px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      <div className="w-11 h-11 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary-600">{cls.time.split(" ")[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{cls.name}</p>
                          {cls.enrolled === cls.capacity && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full shrink-0">Full</span>}
                        </div>
                        <p className="text-xs text-gray-500">{cls.instructor}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cls.enrolled === cls.capacity ? "bg-red-500" : cls.enrolled >= cls.capacity * 0.8 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-10 text-right">{cls.enrolled}/{cls.capacity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div data-onboarding="admin-activity" className="bg-white border border-gray-200 rounded-2xl">
                <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-500 mt-0.5">What&apos;s happening</p>
                </div>
                <div className="p-4 space-y-1">
                  {recentActivity.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-400">No activity yet</p>
                      <p className="text-xs text-gray-400 mt-1">Activity will appear here as clients book classes.</p>
                    </div>
                  ) : (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          activity.type === "client" ? "bg-blue-100 text-blue-600" :
                          activity.type === "class" ? "bg-green-100 text-green-600" :
                          activity.type === "payment" ? "bg-primary-100 text-primary-600" :
                          activity.type === "booking" ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"
                        }`}>
                          {activity.type === "client" && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                          {activity.type === "class" && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                          {activity.type === "payment" && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>}
                          {activity.type === "booking" && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                          {activity.type === "cancel" && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                          <p className="text-xs text-gray-500 truncate">{activity.name}</p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{activity.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
