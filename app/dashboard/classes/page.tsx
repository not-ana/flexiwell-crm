"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronIcon,
  CalendarIcon,
  UserIcon,
  CloseIcon,
  CheckCircleIcon,
} from "@/components/icons";
import Button from "@/components/ui/Button";

import { useRouter } from "next/navigation";

// Types
type ViewMode = "day" | "week" | "month";

interface ClassEvent {
  id: string;
  title: string;
  instructor?: string;
  start: Date;
  end: Date;
  color: "purple" | "gray" | "pink" | "orange" | "green" | "blue" | "red";
  status: "scheduled" | "completed" | "cancelled";
  enrolled: number;
  capacity: number;
  rating?: number;
}

const colorStyles: Record<ClassEvent["color"], { bg: string; border: string; text: string }> = {
  purple: { bg: "bg-primary-50", border: "border-l-primary-500", text: "text-primary-700" },
  gray: { bg: "bg-gray-50", border: "border-l-gray-400", text: "text-gray-700" },
  pink: { bg: "bg-pink-50", border: "border-l-pink-500", text: "text-pink-700" },
  orange: { bg: "bg-orange-50", border: "border-l-orange-500", text: "text-orange-700" },
  green: { bg: "bg-green-50", border: "border-l-green-500", text: "text-green-700" },
  blue: { bg: "bg-blue-50", border: "border-l-blue-500", text: "text-blue-700" },
  red: { bg: "bg-red-50", border: "border-l-red-500", text: "text-red-700" },
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

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function getMonthDates(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates: Date[] = [];
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) dates.push(new Date(year, month, -i));
  for (let i = 1; i <= lastDay.getDate(); i++) dates.push(new Date(year, month, i));
  const endPadding = 42 - dates.length;
  for (let i = 1; i <= endPadding; i++) dates.push(new Date(year, month + 1, i));
  return dates;
}

function isCurrentMonth(date: Date, ref: Date): boolean {
  return date.getMonth() === ref.getMonth() && date.getFullYear() === ref.getFullYear();
}

// Current Time Line Component
function CurrentTimeLine({ startHour = 8, hourHeight = 64 }: { startHour?: number; hourHeight?: number }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = now.getHours() + now.getMinutes() / 60;
  if (currentHour < startHour || currentHour > startHour + 11) return null;

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

// Day View Component
function DayView({ events, selectedDate, onEventClick, selectedEventId }: { events: ClassEvent[]; selectedDate: Date; onEventClick: (event: ClassEvent) => void; selectedEventId?: string }) {
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);
  const dayEvents = events.filter((e) => isSameDay(e.start, selectedDate));

  const getEventStyle = (event: ClassEvent) => {
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    return { top: `${(startHour - 8) * 64}px`, height: `${(endHour - startHour) * 64}px` };
  };

  return (
    <div className="relative">
      <CurrentTimeLine startHour={8} hourHeight={64} />
      {hours.map((hour) => (
        <div key={hour} className="flex h-16 border-b border-gray-100">
          <div className="w-16 pr-3 text-right text-xs text-gray-500 -mt-2">
            {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
          </div>
          <div className="flex-1 border-l border-gray-200" />
        </div>
      ))}
      <div className="absolute left-16 right-0 top-0">
        {dayEvents.map((event) => {
          const style = getEventStyle(event);
          const colors = colorStyles[event.color];
          const isSelected = event.id === selectedEventId;
          return (
            <button
              key={event.id}
              onClick={() => onEventClick(event)}
              className={`absolute left-1 right-1 p-3 rounded-lg border-l-4 ${colors.bg} ${colors.border} ${colors.text} text-left transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary-500 shadow-md" : ""}`}
              style={style}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-sm truncate">{event.title}</div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs opacity-75">{event.enrolled}/{event.capacity}</span>
                  <ScarcityBadge enrolled={event.enrolled} capacity={event.capacity} />
                </div>
              </div>
              {event.instructor && <div className="text-xs opacity-75">Instructor: {event.instructor}</div>}
              <div className="text-xs opacity-75">{formatTime(event.start)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Week View Component
function WeekView({ events, selectedDate, onEventClick, selectedEventId, onDayClick }: { events: ClassEvent[]; selectedDate: Date; onEventClick: (event: ClassEvent) => void; selectedEventId?: string; onDayClick: (date: Date) => void }) {
  const weekDates = getWeekDates(selectedDate);
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  const getEventStyle = (event: ClassEvent) => {
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    return { top: `${(startHour - 8) * 48}px`, height: `${Math.max((endHour - startHour) * 48, 24)}px` };
  };

  return (
    <div>
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
        <CurrentTimeLine startHour={8} hourHeight={48} />
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
                const style = getEventStyle(event);
                const colors = colorStyles[event.color];
                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`absolute left-1 right-1 px-2 py-1 rounded border-l-2 ${colors.bg} ${colors.border} ${colors.text} text-left text-xs hover:shadow-sm ${event.id === selectedEventId ? "ring-1 ring-primary-500" : ""}`}
                    style={style}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-medium truncate">{event.title}</span>
                      <span className="opacity-75 shrink-0">{event.enrolled}/{event.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="opacity-75 truncate">{formatTime(event.start)}</span>
                      <ScarcityBadge enrolled={event.enrolled} capacity={event.capacity} compact />
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Dot colors for mobile month view
const dotColors: Record<ClassEvent["color"], string> = {
  purple: "bg-purple-500",
  gray: "bg-gray-500",
  pink: "bg-pink-500",
  orange: "bg-orange-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  red: "bg-red-500",
};

// Scarcity Badge helper
function ScarcityBadge({ enrolled, capacity, compact = false }: { enrolled: number; capacity: number; compact?: boolean }) {
  const spotsLeft = capacity - enrolled;
  if (enrolled >= capacity) {
    return <span className={`inline-flex items-center ${compact ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-xs"} font-bold bg-red-100 text-red-700 rounded`}>FULL</span>;
  }
  if (spotsLeft <= 3) {
    return <span className={`inline-flex items-center ${compact ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-xs"} font-semibold bg-amber-100 text-amber-700 rounded`}>Only {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left!</span>;
  }
  return null;
}

// Month View Component
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
                    const colors = colorStyles[event.color];
                    const spotsLeft = event.capacity - event.enrolled;
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer ${colors.bg} ${colors.text} ${event.id === selectedEventId ? "ring-1 ring-primary-500" : ""}`}
                      >
                        <span className="truncate">{event.title}</span>
                        {event.enrolled >= event.capacity && <span className="ml-1 text-red-600 font-bold">FULL</span>}
                        {spotsLeft > 0 && spotsLeft <= 3 && <span className="ml-1 text-amber-600 font-bold">{spotsLeft}!</span>}
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
                const colors = colorStyles[event.color];
                const spotsLeft = event.capacity - event.enrolled;
                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`w-full p-3 rounded-lg border-l-4 text-left ${colors.bg} ${colors.border} ${event.id === selectedEventId ? "ring-2 ring-primary-500" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${colors.text}`}>{event.title}</p>
                      <span className="text-sm text-gray-500">{formatTime(event.start)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{event.enrolled}/{event.capacity} spots</span>
                      <ScarcityBadge enrolled={event.enrolled} capacity={event.capacity} compact />
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

// Progress Banner Component (Hormozi: gamification + milestone tracking)
function ProgressBanner() {
  // Demo data - in production, fetch from API
  const weekStreak = 3;
  const classesThisMonth = 7;
  const classesInPlan = 12;
  const nextMilestoneTarget = 10;
  const classesToMilestone = nextMilestoneTarget - classesThisMonth;
  const monthProgress = Math.round((classesThisMonth / classesInPlan) * 100);

  return (
    <div className="px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
      <div className="flex items-center gap-6 overflow-x-auto">
        {/* Streak */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{weekStreak}-week streak</p>
            <p className="text-xs text-gray-500">Keep it up!</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 shrink-0" />

        {/* Monthly progress */}
        <div className="flex items-center gap-3 shrink-0 min-w-[200px]">
          <div>
            <p className="text-sm font-semibold text-gray-900">{classesThisMonth}/{classesInPlan} classes</p>
            <p className="text-xs text-gray-500">this month</p>
          </div>
          <div className="flex-1 h-2 bg-gray-200 rounded-full min-w-[80px]">
            <div className="h-2 bg-primary-500 rounded-full transition-all" style={{ width: `${Math.min(monthProgress, 100)}%` }} />
          </div>
          <span className="text-xs font-medium text-primary-600">{monthProgress}%</span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 shrink-0" />

        {/* Milestone */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div>
            {classesToMilestone > 0 ? (
              <>
                <p className="text-sm font-semibold text-gray-900">{classesToMilestone} more to go!</p>
                <p className="text-xs text-gray-500">{nextMilestoneTarget}-class badge</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-green-700">Badge earned!</p>
                <p className="text-xs text-gray-500">{nextMilestoneTarget}-class milestone</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Request Modal Component
type RequestType = "cancel" | "reschedule" | "extra-class";

function RequestModal({ type, event, onClose, onSubmit }: { type: RequestType; event?: ClassEvent; onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [preferredTimeRange, setPreferredTimeRange] = useState<"morning" | "afternoon" | "evening" | "any">("any");

  const titles: Record<RequestType, string> = {
    cancel: "Cancel Class",
    reschedule: "Reschedule Class",
    "extra-class": "Request Extra Class"
  };
  const descriptions: Record<RequestType, string> = {
    cancel: "Let us know the reason for cancellation.",
    reschedule: "Tell us when works better and we'll find you a spot.",
    "extra-class": "Tell us your preferred times and we'll notify you when a spot opens."
  };

  const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const timeRanges = [
    { id: "morning" as const, label: "Morning", desc: "6am-12pm" },
    { id: "afternoon" as const, label: "Afternoon", desc: "12pm-6pm" },
    { id: "evening" as const, label: "Evening", desc: "6pm-10pm" },
    { id: "any" as const, label: "Any time", desc: "" },
  ];

  const toggleDay = (day: string) => {
    setPreferredDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const needsPreferences = type === "reschedule" || type === "extra-class";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsPreferences && preferredDays.length === 0) return;

    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => { onSubmit(reason); onClose(); }} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {needsPreferences ? "You're on the waitlist!" : "Request submitted!"}
          </h3>
          <p className="text-gray-600">
            {needsPreferences
              ? "We'll text you as soon as a matching spot opens."
              : "We'll get back to you soon."}
          </p>
          {needsPreferences && (
            <p className="mt-3 text-xs text-gray-500">
              When notified, confirm within 30 minutes to secure your spot.
            </p>
          )}
          <button
            onClick={() => { onSubmit(reason); onClose(); }}
            className="mt-5 w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{titles[type]}</h3>
          <p className="text-sm text-gray-600 mb-4">{descriptions[type]}</p>

          {/* Current Class Info */}
          {event && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-900">{event.title}</p>
              <p className="text-sm text-gray-600">{formatDate(event.start)} at {formatTime(event.start)}</p>
              {event.instructor && <p className="text-sm text-gray-600">with {event.instructor}</p>}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Day + Time Preferences (for reschedule and extra-class) */}
            {needsPreferences && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Days</label>
                  <div className="flex flex-wrap gap-2">
                    {allDays.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          preferredDays.includes(day)
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeRanges.map((range) => (
                      <button
                        key={range.id}
                        type="button"
                        onClick={() => setPreferredTimeRange(range.id)}
                        className={`px-2 py-2 text-center rounded-lg transition-colors text-xs font-medium ${
                          preferredTimeRange === range.id
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reason / Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === "cancel" ? "Reason" : "Notes (optional)"}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder={type === "cancel" ? "Why do you need to cancel?" : "Any additional details..."}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                required={type === "cancel"}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={onClose} type="button">Back</Button>
              <Button
                fullWidth
                type="submit"
                disabled={isSubmitting || (needsPreferences && preferredDays.length === 0)}
              >
                {isSubmitting ? "Submitting..." : needsPreferences ? "Join Waitlist" : "Submit"}
              </Button>
            </div>
          </form>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Event Details Sidebar
function EventDetailsSidebar({
  event,
  onClose,
  onRequestCancel,
  onRequestReschedule,
  onRequestExtraClass,
  onBookClass,
}: {
  event: ClassEvent | null;
  onClose: () => void;
  onRequestCancel: () => void;
  onRequestReschedule: () => void;
  onRequestExtraClass: () => void;
  onBookClass: () => void;
}) {
  const statusLabels: Record<string, string> = {
    scheduled: "Scheduled",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  // Demo recommended classes based on time of day
  const getRecommendedClasses = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return [
        { name: "Morning Flow Yoga", time: "8:00 AM", instructor: "Sarah M.", spotsLeft: 2 },
        { name: "Power Pilates", time: "9:30 AM", instructor: "Lisa K.", spotsLeft: 5 },
        { name: "Sunrise Stretch", time: "7:00 AM", instructor: "Anna B.", spotsLeft: 1 },
      ];
    } else if (hour < 17) {
      return [
        { name: "Midday Reformer", time: "12:30 PM", instructor: "Lisa K.", spotsLeft: 3 },
        { name: "Core Strength", time: "2:00 PM", instructor: "Sarah M.", spotsLeft: 4 },
        { name: "Mat Pilates Express", time: "1:00 PM", instructor: "Anna B.", spotsLeft: 2 },
      ];
    } else {
      return [
        { name: "Evening Restorative", time: "6:00 PM", instructor: "Sarah M.", spotsLeft: 1 },
        { name: "Power Yoga Flow", time: "7:30 PM", instructor: "Lisa K.", spotsLeft: 3 },
        { name: "Stretch & Relax", time: "8:00 PM", instructor: "Anna B.", spotsLeft: 6 },
      ];
    }
  };

  if (!event) {
    const recommended = getRecommendedClasses();
    return (
      <div className="w-80 h-full border-l border-gray-200 p-6 flex flex-col bg-white hidden lg:flex">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-7 h-7 text-primary-400" />
          </div>
          <p className="text-gray-500 mb-1">Select a class to view details</p>
          <p className="text-xs text-gray-400 mb-6">or book a new one</p>
          <button
            onClick={onBookClass}
            className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors mb-3"
          >
            Book a Class
          </button>
          <button
            onClick={onRequestExtraClass}
            className="w-full px-4 py-2 text-primary-600 hover:text-primary-700 text-sm font-medium hover:bg-primary-50 rounded-lg transition-colors"
          >
            Request Extra Class
          </button>
        </div>

        {/* Recommended for You */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Recommended for You</h3>
          <p className="text-xs text-gray-500 mb-3">Based on your schedule</p>
          <div className="space-y-2">
            {recommended.map((cls, idx) => (
              <button
                key={idx}
                onClick={onBookClass}
                className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-primary-700">{cls.name}</p>
                  {cls.spotsLeft <= 3 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">{cls.spotsLeft} left</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{cls.time}</span>
                  <span className="text-xs text-gray-400">with {cls.instructor}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[300px] sm:w-80 h-full border-l border-gray-200 bg-white overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${event.status === "scheduled" ? "bg-green-100 text-green-700" : event.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
          {statusLabels[event.status] || event.status}
        </span>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" /><span>{formatDate(event.start)}</span>
          </div>
          {event.instructor && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="w-4 h-4" /><span>{event.instructor}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
          </div>

          {/* Instructor Rating */}
          {event.rating && event.rating > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>{event.rating.toFixed(1)} instructor rating</span>
            </div>
          )}
        </div>
      </div>

      {/* Capacity Fill Bar (Hormozi: social proof) */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700">{event.enrolled}/{event.capacity} spots filled</span>
          {event.enrolled / event.capacity > 0.7 && (
            <span className="text-xs font-semibold px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">Popular class!</span>
          )}
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-full">
          <div
            className={`h-2.5 rounded-full transition-all ${
              event.enrolled >= event.capacity
                ? "bg-red-500"
                : event.enrolled / event.capacity > 0.7
                ? "bg-orange-500"
                : "bg-green-500"
            }`}
            style={{ width: `${Math.min(Math.round((event.enrolled / event.capacity) * 100), 100)}%` }}
          />
        </div>
        <div className="mt-1">
          <ScarcityBadge enrolled={event.enrolled} capacity={event.capacity} />
        </div>
      </div>

      {event.status === "scheduled" && (
        <div className="p-4">
          <div className="space-y-2">
            <button onClick={onRequestReschedule} className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><CalendarIcon className="w-4 h-4 text-blue-600" /></div>
              <div><p className="font-medium text-gray-900">Reschedule</p><p className="text-xs text-gray-500">Move to another time</p></div>
            </button>
            <button onClick={onRequestCancel} className="w-full flex items-center gap-3 px-4 py-3 text-left border border-red-200 rounded-lg hover:bg-red-50">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><CloseIcon className="w-4 h-4 text-red-600" /></div>
              <div><p className="font-medium text-red-700">Cancel</p><p className="text-xs text-red-500">Request cancellation</p></div>
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Prompt (Hormozi: premium upsell for red/premium classes) */}
      {event.color === "red" && (
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm font-semibold text-purple-800">Premium Class</span>
            </div>
            <p className="text-xs text-purple-700 mb-3">
              This class requires a premium plan. Upgrade to unlock unlimited premium classes and priority booking.
            </p>
            <button className="w-full px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface WaitlistEntry {
  id: string;
  classId: string;
  className: string;
  position: number;
  status: "waiting" | "notified" | "confirmed" | "expired";
  notificationExpiresAt?: string;
}

function WaitlistBanner({ entries, onConfirm, onBrowse }: { entries: WaitlistEntry[]; onConfirm: (id: string) => void; onBrowse: () => void }) {
  const active = entries.filter((e) => e.status === "waiting" || e.status === "notified");

  // Show notified first
  const sorted = [...active].sort((a, b) => {
    if (a.status === "notified" && b.status !== "notified") return -1;
    if (b.status === "notified" && a.status !== "notified") return 1;
    return 0;
  });

  const hasNotified = sorted.some((e) => e.status === "notified");

  return (
    <div className={`px-6 py-3 border-b border-gray-200 ${
      hasNotified
        ? "bg-gradient-to-r from-green-50 to-emerald-50"
        : "bg-gradient-to-r from-primary-50 to-blue-50"
    }`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="text-sm font-semibold text-gray-900">
            {hasNotified ? "A spot opened up!" : active.length > 0 ? `Your Waitlist (${active.length})` : "Your Waitlist"}
          </span>
        </div>
        {active.length === 0 && (
          <button
            onClick={onBrowse}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Class full? Join waitlist when booking
          </button>
        )}
      </div>
      {active.length === 0 ? (
        <p className="text-xs text-gray-500">
          When a class is full, join the waitlist and we&apos;ll text you the moment a spot opens.
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 mt-1">
          {sorted.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm shrink-0 ${
                entry.status === "notified"
                  ? "bg-green-100 border border-green-300 animate-pulse"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="min-w-0">
                <p className={`font-medium truncate ${entry.status === "notified" ? "text-green-900" : "text-gray-900"}`}>
                  {entry.className}
                </p>
                <p className={`text-xs ${entry.status === "notified" ? "text-green-700 font-semibold" : "text-gray-500"}`}>
                  {entry.status === "notified" ? "Spot available — confirm now!" : `Position #${entry.position}`}
                </p>
              </div>
              {entry.status === "notified" && (
                <button
                  onClick={() => onConfirm(entry.id)}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 shrink-0 shadow-sm"
                >
                  Confirm
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClassesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [requestModal, setRequestModal] = useState<{ type: RequestType; event?: ClassEvent } | null>(null);
  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);

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

  // Fetch classes and waitlist entries
  const fetchClasses = useCallback(async () => {
    try {
      const [classesRes, waitlistRes] = await Promise.all([
        fetch("/api/dashboard/classes"),
        fetch("/api/waitlist?clientId=me"),
      ]);

      if (classesRes.ok) {
        const data = await classesRes.json();
        // Demo capacity/enrollment data - in production, API would return these
        const demoCapacities = [8, 10, 12, 15, 6, 10, 12];
        const demoRatings = [4.8, 4.5, 4.9, 4.2, 4.7, 4.6, 4.3];
        const formattedEvents: ClassEvent[] = data.events.map((e: {
          id: string;
          title: string;
          instructor?: string;
          start: string;
          end: string;
          color: ClassEvent["color"];
          status: ClassEvent["status"];
          enrolled?: number;
          capacity?: number;
          rating?: number;
        }, idx: number) => {
          const capacity = e.capacity ?? demoCapacities[idx % demoCapacities.length];
          // Deterministic demo enrollment based on index - avoids hydration issues
          const demoEnrollments = [7, 10, 5, 12, 6, 9, 11, 3, 8, 10];
          const enrolled = e.enrolled ?? Math.min(capacity, demoEnrollments[idx % demoEnrollments.length]);
          return {
            ...e,
            start: new Date(e.start),
            end: new Date(e.end),
            capacity,
            enrolled,
            rating: e.rating ?? demoRatings[idx % demoRatings.length],
          };
        });
        setEvents(formattedEvents);
      }

      if (waitlistRes.ok) {
        const data = await waitlistRes.json();
        setWaitlistEntries(data.entries || []);
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
  const router = useRouter();

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
    if (viewMode === "month") return selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const weekDates = getWeekDates(selectedDate);
    const start = weekDates[0], end = weekDates[6];
    if (start.getMonth() === end.getMonth()) return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const viewModeLabels: Record<ViewMode, string> = { day: "Day", week: "Week", month: "Month" };

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
      <div className="p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-semibold text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-1">View and manage your scheduled classes</p>
      </div>

      {/* Progress Banner (Hormozi: gamification + streak tracking) */}
      <ProgressBanner />

      {/* Waitlist entries banner — always visible (Hormozi: reduce perceived time delay) */}
      <WaitlistBanner
        entries={waitlistEntries}
        onConfirm={(id) => router.push(`/dashboard/classes/book?confirm=${id}`)}
        onBrowse={() => router.push("/dashboard/classes/book")}
      />

      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button onClick={goToPrev} className="p-2 hover:bg-gray-50 rounded-l-lg border-r border-gray-300">
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Today</button>
            <button onClick={goToNext} className="p-2 hover:bg-gray-50 rounded-r-lg border-l border-gray-300">
              <ArrowRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="relative">
            <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-lg">
              <span>{getHeaderText()}</span>
              <ChevronIcon className="w-4 h-4 text-gray-500" direction={showDatePicker ? "up" : "down"} />
            </button>
            {showDatePicker && <DatePicker selectedDate={selectedDate} onSelect={setSelectedDate} onClose={() => setShowDatePicker(false)} />}
          </div>
        </div>
        <div className="relative" ref={viewDropdownRef}>
          <button onClick={() => setShowViewDropdown(!showViewDropdown)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <span>{viewModeLabels[viewMode]} view</span>
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
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {viewMode === "day" && <DayView events={events} selectedDate={selectedDate} onEventClick={setSelectedEvent} selectedEventId={selectedEvent?.id} />}
          {viewMode === "week" && <WeekView events={events} selectedDate={selectedDate} onEventClick={setSelectedEvent} selectedEventId={selectedEvent?.id} onDayClick={(date) => { setSelectedDate(date); setViewMode("day"); }} />}
          {viewMode === "month" && <MonthView events={events} selectedDate={selectedDate} onEventClick={setSelectedEvent} selectedEventId={selectedEvent?.id} onDayClick={(date) => { setSelectedDate(date); setViewMode("day"); }} />}
        </div>
        {/* Mobile overlay */}
        {selectedEvent && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedEvent(null)}
          />
        )}
        {/* Sidebar - slides in on mobile, always visible on desktop */}
        <div className={`
          fixed lg:static inset-y-0 right-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${selectedEvent ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}>
          <EventDetailsSidebar
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onRequestCancel={() => selectedEvent && setRequestModal({ type: "cancel", event: selectedEvent })}
            onRequestReschedule={() => selectedEvent && setRequestModal({ type: "reschedule", event: selectedEvent })}
            onRequestExtraClass={() => setRequestModal({ type: "extra-class" })}
            onBookClass={() => router.push("/dashboard/classes/book")}
          />
        </div>
      </div>

      {requestModal && <RequestModal type={requestModal.type} event={requestModal.event} onClose={() => setRequestModal(null)} onSubmit={(reason) => {
          // Handle request submission - will integrate with backend API
          console.log(`Request submitted: ${requestModal.type}`, { reason, event: requestModal.event });
          // In production: await api.submitClassRequest({ type: requestModal.type, classId: requestModal.event.id, reason });
          setRequestModal(null);
        }} />}
    </div>
  );
}
