"use client";

import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

export interface DataPoint {
  label: string;
  value: number;
}

interface YearlyBarChartProps {
  weekData?: DataPoint[];
  monthData?: DataPoint[];
  yearData?: DataPoint[];
}

const BAR_COLOR = "#FCE7F6"; // accent-100
const BAR_COLOR_HIGHLIGHT = "#DD2590"; // accent-600

// Last 6 months data for the client
const monthlyData: DataPoint[] = [
  { label: "Jul", value: 8 },
  { label: "Aug", value: 10 },
  { label: "Sep", value: 12 },
  { label: "Oct", value: 9 },
  { label: "Nov", value: 11 },
  { label: "Dec", value: 12 },
];

export default function YearlyBarChart({ weekData, monthData, yearData }: YearlyBarChartProps) {
  const data = monthData || monthlyData;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const average = Math.round(total / data.length);
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
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
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
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
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === data.length - 1 ? BAR_COLOR_HIGHLIGHT : BAR_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
