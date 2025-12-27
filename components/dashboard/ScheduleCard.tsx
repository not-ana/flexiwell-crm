"use client";

import { useState } from "react";
import Link from "next/link";

interface UpcomingClass {
  id: string;
  title: string;
  date: string;
  dayOfWeek: string;
  time: string;
  instructor: string;
  type: "pilates" | "yoga" | "reformer" | "stretch";
  confirmed: boolean;
}

const classTypeColors = {
  pilates: "bg-purple-500",
  yoga: "bg-pink-400",
  reformer: "bg-blue-500",
  stretch: "bg-green-500",
};

const classTypeBgColors = {
  pilates: "bg-purple-50 border-purple-200",
  yoga: "bg-pink-50 border-pink-200",
  reformer: "bg-blue-50 border-blue-200",
  stretch: "bg-green-50 border-green-200",
};

const upcomingClasses: UpcomingClass[] = [
  { id: "c1", title: "Morning Pilates", date: "Dec 27", dayOfWeek: "Today", time: "9:00 AM", instructor: "Ana", type: "pilates", confirmed: false },
  { id: "c2", title: "Afternoon Yoga", date: "Dec 28", dayOfWeek: "Tomorrow", time: "4:00 PM", instructor: "Maria", type: "yoga", confirmed: false },
  { id: "c3", title: "Reformer Session", date: "Dec 29", dayOfWeek: "Sunday", time: "10:00 AM", instructor: "Ana", type: "reformer", confirmed: true },
  { id: "c4", title: "Yoga Flow", date: "Dec 31", dayOfWeek: "Tuesday", time: "10:00 AM", instructor: "Maria", type: "yoga", confirmed: false },
];

export default function ScheduleCard() {
  const [classes, setClasses] = useState<UpcomingClass[]>(upcomingClasses);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleConfirmClass = (classId: string) => {
    setConfirmingId(classId);
    setTimeout(() => {
      setClasses((prev) =>
        prev.map((cls) => (cls.id === classId ? { ...cls, confirmed: true } : cls))
      );
      setConfirmingId(null);
    }, 500);
  };

  const pendingCount = classes.filter((cls) => !cls.confirmed).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Classes</h2>
          <p className="text-sm text-gray-500">
            {pendingCount > 0 ? `${pendingCount} pending confirmation` : "All confirmed"}
          </p>
        </div>
        <Link
          href="/dashboard/classes"
          className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          View Calendar →
        </Link>
      </div>

      {/* Upcoming Classes List */}
      <div className="space-y-3">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className={`p-4 rounded-xl border transition-all ${classTypeBgColors[cls.type]}`}
          >
            <div className="flex items-start gap-3">
              {/* Date Badge */}
              <div className="flex-shrink-0 text-center">
                <div className={`w-12 h-12 rounded-lg ${classTypeColors[cls.type]} flex flex-col items-center justify-center text-white`}>
                  <span className="text-xs font-medium">{cls.date.split(" ")[0]}</span>
                  <span className="text-lg font-bold leading-none">{cls.date.split(" ")[1]}</span>
                </div>
              </div>

              {/* Class Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{cls.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {cls.dayOfWeek} • {cls.time} • {cls.instructor}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${
                      cls.confirmed
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {cls.confirmed ? "Confirmed" : "Pending"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  {!cls.confirmed ? (
                    <button
                      onClick={() => handleConfirmClass(cls.id)}
                      disabled={confirmingId === cls.id}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {confirmingId === cls.id ? (
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
                          Confirm
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirmed
                    </div>
                  )}
                  <Link
                    href={`/dashboard/classes?class=${cls.id}`}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {classes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-2">No upcoming classes</p>
          <Link href="/dashboard/classes" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            Book a class
          </Link>
        </div>
      )}
    </div>
  );
}
