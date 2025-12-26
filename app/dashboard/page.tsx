"use client";

import { useState } from "react";
import {
  ComingUpCard,
  CalendarCard,
  ProgressDonutCard,
  YearlyBarChart,
} from "@/components/dashboard";

// TODO: Replace with real data from API/database
const mockUpcomingClasses = [
  {
    id: "1",
    date: new Date(2024, 11, 26),
    title: "Morning Pilates",
    startTime: "9:00 AM",
    endTime: "10:00 AM",
    instructor: "Ana",
  },
  {
    id: "2",
    date: new Date(2024, 11, 27),
    title: "Afternoon Yoga",
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    instructor: "Maria",
  },
  {
    id: "3",
    date: new Date(2024, 11, 28),
    title: "Reformer Session",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    instructor: "Ana",
  },
];

const mockProgressData = {
  completed: 12,
  scheduled: 4,
  total: 20,
};

// TODO: Get user data from auth context
const userData = {
  name: "Olivia",
  memberSince: "March 2024",
  streak: 8,
  totalClasses: 47,
  favoriteInstructor: "Ana",
  planName: "Premium Monthly",
  classesRemaining: 8,
  nextPayment: "Jan 15, 2025",
};

const quickStats = [
  {
    label: "Current Streak",
    value: `${userData.streak} weeks`,
    icon: "🔥",
    color: "from-orange-400 to-red-500",
    bgColor: "bg-orange-50",
  },
  {
    label: "Classes This Month",
    value: "12",
    icon: "📅",
    color: "from-blue-400 to-indigo-500",
    bgColor: "bg-blue-50",
  },
  {
    label: "Classes Remaining",
    value: userData.classesRemaining.toString(),
    icon: "✨",
    color: "from-purple-400 to-pink-500",
    bgColor: "bg-purple-50",
  },
  {
    label: "Total Classes",
    value: userData.totalClasses.toString(),
    icon: "🏆",
    color: "from-green-400 to-emerald-500",
    bgColor: "bg-green-50",
  },
];

const motivationalQuotes = [
  "Every class is a step towards your best self!",
  "Consistency is the key to transformation.",
  "Your body can do it. It's your mind you need to convince.",
  "Progress, not perfection.",
  "Small steps every day lead to big changes.",
];

export default function DashboardPage() {
  const [quote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Welcome Hero Section */}
      <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-pink-500 p-8 text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-24" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {greeting()}, {userData.name}! 👋
              </h1>
              <p className="text-white/90 text-lg max-w-xl">
                "{quote}"
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <div className="text-right">
                <p className="text-white/70 text-sm">Your Plan</p>
                <p className="font-semibold">{userData.planName}</p>
              </div>
              <div className="w-px h-12 bg-white/30" />
              <div className="text-right">
                <p className="text-white/70 text-sm">Member Since</p>
                <p className="font-semibold">{userData.memberSince}</p>
              </div>
            </div>
          </div>

          {/* Streak Badge */}
          {userData.streak >= 4 && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-2xl">🔥</span>
              <span className="font-medium">{userData.streak} Week Streak! Keep it up!</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bgColor} rounded-xl p-5 border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column - Upcoming & Progress */}
        <div className="xl:col-span-4 space-y-6">
          <ComingUpCard classes={mockUpcomingClasses} />
          <ProgressDonutCard data={mockProgressData} />

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/dashboard/classes"
                className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <span className="text-lg">📅</span>
                </div>
                <div>
                  <p className="font-medium">Book a Class</p>
                  <p className="text-sm text-primary-600">Schedule your next session</p>
                </div>
              </a>
              <a
                href="/dashboard/support"
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <span className="text-lg">💬</span>
                </div>
                <div>
                  <p className="font-medium">Need Help?</p>
                  <p className="text-sm text-gray-600">Contact our support team</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column - Calendar & Charts */}
        <div className="xl:col-span-8 space-y-6">
          <CalendarCard />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <YearlyBarChart />

            {/* Favorite Instructor Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Instructor</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-700">
                    {userData.favoriteInstructor.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{userData.favoriteInstructor}</p>
                  <p className="text-sm text-gray-600">Pilates & Reformer Specialist</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-400">★★★★★</span>
                    <span className="text-sm text-gray-500">(4.9)</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary-600">23</p>
                    <p className="text-sm text-gray-600">Classes Together</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">98%</p>
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Info Banner */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{userData.planName}</h3>
                <p className="text-gray-400 mt-1">
                  {userData.classesRemaining} classes remaining this month
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Next billing</p>
                <p className="font-medium">{userData.nextPayment}</p>
              </div>
              <a
                href="/dashboard/settings"
                className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Manage Plan
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
