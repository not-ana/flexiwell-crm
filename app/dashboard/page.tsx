"use client";

import Link from "next/link";
import {
  ScheduleCard,
  ProgressDonutCard,
  YearlyBarChart,
} from "@/components/dashboard";
import { InteractiveOnboarding, useInteractiveOnboarding } from "@/components/onboarding";

const mockProgressData = {
  completed: 12,
  scheduled: 4,
  total: 20,
};

// User data - will be fetched from auth context when backend is ready
// Mock data simulates API response structure
const getUserData = () => {
  // In production, replace with:
  // const { user } = useAuth();
  // const { data } = useUserProfile(user?.id);
  return {
    name: "Olivia",
    memberSince: "March 2024",
    streak: 8,
    totalClasses: 47,
    favoriteInstructor: "Sarah",
    planName: "Premium Monthly",
    classesRemaining: 8,
    nextPayment: "Jan 15, 2025",
  };
};

const userData = getUserData();

export default function DashboardPage() {
  // Onboarding
  const { shouldShow: showOnboarding, markComplete } = useInteractiveOnboarding("client");

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Interactive Onboarding */}
      <InteractiveOnboarding
        role="client"
        isOpen={showOnboarding}
        onComplete={markComplete}
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            {greeting()}, {userData.name}
          </h1>
          <Link
            href="/dashboard/settings"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Settings
          </Link>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <Link href="/dashboard/profile" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-accent-200 hover:bg-accent-50/30 transition-colors">
            <p className="text-xs text-gray-500 mb-1">Your Instructor</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center">
                <span className="text-xs font-semibold text-accent-600">
                  {userData.favoriteInstructor.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{userData.favoriteInstructor}</p>
                <p className="text-xs text-accent-600">View schedule →</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Cards Row - Upcoming Classes + Stacked Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScheduleCard />
        <div className="flex flex-col gap-6">
          <ProgressDonutCard data={mockProgressData} />
          <YearlyBarChart />
        </div>
      </div>
    </div>
  );
}
