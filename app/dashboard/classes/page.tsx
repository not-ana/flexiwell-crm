"use client";

import { useState } from "react";
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
}

// Mock data - client's enrolled classes
const mockEvents: ClassEvent[] = [
  {
    id: "1",
    title: "Morning Yoga",
    instructor: "Ana",
    start: new Date(2024, 11, 26, 9, 0),
    end: new Date(2024, 11, 26, 10, 0),
    color: "purple",
    status: "scheduled",
  },
  {
    id: "2",
    title: "Pilates",
    instructor: "Maria",
    start: new Date(2024, 11, 26, 14, 0),
    end: new Date(2024, 11, 26, 15, 0),
    color: "pink",
    status: "scheduled",
  },
  {
    id: "3",
    title: "Evening Stretch",
    instructor: "Ana",
    start: new Date(2024, 11, 27, 18, 0),
    end: new Date(2024, 11, 27, 19, 0),
    color: "green",
    status: "scheduled",
  },
  {
    id: "4",
    title: "Reformer Session",
    instructor: "Maria",
    start: new Date(2024, 11, 28, 10, 0),
    end: new Date(2024, 11, 28, 11, 0),
    color: "blue",
    status: "scheduled",
  },
  {
    id: "5",
    title: "Yoga Flow",
    instructor: "Ana",
    start: new Date(2024, 11, 30, 9, 0),
    end: new Date(2024, 11, 30, 10, 0),
    color: "purple",
    status: "scheduled",
  },
];

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

// Date Picker Component
function DatePicker({ selectedDate, onSelect, onClose }: { selectedDate: Date; onSelect: (date: Date) => void; onClose: () => void }) {
  const [viewDate, setViewDate] = useState(selectedDate);
  const dates = getMonthDates(viewDate);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
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
              <div className="font-medium text-sm truncate">{event.title}</div>
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
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="opacity-75 truncate">{formatTime(event.start)}</div>
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

// Month View Component
function MonthView({ events, selectedDate, onEventClick, selectedEventId, onDayClick }: { events: ClassEvent[]; selectedDate: Date; onEventClick: (event: ClassEvent) => void; selectedEventId?: string; onDayClick: (date: Date) => void }) {
  const dates = getMonthDates(selectedDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
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
  );
}

// Request Modal Component
type RequestType = "cancel" | "reschedule" | "change-instructor";

function RequestModal({ type, event, onClose, onSubmit }: { type: RequestType; event: ClassEvent; onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const titles: Record<RequestType, string> = { cancel: "Request Cancellation", reschedule: "Request Reschedule", "change-instructor": "Request Instructor Change" };
  const descriptions: Record<RequestType, string> = { cancel: "Please let us know why you need to cancel.", reschedule: "Select your preferred time.", "change-instructor": "Please let us know why." };

  const availability = event.instructor === "Ana"
    ? [{ day: "Monday", slots: ["9:00 AM", "2:00 PM"] }, { day: "Wednesday", slots: ["9:00 AM", "5:00 PM"] }]
    : [{ day: "Tuesday", slots: ["9:00 AM", "1:00 PM"] }, { day: "Thursday", slots: ["11:00 AM", "3:00 PM"] }];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "reschedule" && !selectedSlot) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => { onSubmit(reason); onClose(); }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Submitted</h3>
          <p className="text-gray-600">We'll get back to you soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{titles[type]}</h3>
          <p className="text-sm text-gray-600 mb-4">{descriptions[type]}</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="font-medium text-gray-900">{event.title}</p>
            <p className="text-sm text-gray-600">{formatDate(event.start)} at {formatTime(event.start)}</p>
            {event.instructor && <p className="text-sm text-gray-600">Instructor: {event.instructor}</p>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {type === "reschedule" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Available Slots</label>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {availability.map((day) => (
                    <div key={day.day} className="border border-gray-200 rounded-lg p-3">
                      <p className="font-medium text-gray-900 text-sm mb-2">{day.day}</p>
                      <div className="flex flex-wrap gap-2">
                        {day.slots.map((time) => (
                          <button key={`${day.day}-${time}`} type="button" onClick={() => setSelectedSlot({ day: day.day, time })}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedSlot?.day === day.day && selectedSlot?.time === time ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-primary-100"}`}>
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{type === "reschedule" ? "Notes (optional)" : "Reason"}</label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none" required={type !== "reschedule"} />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={onClose} type="button">Cancel</Button>
              <Button fullWidth type="submit" disabled={isSubmitting || (type === "reschedule" && !selectedSlot)}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
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
function EventDetailsSidebar({ event, onRequestCancel, onRequestReschedule, onRequestChangeInstructor }: { event: ClassEvent | null; onRequestCancel: () => void; onRequestReschedule: () => void; onRequestChangeInstructor: () => void }) {
  if (!event) {
    return (
      <div className="w-80 border-l border-gray-200 p-6 flex items-center justify-center text-gray-500">
        <p>Select a class to see details</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${event.status === "scheduled" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </span>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" /><span>{formatDate(event.start)}</span>
          </div>
          {event.instructor && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="w-4 h-4" /><span>Instructor: {event.instructor}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
        <div className="space-y-3">
          <button onClick={onRequestReschedule} className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><CalendarIcon className="w-4 h-4 text-blue-600" /></div>
            <div><p className="font-medium text-gray-900">Request Reschedule</p><p className="text-xs text-gray-500">Move to another time</p></div>
          </button>
          <button onClick={onRequestChangeInstructor} className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center"><UserIcon className="w-4 h-4 text-primary-600" /></div>
            <div><p className="font-medium text-gray-900">Change Instructor</p><p className="text-xs text-gray-500">Switch to another instructor</p></div>
          </button>
          <button onClick={onRequestCancel} className="w-full flex items-center gap-3 px-4 py-3 text-left border border-red-200 rounded-lg hover:bg-red-50">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><CloseIcon className="w-4 h-4 text-red-600" /></div>
            <div><p className="font-medium text-red-700">Cancel Class</p><p className="text-xs text-red-500">Request cancellation</p></div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date(2024, 11, 26));
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [events] = useState<ClassEvent[]>(mockEvents);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [requestModal, setRequestModal] = useState<{ type: RequestType; event: ClassEvent } | null>(null);

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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-semibold text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-1">View and manage your scheduled classes</p>
      </div>

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
        <div className="relative">
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

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {viewMode === "day" && <DayView events={events} selectedDate={selectedDate} onEventClick={setSelectedEvent} selectedEventId={selectedEvent?.id} />}
          {viewMode === "week" && <WeekView events={events} selectedDate={selectedDate} onEventClick={setSelectedEvent} selectedEventId={selectedEvent?.id} onDayClick={(date) => { setSelectedDate(date); setViewMode("day"); }} />}
          {viewMode === "month" && <MonthView events={events} selectedDate={selectedDate} onEventClick={setSelectedEvent} selectedEventId={selectedEvent?.id} onDayClick={(date) => { setSelectedDate(date); setViewMode("day"); }} />}
        </div>
        <EventDetailsSidebar
          event={selectedEvent}
          onRequestCancel={() => selectedEvent && setRequestModal({ type: "cancel", event: selectedEvent })}
          onRequestReschedule={() => selectedEvent && setRequestModal({ type: "reschedule", event: selectedEvent })}
          onRequestChangeInstructor={() => selectedEvent && setRequestModal({ type: "change-instructor", event: selectedEvent })}
        />
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
