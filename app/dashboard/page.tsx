"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ScheduleCard,
  ProgressDonutCard,
  YearlyBarChart,
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
}

interface ClientData {
  name: string;
  memberSince: string;
  streak: number;
  totalClasses: number;
  favoriteInstructor: string;
  planName: string;
  classesRemaining: number;
  nextPayment: string;
  plan: ClientPlan;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Onboarding
  const { shouldShow: showOnboarding, markComplete } = useInteractiveOnboarding("client");

  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const fetchClientData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch client details
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
        // Calculate streak (consecutive weeks with classes)
        const bookings = bookingsJson.bookings || [];
        let streak = 0;
        if (bookings.length > 0) {
          const completedBookings = bookings.filter((b: { status: string }) => b.status === "completed");
          // Simplified streak: count weeks with completed classes
          const weeksWithClasses = new Set<string>();
          completedBookings.forEach((b: { scheduledDate: string }) => {
            const date = new Date(b.scheduledDate);
            const weekStart = new Date(date);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weeksWithClasses.add(weekStart.toISOString().split("T")[0]);
          });
          streak = weeksWithClasses.size;
        }

        // Find favorite instructor
        const instructorCounts: Record<string, { count: number; name: string }> = {};
        bookings.forEach((b: { instructorName: string; instructorId: string }) => {
          if (b.instructorName) {
            if (!instructorCounts[b.instructorId]) {
              instructorCounts[b.instructorId] = { count: 0, name: b.instructorName };
            }
            instructorCounts[b.instructorId].count++;
          }
        });
        const favoriteInstructor = Object.values(instructorCounts).sort((a, b) => b.count - a.count)[0]?.name || "Not assigned";

        // Get next payment date
        const pendingPayments = paymentsJson.payments || [];
        const nextPayment = pendingPayments.length > 0
          ? new Date(pendingPayments[0].dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : client.plan?.endDate
            ? new Date(client.plan.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "N/A";

        // Calculate total completed classes
        const completedClasses = bookings.filter((b: { status: string }) => b.status === "completed").length;

        // Format plan name
        const planTypes: Record<string, string> = {
          monthly: "Monthly Plan",
          quarterly: "Quarterly Plan",
          annual: "Annual Plan",
          "drop-in": "Drop-in",
        };
        const planName = planTypes[client.plan?.type] || "Basic Plan";

        setClientData({
          name: client.name?.split(" ")[0] || user.name?.split(" ")[0] || "User",
          memberSince: client.createdAt
            ? new Date(client.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
            : "Recently",
          streak: Math.min(streak, 52), // Cap at 52 weeks
          totalClasses: completedClasses,
          favoriteInstructor,
          planName,
          classesRemaining: client.plan?.remainingClasses || 0,
          nextPayment,
          plan: client.plan || {
            type: "monthly",
            totalClasses: 0,
            remainingClasses: 0,
            usedClasses: 0,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
          },
        });
      } else {
        // Fallback for user without client record
        setClientData({
          name: user.name?.split(" ")[0] || "User",
          memberSince: "Recently",
          streak: 0,
          totalClasses: 0,
          favoriteInstructor: "Not assigned",
          planName: "No Plan",
          classesRemaining: 0,
          nextPayment: "N/A",
          plan: {
            type: "none",
            totalClasses: 0,
            remainingClasses: 0,
            usedClasses: 0,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Error fetching client data:", error);
      setClientData({
        name: user?.name?.split(" ")[0] || "User",
        memberSince: "Recently",
        streak: 0,
        totalClasses: 0,
        favoriteInstructor: "Not assigned",
        planName: "No Plan",
        classesRemaining: 0,
        nextPayment: "N/A",
        plan: {
          type: "none",
          totalClasses: 0,
          remainingClasses: 0,
          usedClasses: 0,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        },
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.name]);

  useEffect(() => {
    if (!authLoading) {
      fetchClientData();
    }
  }, [authLoading, fetchClientData]);

  // Calculate progress data from client plan
  const progressData = clientData
    ? {
        completed: clientData.plan.usedClasses,
        scheduled: 0, // Will be calculated by ProgressDonutCard if needed
        total: clientData.plan.totalClasses || 20,
      }
    : { completed: 0, scheduled: 0, total: 20 };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const userData = clientData || {
    name: "User",
    memberSince: "Recently",
    streak: 0,
    totalClasses: 0,
    favoriteInstructor: "Not assigned",
    planName: "No Plan",
    classesRemaining: 0,
    nextPayment: "N/A",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Interactive Onboarding */}
      <InteractiveOnboarding
        role="client"
        isOpen={showOnboarding}
        onComplete={markComplete}
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {greeting()}, {userData.name}
          </h1>
          <Link
            href="/dashboard/settings"
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Settings
          </Link>
        </div>

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
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <p className="text-xs text-gray-500">Week Streak</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{userData.streak}</p>
            <p className="text-sm text-gray-600">weeks in a row</p>
          </div>

          {/* Next Billing */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Next Billing</p>
            <p className="text-lg font-semibold text-gray-900">{userData.nextPayment}</p>
            <p className="text-sm text-gray-600">auto-renewal</p>
          </div>

          {/* Instructor */}
          <Link href="/dashboard/profile" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
            <p className="text-xs text-gray-500 mb-1">Your Instructor</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary-600">
                  {userData.favoriteInstructor.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{userData.favoriteInstructor}</p>
                <p className="text-xs text-primary-600">View schedule →</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Cards Row - Upcoming Classes + Stacked Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div data-onboarding="client-schedule" className="h-full">
          <ScheduleCard />
        </div>
        <div data-onboarding="client-progress" className="flex flex-col gap-6">
          <ProgressDonutCard data={progressData} />
          <YearlyBarChart />
        </div>
      </div>
    </div>
  );
}
