"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ScheduleCard,
  ProgressDonutCard,
} from "@/components/dashboard";
import { InteractiveOnboarding, useInteractiveOnboarding } from "@/components/onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui";

interface ClientPlan {
  type: string;
  totalClasses: number;
  remainingClasses: number;
  usedClasses: number;
  startDate: string;
  endDate: string;
  price?: number;
}

interface ClientMilestone {
  type: string;
  achievedAt: string;
  acknowledged: boolean;
}

interface ClientData {
  name: string;
  memberSince: string;
  streak: number;
  longestStreak: number;
  totalClasses: number;
  favoriteInstructor: string;
  planName: string;
  classesRemaining: number;
  nextPayment: string;
  plan: ClientPlan;
  // Hormozi fields
  milestones: ClientMilestone[];
  goals: string[];
  healthScore: number;
  lifecycleStage: string;
  totalLifetimeRevenue: number;
}

// Hormozi: Milestone celebration component
function MilestoneBanner({ milestones, onAcknowledge }: { milestones: ClientMilestone[]; onAcknowledge: (type: string) => void }) {
  const unacknowledged = milestones.filter(m => !m.acknowledged);
  if (unacknowledged.length === 0) return null;

  const milestone = unacknowledged[0];
  const milestoneLabels: Record<string, { title: string; emoji: string; message: string }> = {
    first_class: { title: "First Class Complete!", emoji: "🎉", message: "Your wellness journey has officially begun." },
    "10_classes": { title: "10 Classes!", emoji: "💪", message: "You're building a real habit. Keep it up!" },
    "25_classes": { title: "25 Classes!", emoji: "⭐", message: "A quarter century of classes — incredible dedication." },
    "50_classes": { title: "50 Classes!", emoji: "🏆", message: "Half a hundred! You're in the top 10% of our members." },
    "100_classes": { title: "100 Classes!", emoji: "👑", message: "Triple digits! You're a wellness warrior." },
    "3_months": { title: "3 Month Member!", emoji: "📅", message: "Three months of consistency. You're on fire!" },
    "6_months": { title: "6 Month Member!", emoji: "🌟", message: "Half a year of growth. Amazing commitment!" },
    "1_year": { title: "1 Year Anniversary!", emoji: "🎂", message: "A full year of wellness. We're honored to be part of your journey." },
    streak_4_weeks: { title: "4 Week Streak!", emoji: "🔥", message: "One full month without missing a week!" },
    streak_12_weeks: { title: "12 Week Streak!", emoji: "🔥🔥", message: "Three months of consistent attendance!" },
  };

  const label = milestoneLabels[milestone.type] || { title: "Achievement Unlocked!", emoji: "🎯", message: "Great progress!" };

  return (
    <div className="mb-6 bg-gradient-to-r from-primary-50 via-purple-50 to-pink-50 border border-primary-200 rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="text-3xl sm:text-4xl">{label.emoji}</div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{label.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{label.message}</p>
          </div>
        </div>
        <button onClick={() => onAcknowledge(milestone.type)}
          className="px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-100 rounded-lg hover:bg-primary-200 transition-colors whitespace-nowrap">
          Awesome!
        </button>
      </div>
    </div>
  );
}

// Hormozi: Goals Progress section (ties to Health Assessment goals)
function GoalsSection({ goals }: { goals: string[] }) {
  if (!goals || goals.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">My Goals</h3>
        <Link href="/dashboard/profile" className="text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</Link>
      </div>
      <div className="space-y-2">
        {goals.slice(0, 4).map((goal, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-primary-300 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">{goal}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Hormozi: Upgrade prompt based on usage patterns
function UpgradePrompt({ planType, classesRemaining, classesTotal, usedClasses }: {
  planType: string; classesRemaining: number; classesTotal: number; usedClasses: number;
}) {
  // Only show for drop-in or plans with high utilization
  if (planType === "drop-in" && usedClasses >= 3) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-primary-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Save with a monthly plan</p>
            <p className="text-xs text-gray-600">You&apos;ve used {usedClasses} drop-ins. A monthly plan saves you ~40%.</p>
          </div>
          <Link href="/dashboard/plans" className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap">
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  if (classesTotal > 0 && classesRemaining <= 2 && classesRemaining > 0) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Only {classesRemaining} class{classesRemaining !== 1 ? "es" : ""} left</p>
            <p className="text-xs text-gray-600">Renew now to keep your streak going and save your spot.</p>
          </div>
          <Link href="/dashboard/plans" className="px-3 py-1.5 text-xs font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap">
            Renew
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

// Hormozi: Milestones earned display
function MilestonesEarned({ milestones }: { milestones: ClientMilestone[] }) {
  if (!milestones || milestones.length === 0) return null;

  const badgeEmoji: Record<string, string> = {
    first_class: "🎉", "10_classes": "💪", "25_classes": "⭐", "50_classes": "🏆",
    "100_classes": "👑", "3_months": "📅", "6_months": "🌟", "1_year": "🎂",
    streak_4_weeks: "🔥", streak_12_weeks: "🔥",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 text-sm mb-3">Achievements</h3>
      <div className="flex flex-wrap gap-2">
        {milestones.map((m, i) => (
          <div key={i} className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-lg"
            title={m.type.replace(/_/g, " ")}>
            {badgeEmoji[m.type] || "🎯"}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { shouldShow: showOnboardingRaw, markComplete } = useInteractiveOnboarding("client");

  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const fetchClientData = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }

    try {
      const [clientRes, bookingsRes, paymentsRes] = await Promise.all([
        fetch(`/api/clients/${user.id}`),
        fetch(`/api/bookings?clientId=${user.id}`),
        fetch(`/api/payments?clientId=${user.id}&status=pending`),
      ]);

      const clientJson = clientRes.ok ? await clientRes.json() : null;
      const bookingsJson = bookingsRes.ok ? await bookingsRes.json() : { bookings: [] };
      const paymentsJson = paymentsRes.ok ? await paymentsRes.json() : { payments: [] };

      const client = clientJson?.client;

      if (client) {
        const bookings = bookingsJson.bookings || [];
        let streak = client.currentStreak || 0;
        if (!streak && bookings.length > 0) {
          const completedBookings = bookings.filter((b: { status: string }) => b.status === "completed");
          const weeksWithClasses = new Set<string>();
          completedBookings.forEach((b: { scheduledDate: string }) => {
            const date = new Date(b.scheduledDate);
            const weekStart = new Date(date);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weeksWithClasses.add(weekStart.toISOString().split("T")[0]);
          });
          streak = weeksWithClasses.size;
        }

        const instructorCounts: Record<string, { count: number; name: string }> = {};
        bookings.forEach((b: { instructorName: string; instructorId: string }) => {
          if (b.instructorName) {
            if (!instructorCounts[b.instructorId]) instructorCounts[b.instructorId] = { count: 0, name: b.instructorName };
            instructorCounts[b.instructorId].count++;
          }
        });
        const favoriteInstructor = Object.values(instructorCounts).sort((a, b) => b.count - a.count)[0]?.name || "Not assigned";

        const pendingPayments = paymentsJson.payments || [];
        const nextPayment = pendingPayments.length > 0
          ? new Date(pendingPayments[0].dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : client.plan?.endDate
            ? new Date(client.plan.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "N/A";

        const completedClasses = bookings.filter((b: { status: string }) => b.status === "completed").length;

        const planTypes: Record<string, string> = {
          monthly: "Monthly Plan", quarterly: "Quarterly Plan", annual: "Annual Plan",
          "drop-in": "Drop-in", trial: "Trial", challenge: "Challenge", premium: "Premium", vip: "VIP",
        };
        const planName = planTypes[client.plan?.type] || "Basic Plan";

        setClientData({
          name: client.name?.split(" ")[0] || user.name?.split(" ")[0] || "User",
          memberSince: client.createdAt
            ? new Date(client.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
            : "Recently",
          streak: Math.min(streak, 52),
          longestStreak: client.longestStreak || streak,
          totalClasses: completedClasses,
          favoriteInstructor,
          planName,
          classesRemaining: client.plan?.remainingClasses || 0,
          nextPayment,
          plan: client.plan || { type: "monthly", totalClasses: 0, remainingClasses: 0, usedClasses: 0, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
          milestones: client.milestones || [],
          goals: [],
          healthScore: client.healthScore?.overall || 0,
          lifecycleStage: client.lifecycleStage || "active",
          totalLifetimeRevenue: client.totalLifetimeRevenue || 0,
        });

        // Fetch goals from health assessment
        try {
          const haRes = await fetch(`/api/health-assessment?clientId=${user.id}`);
          if (haRes.ok) {
            const haData = await haRes.json();
            if (haData.assessment?.goals) {
              setClientData(prev => prev ? { ...prev, goals: haData.assessment.goals } : prev);
            }
          }
        } catch { /* ignore */ }
      } else {
        setClientData({
          name: user.name?.split(" ")[0] || "User",
          memberSince: "Recently", streak: 0, longestStreak: 0, totalClasses: 0,
          favoriteInstructor: "Not assigned", planName: "No Plan",
          classesRemaining: 0, nextPayment: "N/A",
          plan: { type: "none", totalClasses: 0, remainingClasses: 0, usedClasses: 0, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
          milestones: [], goals: [], healthScore: 0, lifecycleStage: "trial", totalLifetimeRevenue: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
      setClientData({
        name: user?.name?.split(" ")[0] || "User",
        memberSince: "Recently", streak: 0, longestStreak: 0, totalClasses: 0,
        favoriteInstructor: "Not assigned", planName: "No Plan",
        classesRemaining: 0, nextPayment: "N/A",
        plan: { type: "none", totalClasses: 0, remainingClasses: 0, usedClasses: 0, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
        milestones: [], goals: [], healthScore: 0, lifecycleStage: "trial", totalLifetimeRevenue: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.name]);

  useEffect(() => {
    if (!authLoading) fetchClientData();
  }, [authLoading, fetchClientData]);

  const handleAcknowledgeMilestone = async (type: string) => {
    try {
      await fetch(`/api/clients/${user?.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, acknowledged: true }),
      });
      setClientData(prev => {
        if (!prev) return prev;
        return { ...prev, milestones: prev.milestones.map(m => m.type === type ? { ...m, acknowledged: true } : m) };
      });
    } catch { /* ignore */ }
  };

  const progressData = clientData
    ? { completed: clientData.plan.usedClasses, scheduled: 0, total: clientData.plan.totalClasses || 20 }
    : { completed: 0, scheduled: 0, total: 20 };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const userData = clientData || {
    name: "User", memberSince: "Recently", streak: 0, longestStreak: 0, totalClasses: 0,
    favoriteInstructor: "Not assigned", planName: "No Plan", classesRemaining: 0, nextPayment: "N/A",
    milestones: [], goals: [], healthScore: 0, lifecycleStage: "trial", totalLifetimeRevenue: 0,
    plan: { type: "none", totalClasses: 0, remainingClasses: 0, usedClasses: 0, startDate: "", endDate: "" },
  };

  const isNewClient = userData.totalClasses === 0 && userData.classesRemaining === 0 && userData.planName === "No Plan";
  const showOnboarding = showOnboardingRaw && !isNewClient;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <InteractiveOnboarding role="client" isOpen={showOnboarding} onComplete={markComplete} />

      {/* Milestone Celebration Banner */}
      <MilestoneBanner milestones={userData.milestones} onAcknowledge={handleAcknowledgeMilestone} />

      {/* Header */}
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {greeting()}, {userData.name}
          </h1>
        </div>

        {/* New Client Welcome State */}
        {isNewClient && (
          <div className="mb-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-5 sm:px-6 py-6 text-white text-center">
              <h2 className="text-lg font-semibold mb-1">Welcome to your wellness journey</h2>
              <p className="text-sm text-white/80">Get started by booking your first class</p>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <Link href="/dashboard/classes/book"
                className="flex items-center gap-4 p-4 bg-primary-50 border-2 border-primary-200 rounded-xl hover:border-primary-400 transition-colors group">
                <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">Book Your First Class</p>
                  <p className="text-sm text-gray-500">Browse available sessions and reserve your spot</p>
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link href="/dashboard/profile"
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group">
                <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">Complete Your Profile</p>
                  <p className="text-sm text-gray-500">Add your preferences and health information</p>
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        )}

        {/* Upgrade Prompt (Hormozi Ascension) */}
        {!isNewClient && (
          <div className="mb-4">
            <UpgradePrompt
              planType={userData.plan.type}
              classesRemaining={userData.classesRemaining}
              classesTotal={userData.plan.totalClasses}
              usedClasses={userData.plan.usedClasses}
            />
          </div>
        )}

        {/* Stats Cards Row */}
        <div data-onboarding="client-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Plan & Classes */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{userData.planName}</p>
            <p className="text-2xl font-bold text-gray-900">{userData.classesRemaining}</p>
            <p className="text-sm text-gray-600">classes remaining</p>
          </div>

          {/* Week Streak */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <p className="text-xs text-gray-500">Week Streak</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{userData.streak}</p>
            <p className="text-sm text-gray-600">
              weeks in a row
              {userData.longestStreak > userData.streak && (
                <span className="text-xs text-gray-400 ml-1">(best: {userData.longestStreak})</span>
              )}
            </p>
          </div>

          {/* Total Classes */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Classes</p>
            <p className="text-2xl font-bold text-gray-900">{userData.totalClasses}</p>
            <p className="text-sm text-gray-600">completed</p>
          </div>

          {/* Instructor */}
          <Link href="/dashboard/profile" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
            <p className="text-xs text-gray-500 mb-1">Your Instructor</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary-600">{userData.favoriteInstructor.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{userData.favoriteInstructor}</p>
                <p className="text-xs text-primary-600">View schedule</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Schedule + Progress (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div data-onboarding="client-schedule"><ScheduleCard /></div>
          <div data-onboarding="client-progress"><ProgressDonutCard data={progressData} /></div>
        </div>

        {/* Right: Goals + Milestones + Billing (1/3) */}
        <div className="space-y-4">
          {/* Goals from Health Assessment */}
          <GoalsSection goals={userData.goals} />

          {/* Milestones Earned */}
          <MilestonesEarned milestones={userData.milestones} />

          {/* Billing info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Billing</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Next billing</span>
                <span className="font-medium text-gray-900">{userData.nextPayment}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current plan</span>
                <span className="font-medium text-gray-900">{userData.planName}</span>
              </div>
              {userData.plan.price && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly cost</span>
                  <span className="font-medium text-gray-900">${userData.plan.price}</span>
                </div>
              )}
            </div>
          </div>

          {/* Member Since */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Member since</p>
                <p className="text-xs text-gray-500">{userData.memberSince}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
