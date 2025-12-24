"use client";

import { MoreIcon } from "@/components/icons";

interface DayEvent {
  color: string;
}

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  events?: DayEvent[];
}

const eventColors = {
  pink: "bg-pink-400",
  purple: "bg-primary-500",
  blue: "bg-blue-500",
  green: "bg-success-500",
  orange: "bg-orange-400",
  yellow: "bg-yellow-400",
};

// Mock calendar data for November 2024
const calendarDays: CalendarDay[] = [
  { day: 30, isCurrentMonth: false },
  { day: 31, isCurrentMonth: false },
  { day: 1, isCurrentMonth: true },
  { day: 2, isCurrentMonth: true, events: [{ color: "pink" }, { color: "purple" }, { color: "purple" }] },
  { day: 3, isCurrentMonth: true },
  { day: 5, isCurrentMonth: true },
  { day: 4, isCurrentMonth: true, events: [{ color: "orange" }] },
  { day: 6, isCurrentMonth: true, events: [{ color: "purple" }] },
  { day: 7, isCurrentMonth: true, events: [{ color: "pink" }, { color: "pink" }] },
  { day: 8, isCurrentMonth: true, events: [{ color: "pink" }, { color: "purple" }, { color: "blue" }] },
  { day: 9, isCurrentMonth: true },
  { day: 10, isCurrentMonth: true, isToday: true, events: [{ color: "purple" }, { color: "pink" }, { color: "purple" }] },
  { day: 11, isCurrentMonth: true, events: [{ color: "orange" }] },
  { day: 12, isCurrentMonth: true, events: [{ color: "blue" }] },
  { day: 13, isCurrentMonth: true, events: [{ color: "purple" }, { color: "pink" }] },
  { day: 14, isCurrentMonth: true },
  { day: 15, isCurrentMonth: true },
  { day: 16, isCurrentMonth: true, events: [{ color: "pink" }] },
  { day: 17, isCurrentMonth: true, events: [{ color: "pink" }, { color: "purple" }, { color: "pink" }] },
  { day: 18, isCurrentMonth: true, events: [{ color: "green" }] },
  { day: 19, isCurrentMonth: true },
  { day: 20, isCurrentMonth: true, events: [{ color: "purple" }, { color: "pink" }] },
  { day: 21, isCurrentMonth: true, events: [{ color: "orange" }, { color: "pink" }, { color: "pink" }] },
  { day: 22, isCurrentMonth: true, events: [{ color: "purple" }, { color: "blue" }] },
  { day: 23, isCurrentMonth: true, events: [{ color: "pink" }] },
  { day: 24, isCurrentMonth: true, events: [{ color: "green" }, { color: "yellow" }, { color: "yellow" }] },
  { day: 25, isCurrentMonth: true, events: [{ color: "green" }, { color: "yellow" }, { color: "yellow" }] },
  { day: 26, isCurrentMonth: true },
  { day: 27, isCurrentMonth: true, events: [{ color: "purple" }] },
  { day: 28, isCurrentMonth: true, events: [{ color: "blue" }, { color: "pink" }] },
  { day: 29, isCurrentMonth: true, events: [{ color: "blue" }] },
  { day: 30, isCurrentMonth: true, events: [{ color: "pink" }, { color: "pink" }] },
  { day: 31, isCurrentMonth: true, events: [{ color: "purple" }] },
  { day: 1, isCurrentMonth: false },
  { day: 2, isCurrentMonth: false, events: [{ color: "orange" }] },
];

const weekDays = ["Mon", "T", "W", "T", "F", "S", "S"];

export default function CalendarCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-5 h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">This Month&apos;s Progress</h2>
          <p className="text-sm text-gray-600">Your path to [12] classes this month</p>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <MoreIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div key={index} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`relative h-12 flex flex-col items-center justify-start pt-1 rounded-lg ${
              day.isToday ? "bg-primary-600" : ""
            }`}
          >
            <span
              className={`text-sm font-medium ${
                day.isToday
                  ? "text-white"
                  : day.isCurrentMonth
                  ? "text-gray-900"
                  : "text-gray-400"
              }`}
            >
              {day.day}
            </span>
            {day.events && day.events.length > 0 && (
              <div className="flex gap-0.5 mt-1">
                {day.events.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={eventIndex}
                    className={`w-1.5 h-1.5 rounded-full ${
                      eventColors[event.color as keyof typeof eventColors]
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
