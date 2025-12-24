"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui";
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, ChevronIcon } from "@/components/icons";
import { CalendarEvent, CalendarDay, eventColorClasses } from "./types";

interface CalendarViewProps {
  events: CalendarEvent[];
  onCreateClass?: () => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
}

const WEEKDAYS = ["Mon", "Tues", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthDays(year: number, month: number, events: CalendarEvent[]): CalendarDay[] {
  const days: CalendarDay[] = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
  let startDay = firstDayOfMonth.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1; // Convert to Monday = 0

  // Add days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(date, events),
    });
  }

  // Add days of current month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(year, month, day);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: dateOnly.getTime() === today.getTime(),
      events: getEventsForDate(date, events),
    });
  }

  // Add days from next month to complete the grid (6 rows)
  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      events: getEventsForDate(date, events),
    });
  }

  return days;
}

function getEventsForDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
  return events.filter((event) => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear()
    );
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDateRange(year: number, month: number): string {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${firstDay.toLocaleDateString("en-US", options)} – ${lastDay.toLocaleDateString("en-US", options)}`;
}

export default function CalendarView({
  events,
  onCreateClass,
  onEventClick,
  onDateClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => getMonthDays(year, month, events), [year, month, events]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const today = new Date();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        {/* Left: Date badge and title */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center w-14 h-14 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-xs font-medium text-gray-600 uppercase">
              {today.toLocaleDateString("en-US", { month: "short" })}
            </span>
            <span className="text-xl font-bold text-gray-900">{today.getDate()}</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{formatMonthYear(currentDate)}</h2>
            <p className="text-sm text-gray-600">{formatDateRange(year, month)}</p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Today button */}
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>

          {/* View mode dropdown */}
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            {viewMode === "month" ? "Month view" : "Week view"}
            <ChevronIcon className="w-4 h-4" direction="down" />
          </button>

          {/* Create class button */}
          {onCreateClass && (
            <Button size="sm" leftIcon={<PlusIcon className="w-4 h-4" />} onClick={onCreateClass}>
              Create class
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {/* Weekday headers */}
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-3 py-3 text-sm font-medium text-gray-600 border-b border-gray-200 bg-gray-50"
          >
            {day}
          </div>
        ))}

        {/* Days */}
        {days.map((day, index) => (
          <div
            key={index}
            className={`min-h-[120px] p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
              !day.isCurrentMonth ? "bg-gray-50/50" : ""
            } ${index % 7 === 6 ? "border-r-0" : ""}`}
            onClick={() => onDateClick?.(day.date)}
          >
            {/* Day number */}
            <div className="flex items-start justify-between mb-1">
              <span
                className={`inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full ${
                  day.isToday
                    ? "bg-primary-600 text-white"
                    : day.isCurrentMonth
                    ? "text-gray-900"
                    : "text-gray-400"
                }`}
              >
                {day.date.getDate()}
              </span>
            </div>

            {/* Events */}
            <div className="space-y-1">
              {day.events.slice(0, 3).map((event) => {
                const colors = eventColorClasses[event.color];
                return (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-medium truncate ${colors.bg} ${colors.text} hover:opacity-80 transition-opacity`}
                  >
                    {event.title.length > 12 ? `${event.title.slice(0, 12)}...` : event.title}{" "}
                    <span className="font-normal">{event.startTime}</span>
                  </button>
                );
              })}
              {day.events.length > 3 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDateClick?.(day.date);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900 font-medium"
                >
                  {day.events.length - 3} more...
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
