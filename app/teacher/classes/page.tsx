"use client";

import { useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronIcon,
  CalendarIcon,
  UserIcon,
  CloseIcon,
  PlusIcon,
} from "@/components/icons";
import Button from "@/components/ui/Button";

// Types
type ViewMode = "day" | "week" | "month";
type ClassStatus = "scheduled" | "in-progress" | "completed" | "cancelled";

interface Student {
  id: string;
  name: string;
  initials: string;
  attended?: boolean;
}

interface ClassEvent {
  id: string;
  title: string;
  type: string;
  start: Date;
  end: Date;
  color: "purple" | "green" | "blue" | "orange" | "pink";
  status: ClassStatus;
  room: string;
  unit: string;
  capacity: number;
  enrolled: number;
  students: Student[];
}

// Mock data - teacher's classes
const mockEvents: ClassEvent[] = [
  {
    id: "1",
    title: "Morning Yoga",
    type: "Yoga",
    start: new Date(2024, 11, 26, 9, 0),
    end: new Date(2024, 11, 26, 10, 0),
    color: "green",
    status: "completed",
    room: "Studio A",
    unit: "FlexiWell Centro",
    capacity: 15,
    enrolled: 12,
    students: [
      { id: "s1", name: "Ana Silva", initials: "AS", attended: true },
      { id: "s2", name: "Maria Santos", initials: "MS", attended: true },
      { id: "s3", name: "João Costa", initials: "JC", attended: false },
    ],
  },
  {
    id: "2",
    title: "Pilates",
    type: "Pilates",
    start: new Date(2024, 11, 26, 14, 0),
    end: new Date(2024, 11, 26, 15, 0),
    color: "purple",
    status: "completed",
    room: "Studio B",
    unit: "FlexiWell Centro",
    capacity: 10,
    enrolled: 8,
    students: [
      { id: "s4", name: "Pedro Lima", initials: "PL", attended: true },
      { id: "s5", name: "Carla Reis", initials: "CR", attended: true },
    ],
  },
  {
    id: "3",
    title: "Morning Yoga",
    type: "Yoga",
    start: new Date(2024, 11, 27, 9, 0),
    end: new Date(2024, 11, 27, 10, 0),
    color: "green",
    status: "in-progress",
    room: "Studio A",
    unit: "FlexiWell Centro",
    capacity: 15,
    enrolled: 14,
    students: [
      { id: "s1", name: "Ana Silva", initials: "AS" },
      { id: "s2", name: "Maria Santos", initials: "MS" },
      { id: "s6", name: "Lucas Oliveira", initials: "LO" },
    ],
  },
  {
    id: "4",
    title: "Reformer Session",
    type: "Pilates",
    start: new Date(2024, 11, 28, 10, 0),
    end: new Date(2024, 11, 28, 11, 0),
    color: "blue",
    status: "scheduled",
    room: "Reformer Room",
    unit: "FlexiWell Jardins",
    capacity: 8,
    enrolled: 6,
    students: [
      { id: "s7", name: "Fernanda Gomes", initials: "FG" },
      { id: "s8", name: "Ricardo Alves", initials: "RA" },
    ],
  },
  {
    id: "5",
    title: "Evening Stretch",
    type: "Stretching",
    start: new Date(2024, 11, 27, 18, 0),
    end: new Date(2024, 11, 27, 19, 0),
    color: "orange",
    status: "scheduled",
    room: "Main Hall",
    unit: "FlexiWell Centro",
    capacity: 20,
    enrolled: 15,
    students: [
      { id: "s9", name: "Juliana Mendes", initials: "JM" },
      { id: "s10", name: "Bruno Costa", initials: "BC" },
    ],
  },
  {
    id: "6",
    title: "Power Pilates",
    type: "Pilates",
    start: new Date(2024, 11, 28, 14, 0),
    end: new Date(2024, 11, 28, 15, 0),
    color: "purple",
    status: "scheduled",
    room: "Studio B",
    unit: "FlexiWell Centro",
    capacity: 12,
    enrolled: 10,
    students: [],
  },
];

const colorStyles: Record<ClassEvent["color"], { bg: string; border: string; text: string }> = {
  purple: { bg: "bg-purple-50", border: "border-l-purple-500", text: "text-purple-700" },
  green: { bg: "bg-green-50", border: "border-l-green-500", text: "text-green-700" },
  blue: { bg: "bg-blue-50", border: "border-l-blue-500", text: "text-blue-700" },
  orange: { bg: "bg-orange-50", border: "border-l-orange-500", text: "text-orange-700" },
  pink: { bg: "bg-pink-50", border: "border-l-pink-500", text: "text-pink-700" },
};

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
                  const colors = colorStyles[event.color];
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`absolute left-1 right-1 px-2 py-1 rounded border-l-2 ${colors.bg} ${colors.border} ${colors.text} text-left text-xs hover:shadow-sm transition-shadow ${event.id === selectedEventId ? "ring-2 ring-primary-500 shadow-md" : ""}`}
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
              const colors = colorStyles[event.color];
              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`absolute left-2 right-2 px-3 py-2 rounded-lg border-l-4 ${colors.bg} ${colors.border} ${colors.text} text-left hover:shadow-md transition-shadow ${event.id === selectedEventId ? "ring-2 ring-primary-500 shadow-md" : ""}`}
                  style={style}
                >
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs opacity-75">{formatTime(event.start)}</div>
                </button>
              );
            })}
          </div>
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
                const colors = colorStyles[event.color];
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
    type: "Pilates",
    date: "",
    time: "",
    duration: "50",
    unit: "FlexiWell Centro",
    room: "Room 1",
    capacity: "8",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdClass, setCreatedClass] = useState<typeof formData | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.name || !formData.date || !formData.time) {
      return;
    }
    setIsCreating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log("Creating class:", formData);
    setCreatedClass({ ...formData });
    setShowSuccess(true);
    setIsCreating(false);
  };

  const handleClose = () => {
    setShowSuccess(false);
    setCreatedClass(null);
    setFormData({
      name: "",
      type: "Pilates",
      date: "",
      time: "",
      duration: "50",
      unit: "FlexiWell Centro",
      room: "Room 1",
      capacity: "8",
    });
    onClose();
  };

  // Success state
  if (showSuccess && createdClass) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Class Created Successfully!</h2>
            <p className="text-gray-600 mb-6">Your new class has been scheduled.</p>

            <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">{createdClass.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{createdClass.date}</span>
                </div>
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
                  <span>{createdClass.unit} - {createdClass.room}</span>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="50">50 minutes</option>
              <option value="60">60 minutes</option>
              <option value="75">75 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            >
              <option value="FlexiWell Centro">FlexiWell Centro</option>
              <option value="FlexiWell Jardins">FlexiWell Jardins</option>
              <option value="FlexiWell Moema">FlexiWell Moema</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <select
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="Room 1">Room 1</option>
                <option value="Room 2">Room 2</option>
                <option value="Room 3">Room 3</option>
                <option value="Studio A">Studio A</option>
                <option value="Studio B">Studio B</option>
              </select>
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
          </div>
        </div>

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

  if (!isOpen || !event) return null;

  const handleStart = async () => {
    setIsStarting(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsStarting(false);
    setShowSuccess(true);
  };

  const handleClose = () => {
    setShowSuccess(false);
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

  // Initialize attendance from event students
  useState(() => {
    if (event?.students) {
      const initial: Record<string, boolean | null> = {};
      event.students.forEach(s => {
        initial[s.id] = s.attended ?? null;
      });
      setAttendance(initial);
    }
  });

  if (!isOpen || !event) return null;

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => {
      const current = prev[studentId];
      if (current === null || current === undefined) return { ...prev, [studentId]: true };
      if (current === true) return { ...prev, [studentId]: false };
      return { ...prev, [studentId]: true };
    });
  };

  const markAllPresent = () => {
    const all: Record<string, boolean> = {};
    event.students.forEach(s => { all[s.id] = true; });
    setAttendance(all);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
    setShowSuccess(true);
  };

  const handleClose = () => {
    setShowSuccess(false);
    onClose();
  };

  const presentCount = Object.values(attendance).filter(v => v === true).length;
  const absentCount = Object.values(attendance).filter(v => v === false).length;

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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">Present: {presentCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600">Absent: {absentCount}</span>
              </div>
            </div>
            <button onClick={markAllPresent} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Mark all present
            </button>
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
                    <span className="font-medium text-gray-900">{student.name}</span>
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
            <div className="grid grid-cols-3 gap-3">
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Enrolled Students</h2>
              <p className="text-sm text-gray-600 mt-1">{event.title} • {event.enrolled}/{event.capacity} students</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {event.students.length > 0 ? (
            <div className="space-y-3">
              {event.students.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-700">{student.initials}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500">Student ID: {student.id}</p>
                  </div>
                  {event.status === "completed" && (
                    student.attended === true ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-xs font-medium">Present</span>
                      </div>
                    ) : student.attended === false ? (
                      <div className="flex items-center gap-1 text-red-600">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        <span className="text-xs font-medium">Absent</span>
                      </div>
                    ) : null
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-1">No students enrolled yet</p>
              <p className="text-sm text-gray-500">Students will appear here once they register for this class.</p>
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

// Event Details Sidebar for Teacher
function EventDetailsSidebar({ event, onClose, onStartClass, onTakeAttendance, onViewReport, onViewStudents }: {
  event: ClassEvent | null;
  onClose: () => void;
  onStartClass: () => void;
  onTakeAttendance: () => void;
  onViewReport: () => void;
  onViewStudents: () => void;
}) {
  if (!event) {
    return (
      <div className="hidden lg:flex w-80 border-l border-gray-200 p-6 items-center justify-center text-gray-500 bg-white">
        <p>Select a class to see details</p>
      </div>
    );
  }

  const statusStyle = statusStyles[event.status];

  return (
    <div className="w-[300px] sm:w-80 h-full border-l border-gray-200 bg-white overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.label}
        </span>
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
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserIcon className="w-4 h-4" /><span>{event.enrolled}/{event.capacity} students</span>
          </div>
        </div>
      </div>

      {event.students.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Enrolled Students</h3>
          <div className="space-y-2">
            {event.students.map((student) => (
              <div
                key={student.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  student.attended === true ? "bg-green-50" :
                  student.attended === false ? "bg-red-50" : "bg-gray-50"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary-700">{student.initials}</span>
                </div>
                <span className="text-sm text-gray-900 flex-1">{student.name}</span>
                {student.attended === true && (
                  <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {student.attended === false && (
                  <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
            ))}
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
            <button onClick={onTakeAttendance} className="w-full flex items-center gap-3 px-4 py-3 text-left bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div><p className="font-medium">Take Attendance</p><p className="text-xs opacity-75">Mark students present</p></div>
            </button>
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
          <button onClick={onViewStudents} className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div><p className="font-medium text-gray-900">View Students</p><p className="text-xs text-gray-500">See all enrolled students</p></div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherClassesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date(2024, 11, 26));
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(null);
  const [events] = useState<ClassEvent[]>(mockEvents);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStartClassModal, setShowStartClassModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);

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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Classes</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your classes and track attendance</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="sm:inline">Create Class</span>
          </button>
        </div>
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
        <div className="relative self-end sm:self-auto">
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
          {viewMode === "week" && <WeekView events={events} selectedDate={selectedDate} onEventClick={setSelectedEvent} selectedEventId={selectedEvent?.id} onDayClick={(date) => { setSelectedDate(date); setViewMode("day"); }} />}
          {viewMode === "month" && <MonthView events={events} selectedDate={selectedDate} onEventClick={setSelectedEvent} selectedEventId={selectedEvent?.id} onDayClick={(date) => { setSelectedDate(date); setViewMode("day"); }} />}
          {viewMode === "day" && <WeekView events={events} selectedDate={selectedDate} onEventClick={setSelectedEvent} selectedEventId={selectedEvent?.id} onDayClick={(date) => { setSelectedDate(date); }} />}
        </div>
        {/* Mobile overlay */}
        {selectedEvent && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedEvent(null)}
          />
        )}
        {/* Sidebar - hidden on mobile unless event selected, always visible on desktop */}
        <div className={`
          fixed lg:static inset-y-0 right-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${selectedEvent ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <EventDetailsSidebar
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onStartClass={handleStartClass}
            onTakeAttendance={handleTakeAttendance}
            onViewReport={handleViewReport}
            onViewStudents={handleViewStudents}
          />
        </div>
      </div>

      <CreateClassModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <StartClassModal
        isOpen={showStartClassModal}
        onClose={() => setShowStartClassModal(false)}
        event={selectedEvent}
        onConfirm={() => console.log("Class started")}
      />
      <TakeAttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        event={selectedEvent}
        onSave={(attendance) => console.log("Attendance saved:", attendance)}
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
    </div>
  );
}
