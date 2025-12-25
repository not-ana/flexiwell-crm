"use client";

import { useState } from "react";
import { ChevronIcon } from "@/components/icons";

interface StaffPerformance {
  id: string;
  name: string;
  role: "admin" | "teacher";
  initials: string;
  avatar?: string;
  stats: {
    classesThisMonth: number;
    clientsServed: number;
    avgRating: number;
    attendance: number;
    revenue?: number;
  };
  trend: "up" | "down" | "stable";
}

interface OverviewStat {
  label: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "stable";
  icon: React.ReactNode;
}

const mockStaffPerformance: StaffPerformance[] = [
  {
    id: "1",
    name: "Maria Santos",
    role: "teacher",
    initials: "MS",
    stats: {
      classesThisMonth: 24,
      clientsServed: 86,
      avgRating: 4.9,
      attendance: 98,
      revenue: 4800,
    },
    trend: "up",
  },
  {
    id: "2",
    name: "Pedro Costa",
    role: "teacher",
    initials: "PC",
    stats: {
      classesThisMonth: 18,
      clientsServed: 62,
      avgRating: 4.7,
      attendance: 95,
      revenue: 3600,
    },
    trend: "stable",
  },
  {
    id: "3",
    name: "Carlos Mendes",
    role: "admin",
    initials: "CM",
    stats: {
      classesThisMonth: 0,
      clientsServed: 124,
      avgRating: 4.8,
      attendance: 100,
    },
    trend: "up",
  },
  {
    id: "4",
    name: "Julia Oliveira",
    role: "teacher",
    initials: "JO",
    stats: {
      classesThisMonth: 12,
      clientsServed: 45,
      avgRating: 4.6,
      attendance: 92,
      revenue: 2400,
    },
    trend: "down",
  },
];

const mockOverviewStats: OverviewStat[] = [
  {
    label: "Total Revenue",
    value: "R$ 24,500",
    change: "+12.5%",
    trend: "up",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Active Clients",
    value: 248,
    change: "+18",
    trend: "up",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "Classes This Month",
    value: 156,
    change: "+8%",
    trend: "up",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: "Avg. Attendance",
    value: "94%",
    change: "+2.3%",
    trend: "up",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const recentActivity = [
  { id: 1, action: "New client registration", name: "Lucas Ferreira", time: "5 min ago", type: "client" },
  { id: 2, action: "Class completed", name: "Morning Yoga", time: "1 hour ago", type: "class" },
  { id: 3, action: "Payment received", name: "R$ 350.00", time: "2 hours ago", type: "payment" },
  { id: 4, action: "New booking", name: "Pilates - Maria S.", time: "3 hours ago", type: "booking" },
  { id: 5, action: "Class canceled", name: "Evening Stretch", time: "5 hours ago", type: "cancel" },
];

function StaffAvatar({ name, initials, avatar }: { name: string; initials: string; avatar?: string }) {
  const colors = ["bg-purple-500", "bg-pink-500", "bg-blue-500", "bg-green-500", "bg-orange-500"];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return avatar ? (
    <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
  ) : (
    <div className={`w-10 h-10 ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
      {initials}
    </div>
  );
}

function TrendIndicator({ trend, value }: { trend: "up" | "down" | "stable"; value: string }) {
  const colors = {
    up: "text-green-600 bg-green-50",
    down: "text-red-600 bg-red-50",
    stable: "text-gray-600 bg-gray-50",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[trend]}`}>
      {trend === "up" && "↑"}
      {trend === "down" && "↓"}
      {trend === "stable" && "→"}
      {value}
    </span>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium text-gray-900">{rating}</span>
      <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </div>
  );
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Overview of your business performance.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            {(["week", "month", "year"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  period === p
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p === "week" ? "This Week" : p === "month" ? "This Month" : "This Year"}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {mockOverviewStats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                  {stat.icon}
                </div>
                <TrendIndicator trend={stat.trend} value={stat.change} />
              </div>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_380px] gap-6">
          {/* Staff Performance Table */}
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Staff Performance</h2>
                <p className="text-sm text-gray-500">Track your team's metrics</p>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                View all
                <ChevronIcon className="w-4 h-4" direction="right" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockStaffPerformance.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <StaffAvatar name={staff.name} initials={staff.initials} avatar={staff.avatar} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{staff.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{staff.stats.classesThisMonth}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{staff.stats.clientsServed}</span>
                      </td>
                      <td className="px-6 py-4">
                        <RatingStars rating={staff.stats.avgRating} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${staff.stats.attendance}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{staff.stats.attendance}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-sm font-medium ${
                            staff.trend === "up"
                              ? "text-green-600"
                              : staff.trend === "down"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {staff.trend === "up" && "↑ Improving"}
                          {staff.trend === "down" && "↓ Declining"}
                          {staff.trend === "stable" && "→ Stable"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="px-6 py-3 flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === "client"
                          ? "bg-blue-100 text-blue-600"
                          : activity.type === "class"
                          ? "bg-green-100 text-green-600"
                          : activity.type === "payment"
                          ? "bg-purple-100 text-purple-600"
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
                      <p className="text-sm text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.name}</p>
                    </div>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-gray-200">
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all activity
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">This Month Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New clients</span>
                  <span className="text-sm font-semibold text-gray-900">+32</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Classes held</span>
                  <span className="text-sm font-semibold text-gray-900">156</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cancellation rate</span>
                  <span className="text-sm font-semibold text-red-600">8.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. class size</span>
                  <span className="text-sm font-semibold text-gray-900">12.4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Client retention</span>
                  <span className="text-sm font-semibold text-green-600">94%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
