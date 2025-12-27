"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, LineChart, Line, AreaChart, Area, PieChart, Pie } from "recharts";
import { InteractiveOnboarding, useInteractiveOnboarding } from "@/components/onboarding";

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
    name: "Sarah Johnson",
    role: "teacher",
    initials: "SJ",
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
    name: "James Wilson",
    role: "teacher",
    initials: "JW",
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
    name: "Michael Chen",
    role: "admin",
    initials: "MC",
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
    name: "Emily Davis",
    role: "teacher",
    initials: "ED",
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

// Class types distribution - Using admin purple theme variations
const classTypesData = [
  { name: "Pilates", value: 45, color: "#6938EF" },  // primary-500
  { name: "Yoga", value: 25, color: "#8870E9" },     // primary-400
  { name: "Reformer", value: 20, color: "#5925DC" }, // primary-700
  { name: "Stretch", value: 10, color: "#BDB4FE" },  // primary-300
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
      color: "from-primary-500 to-primary-600",
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
  { id: 1, action: "New client registration", name: "Lucas Brooks", time: "5 min ago", type: "client" },
  { id: 2, action: "Class completed", name: "Morning Yoga", time: "1 hour ago", type: "class" },
  { id: 3, action: "Payment received", name: "$350.00", time: "2 hours ago", type: "payment" },
  { id: 4, action: "New booking", name: "Pilates - Sarah J.", time: "3 hours ago", type: "booking" },
  { id: 5, action: "Class canceled", name: "Evening Stretch", time: "5 hours ago", type: "cancel" },
];

const upcomingClasses = [
  { id: 1, name: "Morning Pilates", time: "9:00 AM", instructor: "Sarah Johnson", enrolled: 8, capacity: 12 },
  { id: 2, name: "Yoga Flow", time: "10:30 AM", instructor: "James Wilson", enrolled: 10, capacity: 10 },
  { id: 3, name: "Stretch & Relax", time: "2:00 PM", instructor: "Emily Davis", enrolled: 6, capacity: 15 },
  { id: 4, name: "Power Pilates", time: "4:30 PM", instructor: "Sarah Johnson", enrolled: 11, capacity: 12 },
];

function StaffAvatar({ name, initials, avatar }: { name: string; initials: string; avatar?: string }) {
  const colors = ["bg-primary-500", "bg-pink-500", "bg-blue-500", "bg-green-500", "bg-orange-500"];
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

interface Establishment {
  id: string;
  name: string;
  location: string;
}

const establishments: Establishment[] = [
  { id: "1", name: "FlexiWell Downtown", location: "Downtown, New York" },
  { id: "2", name: "FlexiWell Midtown", location: "Midtown, New York" },
  { id: "3", name: "FlexiWell Uptown", location: "Uptown, New York" },
];

export default function AdminDashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment>(establishments[0]);
  const [showEstablishmentDropdown, setShowEstablishmentDropdown] = useState(false);

  // Onboarding
  const { shouldShow: showOnboarding, markComplete } = useInteractiveOnboarding("admin");

  const availableYears = [currentYear, currentYear - 1];

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Interactive Onboarding */}
      <InteractiveOnboarding
        role="admin"
        isOpen={showOnboarding}
        onComplete={markComplete}
      />
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                Good morning, Alex
              </h1>
              {/* Establishment Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowEstablishmentDropdown(!showEstablishmentDropdown)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {selectedEstablishment.name}
                  <ChevronIcon className="w-4 h-4 text-gray-400" direction={showEstablishmentDropdown ? "up" : "down"} />
                </button>
                {showEstablishmentDropdown && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[220px]">
                    {establishments.map((establishment) => (
                      <button
                        key={establishment.id}
                        onClick={() => {
                          setSelectedEstablishment(establishment);
                          setShowEstablishmentDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          selectedEstablishment.id === establishment.id ? "bg-primary-50" : ""
                        }`}
                      >
                        <p className={`text-sm font-medium ${selectedEstablishment.id === establishment.id ? "text-primary-600" : "text-gray-900"}`}>
                          {establishment.name}
                        </p>
                        <p className="text-xs text-gray-500">{establishment.location}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Year Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {selectedYear}
                  <ChevronIcon className="w-4 h-4 text-gray-400" direction={showYearDropdown ? "up" : "down"} />
                </button>
                {showYearDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[100px]">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setShowYearDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
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
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
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

              <Link
                href="/admin/settings"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          {/* Revenue Chart with Stats */}
          <div className="col-span-8 bg-white border border-gray-200 rounded-2xl p-6">
            {/* Stats Row inside Revenue Card */}
            <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-100">
              {getOverviewStats(selectedPeriod, selectedYear).map((stat, idx) => (
                <div key={idx}>
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.trend === "up" ? "text-green-600" : stat.trend === "down" ? "text-red-600" : "text-gray-600"}`}>
                    {stat.change}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
                <p className="text-sm text-gray-500">Monthly comparison</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span className="text-gray-600">This Year</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-gray-600">Last Year</span>
                </div>
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6938EF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6938EF" stopOpacity={0}/>
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
                    formatter={(value) => [`$${(value as number).toLocaleString()}`, ""]}
                  />
                  <Area type="monotone" dataKey="lastYear" stroke="#D1D5DB" strokeWidth={2} fill="transparent" />
                  <Area type="monotone" dataKey="revenue" stroke="#6938EF" strokeWidth={3} fill="url(#colorRevenue)" />
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
                    formatter={(value) => [`${value}%`, ""]}
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
                <Link
                  href="/admin/classes"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  View schedule
                  <ChevronIcon className="w-4 h-4" direction="right" />
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
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
                      formatter={(value) => [`${value}%`, "Attendance"]}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
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
              <div className="divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="px-6 py-4 flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
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
                    <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-300">Revenue growth</span>
                  </div>
                  <span className="text-lg font-bold text-primary-400">+12.5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
