"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { MoreIcon } from "@/components/icons";

export interface ProgressData {
  completed: number;
  scheduled: number;
  total: number;
}

interface ProgressDonutCardProps {
  data: ProgressData;
}

const COLORS = {
  completed: "#7F56D9",
  scheduled: "#D6BBFB",
  toBook: "#E5E7EB",
};

export default function ProgressDonutCard({ data }: ProgressDonutCardProps) {
  const { completed, scheduled, total } = data;
  const toBook = Math.max(0, total - completed - scheduled);

  const chartData = [
    { name: "Completed", value: completed, color: COLORS.completed },
    { name: "Scheduled", value: scheduled, color: COLORS.scheduled },
    { name: "To book", value: toBook, color: COLORS.toBook },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-5 h-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">This Month&apos;s Progress</h2>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <MoreIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Donut Chart and Legend */}
      <div className="flex items-center justify-center gap-8">
        {/* Donut Chart */}
        <div className="relative w-[160px] h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{completed}</span>
            <span className="text-xs text-gray-600">of {total} classes</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.completed }} />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.scheduled }} />
            <span className="text-sm text-gray-600">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.toBook }} />
            <span className="text-sm text-gray-600">To book</span>
          </div>
        </div>
      </div>
    </div>
  );
}
