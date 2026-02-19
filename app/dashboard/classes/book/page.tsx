"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  UserIcon,
  CloseIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@/components/icons";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

interface AvailableClass {
  _id: string;
  title: string;
  type: string;
  instructorId: string;
  instructorName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentEnrollment: number;
  availableSpots: number;
  isFull: boolean;
  location?: string;
  description?: string;
}

interface BookingState {
  loading: boolean;
  error: string | null;
  success: boolean;
  bookingId?: string;
}

const classTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  pilates: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  yoga: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  stretching: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  meditation: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  other: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
};

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay());

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Confirmation Modal Component
function ConfirmBookingModal({
  classInfo,
  onConfirm,
  onCancel,
  bookingState,
}: {
  classInfo: AvailableClass;
  onConfirm: () => void;
  onCancel: () => void;
  bookingState: BookingState;
}) {
  if (bookingState.success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Class booked successfully!
          </h3>
          <p className="text-gray-600 mb-4">
            Your {classInfo.title} class has been confirmed for{" "}
            {formatDate(classInfo.scheduledDate)} at {classInfo.startTime}.
          </p>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-green-800">
              You will receive a WhatsApp reminder 24h before the class.
            </p>
          </div>
          <Button fullWidth onClick={onCancel}>
            View My Classes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Confirm Booking
          </h3>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">{classInfo.title}</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  {formatDate(classInfo.scheduledDate)} at {classInfo.startTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span>Instructor: {classInfo.instructorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>
                  {classInfo.availableSpots} spots available
                </span>
              </div>
            </div>
          </div>

          {bookingState.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {bookingState.error}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-4">
            <p className="text-sm text-amber-800">
              <strong>Cancellation policy:</strong> Cancellations must be made
              at least 12 hours in advance for a credit refund.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={onCancel}>
              Back
            </Button>
            <Button
              fullWidth
              onClick={onConfirm}
              disabled={bookingState.loading}
            >
              {bookingState.loading ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Class Card Component with inline waitlist
function ClassCard({
  classInfo,
  onSelect,
  isSelected,
  onJoinWaitlist,
  waitlistJoining,
  waitlistJoined,
}: {
  classInfo: AvailableClass;
  onSelect: (c: AvailableClass) => void;
  isSelected: boolean;
  onJoinWaitlist: (classInfo: AvailableClass) => void;
  waitlistJoining: string | null;
  waitlistJoined: Record<string, { position: number; total: number }>;
}) {
  const colors = classTypeColors[classInfo.type] || classTypeColors.other;
  const spotsText =
    classInfo.availableSpots === 0
      ? "Full"
      : classInfo.availableSpots === 1
      ? "1 spot left!"
      : classInfo.availableSpots <= 2
      ? `Only ${classInfo.availableSpots} spots left`
      : `${classInfo.availableSpots} spots`;

  const joined = waitlistJoined[classInfo._id];
  const isJoining = waitlistJoining === classInfo._id;

  return (
    <div
      onClick={() => !classInfo.isFull && onSelect(classInfo)}
      role={classInfo.isFull ? undefined : "button"}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200"
          : classInfo.isFull
          ? "border-gray-200 bg-gray-50"
          : `${colors.border} ${colors.bg} hover:shadow-md cursor-pointer`
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className={`font-semibold ${classInfo.isFull ? "text-gray-700" : colors.text}`}>{classInfo.title}</h4>
          <p className="text-sm text-gray-600">{classInfo.instructorName}</p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            classInfo.isFull
              ? "bg-red-100 text-red-700"
              : classInfo.availableSpots <= 2
              ? "bg-amber-100 text-amber-700 animate-pulse"
              : "bg-green-100 text-green-700"
          }`}
        >
          {spotsText}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <polyline points="12 6 12 12 16 14" strokeWidth="2" />
          </svg>
          {classInfo.startTime} - {classInfo.endTime}
        </span>
        {classInfo.location && (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {classInfo.location}
          </span>
        )}
      </div>

      {/* Inline Waitlist - No redirect, zero friction */}
      {classInfo.isFull && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {joined ? (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-medium">
                You&apos;re #{joined.position} of {joined.total} — we&apos;ll WhatsApp you when a spot opens
              </span>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoinWaitlist(classInfo);
              }}
              disabled={isJoining}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
            >
              {isJoining ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Notify me when a spot opens
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Filters Component
function ClassFilters({
  selectedType,
  onTypeChange,
  selectedInstructor,
  onInstructorChange,
  instructors,
}: {
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedInstructor: string;
  onInstructorChange: (instructor: string) => void;
  instructors: { id: string; name: string }[];
}) {
  const types = [
    { id: "all", label: "All" },
    { id: "pilates", label: "Pilates" },
    { id: "yoga", label: "Yoga" },
    { id: "stretching", label: "Stretching" },
    { id: "meditation", label: "Meditation" },
  ];

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Class type
        </label>
        <div className="flex flex-wrap gap-2">
          {types.map((type) => (
            <button
              key={type.id}
              onClick={() => onTypeChange(type.id)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedType === type.id
                  ? "bg-primary-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {instructors.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instructor
          </label>
          <select
            value={selectedInstructor}
            onChange={(e) => onInstructorChange(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All</option>
            {instructors.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export default function BookClassPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(new Date());
  const [classes, setClasses] = useState<AvailableClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<AvailableClass | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedInstructor, setSelectedInstructor] = useState("all");
  const [bookingState, setBookingState] = useState<BookingState>({
    loading: false,
    error: null,
    success: false,
  });
  const [waitlistJoining, setWaitlistJoining] = useState<string | null>(null);
  const [waitlistJoined, setWaitlistJoined] = useState<Record<string, { position: number; total: number }>>({});

  const clientId = user?.id || "";

  // Inline waitlist join - zero friction, no redirect
  const handleJoinWaitlist = async (classInfo: AvailableClass) => {
    setWaitlistJoining(classInfo._id);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: classInfo._id,
          className: classInfo.title,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWaitlistJoined((prev) => ({
          ...prev,
          [classInfo._id]: {
            position: data.entry.position,
            total: data.entry.totalInQueue || data.entry.position,
          },
        }));
      }
    } catch (err) {
      console.error("Error joining waitlist:", err);
    } finally {
      setWaitlistJoining(null);
    }
  };

  // Fetch available classes
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        hasAvailability: "false", // Show all classes
      });

      // Add date range for the week
      const start = new Date(weekStart);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      params.set("dateFrom", start.toISOString());
      params.set("dateTo", end.toISOString());

      if (selectedType !== "all") {
        params.set("type", selectedType);
      }

      if (selectedInstructor !== "all") {
        params.set("instructorId", selectedInstructor);
      }

      const response = await fetch(`/api/bookings/available?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  }, [weekStart, selectedType, selectedInstructor]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Get unique instructors from classes
  const instructors = Array.from(
    new Map(classes.map((c) => [c.instructorId, { id: c.instructorId, name: c.instructorName }])).values()
  );

  // Filter classes by selected date
  const classesForSelectedDate = classes.filter((c) =>
    isSameDay(new Date(c.scheduledDate), selectedDate)
  );

  // Week navigation
  const goToPrevWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStart(newDate);
    setSelectedDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStart(newDate);
    setSelectedDate(newDate);
  };

  // Handle booking
  const handleBookClass = async () => {
    if (!selectedClass) return;

    setBookingState({ loading: true, error: null, success: false });

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          classId: selectedClass._id,
          source: "web",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setBookingState({
          loading: false,
          error: data.error || "Failed to book class",
          success: false,
        });
        return;
      }

      setBookingState({
        loading: false,
        error: null,
        success: true,
        bookingId: data.booking._id,
      });

      // Refresh classes list
      fetchClasses();
    } catch {
      setBookingState({
        loading: false,
        error: "Connection error. Please try again.",
        success: false,
      });
    }
  };

  const weekDates = getWeekDates(weekStart);

  // Count classes per day for indicators
  const classCountByDay = weekDates.map((date) => ({
    date,
    count: classes.filter((c) => isSameDay(new Date(c.scheduledDate), date)).length,
    hasAvailable: classes.some(
      (c) => isSameDay(new Date(c.scheduledDate), date) && !c.isFull
    ),
  }));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Book a Class</h1>
            <p className="text-gray-600">Choose an available class to book</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <ClassFilters
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedInstructor={selectedInstructor}
          onInstructorChange={setSelectedInstructor}
          instructors={instructors}
        />
      </div>

      {/* Week Navigation */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevWeek}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => { setWeekStart(new Date()); setSelectedDate(new Date()); }}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowRightIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <span className="font-medium text-gray-900">
            {formatShortDate(weekDates[0])} - {formatShortDate(weekDates[6])}
          </span>
        </div>

        {/* Day Selector */}
        <div className="grid grid-cols-7 gap-2">
          {classCountByDay.map(({ date, count, hasAvailable }) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            const isPast = date < new Date() && !isToday;

            return (
              <button
                key={date.toISOString()}
                onClick={() => !isPast && setSelectedDate(date)}
                disabled={isPast}
                className={`p-3 rounded-lg text-center transition-all ${
                  isSelected
                    ? "bg-primary-600 text-white"
                    : isPast
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50"
                }`}
              >
                <div className="text-xs uppercase">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className={`text-lg font-semibold ${isToday && !isSelected ? "text-primary-600" : ""}`}>
                  {date.getDate()}
                </div>
                {count > 0 && (
                  <div
                    className={`text-xs mt-1 ${
                      isSelected
                        ? "text-primary-100"
                        : hasAvailable
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {count} {count === 1 ? "class" : "classes"}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Classes List */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : classesForSelectedDate.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No classes on this day
            </h3>
            <p className="text-gray-600 mb-1">
              There are no classes scheduled for {formatDate(selectedDate)}.
            </p>
            <p className="text-sm text-gray-500">
              Try selecting a different day to find available classes.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {formatDate(selectedDate)} - {classesForSelectedDate.length}{" "}
              {classesForSelectedDate.length === 1 ? "class available" : "classes available"}
            </h3>
            {classesForSelectedDate.map((classInfo) => (
              <ClassCard
                key={classInfo._id}
                classInfo={classInfo}
                onSelect={(c) => {
                  setSelectedClass(c);
                  setShowConfirmModal(true);
                  setBookingState({ loading: false, error: null, success: false });
                }}
                isSelected={selectedClass?._id === classInfo._id}
                onJoinWaitlist={handleJoinWaitlist}
                waitlistJoining={waitlistJoining}
                waitlistJoined={waitlistJoined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedClass && (
        <ConfirmBookingModal
          classInfo={selectedClass}
          onConfirm={handleBookClass}
          onCancel={() => {
            if (bookingState.success) {
              router.push("/dashboard/classes");
            } else {
              setShowConfirmModal(false);
              setSelectedClass(null);
            }
          }}
          bookingState={bookingState}
        />
      )}
    </div>
  );
}
