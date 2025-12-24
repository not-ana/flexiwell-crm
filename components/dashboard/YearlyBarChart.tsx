"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { MoreIcon } from "@/components/icons";

export interface MonthData {
  month: string;
  value: number;
}

interface YearlyBarChartProps {
  year: number;
  data: MonthData[];
}

const BAR_COLOR = "#F9A8D4"; // pink-300

export default function YearlyBarChart({ year, data }: YearlyBarChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-5 h-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Your {year}</h2>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <MoreIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Bar Chart */}
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#667085" }}
              interval={0}
            />
            <YAxis hide />
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
              formatter={(value: number) => [`${value} classes`, ""]}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={24}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
