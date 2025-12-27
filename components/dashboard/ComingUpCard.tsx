"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreIcon } from "@/components/icons";

export interface ClassItem {
  id: string;
  date: Date;
  title: string;
  startTime: string;
  endTime: string;
  instructor: string;
  confirmed?: boolean;
  type?: "pilates" | "yoga" | "reformer" | "stretch";
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

const typeColors = {
  pilates: "bg-purple-50 border-purple-200 text-purple-600",
  yoga: "bg-pink-50 border-pink-200 text-pink-600",
  reformer: "bg-blue-50 border-blue-200 text-blue-600",
  stretch: "bg-green-50 border-green-200 text-green-600",
};

export default function ComingUpCard({ classes: initialClasses }: ComingUpCardProps) {
  const [classes, setClasses] = useState(initialClasses);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleConfirm = (classId: string) => {
    setConfirmingId(classId);

    // Simulate API call
    setTimeout(() => {
      setClasses((prev) =>
        prev.map((cls) =>
          cls.id === classId ? { ...cls, confirmed: true } : cls
        )
      );
      setConfirmingId(null);
    }, 500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Coming Up</h2>
          <p className="text-sm text-gray-500">Your next classes</p>
        </div>
        <Link
          href="/dashboard/classes"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all
        </Link>
      </div>

      {/* Class List */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-2">No upcoming classes</p>
            <Link
              href="/dashboard/classes"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Book a class
            </Link>
          </div>
        ) : (
          classes.map((classItem) => {
            const colorClass = classItem.type ? typeColors[classItem.type] : "bg-primary-50 border-primary-100 text-primary-600";

            return (
              <div
                key={classItem.id}
                className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Date Badge */}
                  <div className={`w-12 h-14 rounded-lg flex flex-col items-center justify-center border flex-shrink-0 ${colorClass}`}>
                    <span className="text-lg font-bold">
                      {formatDay(classItem.date)}
                    </span>
                    <span className="text-[10px] font-medium">
                      {formatMonth(classItem.date)}
                    </span>
                  </div>

                  {/* Class Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {classItem.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {classItem.startTime} - {classItem.endTime} · {classItem.instructor}
                        </p>
                      </div>
                      {/* Status Badge */}
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded ${
                          classItem.confirmed
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {classItem.confirmed ? "Confirmed" : "Pending"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2">
                      {!classItem.confirmed ? (
                        <button
                          onClick={() => handleConfirm(classItem.id)}
                          disabled={confirmingId === classItem.id}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {confirmingId === classItem.id ? (
                            <>
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Confirming...
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Confirm Attendance
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Confirmed
                        </div>
                      )}
                      <Link
                        href={`/dashboard/classes?class=${classItem.id}`}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
