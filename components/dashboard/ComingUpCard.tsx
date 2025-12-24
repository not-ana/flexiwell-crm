"use client";

import { MoreIcon } from "@/components/icons";

export interface ClassItem {
  id: string;
  date: Date;
  title: string;
  startTime: string;
  endTime: string;
  instructor: string;
}

interface ComingUpCardProps {
  classes: ClassItem[];
}

function formatDay(date: Date): number {
  return date.getDate();
}

function formatMonth(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" }).toUpperCase();
}

export default function ComingUpCard({ classes }: ComingUpCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 h-[400px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Coming Up</h2>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <MoreIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Class List */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {classes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No upcoming classes
          </p>
        ) : (
          classes.map((classItem) => (
            <div
              key={classItem.id}
              className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {/* Date Badge */}
              <div className="w-12 h-14 bg-primary-50 rounded-lg flex flex-col items-center justify-center border border-primary-100">
                <span className="text-lg font-bold text-primary-600">
                  {formatDay(classItem.date)}
                </span>
                <span className="text-xs font-medium text-primary-600">
                  {formatMonth(classItem.date)}
                </span>
              </div>

              {/* Class Info */}
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  {classItem.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {classItem.startTime} - {classItem.endTime} · Instructor: {classItem.instructor}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
