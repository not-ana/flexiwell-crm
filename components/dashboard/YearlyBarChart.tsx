"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useAuth } from "@/contexts/AuthContext";

export interface DataPoint {
  label: string;
  value: number;
}

export interface YearlyBarChartProps {
  weekData?: DataPoint[];
  monthData?: DataPoint[];
  yearData?: DataPoint[];
}

const BAR_COLOR = "#EDE9FE"; // primary-100
const BAR_COLOR_HIGHLIGHT = "#7C3AED"; // primary-600

export default function YearlyBarChart({ weekData, monthData, yearData }: YearlyBarChartProps) {
  const { user } = useAuth();
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClassHistory = useCallback(async () => {
    // Use provided props if available
    if (monthData) {
      setData(monthData);
      setLoading(false);
      return;
    }

    if (!user?.id) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch bookings for the last 6 months
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const response = await fetch(
        `/api/bookings?clientId=${user.id}&startDate=${sixMonthsAgo.toISOString()}&endDate=${now.toISOString()}`
      );

      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();

      // Group bookings by month
      const monthlyCount: Record<string, number> = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // Initialize last 6 months with 0
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthlyCount[key] = 0;
      }

      // Count bookings per month (only completed ones)
      (result.bookings || []).forEach((booking: { scheduledDate: string; status: string }) => {
        if (booking.status === "completed" || booking.status === "confirmed") {
          const date = new Date(booking.scheduledDate);
          const key = `${date.getFullYear()}-${date.getMonth()}`;
          if (monthlyCount[key] !== undefined) {
            monthlyCount[key]++;
          }
        }
      });

      // Convert to DataPoint array
      const chartData: DataPoint[] = Object.entries(monthlyCount).map(([key, value]) => {
        const [year, month] = key.split("-").map(Number);
        return {
          label: monthNames[month],
          value,
        };
      });

      setData(chartData);
    } catch (error) {
      console.error("Error fetching class history:", error);
      // Fallback to empty data
      setData([
        { label: "Jul", value: 0 },
        { label: "Aug", value: 0 },
        { label: "Sep", value: 0 },
        { label: "Oct", value: 0 },
        { label: "Nov", value: 0 },
        { label: "Dec", value: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, monthData]);

  useEffect(() => {
    fetchClassHistory();
  }, [fetchClassHistory]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Class History</h2>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
        <div className="h-[100px] w-full bg-gray-100 animate-pulse rounded-lg mb-4" />
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3 bg-gray-200 rounded w-16 mb-1" />
              <div className="h-5 bg-gray-200 rounded w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate stats
  const displayData = data.length > 0 ? data : [{ label: "N/A", value: 0 }];
  const total = displayData.reduce((sum, item) => sum + item.value, 0);
  const average = displayData.length > 0 ? Math.round(total / displayData.length) : 0;
  const currentMonth = displayData[displayData.length - 1] || { value: 0 };
  const previousMonth = displayData[displayData.length - 2] || { value: 0 };
  const trend = currentMonth.value - previousMonth.value;
  const trendPercent = previousMonth.value > 0 ? Math.round((trend / previousMonth.value) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Class History</h2>
          <p className="text-sm text-gray-500">Last 6 months</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">total classes</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-[100px] w-full mb-4">
        {displayData.length > 0 && displayData.some(d => d.value > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#667085" }}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #EAECF0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "#101828", fontWeight: 600, marginBottom: "4px" }}
                formatter={(value) => [`${value} classes`, ""]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {displayData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === displayData.length - 1 ? BAR_COLOR_HIGHLIGHT : BAR_COLOR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No class history yet
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">This month</p>
          <p className="text-lg font-semibold text-gray-900">{currentMonth.value}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Monthly avg</p>
          <p className="text-lg font-semibold text-gray-900">{average}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">vs last month</p>
          <p className={`text-lg font-semibold flex items-center gap-1 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
            {trend >= 0 ? "+" : ""}{trend}
            <span className="text-xs font-normal">({trend >= 0 ? "+" : ""}{trendPercent}%)</span>
          </p>
        </div>
      </div>
    </div>
  );
}
