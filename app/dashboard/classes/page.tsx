"use client";

import { useState } from "react";
import {
  PlusIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronIcon,
  CalendarIcon,
  UserIcon,
  TrashIcon,
  EditIcon,
  ExpandIcon,
  CloseIcon,
  CheckCircleIcon,
} from "@/components/icons";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// Types
interface Attendee {
  id: string;
  name: string;
  avatar?: string;
  status: "yes" | "no" | "awaiting";
}

interface WaitlistItem {
  id: string;
  name: string;
  avatar?: string;
  action: string;
  actionLink?: string;
  actionLinkText?: string;
  time: string;
  isOnline?: boolean;
}

interface ClassEvent {
  id: string;
  title: string;
  instructor?: string;
  start: Date;
  end: Date;
  color: "purple" | "gray" | "pink" | "orange" | "green" | "blue" | "red";
  attendees?: Attendee[];
  waitlist?: WaitlistItem[];
}

// Mock data
const mockEvents: ClassEvent[] = [
  {
    id: "1",
    title: "Friday standup",
    start: new Date(2025, 0, 10, 9, 0),
    end: new Date(2025, 0, 10, 9, 30),
    color: "gray",
  },
  {
    id: "2",
    title: "Olivia x Riley",
    start: new Date(2025, 0, 10, 10, 0),
    end: new Date(2025, 0, 10, 11, 0),
    color: "purple",
  },
  {
    id: "3",
    title: "Pilates",
    instructor: "Ines",
    start: new Date(2025, 0, 10, 13, 30),
    end: new Date(2025, 0, 10, 15, 30),
    color: "purple",
    attendees: [
      { id: "1", name: "Ana", status: "yes" },
      { id: "2", name: "Olivia", status: "yes" },
      { id: "3", name: "Riley", status: "no" },
      { id: "4", name: "Jordan", status: "awaiting" },
    ],
    waitlist: [
      {
        id: "1",
        name: "Lana Steiner",
        action: "Invited",
        actionLinkText: "Alisa Hester",
        actionLink: "#",
        time: "2 mins ago",
        isOnline: true,
      },
      {
        id: "2",
        name: "Demi Wikinson",
        action: "Invited",
        actionLinkText: "Alisa Hester",
        actionLink: "#",
        time: "2 mins ago",
        isOnline: true,
      },
      {
        id: "3",
        name: "Candice Wu",
        action: "Commented in",
        actionLinkText: "Marketing site redesign",
        actionLink: "#",
        time: "3 hours ago",
        isOnline: true,
      },
      {
        id: "4",
        name: "Candice Wu",
        action: "Was added to",
        actionLinkText: "Marketing site redesign",
        actionLink: "#",
        time: "3 hours ago",
        isOnline: false,
      },
      {
        id: "5",
        name: "Natali Craig",
        action: "Added 3 labels to the project",
        actionLinkText: "Marketing site redesign",
        actionLink: "#",
        time: "6 hours ago",
        isOnline: false,
      },
    ],
  },
  {
    id: "4",
    title: "Pilates",
    instructor: "Ana",
    start: new Date(2025, 0, 10, 13, 30),
    end: new Date(2025, 0, 10, 15, 30),
    color: "purple",
    attendees: [],
    waitlist: [],
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

// Avatar component
function Avatar({ name, avatar, size = "md", showOnline }: { name: string; avatar?: string; size?: "sm" | "md"; showOnline?: boolean }) {
  const sizeClasses = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const colors = ["bg-purple-500", "bg-pink-500", "bg-blue-500", "bg-green-500", "bg-orange-500"];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div className="relative">
      {avatar ? (
        <img src={avatar} alt={name} className={`${sizeClasses} rounded-full object-cover`} />
      ) : (
        <div className={`${sizeClasses} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium`}>
          {initials}
        </div>
      )}
      {showOnline !== undefined && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${showOnline ? "bg-green-500" : "bg-gray-300"}`} />
      )}
    </div>
  );
}

// Avatar group component
function AvatarGroup({ attendees, max = 4 }: { attendees: Attendee[]; max?: number }) {
  const displayed = attendees.slice(0, max);
  const remaining = attendees.length - max;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {displayed.map((attendee) => (
          <div key={attendee.id} className="ring-2 ring-white rounded-full">
            <Avatar name={attendee.name} avatar={attendee.avatar} size="sm" />
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <span className="ml-2 text-sm text-gray-500 font-medium">OR</span>
      )}
      <button className="ml-2 w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors">
        <PlusIcon className="w-4 h-4" />
      </button>
    </div>
  );
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

// Event details modal
function EventDetailsModal({ event, onClose }: { event: ClassEvent; onClose: () => void }) {
  const attendeeCounts = {
    yes: event.attendees?.filter((a) => a.status === "yes").length || 0,
    no: event.attendees?.filter((a) => a.status === "no").length || 0,
    awaiting: event.attendees?.filter((a) => a.status === "awaiting").length || 0,
  };
  const totalAttendees = event.attendees?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{event.title}</h2>
            <div className="flex items-center gap-1">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                <TrashIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                <EditIcon className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded ml-2">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Event info */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <CalendarIcon className="w-5 h-5" />
              <span>{formatDate(event.start)}</span>
            </div>
            {event.instructor && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <UserIcon className="w-5 h-5" />
                <span>Instructor: {event.instructor}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
            </div>
          </div>

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="mt-6">
              <AvatarGroup attendees={event.attendees} />
              <div className="mt-3 text-sm text-gray-600">
                <span className="font-medium">{totalAttendees} attendees</span>
                <span className="ml-4">{attendeeCounts.yes} yes</span>
                <span className="ml-4">{attendeeCounts.no} no</span>
                <span className="ml-4">{attendeeCounts.awaiting} awaiting</span>
              </div>
            </div>
          )}
        </div>

        {/* Waitlist */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Wait list</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="6" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="18" r="2" />
              </svg>
            </button>
          </div>

          {!event.waitlist || event.waitlist.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No one on the waitlist</p>
            </div>
          ) : (
            <div className="space-y-4">
              {event.waitlist.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <Avatar name={item.name} avatar={item.avatar} showOnline={item.isOnline} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{item.name}</span>
                      <span className="text-xs text-gray-500">{item.time}</span>
                      {item.isOnline && <span className="w-2 h-2 rounded-full bg-green-500" />}
                    </div>
                    <p className="text-sm text-gray-600">
                      {item.action}{" "}
                      {item.actionLinkText && (
                        <a href={item.actionLink} className="text-primary-600 hover:underline">
                          {item.actionLinkText}
                        </a>
                      )}
                      {item.action.includes("team") && " to the team"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Delete confirmation modal
function DeleteConfirmModal({ event, onClose, onConfirm }: { event: ClassEvent; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          {/* Icon */}
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <TrashIcon className="w-6 h-6 text-red-600" />
          </div>

          {/* Content */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete class</h3>
            <p className="text-gray-600">
              Are you sure you want to delete the class <strong>{event.title}</strong>? This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <button
              onClick={onConfirm}
              className="px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Edit event modal
function EditEventModal({ event, onClose, onSave }: { event: ClassEvent; onClose: () => void; onSave: (data: { title: string; instructor: string; date: string; startTime: string; endTime: string }) => void }) {
  const [title, setTitle] = useState(event.title);
  const [instructor, setInstructor] = useState(event.instructor || "");
  const [date, setDate] = useState(event.start.toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState(
    event.start.toTimeString().slice(0, 5)
  );
  const [endTime, setEndTime] = useState(
    event.end.toTimeString().slice(0, 5)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, instructor, date, startTime, endTime });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          {/* Icon */}
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Edit class</h3>
            <p className="text-gray-600 text-sm mt-1">
              Update the class information below.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class name</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pilates"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
              <Input
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="e.g. Ana"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" fullWidth onClick={onClose} type="button">
                Cancel
              </Button>
              <Button fullWidth type="submit">
                Save
              </Button>
            </div>
          </form>
        </div>

        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600">
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Event details sidebar
function EventDetailsSidebar({ event, onExpand, onDelete, onEdit }: { event: ClassEvent | null; onExpand: () => void; onDelete: () => void; onEdit: () => void }) {
  if (!event) {
    return (
      <div className="w-80 border-l border-gray-200 p-6 flex items-center justify-center text-gray-500">
        <p>Select an event to see details</p>
      </div>
    );
  }

  const attendeeCounts = {
    yes: event.attendees?.filter((a) => a.status === "yes").length || 0,
    no: event.attendees?.filter((a) => a.status === "no").length || 0,
    awaiting: event.attendees?.filter((a) => a.status === "awaiting").length || 0,
  };
  const totalAttendees = event.attendees?.length || 0;

  return (
    <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>
          <div className="flex items-center gap-1">
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
              <TrashIcon className="w-4 h-4" />
            </button>
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
              <EditIcon className="w-4 h-4" />
            </button>
            <button onClick={onExpand} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
              <ExpandIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

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

        {/* Attendees */}
        {event.attendees && event.attendees.length > 0 && (
          <div className="mt-4">
            <AvatarGroup attendees={event.attendees} />
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">{totalAttendees} attendees</span>
              <span className="ml-3">{attendeeCounts.yes} yes</span>
              <span className="ml-3">{attendeeCounts.no} no</span>
              <span className="ml-3">{attendeeCounts.awaiting} awaiting</span>
            </div>
          </div>
        )}
      </div>

      {/* Waitlist */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Wait list</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="6" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="18" r="2" />
            </svg>
          </button>
        </div>

        {!event.waitlist || event.waitlist.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Nenhuma pessoa na lista de espera</p>
          </div>
        ) : (
          <div className="space-y-4">
            {event.waitlist.map((item) => (
              <div key={item.id} className="flex gap-3">
                <Avatar name={item.name} avatar={item.avatar} showOnline={item.isOnline} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500">{item.time}</span>
                    {item.isOnline && <span className="w-2 h-2 rounded-full bg-green-500" />}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {item.action}{" "}
                    {item.actionLinkText && (
                      <a href={item.actionLink} className="text-primary-600 hover:underline">
                        {item.actionLinkText}
                      </a>
                    )}
                    {item.action.includes("team") && " to the team"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 0, 10));
  const [selectedEvent, setSelectedEvent] = useState<ClassEvent | null>(mockEvents[2]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [events, setEvents] = useState<ClassEvent[]>(mockEvents);

  const goToToday = () => setSelectedDate(new Date());
  const goToPrevDay = () => setSelectedDate((d) => new Date(d.getTime() - 86400000));
  const goToNextDay = () => setSelectedDate((d) => new Date(d.getTime() + 86400000));

  const handleEventClick = (event: ClassEvent) => {
    setSelectedEvent(event);
  };

  const handleExpand = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedEvent) {
      setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
      setSelectedEvent(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (data: { title: string; instructor: string; date: string; startTime: string; endTime: string }) => {
    if (selectedEvent) {
      const [year, month, day] = data.date.split("-").map(Number);
      const [startHour, startMin] = data.startTime.split(":").map(Number);
      const [endHour, endMin] = data.endTime.split(":").map(Number);

      const updatedEvent: ClassEvent = {
        ...selectedEvent,
        title: data.title,
        instructor: data.instructor || undefined,
        start: new Date(year, month - 1, day, startHour, startMin),
        end: new Date(year, month - 1, day, endHour, endMin),
      };

      setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? updatedEvent : e)));
      setSelectedEvent(updatedEvent);
      setIsEditModalOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-semibold text-gray-900">Classes</h1>
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

          {/* Loading indicator placeholder */}
          <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
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

          {/* Add event button */}
          <Button leftIcon={<PlusIcon className="w-5 h-5" />}>
            Add event
          </Button>
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
          onExpand={handleExpand}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>

      {/* Expand Modal */}
      {isModalOpen && selectedEvent && (
        <EventDetailsModal event={selectedEvent} onClose={handleCloseModal} />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedEvent && (
        <DeleteConfirmModal
          event={selectedEvent}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
