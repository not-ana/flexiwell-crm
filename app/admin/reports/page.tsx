"use client";

import { useState, useEffect, useCallback } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { useCurrency } from "@/hooks/useCurrency";

// Types for API response
interface RevenueData {
  total: number;
  growth: number;
  monthly: { month: string; year: number; revenue: number; clients: number }[];
  paymentCount: number;
}

interface ClassMetrics {
  totalClasses: number;
  completedClasses: number;
  cancelledClasses: number;
  avgAttendance: number;
  cancelRate: number;
  popularClasses: { name: string; sessions: number; avgAttendance: number; revenue: number }[];
}

interface InstructorData {
  id: string;
  name: string;
  classes: number;
  students: number;
  revenue: number;
}

interface InstructorMetrics {
  totalInstructors: number;
  totalClassesTaught: number;
  satisfaction: number;
  instructors: InstructorData[];
}

interface PlanDistribution {
  plan: string;
  type: string;
  count: number;
  percentage: number;
}

interface ClientMetrics {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  newThisMonth: number;
  churnRate: number;
  retention: number;
  planDistribution: PlanDistribution[];
  clientGrowth: { month: string; year: number; clients: number }[];
}

interface ReportsData {
  revenue?: RevenueData;
  classes?: ClassMetrics;
  instructors?: InstructorMetrics;
  clients?: ClientMetrics;
}


function BarChart({ data, height = 200, formatValue }: { data: { label: string; value: number }[]; height?: number; formatValue?: (amount: number) => string }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barAreaHeight = height - 24;
  const format = formatValue || ((v: number) => v.toLocaleString());

  // If 1-2 months, show alternative view
  if (data.length <= 2) {
    const current = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : null;
    const change = previous ? current.value - previous.value : null;
    const changePercent = previous && previous.value > 0
      ? Math.round(((current.value - previous.value) / previous.value) * 100)
      : null;

    return (
      <div style={{ height }} className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl sm:text-5xl font-bold text-primary-600 mb-2">
            {format(current.value)}
          </div>
          <div className="text-sm text-gray-500 mb-3">
            {current.label}
          </div>
          {change !== null && previous && (
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              change >= 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {change >= 0 ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {change >= 0 ? '+' : ''}{format(Math.abs(change))} ({changePercent}%) vs {previous.label}
            </div>
          )}
          {change === null && (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              First month with data
            </div>
          )}
        </div>
      </div>
    );
  }

  // Y-axis scale
  const yTicks = 4;
  const yStep = Math.ceil(maxValue / yTicks);
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => i * yStep).reverse();

  return (
    <div style={{ height }}>
      <div className="flex" style={{ height: barAreaHeight }}>
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-2 shrink-0" style={{ height: barAreaHeight }}>
          {yLabels.map((v, i) => (
            <span key={i} className="text-[10px] text-gray-400 text-right leading-none whitespace-nowrap">
              {format(v)}
            </span>
          ))}
        </div>
        {/* Bars */}
        <div className="flex-1 flex items-end gap-3 border-l border-b border-gray-200 pl-2">
          {data.map((item, index) => {
            const barHeight = Math.max((item.value / (yStep * yTicks)) * 100, 2);
            return (
              <div key={index} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span className="text-[10px] sm:text-xs font-medium text-gray-700">{format(item.value)}</span>
                <div
                  className="w-[40%] max-w-[48px] bg-primary-500 rounded-t-md transition-all hover:bg-primary-600"
                  style={{ height: `${barHeight}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-3 mt-2" style={{ marginLeft: '3rem' }}>
        {data.map((item, index) => (
          <span key={index} className="flex-1 text-xs text-gray-500 text-center">{item.label}</span>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = "primary" }: { value: number; max: number; color?: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const colors: Record<string, string> = {
    primary: "bg-primary-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    purple: "bg-primary-500",
  };

  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${colors[color]} rounded-full`} style={{ width: `${percentage}%` }} />
    </div>
  );
}

function ClientGrowthDisplay({ data }: { data: { month: string; year: number; clients: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-gray-500">
        No client growth data available
      </div>
    );
  }

  // If 1-2 months, show cards with large numbers
  if (data.length <= 2) {
    const current = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : null;
    const change = previous ? current.clients - previous.clients : null;
    const changePercent = previous && previous.clients > 0
      ? Math.round(((current.clients - previous.clients) / previous.clients) * 100)
      : null;

    return (
      <div className="h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl font-bold text-primary-600 mb-2">
            {current.clients}
          </div>
          <div className="text-sm text-gray-500 mb-3">
            clients in {current.month} {current.year}
          </div>
          {change !== null && (
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              change >= 0
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {change >= 0 ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {change >= 0 ? '+' : ''}{change} ({changePercent}%) vs {previous?.month}
            </div>
          )}
          {change === null && (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              First month of data
            </div>
          )}
        </div>
      </div>
    );
  }

  // If 3+ months, show normal bar chart
  return (
    <BarChart
      data={data.map(m => ({ label: m.month, value: m.clients }))}
      height={200}
    />
  );
}

type ExportFormat = "pdf" | "excel" | "csv";

function generateCSV(data: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const headerRow = headers.map(h => h.label).join(",");
  const rows = data.map(item =>
    headers.map(h => {
      const value = item[h.key];
      const strValue = String(value ?? "");
      if (strValue.includes(",") || strValue.includes('"') || strValue.includes("\n")) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    }).join(",")
  );
  return [headerRow, ...rows].join("\n");
}

function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("this_year");
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "instructors" | "clients">("overview");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");

  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { formatCurrency, symbol: currencySymbol, loading: currencyLoading } = useCurrency();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/reports?period=${dateRange}&type=all`);
      if (!response.ok) throw new Error("Failed to fetch reports");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getExportData = (reportType: string) => {
    const periodLabel = {
      this_month: "This Month",
      last_month: "Last Month",
      this_quarter: "This Quarter",
      this_year: "This Year",
      all_time: "All Time",
    }[dateRange] || dateRange;

    switch (reportType) {
      case "overview":
        return {
          headers: [
            { key: "month", label: "Month" },
            { key: "revenue", label: `Revenue (${currencySymbol})` },
            { key: "clients", label: "Clients" },
          ],
          data: (data?.revenue?.monthly || []).map(m => ({
            month: m.month,
            revenue: m.revenue,
            clients: m.clients,
          })),
          summary: `Overview Report - ${periodLabel}\nTotal Revenue: ${formatCurrency(data?.revenue?.total || 0)}\nGrowth: ${data?.revenue?.growth || 0}%`,
        };
      case "classes":
        return {
          headers: [
            { key: "name", label: "Class Name" },
            { key: "sessions", label: "Sessions" },
            { key: "avgAttendance", label: "Avg Attendance (%)" },
            { key: "revenue", label: `Revenue (${currencySymbol})` },
          ],
          data: (data?.classes?.popularClasses || []).map(c => ({
            name: c.name,
            sessions: c.sessions,
            avgAttendance: c.avgAttendance,
            revenue: c.revenue,
          })),
          summary: `Classes Report - ${periodLabel}\nTotal Classes: ${data?.classes?.totalClasses || 0}\nAvg Attendance: ${data?.classes?.avgAttendance || 0}%\nCancel Rate: ${data?.classes?.cancelRate || 0}%`,
        };
      case "instructors":
        return {
          headers: [
            { key: "name", label: "Instructor" },
            { key: "classes", label: "Classes" },
            { key: "students", label: "Students" },
            { key: "revenue", label: `Revenue (${currencySymbol})` },
          ],
          data: (data?.instructors?.instructors || []).map(i => ({
            name: i.name,
            classes: i.classes,
            students: i.students,
            revenue: i.revenue,
          })),
          summary: `Instructors Report - ${periodLabel}\nActive Instructors: ${data?.instructors?.totalInstructors || 0}\nTotal Classes: ${data?.instructors?.totalClassesTaught || 0}`,
        };
      case "clients":
        return {
          headers: [
            { key: "plan", label: "Plan" },
            { key: "count", label: "Clients" },
            { key: "percentage", label: "Percentage (%)" },
          ],
          data: (data?.clients?.planDistribution || []).map(p => ({
            plan: p.plan,
            count: p.count,
            percentage: p.percentage,
          })),
          summary: `Clients Report - ${periodLabel}\nTotal Clients: ${data?.clients?.totalClients || 0}\nActive Clients: ${data?.clients?.activeClients || 0}\nRetention Rate: ${data?.clients?.retention || 0}%`,
        };
      default:
        return { headers: [], data: [], summary: "" };
    }
  };

  if (loading || currencyLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const revenue = data?.revenue || { total: 0, growth: 0, monthly: [], paymentCount: 0 };
  const classes = data?.classes || { totalClasses: 0, avgAttendance: 0, cancelRate: 0, popularClasses: [] };
  const instructors = data?.instructors || { totalInstructors: 0, totalClassesTaught: 0, satisfaction: 0, instructors: [] };
  const clients = data?.clients || { totalClients: 0, activeClients: 0, newThisMonth: 0, churnRate: 0, retention: 0, planDistribution: [], clientGrowth: [] };

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Track your studio&apos;s performance</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary-500"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="all_time">All Time</option>
            </select>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden lg:inline">Export Report</span>
              <span className="lg:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-full lg:w-fit mb-6 lg:mb-8 overflow-x-auto">
          {(["overview", "classes", "instructors", "clients"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 lg:flex-none px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md transition-colors capitalize whitespace-nowrap ${
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard
                label="Total Revenue"
                value={formatCurrency(revenue.total)}
                change={revenue.growth !== 0 ? { text: `${revenue.growth >= 0 ? "+" : ""}${revenue.growth}%`, type: revenue.growth >= 0 ? "positive" : "negative" } : undefined}
              />
              <StatCard
                label="Active Clients"
                value={clients.activeClients}
                change={clients.newThisMonth > 0 ? { text: `+${Math.round((clients.newThisMonth / Math.max(clients.activeClients - clients.newThisMonth, 1)) * 100)}%`, type: "positive" } : undefined}
              />
              <StatCard
                label="Total Classes"
                value={classes.totalClasses}
              />
              <StatCard
                label="Avg. Attendance"
                value={`${classes.avgAttendance}%`}
              />
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Revenue Overview</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Monthly revenue for selected period</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary-500 rounded-full" />
                    <span className="text-gray-600">Revenue</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <div className="min-w-[500px]">
                  {revenue.monthly.length > 0 ? (
                    <BarChart
                      data={revenue.monthly.map(m => ({ label: m.month, value: m.revenue }))}
                      height={250}
                      formatValue={formatCurrency}
                    />
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-gray-500">
                      No revenue data for selected period
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Popular Classes */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Popular Classes</h2>
                {classes.popularClasses.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {classes.popularClasses.slice(0, 7).map((cls, index) => (
                      <div key={cls.name} className="flex items-center gap-3 sm:gap-4">
                        <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs sm:text-sm font-semibold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{cls.name}</p>
                            <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">{cls.avgAttendance}% att.</span>
                          </div>
                          <ProgressBar value={cls.sessions} max={Math.max(...classes.popularClasses.map(c => c.sessions))} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No class data available</p>
                )}
              </div>

              {/* Client Plan Distribution */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Plan Distribution</h2>
                {clients.planDistribution.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {clients.planDistribution.map((plan, index) => {
                      const colors = ["primary", "blue", "green", "orange"];
                      return (
                        <div key={plan.plan}>
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{plan.plan}</p>
                            <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">{plan.count} ({plan.percentage}%)</span>
                          </div>
                          <ProgressBar value={plan.percentage} max={100} color={colors[index % colors.length]} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No plan distribution data</p>
                )}
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Client Retention Rate</span>
                    <span className="text-base sm:text-lg font-bold text-green-600">{clients.retention}%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "classes" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard label="Total Classes" value={classes.totalClasses} />
              <StatCard label="Avg. Attendance" value={`${classes.avgAttendance}%`} />
              <StatCard label="Cancel Rate" value={`${classes.cancelRate}%`} />
              <StatCard label="Completed" value={data?.classes?.completedClasses || 0} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Class Performance</h2>
              </div>

              {classes.popularClasses.length > 0 ? (
                <>
                  {/* Mobile/Tablet Card View */}
                  <div className="lg:hidden divide-y divide-gray-100">
                    {classes.popularClasses.map((cls) => (
                      <div key={cls.name} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{cls.name}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Sessions</p>
                            <p className="font-medium text-gray-900">{cls.sessions}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Attendance</p>
                            <p className="font-medium text-gray-900">{cls.avgAttendance}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Revenue</p>
                            <p className="font-medium text-gray-900">{formatCurrency(cls.revenue)}</p>
                          </div>
                        </div>
                        <ProgressBar value={cls.avgAttendance} max={100} color="green" />
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <table className="w-full hidden lg:table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Class</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sessions</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Avg. Attendance</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {classes.popularClasses.map((cls) => (
                        <tr key={cls.name} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-4 font-medium text-gray-900">{cls.name}</td>
                          <td className="px-4 sm:px-6 py-4 text-gray-600">{cls.sessions}</td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">{cls.avgAttendance}%</span>
                              <div className="w-20">
                                <ProgressBar value={cls.avgAttendance} max={100} color="green" />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-600">{formatCurrency(cls.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No class performance data available
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "instructors" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              <StatCard label="Active Instructors" value={instructors.totalInstructors} />
              <StatCard label="Classes Taught" value={instructors.totalClassesTaught} />
              <StatCard label="Satisfaction" value={`${instructors.satisfaction}%`} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Instructor Performance</h2>
              </div>

              {instructors.instructors.length > 0 ? (
                <>
                  {/* Mobile/Tablet Card View */}
                  <div className="lg:hidden divide-y divide-gray-100">
                    {instructors.instructors.map((instructor) => (
                      <div key={instructor.id} className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary-700">
                              {instructor.name.split(" ").map(n => n[0]).join("")}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{instructor.name}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Classes</p>
                            <p className="font-medium text-gray-900">{instructor.classes}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Students</p>
                            <p className="font-medium text-gray-900">{instructor.students}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Revenue</p>
                            <p className="font-medium text-gray-900">{formatCurrency(instructor.revenue)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <table className="w-full hidden lg:table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Instructor</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Classes</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Students</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {instructors.instructors.map((instructor) => (
                        <tr key={instructor.id} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary-700">
                                  {instructor.name.split(" ").map(n => n[0]).join("")}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">{instructor.name}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-600">{instructor.classes}</td>
                          <td className="px-4 sm:px-6 py-4 text-gray-600">{instructor.students}</td>
                          <td className="px-4 sm:px-6 py-4 text-gray-600">{formatCurrency(instructor.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No instructor data available
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "clients" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard label="Total Clients" value={clients.totalClients} />
              <StatCard label="Active Clients" value={clients.activeClients} />
              <StatCard label="New This Month" value={clients.newThisMonth} change={clients.newThisMonth > 0 ? { text: `+${clients.newThisMonth}`, type: "positive" } : undefined} />
              <StatCard label="Churn Rate" value={`${clients.churnRate}%`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Client Growth</h2>
                <ClientGrowthDisplay data={clients.clientGrowth} />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Retention Metrics</h2>
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm text-gray-600">Retention Rate</span>
                      <span className="text-sm sm:text-base font-semibold text-green-600">{clients.retention}%</span>
                    </div>
                    <ProgressBar value={clients.retention} max={100} color="green" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm text-gray-600">Active Rate</span>
                      <span className="text-sm sm:text-base font-semibold text-blue-600">
                        {clients.totalClients > 0 ? Math.round((clients.activeClients / clients.totalClients) * 100) : 0}%
                      </span>
                    </div>
                    <ProgressBar value={clients.activeClients} max={clients.totalClients || 1} color="blue" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm text-gray-600">Churn Rate</span>
                      <span className="text-sm sm:text-base font-semibold text-red-600">{clients.churnRate}%</span>
                    </div>
                    <ProgressBar value={clients.churnRate} max={100} color="orange" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Export Report</h2>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Report Type</label>
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
                    className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="overview">Overview Report</option>
                    <option value="classes">Classes Report</option>
                    <option value="instructors">Instructors Report</option>
                    <option value="clients">Clients Report</option>
                  </select>
                </div>

                {/* Period Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Period</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="this_quarter">This Quarter</option>
                    <option value="this_year">This Year</option>
                    <option value="all_time">All Time</option>
                  </select>
                </div>

                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Export Format</label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button
                      onClick={() => setExportFormat("pdf")}
                      className={`px-2 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl text-center ${
                        exportFormat === "pdf" ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <svg className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-0.5 sm:mb-1 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className={`text-xs sm:text-sm font-medium ${exportFormat === "pdf" ? "text-primary-700" : "text-gray-700"}`}>PDF</span>
                    </button>
                    <button
                      onClick={() => setExportFormat("excel")}
                      className={`px-2 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl text-center ${
                        exportFormat === "excel" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <svg className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-0.5 sm:mb-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className={`text-xs sm:text-sm font-medium ${exportFormat === "excel" ? "text-green-700" : "text-gray-700"}`}>Excel</span>
                    </button>
                    <button
                      onClick={() => setExportFormat("csv")}
                      className={`px-2 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl text-center ${
                        exportFormat === "csv" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <svg className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-0.5 sm:mb-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                      </svg>
                      <span className={`text-xs sm:text-sm font-medium ${exportFormat === "csv" ? "text-blue-700" : "text-gray-700"}`}>CSV</span>
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium text-gray-900 capitalize">{activeTab}</span> report for{" "}
                    <span className="font-medium text-gray-900">
                      {dateRange === "this_month" ? "This Month" :
                       dateRange === "last_month" ? "Last Month" :
                       dateRange === "this_quarter" ? "This Quarter" :
                       dateRange === "this_year" ? "This Year" : "All Time"}
                    </span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Format: {exportFormat.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="w-full sm:flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const periodLabels: Record<string, string> = {
                      this_month: "this-month",
                      last_month: "last-month",
                      this_quarter: "this-quarter",
                      this_year: "this-year",
                      all_time: "all-time",
                    };

                    const exportData = getExportData(activeTab);
                    const fileBaseName = `flexiwell-${activeTab}-report-${periodLabels[dateRange]}`;

                    if (exportFormat === "csv") {
                      const csvContent = generateCSV(exportData.data, exportData.headers);
                      downloadFile(csvContent, `${fileBaseName}.csv`, "text/csv;charset=utf-8;");
                    } else if (exportFormat === "excel") {
                      const csvContent = "\uFEFF" + generateCSV(exportData.data, exportData.headers);
                      downloadFile(csvContent, `${fileBaseName}.csv`, "text/csv;charset=utf-8;");
                    } else if (exportFormat === "pdf") {
                      const printWindow = window.open("", "_blank");
                      if (printWindow) {
                        const tableRows = exportData.data.map(row =>
                          `<tr>${exportData.headers.map(h => `<td style="border: 1px solid #ddd; padding: 8px;">${(row as Record<string, unknown>)[h.key]}</td>`).join("")}</tr>`
                        ).join("");

                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <title>${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report - FlexiWell</title>
                            <style>
                              body { font-family: Arial, sans-serif; padding: 40px; }
                              h1 { color: #333; margin-bottom: 10px; }
                              .period { color: #666; margin-bottom: 20px; }
                              .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; white-space: pre-line; }
                              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                              th { background: #7c3aed; color: white; padding: 12px 8px; text-align: left; }
                              td { border: 1px solid #ddd; padding: 8px; }
                              tr:nth-child(even) { background: #f9f9f9; }
                              .footer { margin-top: 30px; color: #999; font-size: 12px; }
                              @media print { body { padding: 20px; } }
                            </style>
                          </head>
                          <body>
                            <h1>${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report</h1>
                            <p class="period">Period: ${periodLabels[dateRange].replace(/-/g, " ")}</p>
                            <div class="summary">${exportData.summary}</div>
                            <table>
                              <thead>
                                <tr>${exportData.headers.map(h => `<th>${h.label}</th>`).join("")}</tr>
                              </thead>
                              <tbody>${tableRows}</tbody>
                            </table>
                            <p class="footer">Generated by FlexiWell on ${new Date().toLocaleDateString()}</p>
                          </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }

                    setShowExportModal(false);
                  }}
                  className="w-full sm:flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
