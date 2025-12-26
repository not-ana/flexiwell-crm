"use client";

import { useState } from "react";
import { ChevronIcon, CalendarIcon } from "@/components/icons";

// Mock data for reports
const revenueData = {
  total: 45680,
  growth: 12.5,
  monthly: [
    { month: "Jan", revenue: 3200, clients: 42 },
    { month: "Feb", revenue: 3500, clients: 45 },
    { month: "Mar", revenue: 4100, clients: 52 },
    { month: "Apr", revenue: 3800, clients: 48 },
    { month: "May", revenue: 4500, clients: 56 },
    { month: "Jun", revenue: 4200, clients: 54 },
    { month: "Jul", revenue: 4800, clients: 61 },
    { month: "Aug", revenue: 5100, clients: 65 },
    { month: "Sep", revenue: 4600, clients: 58 },
    { month: "Oct", revenue: 5200, clients: 68 },
    { month: "Nov", revenue: 5400, clients: 72 },
    { month: "Dec", revenue: 5680, clients: 76 },
  ],
};

const classMetrics = {
  totalClasses: 324,
  avgAttendance: 87,
  cancelRate: 8.2,
  popularClasses: [
    { name: "Morning Yoga", sessions: 48, avgAttendance: 92, revenue: 4200 },
    { name: "Pilates Basic", sessions: 42, avgAttendance: 88, revenue: 3800 },
    { name: "Evening Stretch", sessions: 36, avgAttendance: 85, revenue: 3200 },
    { name: "Power Pilates", sessions: 32, avgAttendance: 90, revenue: 2900 },
    { name: "Meditation", sessions: 28, avgAttendance: 78, revenue: 2100 },
  ],
};

const instructorMetrics = [
  { name: "Ana Silva", classes: 86, students: 245, rating: 4.9, revenue: 12400 },
  { name: "Maria Santos", classes: 72, students: 198, rating: 4.8, revenue: 10800 },
  { name: "Carlos Lima", classes: 64, students: 176, rating: 4.7, revenue: 9200 },
  { name: "Julia Costa", classes: 58, students: 156, rating: 4.6, revenue: 8400 },
];

const clientMetrics = {
  totalClients: 76,
  activeClients: 68,
  newThisMonth: 12,
  churnRate: 3.2,
  retention: 96.8,
  planDistribution: [
    { plan: "Monthly - 8 classes", count: 32, percentage: 42 },
    { plan: "Monthly - 12 classes", count: 24, percentage: 32 },
    { plan: "Quarterly", count: 12, percentage: 16 },
    { plan: "Annual", count: 8, percentage: 10 },
  ],
};

function StatCard({ title, value, change, changeType, suffix = "" }: {
  title: string;
  value: string | number;
  change?: number;
  changeType?: "positive" | "negative";
  suffix?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className="flex items-end gap-2 mt-2">
        <p className="text-3xl font-bold text-gray-900">{value}{suffix}</p>
        {change !== undefined && (
          <span className={`text-sm font-medium ${changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
            {changeType === "positive" ? "↑" : "↓"} {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}

function BarChart({ data, height = 200 }: { data: { label: string; value: number }[]; height?: number }) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-2">
          <div
            className="w-full bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600"
            style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: 4 }}
          />
          <span className="text-xs text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ value, max, color = "primary" }: { value: number; max: number; color?: string }) {
  const percentage = (value / max) * 100;
  const colors: Record<string, string> = {
    primary: "bg-primary-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${colors[color]} rounded-full`} style={{ width: `${percentage}%` }} />
    </div>
  );
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("this_year");
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "instructors" | "clients">("overview");

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Track your studio's performance</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
            </select>
            <button className="px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
              Export Report
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit mb-8">
          {(["overview", "classes", "instructors", "clients"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Revenue"
                value={`R$ ${revenueData.total.toLocaleString()}`}
                change={revenueData.growth}
                changeType="positive"
              />
              <StatCard
                title="Active Clients"
                value={clientMetrics.activeClients}
                change={18}
                changeType="positive"
              />
              <StatCard
                title="Classes This Month"
                value={classMetrics.totalClasses}
                change={8}
                changeType="positive"
              />
              <StatCard
                title="Avg. Attendance"
                value={classMetrics.avgAttendance}
                suffix="%"
                change={2.3}
                changeType="positive"
              />
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
                  <p className="text-sm text-gray-500">Monthly revenue for {dateRange === "this_year" ? "2024" : "selected period"}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary-500 rounded-full" />
                    <span className="text-gray-600">Revenue</span>
                  </div>
                </div>
              </div>
              <BarChart
                data={revenueData.monthly.map(m => ({ label: m.month, value: m.revenue }))}
                height={250}
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-6">
              {/* Popular Classes */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Classes</h2>
                <div className="space-y-4">
                  {classMetrics.popularClasses.map((cls, index) => (
                    <div key={cls.name} className="flex items-center gap-4">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">{cls.name}</p>
                          <span className="text-sm text-gray-500">{cls.avgAttendance}% att.</span>
                        </div>
                        <ProgressBar value={cls.sessions} max={50} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Plan Distribution */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h2>
                <div className="space-y-4">
                  {clientMetrics.planDistribution.map((plan, index) => {
                    const colors = ["primary", "blue", "green", "orange"];
                    return (
                      <div key={plan.plan}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">{plan.plan}</p>
                          <span className="text-sm text-gray-500">{plan.count} clients ({plan.percentage}%)</span>
                        </div>
                        <ProgressBar value={plan.percentage} max={100} color={colors[index]} />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Client Retention Rate</span>
                    <span className="text-lg font-bold text-green-600">{clientMetrics.retention}%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "classes" && (
          <>
            <div className="grid grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Classes" value={classMetrics.totalClasses} />
              <StatCard title="Avg. Attendance" value={classMetrics.avgAttendance} suffix="%" />
              <StatCard title="Cancel Rate" value={classMetrics.cancelRate} suffix="%" changeType="negative" change={1.2} />
              <StatCard title="Waitlist Conversion" value={72} suffix="%" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Class Performance</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Avg. Attendance</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classMetrics.popularClasses.map((cls) => (
                    <tr key={cls.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{cls.name}</td>
                      <td className="px-6 py-4 text-gray-600">{cls.sessions}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">{cls.avgAttendance}%</span>
                          <div className="w-20">
                            <ProgressBar value={cls.avgAttendance} max={100} color="green" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">R$ {cls.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="text-green-600 text-sm font-medium">↑ 5%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "instructors" && (
          <>
            <div className="grid grid-cols-4 gap-6 mb-8">
              <StatCard title="Active Instructors" value={4} />
              <StatCard title="Total Classes Taught" value={280} />
              <StatCard title="Avg. Rating" value={4.75} suffix="/5" />
              <StatCard title="Student Satisfaction" value={94} suffix="%" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Instructor Performance</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Instructor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Classes</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {instructorMetrics.map((instructor) => (
                    <tr key={instructor.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-700">
                              {instructor.name.split(" ").map(n => n[0]).join("")}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{instructor.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{instructor.classes}</td>
                      <td className="px-6 py-4 text-gray-600">{instructor.students}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-medium text-gray-900">{instructor.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">R$ {instructor.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "clients" && (
          <>
            <div className="grid grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Clients" value={clientMetrics.totalClients} />
              <StatCard title="Active Clients" value={clientMetrics.activeClients} />
              <StatCard title="New This Month" value={clientMetrics.newThisMonth} change={25} changeType="positive" />
              <StatCard title="Churn Rate" value={clientMetrics.churnRate} suffix="%" changeType="negative" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Growth</h2>
                <BarChart
                  data={revenueData.monthly.map(m => ({ label: m.month, value: m.clients }))}
                  height={200}
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Retention Metrics</h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Retention Rate</span>
                      <span className="font-semibold text-green-600">{clientMetrics.retention}%</span>
                    </div>
                    <ProgressBar value={clientMetrics.retention} max={100} color="green" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Active Rate</span>
                      <span className="font-semibold text-blue-600">{Math.round((clientMetrics.activeClients / clientMetrics.totalClients) * 100)}%</span>
                    </div>
                    <ProgressBar value={clientMetrics.activeClients} max={clientMetrics.totalClients} color="blue" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Avg. Classes/Client</span>
                      <span className="font-semibold text-primary-600">8.2</span>
                    </div>
                    <ProgressBar value={82} max={120} color="primary" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
