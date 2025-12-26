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
interface Attendee {
  id: string;
  name: string;
  avatar?: string;
  status: "yes" | "no" | "awaiting";
}

interface ClassEvent {
  id: string;
  title: string;
  instructor?: string;
  start: Date;
  end: Date;
  color: "purple" | "gray" | "pink" | "orange" | "green" | "blue" | "red";
  attendees?: Attendee[];
  status: "scheduled" | "completed" | "cancelled";
}

// Mock data - client's enrolled classes
const mockEvents: ClassEvent[] = [
  {
    id: "1",
    title: "Morning Yoga",
    instructor: "Ana",
    start: new Date(2025, 0, 10, 9, 0),
    end: new Date(2025, 0, 10, 10, 0),
    color: "purple",
    status: "scheduled",
    attendees: [
      { id: "1", name: "Olivia", status: "yes" },
    ],
  },
  {
    id: "2",
    title: "Pilates",
    instructor: "Maria",
    start: new Date(2025, 0, 10, 14, 0),
    end: new Date(2025, 0, 10, 15, 0),
    color: "purple",
    status: "scheduled",
    attendees: [
      { id: "1", name: "Olivia", status: "yes" },
    ],
  },
  {
    id: "3",
    title: "Evening Stretch",
    instructor: "Ana",
    start: new Date(2025, 0, 11, 18, 0),
    end: new Date(2025, 0, 11, 19, 0),
    color: "green",
    status: "scheduled",
    attendees: [
      { id: "1", name: "Olivia", status: "yes" },
    ],
  },
];

const colorStyles: Record<ClassEvent["color"], { bg: string; border: string; text: string }> = {
  purple: { bg: "bg-purple-50", border: "border-l-purple-500", text: "text-purple-700" },
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

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

// Day calendar component
function DayCalendar({ events, selectedDate, onEventClick, selectedEventId }: { events: ClassEvent[]; selectedDate: Date; onEventClick: (event: ClassEvent) => void; selectedEventId?: string }) {
  const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM
  const dayEvents = events.filter(
    (e) => e.start.toDateString() === selectedDate.toDateString()
  );

  const getEventStyle = (event: ClassEvent) => {
    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    const top = (startHour - 8) * 64; // 64px per hour
    const height = (endHour - startHour) * 64;
    return { top: `${top}px`, height: `${height}px` };
  };

  // Group overlapping events
  const groupedEvents: ClassEvent[][] = [];
  dayEvents.forEach((event) => {
    let added = false;
    for (const group of groupedEvents) {
      const overlaps = group.some(
        (e) => event.start < e.end && event.end > e.start
      );
      if (overlaps) {
        group.push(event);
        added = true;
        break;
      }
    }
    if (!added) {
      groupedEvents.push([event]);
    }
  });

  return (
    <div className="relative">
      {/* Time grid */}
      <div className="relative">
        {hours.map((hour) => (
          <div key={hour} className="flex h-16 border-b border-gray-100">
            <div className="w-16 pr-3 text-right text-xs text-gray-500 -mt-2">
              {hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
            <div className="flex-1 border-l border-gray-200" />
          </div>
        ))}

        {/* Current time indicator */}
        <CurrentTimeIndicator />

        {/* Events */}
        <div className="absolute left-16 right-0 top-0">
          {groupedEvents.map((group) =>
            group.map((event, idx) => {
              const style = getEventStyle(event);
              const width = `calc(${100 / group.length}% - 4px)`;
              const left = `calc(${(idx * 100) / group.length}% + 2px)`;
              const colors = colorStyles[event.color];
              const isSelected = event.id === selectedEventId;

              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`absolute p-2 rounded-lg border-l-4 ${colors.bg} ${colors.border} ${colors.text} text-left transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary-500 shadow-md" : ""}`}
                  style={{ ...style, width, left }}
                >
                  <div className="font-medium text-sm truncate">{event.title}</div>
                  {event.instructor && (
                    <div className="text-xs opacity-75">Instructor: {event.instructor}</div>
                  )}
                  <div className="text-xs opacity-75">{formatTime(event.start)}</div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Current time indicator
function CurrentTimeIndicator() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (hours < 8 || hours > 18) return null;

  const top = (hours - 8 + minutes / 60) * 64;
  const timeStr = formatTime(now);

  return (
    <div className="absolute left-0 right-0 flex items-center z-10" style={{ top: `${top}px` }}>
      <div className="w-16 pr-2 text-right text-xs text-primary-600 font-medium">{timeStr}</div>
      <div className="w-2 h-2 rounded-full bg-primary-600" />
      <div className="flex-1 h-0.5 bg-primary-600" />
    </div>
  );
}

// Mock instructor availability data
const instructorAvailability: Record<string, { day: string; slots: { time: string; available: boolean }[] }[]> = {
  "Ana": [
    { day: "Monday", slots: [{ time: "9:00 AM", available: true }, { time: "10:00 AM", available: false }, { time: "2:00 PM", available: true }, { time: "5:00 PM", available: true }] },
    { day: "Tuesday", slots: [{ time: "10:00 AM", available: true }, { time: "3:00 PM", available: true }] },
    { day: "Wednesday", slots: [{ time: "9:00 AM", available: false }, { time: "2:00 PM", available: true }, { time: "5:00 PM", available: true }] },
    { day: "Thursday", slots: [{ time: "10:00 AM", available: true }, { time: "4:00 PM", available: true }] },
    { day: "Friday", slots: [{ time: "9:00 AM", available: true }, { time: "11:00 AM", available: true }] },
  ],
  "Maria": [
    { day: "Monday", slots: [{ time: "8:00 AM", available: true }, { time: "11:00 AM", available: true }, { time: "3:00 PM", available: false }] },
    { day: "Tuesday", slots: [{ time: "9:00 AM", available: true }, { time: "1:00 PM", available: true }, { time: "4:00 PM", available: true }] },
    { day: "Wednesday", slots: [{ time: "10:00 AM", available: true }, { time: "2:00 PM", available: false }] },
    { day: "Thursday", slots: [{ time: "9:00 AM", available: true }, { time: "11:00 AM", available: true }, { time: "3:00 PM", available: true }] },
    { day: "Friday", slots: [{ time: "10:00 AM", available: true }, { time: "2:00 PM", available: true }] },
  ],
};

// Request Modal Component
type RequestType = "cancel" | "reschedule" | "change-instructor";

function RequestModal({
  type,
  event,
  onClose,
  onSubmit
}: {
  type: RequestType;
  event: ClassEvent;
  onClose: () => void;
  onSubmit: (reason: string, preferredDate?: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const titles: Record<RequestType, string> = {
    cancel: "Request Cancellation",
    reschedule: "Request Reschedule",
    "change-instructor": "Request Instructor Change",
  };

  const descriptions: Record<RequestType, string> = {
    cancel: "Please let us know why you need to cancel this class. Your request will be reviewed by our team.",
    reschedule: "Select your preferred time slot from the instructor's available schedule.",
    "change-instructor": "Please let us know why you'd like to change instructors. We'll do our best to accommodate your request.",
  };

  const placeholders: Record<RequestType, string> = {
    cancel: "I need to cancel because...",
    reschedule: "Additional notes (optional)...",
    "change-instructor": "I would like to change instructors because...",
  };

  // Get instructor availability
  const availability = event.instructor ? instructorAvailability[event.instructor] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "reschedule" && !selectedSlot) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSuccess(true);

    // Close modal after showing success
    setTimeout(() => {
      const preferredDate = selectedSlot ? `${selectedSlot.day} at ${selectedSlot.time}` : undefined;
      onSubmit(reason, preferredDate);
      onClose();
    }, 1500);
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
          <p className="text-gray-600">Your request has been sent. We'll get back to you soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{titles[type]}</h3>
          <p className="text-sm text-gray-600 mb-4">{descriptions[type]}</p>

          {/* Class info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="font-medium text-gray-900">{event.title}</p>
            <p className="text-sm text-gray-600">
              {formatDate(event.start)} • {formatTime(event.start)} - {formatTime(event.end)}
            </p>
            {event.instructor && (
              <p className="text-sm text-gray-600">Instructor: {event.instructor}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === "reschedule" && availability.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {event.instructor}'s Available Slots
                </label>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availability.map((day) => (
                    <div key={day.day} className="border border-gray-200 rounded-lg p-3">
                      <p className="font-medium text-gray-900 text-sm mb-2">{day.day}</p>
                      <div className="flex flex-wrap gap-2">
                        {day.slots.map((slot) => {
                          const isSelected = selectedSlot?.day === day.day && selectedSlot?.time === slot.time;
                          return (
                            <button
                              key={`${day.day}-${slot.time}`}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedSlot({ day: day.day, time: slot.time })}
                              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                !slot.available
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                                  : isSelected
                                  ? "bg-primary-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700"
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedSlot && (
                  <p className="text-sm text-primary-600 mt-2">
                    Selected: {selectedSlot.day} at {selectedSlot.time}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === "reschedule" ? "Additional Notes" : "Reason"}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={placeholders[type]}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                required={type !== "reschedule"}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={onClose} type="button">
                Cancel
              </Button>
              <Button
                fullWidth
                type="submit"
                disabled={isSubmitting || (type === "reschedule" && !selectedSlot)}
              >
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

// Instructor Schedule Modal
function InstructorScheduleModal({ instructor, onClose }: { instructor: string; onClose: () => void }) {
  // Mock instructor schedule
  const schedule = [
    { day: "Monday", times: ["9:00 AM - 10:00 AM", "2:00 PM - 3:00 PM", "5:00 PM - 6:00 PM"] },
    { day: "Tuesday", times: ["10:00 AM - 11:00 AM", "3:00 PM - 4:00 PM"] },
    { day: "Wednesday", times: ["9:00 AM - 10:00 AM", "2:00 PM - 3:00 PM", "5:00 PM - 6:00 PM"] },
    { day: "Thursday", times: ["10:00 AM - 11:00 AM", "4:00 PM - 5:00 PM"] },
    { day: "Friday", times: ["9:00 AM - 10:00 AM", "11:00 AM - 12:00 PM"] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{instructor}'s Schedule</h3>
              <p className="text-sm text-gray-600">Available class times</p>
            </div>
          </div>

          <div className="space-y-4">
            {schedule.map((day) => (
              <div key={day.day} className="border-b border-gray-100 pb-3 last:border-0">
                <p className="font-medium text-gray-900 mb-2">{day.day}</p>
                <div className="flex flex-wrap gap-2">
                  {day.times.map((time, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg"
                    >
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button variant="secondary" fullWidth onClick={onClose} className="mt-6">
            Close
          </Button>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Event details sidebar for clients (view-only with request actions)
function EventDetailsSidebar({
  event,
  onRequestCancel,
  onRequestReschedule,
  onRequestChangeInstructor,
  onViewInstructorSchedule
}: {
  event: ClassEvent | null;
  onRequestCancel: () => void;
  onRequestReschedule: () => void;
  onRequestChangeInstructor: () => void;
  onViewInstructorSchedule: () => void;
}) {
  if (!event) {
    return (
      <div className="w-80 border-l border-gray-200 p-6 flex items-center justify-center text-gray-500">
        <p>Select a class to see details</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>

        {/* Status badge */}
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
          event.status === "scheduled" ? "bg-green-100 text-green-700" :
          event.status === "completed" ? "bg-gray-100 text-gray-700" :
          "bg-red-100 text-red-700"
        }`}>
          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </span>

        {/* Event info */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" />
            <span>{formatDate(event.start)}</span>
          </div>
          {event.instructor && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="w-4 h-4" />
              <span>Instructor: {event.instructor}</span>
              <button
                onClick={onViewInstructorSchedule}
                className="text-primary-600 hover:text-primary-700 text-xs underline ml-auto"
              >
                View schedule
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
          </div>
        </div>
      </div>

      {/* Actions for clients */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>

        <div className="space-y-3">
          <button
            onClick={onRequestReschedule}
            className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Request Reschedule</p>
              <p className="text-xs text-gray-500">Ask to move to another time</p>
            </div>
          </button>

          <button
            onClick={onRequestChangeInstructor}
            className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Request Instructor Change</p>
              <p className="text-xs text-gray-500">Ask to switch to another instructor</p>
            </div>
          </button>

          <button
            onClick={onRequestCancel}
            className="w-full flex items-center gap-3 px-4 py-3 text-left border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <CloseIcon className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-700">Request Cancellation</p>
              <p className="text-xs text-red-500">Ask to cancel this class</p>
            </div>
          </button>
        </div>

        {/* Info note */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> All requests are subject to approval. You'll receive a notification once your request has been reviewed.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 0, 10));
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(mockEvents[0]);
  const [events] = useState<ClassEvent[]>(mockEvents);

  // Modal states
  const [requestModal, setRequestModal] = useState<{ type: RequestType; event: ClassEvent } | null>(null);
  const [instructorScheduleModal, setInstructorScheduleModal] = useState<string | null>(null);

  const goToToday = () => setSelectedDate(new Date());
  const goToPrevDay = () => setSelectedDate((d) => new Date(d.getTime() - 86400000));
  const goToNextDay = () => setSelectedDate((d) => new Date(d.getTime() + 86400000));

  const handleEventClick = (event: ClassEvent) => {
    setSelectedEvent(event);
  };

  const handleRequestCancel = () => {
    if (selectedEvent) {
      setRequestModal({ type: "cancel", event: selectedEvent });
    }
  };

  const handleRequestReschedule = () => {
    if (selectedEvent) {
      setRequestModal({ type: "reschedule", event: selectedEvent });
    }
  };

  const handleRequestChangeInstructor = () => {
    if (selectedEvent) {
      setRequestModal({ type: "change-instructor", event: selectedEvent });
    }
  };

  const handleViewInstructorSchedule = () => {
    if (selectedEvent?.instructor) {
      setInstructorScheduleModal(selectedEvent.instructor);
    }
  };

  const handleRequestSubmit = (reason: string, preferredDate?: string) => {
    // In a real app, this would send the request to the API
    console.log("Request submitted:", { type: requestModal?.type, reason, preferredDate });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-semibold text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-1">View and manage your scheduled classes</p>
      </div>

      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Date badge */}
          <div className="flex items-center gap-3 bg-primary-50 rounded-lg px-3 py-2">
            <span className="text-xs text-primary-600 font-medium uppercase">
              {selectedDate.toLocaleDateString("en-US", { month: "short" })}
            </span>
            <span className="text-2xl font-bold text-primary-700">
              {selectedDate.getDate()}
            </span>
          </div>

          {/* Date text */}
          <div>
            <p className="font-semibold text-gray-900">
              {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
            <p className="text-sm text-gray-500">{formatShortDate(selectedDate)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={goToPrevDay}
              className="p-2 hover:bg-gray-50 rounded-l-lg border-r border-gray-300"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Today
            </button>
            <button
              onClick={goToNextDay}
              className="p-2 hover:bg-gray-50 rounded-r-lg border-l border-gray-300"
            >
              <ArrowRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* View mode selector */}
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <span>Day view</span>
              <ChevronIcon className="w-4 h-4" direction="down" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <DayCalendar
            events={events}
            selectedDate={selectedDate}
            onEventClick={handleEventClick}
            selectedEventId={selectedEvent?.id}
          />
        </div>

        {/* Sidebar */}
        <EventDetailsSidebar
          event={selectedEvent}
          onRequestCancel={handleRequestCancel}
          onRequestReschedule={handleRequestReschedule}
          onRequestChangeInstructor={handleRequestChangeInstructor}
          onViewInstructorSchedule={handleViewInstructorSchedule}
        />
      </div>

      {/* Request Modal */}
      {requestModal && (
        <RequestModal
          type={requestModal.type}
          event={requestModal.event}
          onClose={() => setRequestModal(null)}
          onSubmit={handleRequestSubmit}
        />
      )}

      {/* Instructor Schedule Modal */}
      {instructorScheduleModal && (
        <InstructorScheduleModal
          instructor={instructorScheduleModal}
          onClose={() => setInstructorScheduleModal(null)}
        />
      )}
    </div>
  );
}
