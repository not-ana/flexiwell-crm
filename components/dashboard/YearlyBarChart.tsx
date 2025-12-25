"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { ChevronIcon } from "@/components/icons";

export interface DataPoint {
  label: string;
  value: number;
}

type TimePeriod = "week" | "month" | "year";

interface YearlyBarChartProps {
  weekData?: DataPoint[];
  monthData?: DataPoint[];
  yearData?: DataPoint[];
}

const BAR_COLOR = "#F9A8D4"; // pink-300

// Sample data that changes per period
const sampleData: Record<TimePeriod, Record<number, DataPoint[]>> = {
  week: {
    2024: [
      { label: "Mon", value: 2 },
      { label: "Tue", value: 1 },
      { label: "Wed", value: 3 },
      { label: "Thu", value: 2 },
      { label: "Fri", value: 1 },
      { label: "Sat", value: 0 },
      { label: "Sun", value: 0 },
    ],
    2025: [
      { label: "Mon", value: 3 },
      { label: "Tue", value: 2 },
      { label: "Wed", value: 4 },
      { label: "Thu", value: 1 },
      { label: "Fri", value: 2 },
      { label: "Sat", value: 1 },
      { label: "Sun", value: 0 },
    ],
  },
  month: {
    2024: [
      { label: "W1", value: 8 },
      { label: "W2", value: 6 },
      { label: "W3", value: 9 },
      { label: "W4", value: 7 },
    ],
    2025: [
      { label: "W1", value: 10 },
      { label: "W2", value: 8 },
      { label: "W3", value: 12 },
      { label: "W4", value: 9 },
    ],
  },
  year: {
    2024: [
      { label: "J", value: 65 },
      { label: "F", value: 80 },
      { label: "M", value: 90 },
      { label: "A", value: 75 },
      { label: "M", value: 85 },
      { label: "J", value: 70 },
      { label: "J", value: 95 },
      { label: "A", value: 88 },
      { label: "S", value: 92 },
      { label: "O", value: 78 },
      { label: "N", value: 82 },
      { label: "D", value: 68 },
    ],
    2025: [
      { label: "J", value: 72 },
      { label: "F", value: 85 },
      { label: "M", value: 95 },
      { label: "A", value: 88 },
      { label: "M", value: 92 },
      { label: "J", value: 78 },
      { label: "J", value: 0 },
      { label: "A", value: 0 },
      { label: "S", value: 0 },
      { label: "O", value: 0 },
      { label: "N", value: 0 },
      { label: "D", value: 0 },
    ],
  },
};

const periodLabels: Record<TimePeriod, string> = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

export default function YearlyBarChart({ weekData, monthData, yearData }: YearlyBarChartProps) {
  const currentYear = new Date().getFullYear();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("year");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const availableYears = [currentYear, currentYear - 1];

  const getData = (): DataPoint[] => {
    // Use provided data if available, otherwise use sample data
    if (selectedPeriod === "week" && weekData) return weekData;
    if (selectedPeriod === "month" && monthData) return monthData;
    if (selectedPeriod === "year" && yearData) return yearData;

    // Fall back to sample data based on year
    return sampleData[selectedPeriod][selectedYear] || sampleData[selectedPeriod][currentYear];
  };

  const data = getData();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-5 h-[280px]">
      {/* Header with period and year selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{periodLabels[selectedPeriod]}</h2>
            <p className="text-sm text-gray-500">{total} classes total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Year Selector */}
          <div className="relative">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
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
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <XAxis
              dataKey="label"
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
              formatter={(value) => [`${value} classes`, ""]}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={24}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
