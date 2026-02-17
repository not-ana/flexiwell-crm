"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { InteractiveOnboarding, useInteractiveOnboarding } from "@/components/onboarding";
import { useCurrency } from "@/hooks/useCurrency";
import { api } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  revenue: number;
  revenueChange: string;
  clients: number;
  clientsChange: string;
  classes: number;
  classesChange: string;
  attendance: string;
  noShowRate: string;
  noShows: number;
  waitlistFills: number;
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Onboarding - only show tour when dashboard has data
  const { shouldShow: showOnboardingRaw, markComplete } = useInteractiveOnboarding("admin");
  const hasData = !loading && !!dashboardData && (dashboardData.stats.clients > 0 || dashboardData.stats.classes > 0);
  const showOnboarding = showOnboardingRaw && hasData;

  // Setup checklist progress
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("admin_setup_completed_steps");
    if (saved) {
      setCompletedSteps(new Set(JSON.parse(saved)));
    }
  }, []);

  const toggleStepComplete = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      localStorage.setItem("admin_setup_completed_steps", JSON.stringify([...next]));
      return next;
    });
  };

  // Currency
  const { formatCurrency } = useCurrency();

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const response = await api.get<DashboardData>(`/api/admin/dashboard?period=${selectedPeriod}`);
        if (response.data) {
          setDashboardData(response.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [selectedPeriod]);

  const stats = dashboardData?.stats || {
    revenue: 0,
    revenueChange: "+0%",
    clients: 0,
    clientsChange: "+0",
    classes: 0,
    classesChange: "+0%",
    attendance: "0%",
    noShowRate: "0%",
    noShows: 0,
    waitlistFills: 0,
    revenueRecovered: 0,
  };

  const recentActivity = dashboardData?.recentActivity || [];
  const todayClasses = dashboardData?.todayClasses || [];

  // Calculate ROI multiplier
  const subscriptionCost = 179;
  const roiMultiplier = stats.revenueRecovered > 0
    ? (stats.revenueRecovered / subscriptionCost).toFixed(0)
    : "0";

  // Get greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Interactive Onboarding */}
      <InteractiveOnboarding
        role="admin"
        isOpen={showOnboarding}
        onComplete={markComplete}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
                {greeting}, {firstName}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Here&apos;s how your studio is performing.</p>
            </div>
            {/* Period Selector */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 self-start sm:self-auto">
              {(["week", "month", "year"] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    selectedPeriod === period
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}

        {!loading && (
          <>
            {/* Setup Checklist - shows when studio is empty */}
            {stats.clients === 0 && stats.classes === 0 && (
              <div className="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-5 sm:px-6 py-5 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold">Get your studio running</h2>
                    <span className="text-sm text-white/80">{completedSteps.size}/4 complete</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-300"
                      style={{ width: `${(completedSteps.size / 4) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-white/80 mt-2">
                    Studios recover $2,300+/mo in lost revenue with FlexiWell. Complete these steps to start.
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ),
                      title: "Import your client list",
                      description: "Upload a CSV or add clients manually to get started.",
                      href: "/admin/settings",
                      linkText: "Import clients",
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ),
                      title: "Create your first class",
                      description: "Set up a class with schedule, capacity, and instructor.",
                      href: "/admin/classes",
                      linkText: "Create class",
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      ),
                      title: "Connect Stripe",
                      description: "Accept payments and automate billing for your plans.",
                      href: "/admin/billing",
                      linkText: "Set up billing",
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                      title: "Enable smart waitlist",
                      description: "Auto-fill cancelled spots and recover lost revenue.",
                      href: "/admin/waitlist",
                      linkText: "Configure waitlist",
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50 transition-colors group">
                      <button
                        onClick={(e) => toggleStepComplete(i, e)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          completedSteps.has(i)
                            ? "bg-green-100 text-green-600"
                            : "bg-primary-50 text-primary-600 group-hover:bg-primary-100"
                        }`}
                      >
                        {completedSteps.has(i) ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step.icon
                        )}
                      </button>
                      <Link href={step.href} className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${completedSteps.has(i) ? "text-gray-400 line-through" : "text-gray-900"}`}>{step.title}</p>
                        <p className={`text-sm ${completedSteps.has(i) ? "text-gray-400" : "text-gray-500"}`}>{step.description}</p>
                      </Link>
                      {!completedSteps.has(i) && (
                        <Link href={step.href} className="flex items-center gap-1 text-sm font-medium text-primary-600 shrink-0">
                          <span className="hidden sm:inline">{step.linkText}</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Value Banner - Hormozi ROI reinforcement */}
            {stats.revenueRecovered > 0 && (
              <div data-onboarding="admin-metrics" className="mb-6 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl p-4 sm:p-5 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">
                        FlexiWell recovered {formatCurrency(stats.revenueRecovered)} this {selectedPeriod}
                      </p>
                      <p className="text-xs sm:text-sm text-white/80">
                        That&apos;s {roiMultiplier}x your subscription — from {stats.waitlistFills} waitlist fills alone.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/admin/waitlist"
                    className="text-sm font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors shrink-0 text-center"
                  >
                    View Waitlist
                  </Link>
                </div>
              </div>
            )}

            {/* 3 Hero Metrics */}
            <div data-onboarding="admin-charts" className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
              {/* Revenue Recovered */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Revenue Recovered
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(stats.revenueRecovered)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  From {stats.waitlistFills} filled spots this {selectedPeriod}
                </p>
              </div>

              {/* No-Show Rate */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    No-Show Rate
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.noShowRate}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.noShows} no-show{stats.noShows !== 1 ? "s" : ""} this {selectedPeriod}
                </p>
              </div>

              {/* Waitlist Fills */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                    Waitlist Fills
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.waitlistFills}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Spots auto-filled this {selectedPeriod}
                </p>
              </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
                <p className={`text-xs ${stats.revenueChange.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                  {stats.revenueChange}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Active Clients</p>
                <p className="text-lg font-bold text-gray-900">{stats.clients}</p>
                <p className={`text-xs ${stats.clientsChange.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                  {stats.clientsChange} new
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Classes</p>
                <p className="text-lg font-bold text-gray-900">{stats.classes}</p>
                <p className={`text-xs ${stats.classesChange.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                  {stats.classesChange}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Attendance</p>
                <p className="text-lg font-bold text-gray-900">{stats.attendance}</p>
                <p className="text-xs text-gray-500">avg rate</p>
              </div>
            </div>

            {/* Upcoming Classes + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Classes */}
              <div data-onboarding="admin-upcoming" className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl">
                <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Upcoming Classes</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Next scheduled classes</p>
                  </div>
                  <Link
                    href="/admin/classes"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {todayClasses.length === 0 ? (
                    <div className="py-12 px-4 text-center">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">No upcoming classes</h3>
                      <p className="text-sm text-gray-500">Create your first class to see it here.</p>
                    </div>
                  ) : todayClasses.map((cls) => (
                    <div key={cls.id} className="px-4 sm:px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      <div className="w-11 h-11 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary-600">{cls.time.split(' ')[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{cls.name}</p>
                          {cls.enrolled === cls.capacity && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full shrink-0">Full</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{cls.instructor}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cls.enrolled === cls.capacity ? "bg-red-500" :
                              cls.enrolled >= cls.capacity * 0.8 ? "bg-yellow-500" : "bg-green-500"
                            }`}
                            style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-10 text-right">
                          {cls.enrolled}/{cls.capacity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div data-onboarding="admin-activity" className="bg-white border border-gray-200 rounded-2xl">
                <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <p className="text-sm text-gray-500 mt-0.5">What&apos;s happening in your studio</p>
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
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            activity.type === "client"
                              ? "bg-blue-100 text-blue-600"
                              : activity.type === "class"
                              ? "bg-green-100 text-green-600"
                              : activity.type === "payment"
                              ? "bg-primary-100 text-primary-600"
                              : activity.type === "booking"
                              ? "bg-orange-100 text-orange-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {activity.type === "client" && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                          {activity.type === "class" && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {activity.type === "payment" && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          )}
                          {activity.type === "booking" && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          {activity.type === "cancel" && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
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
