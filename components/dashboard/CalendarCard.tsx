"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";

interface ClassEvent {
  id: string;
  title: string;
  time: string;
  instructor: string;
  type: "pilates" | "yoga" | "reformer" | "stretch";
  status: "completed" | "upcoming" | "canceled";
  confirmed?: boolean;
}

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  classes?: ClassEvent[];
}

const classTypeColors = {
  pilates: "bg-primary-500",
  yoga: "bg-pink-400",
  reformer: "bg-blue-500",
  stretch: "bg-green-500",
};

const classTypeBgColors = {
  pilates: "bg-primary-50 border-primary-200",
  yoga: "bg-pink-50 border-pink-200",
  reformer: "bg-blue-50 border-blue-200",
  stretch: "bg-green-50 border-green-200",
};

// Generate calendar data for December 2024
const generateCalendarData = (): CalendarDay[] => {
  const classes: Record<number, ClassEvent[]> = {
    2: [
      { id: "c1", title: "Morning Pilates", time: "9:00 AM", instructor: "Ana", type: "pilates", status: "completed" },
    ],
    5: [
      { id: "c2", title: "Yoga Flow", time: "10:00 AM", instructor: "Maria", type: "yoga", status: "completed" },
    ],
    7: [
      { id: "c3", title: "Reformer Session", time: "4:00 PM", instructor: "Ana", type: "reformer", status: "completed" },
    ],
    9: [
      { id: "c4", title: "Morning Pilates", time: "9:00 AM", instructor: "Ana", type: "pilates", status: "completed" },
      { id: "c5", title: "Stretch & Relax", time: "6:00 PM", instructor: "Maria", type: "stretch", status: "completed" },
    ],
    12: [
      { id: "c6", title: "Yoga Flow", time: "10:00 AM", instructor: "Maria", type: "yoga", status: "completed" },
    ],
    14: [
      { id: "c7", title: "Reformer Session", time: "2:00 PM", instructor: "Ana", type: "reformer", status: "completed" },
    ],
    16: [
      { id: "c8", title: "Morning Pilates", time: "9:00 AM", instructor: "Ana", type: "pilates", status: "completed" },
    ],
    19: [
      { id: "c9", title: "Yoga Flow", time: "10:00 AM", instructor: "Maria", type: "yoga", status: "completed" },
      { id: "c10", title: "Pilates Advanced", time: "5:00 PM", instructor: "Ana", type: "pilates", status: "completed" },
    ],
    21: [
      { id: "c11", title: "Stretch & Relax", time: "6:00 PM", instructor: "Maria", type: "stretch", status: "completed" },
    ],
    23: [
      { id: "c12", title: "Morning Pilates", time: "9:00 AM", instructor: "Ana", type: "pilates", status: "completed" },
    ],
    26: [
      { id: "c13", title: "Morning Pilates", time: "9:00 AM", instructor: "Ana", type: "pilates", status: "upcoming", confirmed: false },
    ],
    27: [
      { id: "c14", title: "Afternoon Yoga", time: "4:00 PM", instructor: "Maria", type: "yoga", status: "upcoming", confirmed: false },
    ],
    28: [
      { id: "c15", title: "Reformer Session", time: "10:00 AM", instructor: "Ana", type: "reformer", status: "upcoming", confirmed: true },
    ],
    30: [
      { id: "c16", title: "Yoga Flow", time: "10:00 AM", instructor: "Maria", type: "yoga", status: "upcoming", confirmed: false },
    ],
  };

  const days: CalendarDay[] = [];

  // Previous month days (November ends on Saturday, so we need Sunday = 1 day)
  days.push({ day: 30, isCurrentMonth: false });

  // December 2024 days
  for (let i = 1; i <= 31; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      isToday: i === 26, // Today is Dec 26
      classes: classes[i] || [],
    });
  }

  // Next month days
  for (let i = 1; i <= 4; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  return days;
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarCard() {
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>(generateCalendarData());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(
    calendarDays.find((d) => d.isToday) || null
  );
  const [currentMonth] = useState({ month: "December", year: 2024 });
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleDayClick = (day: CalendarDay) => {
    if (day.isCurrentMonth) {
      setSelectedDay(day);
    }
  };

  const handleConfirmClass = (classId: string, dayNumber: number) => {
    setConfirmingId(classId);

    // Simulate API call
    setTimeout(() => {
      setCalendarDays((prev) =>
        prev.map((day) => {
          if (day.day === dayNumber && day.isCurrentMonth) {
            return {
              ...day,
              classes: day.classes?.map((cls) =>
                cls.id === classId ? { ...cls, confirmed: true } : cls
              ),
            };
          }
          return day;
        })
      );

      // Update selected day too
      setSelectedDay((prev) => {
        if (prev && prev.day === dayNumber) {
          return {
            ...prev,
            classes: prev.classes?.map((cls) =>
              cls.id === classId ? { ...cls, confirmed: true } : cls
            ),
          };
        }
        return prev;
      });

      setConfirmingId(null);
    }, 500);
  };

  const hasClasses = (day: CalendarDay) => day.classes && day.classes.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My Schedule</h2>
          <p className="text-sm text-gray-500">Click on a day to see your classes</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronIcon className="w-5 h-5 text-gray-400" direction="left" />
          </button>
          <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
            {currentMonth.month} {currentMonth.year}
          </span>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronIcon className="w-5 h-5 text-gray-400" direction="right" />
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Calendar Grid */}
        <div className="flex-1">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((day, index) => (
              <div key={index} className="text-center text-xs font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isSelected = selectedDay?.day === day.day && day.isCurrentMonth;
              const hasClass = hasClasses(day);

              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(day)}
                  disabled={!day.isCurrentMonth}
                  className={`relative h-10 w-full flex flex-col items-center justify-center rounded-lg transition-all ${
                    day.isToday
                      ? "bg-primary-600 text-white shadow-md"
                      : isSelected
                      ? "bg-primary-100 text-primary-700 ring-2 ring-primary-500"
                      : day.isCurrentMonth
                      ? "hover:bg-gray-100 text-gray-900"
                      : "text-gray-300 cursor-default"
                  }`}
                >
                  <span className={`text-sm font-medium ${day.isToday ? "text-white" : ""}`}>
                    {day.day}
                  </span>
                  {hasClass && day.isCurrentMonth && (
                    <div className="absolute bottom-1 flex gap-0.5">
                      {day.classes!.slice(0, 3).map((cls, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            day.isToday ? "bg-white/70" : classTypeColors[cls.type]
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
              <span className="text-xs text-gray-500">Pilates</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-400" />
              <span className="text-xs text-gray-500">Yoga</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-500">Reformer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs text-gray-500">Stretch</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="w-64 border-l border-gray-100 pl-4">
          {selectedDay && selectedDay.isCurrentMonth ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {currentMonth.month} {selectedDay.day}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedDay.classes?.length || 0} class{(selectedDay.classes?.length || 0) !== 1 ? "es" : ""}
                  </p>
                </div>
                {selectedDay.isToday && (
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                    Today
                  </span>
                )}
              </div>

              {selectedDay.classes && selectedDay.classes.length > 0 ? (
                <div className="space-y-2">
                  {selectedDay.classes.map((cls) => (
                    <div
                      key={cls.id}
                      className={`p-3 rounded-lg border transition-all ${classTypeBgColors[cls.type]}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{cls.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {cls.time} • {cls.instructor}
                          </p>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                            cls.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : cls.confirmed
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {cls.status === "completed"
                            ? "Done"
                            : cls.confirmed
                            ? "Confirmed"
                            : "Pending"}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-2">
                        {cls.status === "upcoming" && !cls.confirmed && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleConfirmClass(cls.id, selectedDay.day);
                            }}
                            disabled={confirmingId === cls.id}
                            className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
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
                        )}
                        {cls.status === "upcoming" && cls.confirmed && (
                          <div className="flex-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Attendance Confirmed
                          </div>
                        )}
                        <Link
                          href={`/dashboard/classes?date=${currentMonth.year}-12-${selectedDay.day}&class=${cls.id}`}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">No classes scheduled</p>
                  <Link
                    href="/dashboard/classes"
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Book a class
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <p className="text-sm text-gray-400">Select a day to see classes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
