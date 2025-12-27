"use client";

import { useState } from "react";
import {
  ExternalLinkIcon,
  UserIcon,
  ClockIcon,
  CalendarIcon,
} from "@/components/icons";

// Types
interface ScheduledClass {
  id: string;
  title: string;
  instructor: string;
  instructorAvatar?: string;
  date: string;
  dayOfWeek: string;
  time: string;
  location: string;
  status: "confirmed" | "pending" | "completed" | "cancellation_requested" | "reschedule_requested";
}

interface Instructor {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  specialties: string[];
  nextAvailable: string;
}

// Mock user data (client - Olivia)
const mockUser = {
  name: "Olivia Rhye",
  avatar: undefined,
  initials: "OR",
  location: "Rio de Janeiro, Brazil",
  locationFlag: "🇧🇷",
  email: "olivia@flexitrack.net",
  phone: "55 21 99999 1234",
  plan: "Monthly - 8 classes",
  classesRemaining: 6,
  classesUsed: 2,
};

// Mock scheduled classes
const mockClasses: ScheduledClass[] = [
  {
    id: "1",
    title: "Pilates",
    instructor: "Maria Santos",
    date: "Dec 27, 2024",
    dayOfWeek: "Friday",
    time: "2:00 PM - 3:00 PM",
    location: "FlexiWell Centro",
    status: "confirmed",
  },
  {
    id: "2",
    title: "Pilates",
    instructor: "Maria Santos",
    date: "Dec 30, 2024",
    dayOfWeek: "Monday",
    time: "2:00 PM - 3:00 PM",
    location: "FlexiWell Centro",
    status: "confirmed",
  },
  {
    id: "3",
    title: "Yoga",
    instructor: "Ana Silva",
    date: "Jan 2, 2025",
    dayOfWeek: "Thursday",
    time: "10:00 AM - 11:00 AM",
    location: "FlexiWell Botafogo",
    status: "pending",
  },
];

// Mock instructor data - Maria Santos is Olivia's instructor
const currentInstructor: Instructor = {
  id: "2",
  name: "Maria Santos",
  initials: "MS",
  specialties: ["Pilates", "Yoga", "Stretching"],
  nextAvailable: "Dec 28, 2024 - 3:00 PM",
};

// Avatar component
function Avatar({ name, avatar, initials, size = "md" }: { name: string; avatar?: string; initials?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
  };
  const displayInitials = initials || name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const colors = ["bg-primary-500", "bg-pink-500", "bg-blue-500", "bg-green-500", "bg-orange-500"];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return avatar ? (
    <img src={avatar} alt={name} className={`${sizeClasses[size]} rounded-full object-cover`} />
  ) : (
    <div className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium`}>
      {displayInitials}
    </div>
  );
}

// Request Modal component
function RequestModal({
  isOpen,
  onClose,
  type,
  classData
}: {
  isOpen: boolean;
  onClose: () => void;
  type: "cancel" | "reschedule" | "change-instructor";
  classData?: ScheduledClass;
}) {
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const titles = {
    cancel: "Request Class Cancellation",
    reschedule: "Request Class Reschedule",
    "change-instructor": "Request Instructor Change",
  };

  const descriptions = {
    cancel: "Your request will be reviewed by our team. We'll notify you once it's processed.",
    reschedule: "Let us know your preferred new date/time and we'll try to accommodate.",
    "change-instructor": "Tell us about your preference and we'll find the best match for you.",
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setReason("");
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Submitted!</h3>
            <p className="text-gray-600">We'll get back to you soon.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{titles[type]}</h2>
            <p className="text-sm text-gray-600 mb-4">{descriptions[type]}</p>

            {classData && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-medium text-gray-900">{classData.title}</p>
                <p className="text-sm text-gray-600">{classData.date} • {classData.time}</p>
                <p className="text-sm text-gray-600">with {classData.instructor}</p>
              </div>
            )}

            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-700">
                {type === "cancel" ? "Reason for cancellation" : type === "reschedule" ? "Preferred new time" : "Your preference"}
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={3}
                placeholder={
                  type === "cancel"
                    ? "Please let us know why you need to cancel..."
                    : type === "reschedule"
                    ? "E.g., I'd prefer mornings on Tuesdays..."
                    : "E.g., I'd like someone who specializes in..."
                }
              />
            </label>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason.trim()}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Instructor Schedule Modal
function InstructorScheduleModal({
  isOpen,
  onClose,
  instructor
}: {
  isOpen: boolean;
  onClose: () => void;
  instructor: Instructor;
}) {
  if (!isOpen) return null;

  const availableSlots = [
    { day: "Friday, Dec 27", times: ["9:00 AM", "11:00 AM", "3:00 PM"] },
    { day: "Saturday, Dec 28", times: ["10:00 AM", "2:00 PM"] },
    { day: "Monday, Dec 30", times: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"] },
    { day: "Tuesday, Dec 31", times: ["10:00 AM"] },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={instructor.name} initials={instructor.initials} size="lg" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{instructor.name}</h2>
            <p className="text-sm text-gray-600">{instructor.specialties.join(", ")}</p>
          </div>
        </div>

        <h3 className="text-sm font-medium text-gray-700 mb-3">Available Times</h3>

        <div className="space-y-4">
          {availableSlots.map((slot) => (
            <div key={slot.day}>
              <p className="text-sm font-medium text-gray-900 mb-2">{slot.day}</p>
              <div className="flex flex-wrap gap-2">
                {slot.times.map((time) => (
                  <span
                    key={time}
                    className="px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-full border border-green-200"
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Class card component (client view - no edit, only request actions)
function ClassCardComponent({
  classData,
  onRequestCancel,
  onRequestReschedule,
  onConfirmAttendance,
  onWithdrawRequest,
  isConfirming,
  isWithdrawing
}: {
  classData: ScheduledClass;
  onRequestCancel: () => void;
  onRequestReschedule: () => void;
  onConfirmAttendance: () => void;
  onWithdrawRequest: () => void;
  isConfirming: boolean;
  isWithdrawing: boolean;
}) {
  const statusStyles: Record<ScheduledClass["status"], string> = {
    confirmed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-gray-100 text-gray-600",
    cancellation_requested: "bg-red-100 text-red-700",
    reschedule_requested: "bg-orange-100 text-orange-700",
  };

  const statusLabels: Record<ScheduledClass["status"], string> = {
    confirmed: "Confirmed",
    pending: "Pending",
    completed: "Completed",
    cancellation_requested: "Cancellation Requested",
    reschedule_requested: "Reschedule Requested",
  };

  const hasPendingRequest = classData.status === "cancellation_requested" || classData.status === "reschedule_requested";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{classData.title}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[classData.status]}`}>
          {statusLabels[classData.status]}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UserIcon className="w-4 h-4" />
          <span>Instructor: {classData.instructor}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4" />
          <span>{classData.dayOfWeek}, {classData.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ClockIcon className="w-4 h-4" />
          <span>{classData.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{classData.location}</span>
        </div>
      </div>

      {classData.status !== "completed" && (
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
          {/* Pending Request Message & Withdraw Button */}
          {hasPendingRequest && (
            <div className="space-y-2">
              <div className={`w-full px-3 py-2 ${classData.status === "cancellation_requested" ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"} text-sm rounded-lg flex items-center justify-center gap-2`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {classData.status === "cancellation_requested"
                  ? "Awaiting cancellation approval"
                  : "Awaiting reschedule approval"}
              </div>
              <button
                onClick={onWithdrawRequest}
                disabled={isWithdrawing}
                className="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isWithdrawing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Withdraw Request
                  </>
                )}
              </button>
            </div>
          )}

          {/* Confirm Attendance Button - only show for pending */}
          {classData.status === "pending" && (
            <button
              onClick={onConfirmAttendance}
              disabled={isConfirming}
              className="w-full px-3 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isConfirming ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Confirming...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm Attendance
                </>
              )}
            </button>
          )}

          {/* Confirmed message */}
          {classData.status === "confirmed" && (
            <div className="w-full px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Attendance Confirmed
            </div>
          )}

          {/* Reschedule and Cancel buttons - only show when no pending request */}
          {!hasPendingRequest && (
            <div className="flex gap-2">
              <button
                onClick={onRequestReschedule}
                className="flex-1 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Request Reschedule
              </button>
              <button
                onClick={onRequestCancel}
                className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Request Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [modalType, setModalType] = useState<"cancel" | "reschedule" | "change-instructor" | null>(null);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | undefined>();
  const [showInstructorSchedule, setShowInstructorSchedule] = useState(true); // Show instructor schedule by default
  const [classes, setClasses] = useState<ScheduledClass[]>(mockClasses);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const handleRequestCancel = (classData: ScheduledClass) => {
    // Simulate request - in real app this would call API and then update status
    setClasses((prev) =>
      prev.map((cls) =>
        cls.id === classData.id ? { ...cls, status: "cancellation_requested" as const } : cls
      )
    );
  };

  const handleRequestReschedule = (classData: ScheduledClass) => {
    // Simulate request - in real app this would call API and then update status
    setClasses((prev) =>
      prev.map((cls) =>
        cls.id === classData.id ? { ...cls, status: "reschedule_requested" as const } : cls
      )
    );
  };

  const handleWithdrawRequest = (classId: string) => {
    setWithdrawingId(classId);

    // Simulate API call
    setTimeout(() => {
      setClasses((prev) =>
        prev.map((cls) =>
          cls.id === classId ? { ...cls, status: "confirmed" as const } : cls
        )
      );
      setWithdrawingId(null);
    }, 500);
  };

  const handleConfirmAttendance = (classId: string) => {
    setConfirmingId(classId);

    // Simulate API call
    setTimeout(() => {
      setClasses((prev) =>
        prev.map((cls) =>
          cls.id === classId ? { ...cls, status: "confirmed" as const } : cls
        )
      );
      setConfirmingId(null);
    }, 500);
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 max-w-5xl">
        {/* Header with Avatar and Name */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar name={mockUser.name} avatar={mockUser.avatar} initials={mockUser.initials} size="xl" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{mockUser.name}</h1>
            <span className="inline-block mt-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
              {mockUser.plan}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-12">
          {/* Left Column - Contact Info & Plan */}
          <div className="w-64 flex-shrink-0 space-y-6">
            {/* Location */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Location</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{mockUser.locationFlag}</span>
                <span className="text-gray-900">{mockUser.location}</span>
              </div>
            </div>

            {/* Email */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <a
                href={`mailto:${mockUser.email}`}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <span>{mockUser.email}</span>
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            </div>

            {/* Phone */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <a
                href={`tel:${mockUser.phone.replace(/\s/g, "")}`}
                className="text-primary-600 hover:text-primary-700"
              >
                {mockUser.phone}
              </a>
            </div>

            {/* Classes Progress */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Monthly Classes</p>
              <div className="bg-gray-100 rounded-full h-2 mb-2">
                <div
                  className="bg-primary-600 rounded-full h-2 transition-all"
                  style={{ width: `${(mockUser.classesUsed / (mockUser.classesUsed + mockUser.classesRemaining)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{mockUser.classesUsed} used</span>
                <span className="font-medium text-gray-900">{mockUser.classesRemaining} remaining</span>
              </div>
            </div>

            {/* Current Instructor */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">My Instructor</p>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={currentInstructor.name} initials={currentInstructor.initials} size="md" />
                <div>
                  <p className="font-medium text-gray-900">{currentInstructor.name}</p>
                  <p className="text-xs text-gray-500">{currentInstructor.specialties.join(", ")}</p>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setShowInstructorSchedule(true)}
                  className="w-full px-3 py-2 text-sm font-medium text-primary-600 border border-primary-200 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  View Schedule
                </button>
                <button
                  onClick={() => setModalType("change-instructor")}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Request Change
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Scheduled Classes */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Scheduled Classes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((classData) => (
                <ClassCardComponent
                  key={classData.id}
                  classData={classData}
                  onRequestCancel={() => handleRequestCancel(classData)}
                  onRequestReschedule={() => handleRequestReschedule(classData)}
                  onConfirmAttendance={() => handleConfirmAttendance(classData.id)}
                  onWithdrawRequest={() => handleWithdrawRequest(classData.id)}
                  isConfirming={confirmingId === classData.id}
                  isWithdrawing={withdrawingId === classData.id}
                />
              ))}
            </div>

            {classes.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-600">No classes scheduled yet.</p>
                <p className="text-sm text-gray-500 mt-1">Contact support to book your first class!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <RequestModal
        isOpen={modalType === "cancel" || modalType === "reschedule" || modalType === "change-instructor"}
        onClose={() => {
          setModalType(null);
          setSelectedClass(undefined);
        }}
        type={modalType || "cancel"}
        classData={selectedClass}
      />

      <InstructorScheduleModal
        isOpen={showInstructorSchedule}
        onClose={() => setShowInstructorSchedule(false)}
        instructor={currentInstructor}
      />
    </div>
  );
}
