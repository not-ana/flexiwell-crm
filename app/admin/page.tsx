"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LineChart, Line, AreaChart, Area, PieChart, Pie } from "recharts";

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
  subtext?: string;
  color: string;
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

// Revenue trend data for the chart
const revenueData = [
  { month: "Jan", revenue: 18500, lastYear: 15200 },
  { month: "Feb", revenue: 21200, lastYear: 17800 },
  { month: "Mar", revenue: 19800, lastYear: 16500 },
  { month: "Apr", revenue: 23400, lastYear: 19200 },
  { month: "May", revenue: 25600, lastYear: 21000 },
  { month: "Jun", revenue: 24500, lastYear: 20800 },
  { month: "Jul", revenue: 27800, lastYear: 22500 },
  { month: "Aug", revenue: 26200, lastYear: 23100 },
  { month: "Sep", revenue: 28900, lastYear: 24200 },
  { month: "Oct", revenue: 30500, lastYear: 25800 },
  { month: "Nov", revenue: 29100, lastYear: 26400 },
  { month: "Dec", revenue: 32400, lastYear: 27900 },
];

// Class types distribution
const classTypesData = [
  { name: "Pilates", value: 45, color: "#7C3AED" },
  { name: "Yoga", value: 25, color: "#EC4899" },
  { name: "Reformer", value: 20, color: "#3B82F6" },
  { name: "Stretch", value: 10, color: "#10B981" },
];

// Attendance trend data
const attendanceData = [
  { week: "W1", rate: 92 },
  { week: "W2", rate: 88 },
  { week: "W3", rate: 95 },
  { week: "W4", rate: 91 },
  { week: "W5", rate: 94 },
  { week: "W6", rate: 97 },
  { week: "W7", rate: 93 },
  { week: "W8", rate: 96 },
];

// Stats data organized by period and year
const statsData: Record<string, Record<string, { revenue: string; revenueChange: string; clients: number; clientsChange: string; classes: number; classesChange: string; attendance: string; attendanceChange: string }>> = {
  "2025": {
    week: { revenue: "$6,250", revenueChange: "+8.2%", clients: 248, clientsChange: "+5", classes: 38, classesChange: "+12%", attendance: "96%", attendanceChange: "+1.5%" },
    month: { revenue: "$24,500", revenueChange: "+12.5%", clients: 248, clientsChange: "+18", classes: 156, classesChange: "+8%", attendance: "94%", attendanceChange: "+2.3%" },
    year: { revenue: "$142,800", revenueChange: "+15.8%", clients: 248, clientsChange: "+86", classes: 892, classesChange: "+11%", attendance: "93%", attendanceChange: "+3.1%" },
  },
  "2024": {
    week: { revenue: "$5,800", revenueChange: "+6.5%", clients: 230, clientsChange: "+3", classes: 34, classesChange: "+9%", attendance: "92%", attendanceChange: "+0.8%" },
    month: { revenue: "$21,800", revenueChange: "+9.2%", clients: 230, clientsChange: "+12", classes: 144, classesChange: "+5%", attendance: "91%", attendanceChange: "+1.8%" },
    year: { revenue: "$123,500", revenueChange: "+12.3%", clients: 230, clientsChange: "+65", classes: 806, classesChange: "+7%", attendance: "90%", attendanceChange: "+2.5%" },
  },
};

const getOverviewStats = (period: string, year: number): OverviewStat[] => {
  const data = statsData[String(year)]?.[period] || statsData["2025"].month;
  const periodLabel = period === "week" ? "this week" : period === "month" ? "this month" : "this year";

  return [
    {
      label: "Total Revenue",
      value: data.revenue,
      change: data.revenueChange,
      trend: "up",
      subtext: `vs last ${period}`,
      color: "from-purple-500 to-purple-600",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Active Clients",
      value: data.clients,
      change: data.clientsChange,
      trend: "up",
      subtext: `new ${periodLabel}`,
      color: "from-blue-500 to-blue-600",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: period === "week" ? "Classes This Week" : period === "month" ? "Classes This Month" : "Classes This Year",
      value: data.classes,
      change: data.classesChange,
      trend: "up",
      subtext: `vs last ${period}`,
      color: "from-pink-500 to-pink-600",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Avg. Attendance",
      value: data.attendance,
      change: data.attendanceChange,
      trend: "up",
      subtext: "above target",
      color: "from-green-500 to-green-600",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];
};

const recentActivity = [
  { id: 1, action: "New client registration", name: "Lucas Ferreira", time: "5 min ago", type: "client" },
  { id: 2, action: "Class completed", name: "Morning Yoga", time: "1 hour ago", type: "class" },
  { id: 3, action: "Payment received", name: "$350.00", time: "2 hours ago", type: "payment" },
  { id: 4, action: "New booking", name: "Pilates - Maria S.", time: "3 hours ago", type: "booking" },
  { id: 5, action: "Class canceled", name: "Evening Stretch", time: "5 hours ago", type: "cancel" },
];

const upcomingClasses = [
  { id: 1, name: "Morning Pilates", time: "9:00 AM", instructor: "Maria Santos", enrolled: 8, capacity: 12 },
  { id: 2, name: "Yoga Flow", time: "10:30 AM", instructor: "Pedro Costa", enrolled: 10, capacity: 10 },
  { id: 3, name: "Stretch & Relax", time: "2:00 PM", instructor: "Julia Oliveira", enrolled: 6, capacity: 15 },
  { id: 4, name: "Power Pilates", time: "4:30 PM", instructor: "Maria Santos", enrolled: 11, capacity: 12 },
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
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${colors[trend]}`}>
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

type TimePeriod = "week" | "month" | "year";

export default function AdminDashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const availableYears = [currentYear, currentYear - 1];

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-8">
        {/* Header with gradient */}
        <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, Ana!</h1>
              <p className="text-gray-400 max-w-lg">
                Here's what's happening with your studio today. You have{" "}
                <span className="text-white font-medium">4 classes</span> scheduled and{" "}
                <span className="text-green-400 font-medium">$1,250</span> in new revenue.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Year Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 text-white font-medium bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  {selectedYear}
                  <ChevronIcon className="w-4 h-4 text-gray-300" direction={showYearDropdown ? "up" : "down"} />
                </button>
                {showYearDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setShowYearDropdown(false);
                        }}
                        className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          selectedYear === year ? "font-medium text-primary-600 bg-primary-50" : "text-gray-700"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Period Selector */}
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                {(["week", "month", "year"] as TimePeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      selectedPeriod === period
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="relative z-10 mt-6 flex gap-4">
            <Link
              href="/admin/clients"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add Client
            </Link>
            <Link
              href="/admin/conversations"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Bot Messages
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">3</span>
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Reports
            </Link>
          </div>
        </div>

        {/* Overview Stats - Gradient Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {getOverviewStats(selectedPeriod, selectedYear).map((stat, idx) => (
            <div key={idx} className="relative bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity`} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    {stat.icon}
                  </div>
                  <TrendIndicator trend={stat.trend} value={stat.change} />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-base text-gray-600">{stat.label}</p>
                {stat.subtext && (
                  <p className="text-sm text-gray-400 mt-1">{stat.subtext}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="col-span-8 bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Revenue Trend</h2>
                <p className="text-sm text-gray-500 mt-1">Monthly revenue comparison</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-gray-600">This Year</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-gray-600">Last Year</span>
                </div>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  />
                  <Area type="monotone" dataKey="lastYear" stroke="#D1D5DB" strokeWidth={2} fill="transparent" />
                  <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={3} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Class Distribution */}
          <div className="col-span-4 bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Class Distribution</h2>
            <p className="text-sm text-gray-500 mb-6">Classes by type this month</p>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classTypesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {classTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {classTypesData.map((type) => (
                <div key={type.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                  <span className="text-sm text-gray-600">{type.name}</span>
                  <span className="text-sm font-medium text-gray-900 ml-auto">{type.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_400px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Staff Performance Table */}
            <div className="bg-white border border-gray-200 rounded-2xl">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Staff Performance</h2>
                  <p className="text-sm text-gray-500 mt-1">Track your team's metrics this month</p>
                </div>
                <Link href="/admin/staff" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  View all
                  <ChevronIcon className="w-4 h-4" direction="right" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Classes
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Clients
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockStaffPerformance.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <StaffAvatar name={staff.name} initials={staff.initials} avatar={staff.avatar} />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{staff.name}</p>
                              <p className="text-xs text-gray-500 capitalize">{staff.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-medium text-gray-900">{staff.stats.classesThisMonth}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-medium text-gray-900">{staff.stats.clientsServed}</span>
                        </td>
                        <td className="px-6 py-5">
                          <RatingStars rating={staff.stats.avgRating} />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  staff.stats.attendance >= 95 ? "bg-green-500" :
                                  staff.stats.attendance >= 85 ? "bg-yellow-500" : "bg-red-500"
                                }`}
                                style={{ width: `${staff.stats.attendance}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{staff.stats.attendance}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              staff.trend === "up"
                                ? "text-green-700 bg-green-50"
                                : staff.trend === "down"
                                ? "text-red-700 bg-red-50"
                                : "text-gray-700 bg-gray-100"
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

            {/* Today's Classes */}
            <div className="bg-white border border-gray-200 rounded-2xl">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Today's Classes</h2>
                  <p className="text-sm text-gray-500 mt-1">Upcoming classes for today</p>
                </div>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  View schedule
                  <ChevronIcon className="w-4 h-4" direction="right" />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {upcomingClasses.map((cls) => (
                  <div key={cls.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary-600">{cls.time.split(' ')[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-gray-900">{cls.name}</p>
                        {cls.enrolled === cls.capacity && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Full</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{cls.instructor}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cls.enrolled === cls.capacity ? "bg-red-500" :
                              cls.enrolled >= cls.capacity * 0.8 ? "bg-yellow-500" : "bg-green-500"
                            }`}
                            style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-12 text-right">
                          {cls.enrolled}/{cls.capacity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">enrolled</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Attendance Trend Mini Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Attendance Trend</h3>
              <p className="text-sm text-gray-500 mb-4">Last 8 weeks</p>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceData}>
                    <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={3} dot={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value}%`, "Attendance"]}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">Average</span>
                <span className="text-lg font-bold text-green-600">93.3%</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-2xl">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <p className="text-sm text-gray-500 mt-1">Latest updates from your studio</p>
              </div>
              <div className="divide-y divide-gray-100">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="px-6 py-4 flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
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
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                      {activity.type === "class" && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {activity.type === "payment" && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      )}
                      {activity.type === "booking" && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {activity.type === "cancel" && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.name}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <Link
                  href="/admin/activity"
                  className="block w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2 hover:bg-primary-50 rounded-lg transition-colors text-center"
                >
                  View all activity
                </Link>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-bold mb-5">Monthly Highlights</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">New clients</span>
                  </div>
                  <span className="text-lg font-bold">+32</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">Retention rate</span>
                  </div>
                  <span className="text-lg font-bold text-green-400">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">Revenue growth</span>
                  </div>
                  <span className="text-lg font-bold text-purple-400">+12.5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
