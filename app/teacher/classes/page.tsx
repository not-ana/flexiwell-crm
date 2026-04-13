"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronIcon,
  CalendarIcon,
  UserIcon,
  CloseIcon,
  PlusIcon,
} from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { authFetch } from "@/lib/api/auth-fetch";

// Types
type ViewMode = "day" | "week" | "month";
type ClassStatus = "scheduled" | "in-progress" | "completed" | "cancelled";

interface Student {
  id: string;
  name: string;
  initials: string;
  attended?: boolean;
  daysSinceLastClass?: number;
  currentStreak?: number;
  lifecycleStage?: string;
}

interface ClassEvent {
  id: string;
  title: string;
  type: string;
  start: Date;
  end: Date;
  color: string;
  status: ClassStatus;
  room: string;
  unit: string;
  capacity: number;
  enrolled: number;
  students: Student[];
}

const colorStyles: Record<string, { bg: string; border: string; text: string }> = {
  purple: { bg: "bg-purple-50", border: "border-l-purple-500", text: "text-purple-700" },
  green: { bg: "bg-green-50", border: "border-l-green-500", text: "text-green-700" },
  blue: { bg: "bg-blue-50", border: "border-l-blue-500", text: "text-blue-700" },
  orange: { bg: "bg-orange-50", border: "border-l-orange-500", text: "text-orange-700" },
  pink: { bg: "bg-pink-50", border: "border-l-pink-500", text: "text-pink-700" },
  gray: { bg: "bg-gray-50", border: "border-l-gray-500", text: "text-gray-700" },
};

const defaultColorStyle = colorStyles.gray;

const statusStyles: Record<ClassStatus, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "bg-blue-100", text: "text-blue-700", label: "Scheduled" },
  "in-progress": { bg: "bg-green-100", text: "text-green-700", label: "In Progress" },
  completed: { bg: "bg-gray-100", text: "text-gray-700", label: "Completed" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
};

// Helper functions
function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getMonthDates(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates: Date[] = [];
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    dates.push(new Date(year, month, -i));
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }
  const endPadding = 42 - dates.length;
  for (let i = 1; i <= endPadding; i++) {
    dates.push(new Date(year, month + 1, i));
  }
  return dates;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function isCurrentMonth(date: Date, referenceDate: Date): boolean {
  return date.getMonth() === referenceDate.getMonth() && date.getFullYear() === referenceDate.getFullYear();
}

// Current Time Line Component
function CurrentTimeLine({ startHour = 7, hourHeight = 48 }: { startHour?: number; hourHeight?: number }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = now.getHours() + now.getMinutes() / 60;
  if (currentHour < startHour || currentHour > startHour + 12) return null;

  const top = (currentHour - startHour) * hourHeight;

  return (
    <div className="absolute left-16 right-0 z-20 pointer-events-none" style={{ top: `${top}px` }}>
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    </div>
  );
}

// Date Picker Component
function DatePicker({ selectedDate, onSelect, onClose }: { selectedDate: Date; onSelect: (date: Date) => void; onClose: () => void }) {
  const [viewDate, setViewDate] = useState(selectedDate);
  const dates = getMonthDates(viewDate);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div ref={pickerRef} className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 rounded">
          <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
        </button>
        <span className="font-medium text-gray-900">{viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 rounded">
          <ArrowRightIcon className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {dates.map((date, idx) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          const inMonth = isCurrentMonth(date, viewDate);
          return (
            <button
              key={idx}
              onClick={() => { onSelect(date); onClose(); }}
              className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                isSelected ? "bg-primary-600 text-white" : isToday ? "bg-primary-100 text-primary-700" : inMonth ? "hover:bg-gray-100 text-gray-900" : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
        <button onClick={() => { onSelect(new Date()); onClose(); }} className="text-sm text-primary-600 hover:text-primary-700 font-medium">Today</button>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
      </div>
    </div>
  );
}

// Week View Component
function WeekView({ events, selectedDate, onEventClick, selectedEventId, onDayClick }: { events: ClassEvent[]; selectedDate: Date; onEventClick: (event: ClassEvent) => void; selectedEventId?: string; onDayClick: (date: Date) => void }) {
  const weekDates = getWeekDates(selectedDate);
  const hours = Array.from({ length: 12 }, (_, i) => i + 7);

  const getEventStyle = (event: ClassEvent) => {
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    return { top: `${(startHour - 7) * 60}px`, height: `${Math.max((endHour - startHour) * 60, 30)}px` };
  };

  const getEventStyleMobile = (event: ClassEvent) => {
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    return { top: `${(startHour - 7) * 60}px`, height: `${Math.max((endHour - startHour) * 60, 40)}px` };
  };

  // For mobile, show selected day's events
  const selectedDayEvents = events.filter((e) => isSameDay(e.start, selectedDate));

  return (
    <div>
      {/* Desktop Week View */}
      <div className="hidden sm:block">
        <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="w-16 flex-shrink-0" />
          {weekDates.map((date, idx) => {
            const isToday = isSameDay(date, new Date());
            return (
              <button key={idx} onClick={() => onDayClick(date)} className="flex-1 py-3 text-center border-l border-gray-200 hover:bg-gray-50">
                <div className={`text-xs font-medium ${isToday ? "text-primary-600" : "text-gray-500"}`}>
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className={`text-lg font-semibold mt-1 ${isToday ? "w-8 h-8 mx-auto rounded-full bg-primary-600 text-white flex items-center justify-center" : "text-gray-900"}`}>
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <CurrentTimeLine startHour={7} hourHeight={48} />
          {hours.map((hour) => (
            <div key={hour} className="flex h-12 border-b border-gray-100">
              <div className="w-16 pr-2 text-right text-xs text-gray-500 -mt-2 flex-shrink-0">
                {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
              {weekDates.map((_, idx) => <div key={idx} className="flex-1 border-l border-gray-200" />)}
            </div>
          ))}
          <div className="absolute top-0 left-16 right-0 flex">
            {weekDates.map((date, dayIdx) => (
              <div key={dayIdx} className="flex-1 relative border-l border-gray-200">
                {events.filter((e) => isSameDay(e.start, date)).map((event) => {
                  const startHour = event.start.getHours() + event.start.getMinutes() / 60;
                  const endHour = event.end.getHours() + event.end.getMinutes() / 60;
                  const style = { top: `${(startHour - 7) * 48}px`, height: `${Math.max((endHour - startHour) * 48, 24)}px` };
                  const colors = colorStyles[event.color] || defaultColorStyle;
                  const fillPct = event.capacity > 0 ? (event.enrolled / event.capacity) : 1;
                  const isLowFill = fillPct < 0.5 && event.status === "scheduled";
                  const isFull = event.enrolled >= event.capacity && event.status === "scheduled";
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`absolute left-1 right-1 px-2 py-1 rounded border-l-2 ${colors.bg} ${colors.border} ${colors.text} text-left text-xs hover:shadow-sm transition-shadow ${event.id === selectedEventId ? "ring-2 ring-primary-500 shadow-md" : ""} ${isLowFill ? "ring-1 ring-red-300" : ""}`}
                      style={style}
                    >
                      <div className="font-medium truncate flex items-center gap-1">
                        {isFull && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0" title="Full — clients waiting" />}
                        {isLowFill && <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />}
                        {event.title}
                      </div>
                      <div className="opacity-75 truncate">{formatTime(event.start)} · {event.enrolled}/{event.capacity}</div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Week View - Horizontal week days + vertical timeline */}
      <div className="sm:hidden">
        {/* Week days header - horizontal scroll */}
        <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10 mb-2">
          {weekDates.map((date, idx) => {
            const isToday = isSameDay(date, new Date());
            const isSelected = isSameDay(date, selectedDate);
            return (
              <button
                key={idx}
                onClick={() => onDayClick(date)}
                className="flex-1 py-2 text-center"
              >
                <div className={`text-[10px] font-medium ${isToday ? "text-primary-600" : "text-gray-500"}`}>
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-semibold mt-1 ${
                  isSelected
                    ? "bg-primary-600 text-white"
                    : isToday
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-900"
                }`}>
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Timeline for selected day */}
        <div className="relative">
          <CurrentTimeLine startHour={7} hourHeight={60} />
          {hours.map((hour) => (
            <div key={hour} className="flex h-[60px] border-b border-gray-100">
              <div className="w-14 pr-2 text-right text-xs text-gray-400 -mt-2 flex-shrink-0">
                {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
              <div className="flex-1 border-l border-gray-200" />
            </div>
          ))}
          {/* Events for selected day */}
          <div className="absolute top-0 left-14 right-0">
            {selectedDayEvents.map((event) => {
              const style = getEventStyleMobile(event);
              const colors = colorStyles[event.color] || defaultColorStyle;
              const fillPct = event.capacity > 0 ? Math.round((event.enrolled / event.capacity) * 100) : 100;
              const isLowFill = fillPct < 50 && event.status === "scheduled";
              const isFull = event.enrolled >= event.capacity && event.status === "scheduled";
              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`absolute left-2 right-2 px-3 py-2 rounded-lg border-l-4 ${colors.bg} ${colors.border} ${colors.text} text-left hover:shadow-md transition-shadow ${event.id === selectedEventId ? "ring-2 ring-primary-500 shadow-md" : ""} ${isLowFill ? "ring-1 ring-red-300" : ""}`}
                  style={style}
                >
                  <div className="font-medium text-sm flex items-center gap-1">
                    {isFull && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0" />}
                    {isLowFill && <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />}
                    {event.title}
                  </div>
                  <div className="text-xs opacity-75">{formatTime(event.start)} · {event.enrolled}/{event.capacity}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Day View Component (dedicated single-day view for teacher)
function DayView({ events, selectedDate, onEventClick, selectedEventId }: { events: ClassEvent[]; selectedDate: Date; onEventClick: (event: ClassEvent) => void; selectedEventId?: string }) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 7);
  const dayEvents = events.filter((e) => isSameDay(e.start, selectedDate));

  const getEventStyle = (event: ClassEvent) => {
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    return { top: `${(startHour - 7) * 64}px`, height: `${Math.max((endHour - startHour) * 64, 32)}px` };
  };

  return (
    <div>
      <div className="pb-3 mb-2 border-b border-gray-200">
        <p className="text-base font-semibold text-gray-900">
          {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <p className="text-sm text-gray-500">
          {dayEvents.length} {dayEvents.length === 1 ? "class" : "classes"} scheduled
        </p>
      </div>
      <div className="relative">
        <CurrentTimeLine startHour={7} hourHeight={64} />
        {hours.map((hour) => (
          <div key={hour} className="flex h-16 border-b border-gray-100">
            <div className="w-16 pr-3 text-right text-xs text-gray-500 -mt-2 flex-shrink-0">
              {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
            <div className="flex-1 border-l border-gray-200" />
          </div>
        ))}
        <div className="absolute left-16 right-0 top-0">
          {dayEvents.map((event) => {
            const style = getEventStyle(event);
            const colors = colorStyles[event.color] || defaultColorStyle;
            const statusStyle = statusStyles[event.status];
            const isSelected = event.id === selectedEventId;
            const fillPct = event.capacity > 0 ? Math.round((event.enrolled / event.capacity) * 100) : 100;
            const isLowFill = fillPct < 50 && event.status === "scheduled";
            const isFull = event.enrolled >= event.capacity && event.status === "scheduled";
            const fillBarColor = fillPct >= 80 ? "bg-green-500" : fillPct >= 50 ? "bg-yellow-500" : "bg-red-500";
            return (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className={`absolute left-2 right-2 p-3 rounded-lg border-l-4 ${colors.bg} ${colors.border} ${colors.text} text-left transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary-500 shadow-md" : ""} ${isLowFill ? "ring-1 ring-red-300" : ""}`}
                style={style}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm truncate flex items-center gap-1.5">
                    {isFull && <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0" title="Full — clients waiting" />}
                    {isLowFill && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0 animate-pulse" />}
                    {event.title}
                  </div>
                  <Badge style={statusStyle} />
                </div>
                <div className="text-xs opacity-75 mt-0.5">{formatTime(event.start)} - {formatTime(event.end)}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs opacity-75">{event.enrolled}/{event.capacity} students • {event.room}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${fillBarColor}`} style={{ width: `${fillPct}%` }} />
                    </div>
                    <span className={`text-xs font-medium ${fillPct >= 80 ? "text-green-700" : fillPct >= 50 ? "text-yellow-700" : "text-red-700"}`}>{fillPct}%</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Month View Component
// Color mapping for dots
const dotColors: Record<ClassEvent["color"], string> = {
  purple: "bg-purple-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
};

function MonthView({ events, selectedDate, onEventClick, selectedEventId, onDayClick }: { events: ClassEvent[]; selectedDate: Date; onEventClick: (event: ClassEvent) => void; selectedEventId?: string; onDayClick: (date: Date) => void }) {
  const dates = getMonthDates(selectedDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDaysMobile = ["S", "M", "T", "W", "T", "F", "S"];
  const selectedDayEvents = events.filter((e) => isSameDay(e.start, selectedDate));

  return (
    <div>
      {/* Desktop Month View */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {weekDays.map((day) => (
            <div key={day} className="py-3 text-center text-sm font-medium text-gray-500 border-l border-gray-200 first:border-l-0">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dates.map((date, idx) => {
            const isToday = isSameDay(date, new Date());
            const inMonth = isCurrentMonth(date, selectedDate);
            const dayEvents = events.filter((e) => isSameDay(e.start, date));
            return (
              <button key={idx} onClick={() => onDayClick(date)} className={`min-h-[100px] p-2 border-l border-b border-gray-200 first:border-l-0 text-left ${inMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50"}`}>
                <div className={`text-sm font-medium mb-1 ${isToday ? "w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center" : inMonth ? "text-gray-900" : "text-gray-400"}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => {
                    const colors = colorStyles[event.color] || defaultColorStyle;
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer ${colors.bg} ${colors.text} ${event.id === selectedEventId ? "ring-1 ring-primary-500" : ""}`}
                      >
                        {event.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && <div className="text-xs text-gray-500 px-1">+{dayEvents.length - 3} more</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Month View - Compact with dots */}
      <div className="sm:hidden">
        {/* Mini calendar grid */}
        <div className="grid grid-cols-7 mb-4">
          {weekDaysMobile.map((day, i) => (
            <div key={i} className="py-2 text-center text-xs font-medium text-gray-500">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {dates.map((date, idx) => {
            const isToday = isSameDay(date, new Date());
            const isSelected = isSameDay(date, selectedDate);
            const inMonth = isCurrentMonth(date, selectedDate);
            const dayEvents = events.filter((e) => isSameDay(e.start, date));
            return (
              <button
                key={idx}
                onClick={() => onDayClick(date)}
                className="flex flex-col items-center py-2"
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${
                  isSelected
                    ? "bg-primary-600 text-white"
                    : isToday
                    ? "bg-primary-100 text-primary-700"
                    : inMonth
                    ? "text-gray-900"
                    : "text-gray-400"
                }`}>
                  {date.getDate()}
                </div>
                {/* Dots for events */}
                <div className="flex gap-0.5 h-2">
                  {dayEvents.slice(0, 4).map((event, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${dotColors[event.color]}`} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected day events list */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {selectedDayEvents.length > 0 ? (
            <div className="space-y-2">
              {selectedDayEvents.map((event) => {
                const colors = colorStyles[event.color] || defaultColorStyle;
                const fillPct = event.capacity > 0 ? Math.round((event.enrolled / event.capacity) * 100) : 100;
                const isLowFill = fillPct < 50 && event.status === "scheduled";
                const isFull = event.enrolled >= event.capacity && event.status === "scheduled";
                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`w-full p-3 rounded-lg border-l-4 text-left ${colors.bg} ${colors.border} ${event.id === selectedEventId ? "ring-2 ring-primary-500" : ""} ${isLowFill ? "ring-1 ring-red-300" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${colors.text} flex items-center gap-1`}>
                        {isFull && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full shrink-0" />}
                        {isLowFill && <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />}
                        {event.title}
                      </p>
                      <span className="text-sm text-gray-500">{formatTime(event.start)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{event.enrolled}/{event.capacity} spots</span>
                      <span className={`text-xs font-medium ${fillPct >= 80 ? "text-green-600" : fillPct >= 50 ? "text-yellow-600" : "text-red-600"}`}>{fillPct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No classes scheduled</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Create Class Modal
function CreateClassModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "Pilates",
    date: "",
    time: "",
    duration: "50",
    establishmentId: "",
    unit: "",
    capacity: "8",
    recurrence: "none" as "none" | "daily" | "weekly" | "biweekly" | "monthly",
    recurrenceEndDate: "",
    recurrenceDays: [] as string[],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCount, setPreviewCount] = useState(0);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdClass, setCreatedClass] = useState<typeof formData & { classesCreated?: number } | null>(null);
  if (!isOpen) return null;

  // Calculate how many classes will be created
  const calculateDates = () => {
    if (formData.recurrence === "none") return [formData.date].filter(Boolean);
    if (!formData.date || !formData.recurrenceEndDate) return [];

    const dates: string[] = [];
    const startDate = new Date(formData.date);
    const endDate = new Date(formData.recurrenceEndDate);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (formData.recurrence === "daily") {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (formData.recurrence === "weekly") {
        const dayOfWeek = currentDate.getDay().toString();
        if (formData.recurrenceDays.includes(dayOfWeek)) {
          dates.push(currentDate.toISOString().split("T")[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (formData.recurrence === "biweekly") {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (formData.recurrence === "monthly") {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    return dates;
  };

  const handleSubmit = async () => {
    setFormError(null);

    if (!formData.name || !formData.date || !formData.time) {
      return;
    }

    // Validate recurrence fields
    if (formData.recurrence !== "none" && !formData.recurrenceEndDate) {
      setFormError("Please select an end date for the recurring classes.");
      return;
    }
    if (formData.recurrence === "weekly" && formData.recurrenceDays.length === 0) {
      setFormError("Please select at least one day for weekly recurrence.");
      return;
    }

    const dates = calculateDates();

    // Show preview for batch creation
    if (dates.length > 1 && !showPreview) {
      setPreviewCount(dates.length);
      setShowPreview(true);
      return;
    }

    setIsCreating(true);
    setShowPreview(false);
    try {
      // Calculate end time based on duration
      const [hours, minutes] = formData.time.split(":").map(Number);
      const durationMinutes = parseInt(formData.duration);
      const endHours = Math.floor((hours * 60 + minutes + durationMinutes) / 60);
      const endMinutes = (hours * 60 + minutes + durationMinutes) % 60;
      const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

      // Create classes for each date
      let successCount = 0;
      for (const date of dates) {
        const response = await authFetch("/api/teacher/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.name,
            description: formData.description || undefined,
            type: formData.type.toLowerCase(),
            scheduledDate: date,
            startTime: formData.time,
            endTime: endTime,
            maxCapacity: parseInt(formData.capacity),
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          const errData = await response.json().catch(() => null);
          console.error("Create class failed:", response.status, errData);
          if (errData?.error) {
            setFormError(errData.error);
            break;
          }
        }
      }

      if (successCount > 0) {
        setCreatedClass({ ...formData, classesCreated: successCount });
        setShowSuccess(true);
      } else if (!formError) {
        setFormError("Failed to create class. Please check your data and try again.");
      }
    } catch (error) {
      console.error("Error creating class:", error);
      setFormError("Connection error. Please check your internet and try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setCreatedClass(null);
    setFormData({
      name: "",
      description: "",
      type: "Pilates",
      date: "",
      time: "",
      duration: "50",
      establishmentId: "",
      unit: "",
      capacity: "8",
      recurrence: "none",
      recurrenceEndDate: "",
      recurrenceDays: [],
    });
    onClose();
  };

  // Helper to get recurrence label
  const getRecurrenceLabel = (recurrence: string) => {
    const labels: Record<string, string> = {
      none: "One-time",
      daily: "Daily",
      weekly: "Weekly",
      biweekly: "Every 2 weeks",
      monthly: "Monthly",
    };
    return labels[recurrence] || recurrence;
  };

  // Success state
  if (showSuccess && createdClass) {
    const classCount = createdClass.classesCreated || 1;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {classCount > 1 ? `${classCount} Classes Created!` : "Class Created Successfully!"}
            </h2>
            <p className="text-gray-600 mb-6">
              {classCount > 1
                ? `Your recurring classes have been scheduled.`
                : "Your new class has been scheduled."}
            </p>

            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">{createdClass.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {createdClass.recurrence !== "none"
                      ? `${createdClass.date} to ${createdClass.recurrenceEndDate}`
                      : createdClass.date}
                  </span>
                </div>
                {createdClass.recurrence !== "none" && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{getRecurrenceLabel(createdClass.recurrence)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{createdClass.time} ({createdClass.duration} min)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{createdClass.unit}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{createdClass.capacity} students capacity</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Class</h2>
              <p className="text-sm text-gray-600 mt-1">Schedule a new class for your students</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Essential fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Intermediate Pilates"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Defaults summary line */}
          {!showMoreOptions && (
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm text-gray-500">
              <span>{formData.type} · {formData.duration}min · {formData.capacity} spots</span>
              <button
                type="button"
                onClick={() => setShowMoreOptions(true)}
                className="text-primary-600 hover:text-primary-700 font-medium shrink-0 ml-3"
              >
                Edit
              </button>
            </div>
          )}

          {/* More options (collapsed by default) */}
          {showMoreOptions && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">More options</span>
                <button
                  type="button"
                  onClick={() => setShowMoreOptions(false)}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Collapse
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description visible to clients (optional)"
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="Pilates">Pilates</option>
                    <option value="Yoga">Yoga</option>
                    <option value="Functional">Functional Training</option>
                    <option value="Stretching">Stretching</option>
                    <option value="Meditation">Meditation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="50">50 min</option>
                    <option value="60">60 min</option>
                    <option value="75">75 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
                <select
                  value={formData.recurrence}
                  onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as typeof formData.recurrence })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {formData.recurrence !== "none" && (
                <>
                  {formData.recurrence === "weekly" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Repeat on</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "0", label: "Sun" },
                          { value: "1", label: "Mon" },
                          { value: "2", label: "Tue" },
                          { value: "3", label: "Wed" },
                          { value: "4", label: "Thu" },
                          { value: "5", label: "Fri" },
                          { value: "6", label: "Sat" },
                        ].map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => {
                              const days = formData.recurrenceDays.includes(day.value)
                                ? formData.recurrenceDays.filter((d) => d !== day.value)
                                : [...formData.recurrenceDays, day.value];
                              setFormData({ ...formData, recurrenceDays: days });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              formData.recurrenceDays.includes(day.value)
                                ? "bg-primary-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.recurrenceEndDate}
                      onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                      min={formData.date}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Inline Error */}
        {formError && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-600">{formError}</p>
            <button onClick={() => setFormError(null)} className="text-red-400 hover:text-red-600 p-1 shrink-0">
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Batch Preview Confirmation */}
        {showPreview && (
          <div className="mx-6 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800 mb-2">
              This will create {previewCount} classes
            </p>
            <p className="text-xs text-amber-700 mb-3">
              From {formData.date} to {formData.recurrenceEndDate}, {getRecurrenceLabel(formData.recurrence).toLowerCase()}.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Confirm & Create
              </button>
            </div>
          </div>
        )}

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating || !formData.name || !formData.date || !formData.time}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </>
            ) : (
              "Create Class"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Start Class Modal
function StartClassModal({ isOpen, onClose, event, onConfirm }: { isOpen: boolean; onClose: () => void; event: ClassEvent | null; onConfirm: () => void }) {
  const [isStarting, setIsStarting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleStart = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const response = await authFetch("/api/teacher/classes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: event.id,
          status: "in-progress",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start class");
      }

      setShowSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setError(null);
    onClose();
    if (showSuccess) onConfirm();
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Class Started!</h2>
            <p className="text-gray-600 mb-6">Your class is now in progress.</p>
            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
              <p className="text-sm text-gray-600">{event.enrolled} students enrolled</p>
              <p className="text-sm text-gray-600">{event.room} • {event.unit}</p>
            </div>
            <button onClick={handleClose} className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Start Class</h2>
                <p className="text-sm text-gray-600">Begin the session</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">{event.title}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.unit} - {event.room}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.enrolled}/{event.capacity} students enrolled</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Starting this class will mark it as "In Progress" and allow you to take attendance.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isStarting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Starting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start Class
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Take Attendance Modal
function TakeAttendanceModal({ isOpen, onClose, event, onSave }: { isOpen: boolean; onClose: () => void; event: ClassEvent | null; onSave: (attendance: Record<string, boolean>) => void }) {
  const [attendance, setAttendance] = useState<Record<string, boolean | null>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize attendance from event students when modal opens
  useEffect(() => {
    if (isOpen && event?.students) {
      const initial: Record<string, boolean | null> = {};
      event.students.forEach(s => {
        initial[s.id] = s.attended ?? null;
      });
      setAttendance(initial);
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => {
      const current = prev[studentId];
      // Simple toggle: null/false -> true, true -> false
      return { ...prev, [studentId]: current === true ? false : true };
    });
  };

  const markAllPresent = () => {
    const all: Record<string, boolean> = {};
    event.students.forEach(s => { all[s.id] = true; });
    setAttendance(all);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // First, get bookings for this class to get booking IDs
      const attendanceResponse = await authFetch(`/api/teacher/attendance?classId=${event.id}`);
      if (!attendanceResponse.ok) {
        throw new Error("Failed to fetch attendance data");
      }
      const attendanceData = await attendanceResponse.json();

      // Build attendance data with booking IDs
      const attendanceRecords = attendanceData.attendance.map((record: { bookingId: string; clientId: string }) => ({
        bookingId: record.bookingId,
        status: attendance[record.clientId] === true ? "present" : "absent",
      }));

      // Save attendance
      const response = await authFetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: event.id,
          attendanceData: attendanceRecords,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save attendance");
      }

      setShowSuccess(true);
      // Call onSave to notify parent
      const finalAttendance: Record<string, boolean> = {};
      Object.entries(attendance).forEach(([k, v]) => {
        if (v !== null) finalAttendance[k] = v;
      });
      onSave(finalAttendance);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setError(null);
    onClose();
  };

  const presentCount = Object.values(attendance).filter(v => v === true).length;
  const absentCount = Object.values(attendance).filter(v => v === false).length;
  const unmarkedCount = event.students.length - presentCount - absentCount;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Attendance Saved!</h2>
            <p className="text-gray-600 mb-6">The attendance has been recorded successfully.</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                  <p className="text-sm text-gray-600">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                  <p className="text-sm text-gray-600">Absent</p>
                </div>
              </div>
            </div>
            <button onClick={handleClose} className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Take Attendance</h2>
                <p className="text-sm text-gray-600">{event.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">{presentCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">{absentCount}</span>
              </div>
              {unmarkedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-sm text-gray-400">{unmarkedCount} unmarked</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={markAllPresent} className="text-sm text-green-600 hover:text-green-700 font-medium">
                All present
              </button>
              <button onClick={() => {
                const all: Record<string, boolean> = {};
                event.students.forEach(s => { all[s.id] = false; });
                setAttendance(all);
              }} className="text-sm text-red-600 hover:text-red-700 font-medium">
                All absent
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {event.students.map((student) => {
              const status = attendance[student.id];
              return (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                    status === true ? "bg-green-50" :
                    status === false ? "bg-red-50" :
                    "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        status === true ? "bg-green-200" :
                        status === false ? "bg-red-200" :
                        "bg-gray-200"
                      }`}>
                        <span className={`text-sm font-semibold ${
                          status === true ? "text-green-700" :
                          status === false ? "text-red-700" :
                          "text-gray-700"
                        }`}>{student.initials}</span>
                      </div>
                      {student.daysSinceLastClass != null && student.daysSinceLastClass > 7 && (
                        <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${student.daysSinceLastClass > 14 ? "bg-red-500" : "bg-orange-500"}`} />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{student.name}</span>
                      {student.daysSinceLastClass != null && student.daysSinceLastClass > 7 && (
                        <p className={`text-xs ${student.daysSinceLastClass > 14 ? "text-red-600" : "text-orange-600"}`}>
                          Haven&apos;t been in {student.daysSinceLastClass} days
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAttendance(prev => ({ ...prev, [student.id]: true }))}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        status === true
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600"
                      }`}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setAttendance(prev => ({ ...prev, [student.id]: false }))}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        status === false
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600"
                      }`}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {event.students.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No students enrolled in this class</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-4 mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              "Save Attendance"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Complete Class Modal
function CompleteClassModal({ isOpen, onClose, event, onConfirm }: { isOpen: boolean; onClose: () => void; event: ClassEvent | null; onConfirm: () => void }) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleComplete = async () => {
    setIsCompleting(true);
    setError(null);
    try {
      const response = await authFetch("/api/teacher/classes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: event.id,
          status: "completed",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to complete class");
      }

      setShowSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    setError(null);
    onClose();
    if (showSuccess) onConfirm();
  };

  if (showSuccess) {
    const presentCount = event.students.filter(s => s.attended === true).length;
    const absentStudents = event.students.filter(s => s.attended === false);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Class Completed!</h2>
            <p className="text-gray-600 mb-6">{event.title} has been marked as completed.</p>
            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                  <p className="text-sm text-gray-600">Present</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{event.enrolled}</p>
                  <p className="text-sm text-gray-600">Enrolled</p>
                </div>
              </div>
            </div>

            {/* No-show follow-up section */}
            {absentStudents.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm font-semibold text-amber-800">{absentStudents.length} student{absentStudents.length !== 1 ? "s" : ""} missed this class</p>
                </div>
                <div className="space-y-2 mb-3">
                  {absentStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-amber-700">{student.initials}</span>
                        </div>
                        <span className="text-sm text-gray-700">{student.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          const toast = document.createElement("div");
                          toast.className = "fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 bg-green-600";
                          toast.textContent = `Follow-up sent to ${student.name}`;
                          document.body.appendChild(toast);
                          setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 2500);
                        }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Send message
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const toast = document.createElement("div");
                    toast.className = "fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 bg-green-600";
                    toast.textContent = `Follow-up sent to ${absentStudents.length} student${absentStudents.length !== 1 ? "s" : ""}`;
                    document.body.appendChild(toast);
                    setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 2500);
                  }}
                  className="w-full px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Message all no-shows
                </button>
                <p className="text-[10px] text-amber-600 mt-2 text-center">Quick follow-ups reduce churn by up to 30%</p>
              </div>
            )}

            <button onClick={handleClose} className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Complete Class</h2>
                <p className="text-sm text-gray-600">End the session</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">{event.title}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.enrolled}/{event.capacity} students enrolled</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            This will mark the class as completed. Make sure you have taken attendance before completing.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCompleting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Completing...
              </>
            ) : (
              "Complete Class"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Cancel Class Modal
function CancelClassModal({ isOpen, onClose, event, onConfirm }: { isOpen: boolean; onClose: () => void; event: ClassEvent | null; onConfirm: () => void }) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const handleCancel = async () => {
    if (!reason.trim()) return;
    setIsCancelling(true);
    setError(null);
    try {
      const response = await authFetch("/api/teacher/classes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: event.id,
          status: "cancelled",
          reason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel class");
      }

      setReason("");
      onClose();
      onConfirm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <CloseIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Cancel Class</h2>
                <p className="text-sm text-gray-600">{event.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-red-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-red-800">
              <strong>{event.enrolled} student{event.enrolled !== 1 ? "s" : ""}</strong> enrolled will be notified of the cancellation.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g., Instructor unavailable, emergency..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mt-4">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Keep Class
          </button>
          <button
            onClick={handleCancel}
            disabled={isCancelling || !reason.trim()}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCancelling ? "Cancelling..." : "Cancel Class"}
          </button>
        </div>
      </div>
    </div>
  );
}

// View Report Modal
function ViewReportModal({ isOpen, onClose, event }: { isOpen: boolean; onClose: () => void; event: ClassEvent | null }) {
  if (!isOpen || !event) return null;

  const totalStudents = event.students.length;
  const presentStudents = event.students.filter(s => s.attended === true).length;
  const absentStudents = event.students.filter(s => s.attended === false).length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Class Report</h2>
              <p className="text-sm text-gray-600 mt-1">{event.title}</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Class Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium text-gray-900">{formatDate(event.start)}</p>
              </div>
              <div>
                <p className="text-gray-500">Time</p>
                <p className="font-medium text-gray-900">{formatTime(event.start)} - {formatTime(event.end)}</p>
              </div>
              <div>
                <p className="text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{event.unit}</p>
              </div>
              <div>
                <p className="text-gray-500">Room</p>
                <p className="font-medium text-gray-900">{event.room}</p>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Attendance Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{presentStudents}</p>
                <p className="text-xs text-green-700">Present</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{absentStudents}</p>
                <p className="text-xs text-red-700">Absent</p>
              </div>
              <div className="bg-primary-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary-600">{attendanceRate}%</p>
                <p className="text-xs text-primary-700">Rate</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">${event.enrolled * 50}</p>
                <p className="text-xs text-emerald-700">Est. Revenue</p>
              </div>
            </div>
          </div>

          {/* Attendance Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Capacity utilization</span>
              <span className="font-medium text-gray-900">{event.enrolled}/{event.capacity}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${(event.enrolled / event.capacity) * 100}%` }}
              />
            </div>
          </div>

          {/* Student List */}
          {event.students.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Attendance Details</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {event.students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-700">{student.initials}</span>
                      </div>
                      <span className="text-sm text-gray-900">{student.name}</span>
                    </div>
                    {student.attended === true ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Present</span>
                    ) : student.attended === false ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Absent</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// View Students Modal
function ViewStudentsModal({ isOpen, onClose, event }: { isOpen: boolean; onClose: () => void; event: ClassEvent | null }) {
  if (!isOpen || !event) return null;

  const presentCount = event.students.filter(s => s.attended === true).length;
  const absentCount = event.students.filter(s => s.attended === false).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{event.enrolled}/{event.capacity} enrolled
                {event.status === "completed" && ` — ${presentCount} present, ${absentCount} absent`}
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {event.students.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {event.students.map((student) => {
                const isInactive = student.daysSinceLastClass != null && student.daysSinceLastClass > 7;
                return (
                  <div key={student.id} className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors ${
                    student.attended === false ? "bg-red-50/50" : ""
                  }`}>
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-700">{student.initials}</span>
                      </div>
                      {isInactive && (
                        <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${student.daysSinceLastClass! > 14 ? "bg-red-500" : "bg-orange-500"}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-900 truncate">{student.name}</span>
                        {student.currentStreak != null && student.currentStreak >= 2 && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-semibold rounded-full shrink-0">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c-3.6 0-7-2.4-7-7 0-3.1 2.1-5.7 4-7.8l1.5-1.6c.4-.4 1-.4 1.4 0 .2.2.3.4.3.7v4.3l2.6-3.5c.3-.4.9-.5 1.3-.2.2.1.3.3.4.5C18.3 12.6 19 15.1 19 16c0 4.6-3.4 7-7 7z"/></svg>
                            {student.currentStreak}
                          </span>
                        )}
                      </div>
                      {isInactive ? (
                        <p className={`text-[11px] ${student.daysSinceLastClass! > 14 ? "text-red-600" : "text-orange-600"}`}>
                          Last class {student.daysSinceLastClass} days ago
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400">Active student</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {student.attended === true && (
                        <span className="flex items-center gap-1 text-green-600">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                        </span>
                      )}
                      {student.attended === false && (
                        <span className="flex items-center gap-1 text-red-500">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </span>
                      )}
                      <a
                        href="/teacher/students"
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View profile"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserIcon className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-1">No students enrolled yet</p>
              <p className="text-sm text-gray-500">Students will appear here once they register for this class.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button onClick={onClose} className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Metrics Dashboard Sidebar
function MetricsDashboard({ events, onCreateClass, viewMode, selectedDate }: { events: ClassEvent[]; onCreateClass: () => void; viewMode: ViewMode; selectedDate: Date }) {
  const [inactiveStudents, setInactiveStudents] = useState<{ count: number; top: { id: string; name: string; initials: string; daysSinceLastClass?: number }[] }>({ count: 0, top: [] });

  useEffect(() => {
    async function fetchInactive() {
      try {
        const response = await authFetch("/api/teacher/students");
        if (response.ok) {
          const data = await response.json();
          const allStudents = (data.units || []).flatMap((u: { students: Student[] }) => u.students);
          const inactive = allStudents
            .filter((s: Student) => s.daysSinceLastClass != null && s.daysSinceLastClass > 7)
            .sort((a: Student, b: Student) => (b.daysSinceLastClass || 0) - (a.daysSinceLastClass || 0));
          setInactiveStudents({
            count: inactive.length,
            top: inactive.slice(0, 4).map((s: Student) => ({ id: s.id, name: s.name, initials: s.initials, daysSinceLastClass: s.daysSinceLastClass })),
          });
        }
      } catch { /* silent */ }
    }
    fetchInactive();
  }, []);

  const now = new Date();

  // Compute date range based on viewMode
  let rangeStart: Date;
  let rangeEnd: Date;
  let periodLabel: string;

  if (viewMode === "day") {
    rangeStart = new Date(selectedDate);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeStart.getDate() + 1);
    periodLabel = isSameDay(selectedDate, now) ? "Today" : selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } else if (viewMode === "month") {
    rangeStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    rangeEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    periodLabel = selectedDate.toLocaleDateString("en-US", { month: "long" });
  } else {
    rangeStart = new Date(selectedDate);
    rangeStart.setDate(selectedDate.getDate() - selectedDate.getDay());
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeStart.getDate() + 7);
    periodLabel = "This Week";
  }

  const periodEvents = events.filter(e => e.start >= rangeStart && e.start < rangeEnd && e.status !== "cancelled");
  const totalCapacity = periodEvents.reduce((sum, e) => sum + e.capacity, 0);
  const totalEnrolled = periodEvents.reduce((sum, e) => sum + e.enrolled, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  const emptySpots = totalCapacity - totalEnrolled;

  const atRiskCount = inactiveStudents.count;

  // Upcoming classes with low fill (urgency)
  const upcomingLow = periodEvents
    .filter(e => e.status === "scheduled" && e.start > now && e.enrolled < e.capacity * 0.5)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 3);

  // Classes today
  const todayEvents = events.filter(e => isSameDay(e.start, now) && e.status !== "cancelled");
  const todayCompleted = todayEvents.filter(e => e.status === "completed").length;

  // Occupancy color
  const occColor = occupancyRate >= 80 ? "text-green-600" : occupancyRate >= 50 ? "text-yellow-600" : "text-red-600";
  const occBg = occupancyRate >= 80 ? "bg-green-500" : occupancyRate >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="hidden lg:flex w-80 border-l border-gray-200 bg-white flex-col overflow-y-auto">
      {/* Week Overview */}
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{periodLabel}</h3>

        {/* Occupancy Ring */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke={occupancyRate >= 80 ? "#22c55e" : occupancyRate >= 50 ? "#eab308" : "#ef4444"} strokeWidth="3" strokeDasharray={`${occupancyRate} ${100 - occupancyRate}`} strokeLinecap="round" />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${occColor}`}>
              {occupancyRate}%
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Occupancy</p>
            <p className="text-xs text-gray-500">{totalEnrolled}/{totalCapacity} spots filled</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{periodEvents.length}</p>
            <p className="text-xs text-gray-500">Classes</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{todayCompleted}/{todayEvents.length}</p>
            <p className="text-xs text-gray-500">Today Done</p>
          </div>
          {atRiskCount > 0 && (
            <a href="/teacher/students?filter=inactive" className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center col-span-2 hover:bg-orange-100 transition-colors">
              <p className="text-xl font-bold text-orange-600">{atRiskCount}</p>
              <p className="text-xs text-orange-600">Inactive Students</p>
            </a>
          )}
        </div>
      </div>

      {/* Empty Spots Alert */}
      {emptySpots > 0 && (
        <div className="p-5 border-b border-gray-200">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">{emptySpots} empty spot{emptySpots !== 1 ? "s" : ""} {viewMode === "day" ? "today" : viewMode === "month" ? "this month" : "this week"}</p>
                <p className="text-xs text-amber-700 mt-1">Share your booking link to help fill these spots.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low-Fill Classes */}
      {upcomingLow.length > 0 && (
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Needs Attention
          </h3>
          <div className="space-y-2">
            {upcomingLow.map((event) => {
              const fillPct = Math.round((event.enrolled / event.capacity) * 100);
              return (
                <div key={event.id} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    <span className="text-xs font-semibold text-red-600">{fillPct}%</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {event.start.toLocaleDateString("en-US", { weekday: "short" })} {formatTime(event.start)} — {event.enrolled}/{event.capacity} spots
                  </p>
                  <div className="mt-2 h-1.5 bg-red-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${fillPct < 25 ? "bg-red-500" : "bg-yellow-500"}`} style={{ width: `${fillPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-5 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={onCreateClass}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="font-medium">Create Class</span>
          </button>
          <button
            onClick={() => {
              const link = `${window.location.origin}/dashboard/classes/book`;
              navigator.clipboard.writeText(link);
              const toast = document.createElement("div");
              toast.className = "fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 bg-green-600";
              toast.textContent = "Booking link copied!";
              document.body.appendChild(toast);
              setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 2500);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="font-medium text-gray-700">Copy Booking Link</span>
          </button>
        </div>
      </div>

    </div>
  );
}

// Event Details Sidebar for Teacher
function EventDetailsSidebar({ event, onClose, onStartClass, onTakeAttendance, onCompleteClass, onCancelClass, onViewReport, onViewAllStudents }: {
  event: ClassEvent | null;
  onClose: () => void;
  onStartClass: () => void;
  onTakeAttendance: () => void;
  onCompleteClass: () => void;
  onCancelClass: () => void;
  onViewReport: () => void;
  onViewAllStudents: () => void;
}) {
  if (!event) return null;

  const statusStyle = statusStyles[event.status];
  const fillPct = event.capacity > 0 ? Math.round((event.enrolled / event.capacity) * 100) : 0;
  const fillColor = fillPct >= 80 ? "bg-green-500" : fillPct >= 50 ? "bg-yellow-500" : "bg-red-500";
  const fillTextColor = fillPct >= 80 ? "text-green-600" : fillPct >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="w-[300px] sm:w-80 h-full border-l border-gray-200 bg-white overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <span className="mt-2"><Badge style={statusStyle} /></span>

        {/* Fill Rate Bar */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600">Fill Rate</span>
            <span className={`text-sm font-bold ${fillTextColor}`}>{fillPct}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${fillColor}`} style={{ width: `${fillPct}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1.5">{event.enrolled}/{event.capacity} spots filled{event.enrolled < event.capacity && ` — ${event.capacity - event.enrolled} available`}</p>
          {event.enrolled >= event.capacity && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-600 font-medium">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-2 1-3 .5 1.5 1 2 2 3a3 3 0 01-.38 1.62z" />
              </svg>
              Clients are waiting for this class
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" /><span>{formatDate(event.start)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>{event.unit} • {event.room}</span>
          </div>
        </div>
      </div>

      {event.students.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Enrolled ({event.students.length})</h3>
            <button onClick={onViewAllStudents} className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all</button>
          </div>
          <div className="space-y-1.5">
            {event.students.slice(0, 6).map((student) => (
              <a
                key={student.id}
                href="/teacher/students"
                className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors cursor-pointer ${
                  student.attended === true ? "bg-green-50 hover:bg-green-100" :
                  student.attended === false ? "bg-red-50 hover:bg-red-100" : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary-700">{student.initials}</span>
                  </div>
                  {student.daysSinceLastClass != null && student.daysSinceLastClass > 7 && (
                    <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${student.daysSinceLastClass > 14 ? "bg-red-500" : "bg-orange-500"}`} title={`Last class ${student.daysSinceLastClass} days ago`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-900 truncate">{student.name}</span>
                    {student.currentStreak != null && student.currentStreak >= 2 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-semibold rounded-full shrink-0" title={`${student.currentStreak} class streak`}>
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c-3.6 0-7-2.4-7-7 0-3.1 2.1-5.7 4-7.8l1.5-1.6c.4-.4 1-.4 1.4 0 .2.2.3.4.3.7v4.3l2.6-3.5c.3-.4.9-.5 1.3-.2.2.1.3.3.4.5C18.3 12.6 19 15.1 19 16c0 4.6-3.4 7-7 7z"/></svg>
                        {student.currentStreak}
                      </span>
                    )}
                  </div>
                  {student.daysSinceLastClass != null && student.daysSinceLastClass > 7 && (
                    <p className={`text-[10px] ${student.daysSinceLastClass > 14 ? "text-red-600" : "text-orange-600"}`}>Last class {student.daysSinceLastClass} days ago</p>
                  )}
                </div>
                {student.attended === true && (
                  <svg className="w-4 h-4 text-green-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {student.attended === false && (
                  <svg className="w-4 h-4 text-red-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </a>
            ))}
            {event.students.length > 6 && (
              <p className="text-xs text-gray-500 text-center pt-1">+{event.students.length - 6} more</p>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
        <div className="space-y-3">
          {event.status === "scheduled" && (
            <button onClick={onStartClass} className="w-full flex items-center gap-3 px-4 py-3 text-left bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <div><p className="font-medium">Start Class</p><p className="text-xs opacity-75">Begin the session</p></div>
            </button>
          )}
          {event.status === "in-progress" && (
            <>
              <button onClick={onTakeAttendance} className="w-full flex items-center gap-3 px-4 py-3 text-left bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div><p className="font-medium">Take Attendance</p><p className="text-xs opacity-75">Mark students present</p></div>
              </button>
              <button onClick={onCompleteClass} className="w-full flex items-center gap-3 px-4 py-3 text-left border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div><p className="font-medium text-green-700">Complete Class</p><p className="text-xs text-green-500">End the session</p></div>
              </button>
            </>
          )}
          {event.status === "completed" && (
            <button onClick={onViewReport} className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div><p className="font-medium text-gray-900">View Report</p><p className="text-xs text-gray-500">See attendance summary</p></div>
            </button>
          )}
          {/* Copy booking link for this class */}
          {(event.status === "scheduled") && (
            <button
              onClick={() => {
                const link = `${window.location.origin}/dashboard/classes/book?class=${event.id}`;
                navigator.clipboard.writeText(link);
                const toast = document.createElement("div");
                toast.className = "fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 bg-green-600";
                toast.textContent = "Booking link copied!";
                document.body.appendChild(toast);
                setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 2500);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div><p className="font-medium text-gray-900">Share Booking Link</p><p className="text-xs text-gray-500">Copy link to fill spots</p></div>
            </button>
          )}
          {(event.status === "scheduled" || event.status === "in-progress") && (
            <button onClick={onCancelClass} className="w-full flex items-center gap-3 px-4 py-3 text-left border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <CloseIcon className="w-4 h-4 text-red-600" />
              </div>
              <div><p className="font-medium text-red-700">Cancel Class</p><p className="text-xs text-red-500">Cancel and notify students</p></div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeacherClassesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStartClassModal, setShowStartClassModal] = useState(false);
  const viewDropdownRef = useRef<HTMLDivElement>(null);

  // Click-outside for view dropdown
  useEffect(() => {
    if (!showViewDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(e.target as Node)) {
        setShowViewDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showViewDropdown]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showCompleteClassModal, setShowCompleteClassModal] = useState(false);
  const [showCancelClassModal, setShowCancelClassModal] = useState(false);

  // Fetch classes from API
  const fetchClasses = useCallback(async () => {
    try {
      const response = await authFetch("/api/teacher/classes");
      if (response.ok) {
        const data = await response.json();
        // Convert ISO strings to Date objects
        const formattedEvents: ClassEvent[] = data.classes.map((c: {
          id: string;
          title: string;
          type: string;
          start: string;
          end: string;
          color: string;
          status: string;
          room: string;
          unit: string;
          capacity: number;
          enrolled: number;
          students: Student[];
        }) => ({
          ...c,
          start: new Date(c.start),
          end: new Date(c.end),
          color: (c.color || "gray") as ClassEvent["color"],
          status: c.status as ClassStatus,
          students: (c.students || []).map((s: Student) => ({
            ...s,
          })),
        }));
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const goToToday = () => setSelectedDate(new Date());
  const goToPrev = () => {
    setSelectedDate((d) => {
      const newDate = new Date(d);
      if (viewMode === "day") newDate.setDate(d.getDate() - 1);
      else if (viewMode === "week") newDate.setDate(d.getDate() - 7);
      else newDate.setMonth(d.getMonth() - 1);
      return newDate;
    });
  };
  const goToNext = () => {
    setSelectedDate((d) => {
      const newDate = new Date(d);
      if (viewMode === "day") newDate.setDate(d.getDate() + 1);
      else if (viewMode === "week") newDate.setDate(d.getDate() + 7);
      else newDate.setMonth(d.getMonth() + 1);
      return newDate;
    });
  };

  const getHeaderText = () => {
    if (viewMode === "day") return selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    if (viewMode === "week") {
      const weekDates = getWeekDates(selectedDate);
      const start = weekDates[0], end = weekDates[6];
      if (start.getMonth() === end.getMonth()) return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const viewModeLabels: Record<ViewMode, string> = { day: "Day", week: "Week", month: "Month" };

  const handleStartClass = () => setShowStartClassModal(true);
  const handleTakeAttendance = () => setShowAttendanceModal(true);
  const handleViewReport = () => setShowReportModal(true);
  const handleViewStudents = () => setShowStudentsModal(true);
  const handleCompleteClass = () => setShowCompleteClassModal(true);
  const handleCancelClass = () => setShowCancelClassModal(true);

  // Show loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Classes</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Fill every spot, track every class</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setShowCreateModal(true);
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Create Class</span>
            </button>
          </div>
        </div>
        {/* Inline week stats bar */}
        {events.length > 0 && (() => {
          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          const periodEvents = events.filter(e => e.start >= weekStart && e.start < weekEnd && e.status !== "cancelled");
          const totalCap = periodEvents.reduce((s, e) => s + e.capacity, 0);
          const totalEnr = periodEvents.reduce((s, e) => s + e.enrolled, 0);
          const occRate = totalCap > 0 ? Math.round((totalEnr / totalCap) * 100) : 0;
          const emptySpots = totalCap - totalEnr;
          const occColor = occRate >= 80 ? "text-green-600 bg-green-50" : occRate >= 50 ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50";
          return (
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${occColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${occRate >= 80 ? "bg-green-500" : occRate >= 50 ? "bg-yellow-500" : "bg-red-500"}`} />
                {occRate}% occupancy
              </span>
              <span className="text-xs text-gray-500">{periodEvents.length} classes this week</span>
              <span className="text-xs text-gray-500">{totalEnr} students booked</span>
              {emptySpots > 0 && (
                <span className="text-xs text-red-500 font-medium">{emptySpots} spots to fill</span>
              )}
            </div>
          );
        })()}
      </div>

      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
          <div className="flex items-center border border-gray-300 rounded-lg shrink-0">
            <button onClick={goToPrev} className="p-2 hover:bg-gray-50 rounded-l-lg border-r border-gray-300">
              <ArrowLeftIcon className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
            </button>
            <button onClick={goToToday} className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50">Today</button>
            <button onClick={goToNext} className="p-2 hover:bg-gray-50 rounded-r-lg border-l border-gray-300">
              <ArrowRightIcon className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
            </button>
          </div>
          <div className="relative shrink-0">
            <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-lg">
              <span className="truncate max-w-[120px] sm:max-w-none">{getHeaderText()}</span>
              <ChevronIcon className="w-4 h-4 text-gray-500 shrink-0" direction={showDatePicker ? "up" : "down"} />
            </button>
            {showDatePicker && <DatePicker selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setShowDatePicker(false)} />}
          </div>
        </div>
        <div className="relative self-end sm:self-auto" ref={viewDropdownRef}>
          <button onClick={() => setShowViewDropdown(!showViewDropdown)} className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50">
            <span>{viewModeLabels[viewMode]}</span>
            <ChevronIcon className="w-4 h-4" direction="down" />
          </button>
          {showViewDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[120px]">
              {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                <button key={mode} onClick={() => { setViewMode(mode); setShowViewDropdown(false); }}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${viewMode === mode ? "font-medium text-primary-600 bg-primary-50" : "text-gray-700"}`}>
                  {viewModeLabels[mode]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6 bg-white">
          {/* Empty State */}
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="max-w-md text-center px-4">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Your calendar is empty</h2>
                <p className="text-gray-500 mb-6">Set up your schedule to start managing classes and tracking attendance.</p>

                {/* Real industry data */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm font-semibold text-amber-800 mb-2">The cost of empty classes:</p>
                  <ul className="space-y-1.5 text-sm text-amber-700">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      20-35% of bookings become no-shows without reminders
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      50% of new members quit within the first 6 months
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      Group class members are 56% less likely to cancel
                    </li>
                  </ul>
                  <p className="text-[10px] text-amber-600 mt-2">Sources: fitDegree, IHRSA, Glofox</p>
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-base"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Your First Class
                </button>
                <p className="text-xs text-gray-400 mt-4">Takes less than 2 minutes. Use recurring classes to set up the whole week.</p>

                {/* Social proof */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Text reminders reduce no-shows by <span className="font-semibold text-primary-600">up to 38%</span> <span className="opacity-75">— Imperial College London</span></p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {viewMode === "week" && <WeekView events={events} selectedDate={selectedDate} onEventClick={setSelectedEvent} selectedEventId={selectedEvent?.id} onDayClick={(date) => { setSelectedDate(date); setViewMode("day"); }} />}
              {viewMode === "month" && <MonthView events={events} selectedDate={selectedDate} onEventClick={setSelectedEvent} selectedEventId={selectedEvent?.id} onDayClick={(date) => { setSelectedDate(date); setViewMode("day"); }} />}
              {viewMode === "day" && <DayView events={events} selectedDate={selectedDate} onEventClick={setSelectedEvent} selectedEventId={selectedEvent?.id} />}
            </>
          )}
        </div>
        {/* Mobile overlay */}
        {selectedEvent && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedEvent(null)}
          />
        )}
        {/* Sidebar: Metrics Dashboard when no event, Event Details when selected */}
        {selectedEvent ? (
          <div className={`
            fixed lg:static inset-y-0 right-0 z-50
            transform transition-transform duration-300 ease-in-out
            translate-x-0
          `}>
            <EventDetailsSidebar
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onStartClass={handleStartClass}
              onTakeAttendance={handleTakeAttendance}
              onCompleteClass={handleCompleteClass}
              onCancelClass={handleCancelClass}
              onViewReport={handleViewReport}
              onViewAllStudents={handleViewStudents}
            />
          </div>
        ) : (
          <MetricsDashboard events={events} onCreateClass={() => setShowCreateModal(true)} viewMode={viewMode} selectedDate={selectedDate} />
        )}
      </div>

      <CreateClassModal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); fetchClasses(); }} />
      <StartClassModal
        isOpen={showStartClassModal}
        onClose={() => setShowStartClassModal(false)}
        event={selectedEvent}
        onConfirm={() => { fetchClasses(); setSelectedEvent(null); }}
      />
      <TakeAttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        event={selectedEvent}
        onSave={() => { fetchClasses(); setSelectedEvent(null); }}
      />
      <ViewReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        event={selectedEvent}
      />
      <ViewStudentsModal
        isOpen={showStudentsModal}
        onClose={() => setShowStudentsModal(false)}
        event={selectedEvent}
      />
      <CompleteClassModal
        isOpen={showCompleteClassModal}
        onClose={() => setShowCompleteClassModal(false)}
        event={selectedEvent}
        onConfirm={() => { fetchClasses(); setSelectedEvent(null); }}
      />
      <CancelClassModal
        isOpen={showCancelClassModal}
        onClose={() => setShowCancelClassModal(false)}
        event={selectedEvent}
        onConfirm={() => { fetchClasses(); setSelectedEvent(null); }}
      />
    </div>
  );
}
