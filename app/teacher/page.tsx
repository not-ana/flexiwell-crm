"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronIcon } from "@/components/icons";
import { InteractiveOnboarding, useInteractiveOnboarding } from "@/components/onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { authFetch } from "@/lib/api/auth-fetch";

// Toast notification helper
function showToast(message: string, type: "success" | "error" = "success") {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 transition-opacity ${
    type === "success" ? "bg-green-600" : "bg-red-600"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

interface UpcomingClass {
  id: string;
  name: string;
  time: string;
  duration: string;
  students: number;
  maxStudents: number;
  room: string;
}

interface TodaySchedule {
  id: string;
  name: string;
  time: string;
  status: "completed" | "in-progress" | "upcoming" | "canceled";
  students: number;
  room: string;
}

interface StudentAttendance {
  id: string;
  name: string;
  initials: string;
  classesAttended: number;
  totalClasses: number;
  lastClass: string;
  needsMakeup: boolean;
}

interface MakeupRequest {
  id: string;
  studentName: string;
  studentInitials: string;
  originalClass: string;
  originalDate: string;
  requestedDate?: string;
  status: "pending" | "scheduled" | "completed";
}

// Dashboard data interface
interface DashboardData {
  stats: {
    classesCompleted: number;
    totalClasses: number;
    studentsServed: number;
    avgAttendance: number;
    hoursTeaching: number;
    makeupPending: number;
  };
  todaySchedule: TodaySchedule[];
  upcomingClasses: UpcomingClass[];
  makeupRequests: MakeupRequest[];
  studentAttendance: StudentAttendance[];
}

// Default empty stats
const defaultStats = {
  classesCompleted: 0,
  totalClasses: 0,
  studentsServed: 0,
  avgAttendance: 0,
  hoursTeaching: 0,
  makeupPending: 0,
};


const scheduleStatusStyles: Record<TodaySchedule["status"], { bg: string; text: string; label: string }> = {
  completed: { bg: "bg-primary-100", text: "text-primary-700", label: "Completed" },
  "in-progress": { bg: "bg-primary-50", text: "text-primary-600", label: "In Progress" },
  upcoming: { bg: "bg-gray-100", text: "text-gray-600", label: "Upcoming" },
  canceled: { bg: "bg-red-100", text: "text-red-700", label: "Canceled" },
};

function StatusBadge({ status }: { status: TodaySchedule["status"] }) {
  const style = scheduleStatusStyles[status];
  return <Badge style={style} />;
}

function StudentAvatar({ name, initials }: { name: string; initials: string }) {
  const colors = ["bg-primary-500", "bg-primary-400", "bg-primary-600", "bg-primary-300", "bg-primary-700"];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div className={`w-10 h-10 ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
      {initials}
    </div>
  );
}

const makeupStatusStyles: Record<MakeupRequest["status"], { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
  scheduled: { bg: "bg-blue-100", text: "text-blue-700", label: "Scheduled" },
  completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
};

function MakeupStatusBadge({ status }: { status: MakeupRequest["status"] }) {
  const style = makeupStatusStyles[status];
  return <Badge style={style} />;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "makeups">("today");
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);
  const [showScheduleMakeupModal, setShowScheduleMakeupModal] = useState(false);
  const [selectedMakeupRequest, setSelectedMakeupRequest] = useState<MakeupRequest | null>(null);
  const [walkInData, setWalkInData] = useState({
    name: "",
    email: "",
    phone: "",
    classId: "",
  });

  // Dashboard data states
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(defaultStats);
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [makeupRequests, setMakeupRequests] = useState<MakeupRequest[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);

  // Onboarding
  const { shouldShow: showOnboardingRaw, markComplete } = useInteractiveOnboarding("teacher");

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await authFetch("/api/teacher/dashboard");
      if (response.ok) {
        const data: DashboardData = await response.json();
        setStats(data.stats);
        setTodaySchedule(data.todaySchedule);
        setUpcomingClasses(data.upcomingClasses);
        setMakeupRequests(data.makeupRequests);
        setStudentAttendance(data.studentAttendance);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle walk-in submission
  const handleAddWalkIn = async () => {
    if (!walkInData.name || !walkInData.classId) return;

    setIsSubmittingWalkIn(true);
    try {
      const response = await authFetch("/api/teacher/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(walkInData),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(result.message);
        setShowWalkInModal(false);
        setWalkInData({ name: "", email: "", phone: "", classId: "" });
      } else {
        showToast(result.error || "Failed to add walk-in student", "error");
      }
    } catch (error) {
      console.error("Walk-in error:", error);
      showToast("Failed to add walk-in student", "error");
    } finally {
      setIsSubmittingWalkIn(false);
    }
  };

  // Handle take attendance - navigate to attendance page
  const handleTakeAttendance = (classItem: TodaySchedule) => {
    router.push(`/teacher/attendance?classId=${classItem.id}&className=${encodeURIComponent(classItem.name)}`);
  };

  // Handle schedule makeup
  const handleScheduleMakeup = (request: MakeupRequest) => {
    setSelectedMakeupRequest(request);
    setShowScheduleMakeupModal(true);
  };

  // Handle reschedule makeup
  const handleRescheduleMakeup = (request: MakeupRequest) => {
    setSelectedMakeupRequest(request);
    setShowScheduleMakeupModal(true);
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const completedClasses = todaySchedule.filter(c => c.status === "completed").length;
  const inProgressClass = todaySchedule.find(c => c.status === "in-progress");

  const isEmptyDashboard = stats.totalClasses === 0 && stats.studentsServed === 0 &&
    todaySchedule.length === 0 && upcomingClasses.length === 0 && studentAttendance.length === 0;

  // Only show tour when dashboard has data
  const showOnboarding = showOnboardingRaw && !isEmptyDashboard;

  // Show loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Interactive Onboarding */}
      <InteractiveOnboarding
        role="teacher"
        isOpen={showOnboarding}
        onComplete={markComplete}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
              {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}, {user?.name?.split(" ")[0] || "there"}
            </h1>
            <button
              onClick={() => setShowWalkInModal(true)}
              className="px-3 lg:px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="hidden lg:inline">Add Walk-in</span>
              <span className="lg:hidden">Walk-in</span>
            </button>
          </div>

          {/* Stats Cards Row - hidden when no data */}
          {!isEmptyDashboard && (
          <div data-onboarding="teacher-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Classes This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.classesCompleted}/{stats.totalClasses}</p>
              <p className="text-sm text-gray-600">completed</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Students Served</p>
              <p className="text-2xl font-bold text-gray-900">{stats.studentsServed}</p>
              <p className="text-sm text-gray-600">this week</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Avg. Attendance</p>
              <p className="text-2xl font-bold text-green-600">{stats.avgAttendance}%</p>
              <p className="text-sm text-gray-600">this week</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Hours Teaching</p>
              <p className="text-2xl font-bold text-gray-900">{stats.hoursTeaching}h</p>
              <p className="text-sm text-gray-600">this week</p>
            </div>
          </div>
          )}
        </div>

        {isEmptyDashboard ? (
        <div className="max-w-xl mx-auto py-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to fill your classes</h2>
            <p className="text-gray-500">3 quick steps to start tracking attendance and reducing no-shows</p>
          </div>

          <div className="space-y-3">
            <Link href="/teacher/classes" className="flex items-center gap-4 p-4 bg-white border-2 border-primary-200 rounded-xl hover:border-primary-400 transition-colors group">
              <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">1</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">Set up your class schedule</p>
                <p className="text-sm text-gray-500">Add your weekly classes and time slots</p>
              </div>
              <ChevronIcon className="w-5 h-5 text-gray-300 group-hover:text-primary-500 shrink-0" direction="right" />
            </Link>

            <Link href="/teacher/students" className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group">
              <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">2</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">Add your students</p>
                <p className="text-sm text-gray-500">Import or manually add your student roster</p>
              </div>
              <ChevronIcon className="w-5 h-5 text-gray-300 group-hover:text-gray-500 shrink-0" direction="right" />
            </Link>

            <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl opacity-50">
              <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">3</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-500">Track your first class</p>
                <p className="text-sm text-gray-400">Take attendance and watch your dashboard come alive</p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            Studios using FlexiWell see 20% fewer no-shows in 60 days
          </p>
        </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
          {/* Schedule & Makeups */}
          <div className="order-2 lg:order-1 flex flex-col">
            {/* Tab Navigation */}
            <div data-onboarding="teacher-schedule" className="bg-white border border-gray-200 rounded-2xl flex-1 flex flex-col">
              <div className="px-4 lg:px-6 py-4 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex gap-2 lg:gap-4">
                  <button
                    onClick={() => setActiveTab("today")}
                    className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "today"
                        ? "bg-primary-100 text-primary-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <span className="hidden lg:inline">Today's Schedule</span>
                    <span className="lg:hidden">Today</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("makeups")}
                    className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeTab === "makeups"
                        ? "bg-orange-100 text-orange-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <span className="hidden lg:inline">Makeup Classes</span>
                    <span className="lg:hidden">Makeups</span>
                    {makeupRequests.filter(r => r.status === "pending").length > 0 && (
                      <span className="bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                        {makeupRequests.filter(r => r.status === "pending").length}
                      </span>
                    )}
                  </button>
                </div>
                {activeTab === "today" && (
                  <button
                    onClick={() => setShowAllSchedule(!showAllSchedule)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 self-end sm:self-auto"
                  >
                    {showAllSchedule ? "Show less" : "View all"}
                    <ChevronIcon className="w-4 h-4" direction={showAllSchedule ? "up" : "down"} />
                  </button>
                )}
              </div>

              {activeTab === "today" ? (
                <div className="divide-y divide-gray-200">
                  {todaySchedule.length === 0 ? (
                    <div className="py-12 px-4 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Rest day</h3>
                      <p className="text-sm text-gray-500">No classes scheduled for today. Check upcoming classes for what&apos;s next.</p>
                    </div>
                  ) : (showAllSchedule ? todaySchedule : todaySchedule.slice(0, 4)).map((classItem) => (
                    <div
                      key={classItem.id}
                      className={`px-4 lg:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-gray-50 transition-colors ${
                        classItem.status === "in-progress" ? "bg-primary-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                          classItem.status === "in-progress"
                            ? "bg-primary-500 text-white"
                            : classItem.status === "completed"
                            ? "bg-gray-100 text-gray-400"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          <p className="text-xs lg:text-sm font-bold">{classItem.time.split(" - ")[0]}</p>
                          <p className="text-[10px] lg:text-xs">{classItem.time.split(" - ")[1]}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm lg:text-base font-semibold text-gray-900 truncate">{classItem.name}</p>
                          <p className="text-xs lg:text-sm text-gray-500">{classItem.room} • {classItem.students} students</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 lg:gap-3 ml-[60px] lg:ml-0">
                        <StatusBadge status={classItem.status} />
                        {classItem.status === "in-progress" && (
                          <button
                            onClick={() => handleTakeAttendance(classItem)}
                            className="px-3 lg:px-4 py-1.5 lg:py-2 bg-primary-600 text-white text-xs lg:text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            <span className="hidden lg:inline">Take Attendance</span>
                            <span className="lg:hidden">Attendance</span>
                          </button>
                        )}
                        {classItem.status === "upcoming" && (
                          <Link
                            href={`/teacher/classes?class=${classItem.id}`}
                            className="px-3 lg:px-4 py-1.5 lg:py-2 border border-gray-300 text-gray-700 text-xs lg:text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <span className="hidden lg:inline">View Details</span>
                            <span className="lg:hidden">Details</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {makeupRequests.length === 0 ? (
                    <div className="py-12 px-4 text-center">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">No makeup requests</h3>
                      <p className="text-sm text-gray-500">All students are up to date with their classes.</p>
                    </div>
                  ) : makeupRequests.map((request) => (
                    <div key={request.id} className="px-4 lg:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <StudentAvatar name={request.studentName} initials={request.studentInitials} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{request.studentName}</p>
                          <p className="text-xs lg:text-sm text-gray-500 truncate">
                            Missed: {request.originalClass} on {request.originalDate}
                          </p>
                          {request.requestedDate && (
                            <p className="text-xs text-blue-600 mt-0.5">Scheduled: {request.requestedDate}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 lg:gap-3 ml-[52px] lg:ml-0">
                        <MakeupStatusBadge status={request.status} />
                        {request.status === "pending" && (
                          <button
                            onClick={() => handleScheduleMakeup(request)}
                            className="px-3 py-1.5 bg-orange-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                          >
                            Schedule
                          </button>
                        )}
                        {request.status === "scheduled" && (
                          <button
                            onClick={() => handleRescheduleMakeup(request)}
                            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Reschedule
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {makeupRequests.length === 0 && (
                    <div className="px-4 sm:px-6 py-12 text-center">
                      <p className="text-gray-500">No makeup requests at the moment</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Classes */}
          <div className="order-1 lg:order-2 flex flex-col">
            <div data-onboarding="teacher-upcoming" className="bg-white border border-gray-200 rounded-2xl flex-1 flex flex-col">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Upcoming Classes</h2>
                <p className="text-xs sm:text-sm text-gray-500">Next few days</p>
              </div>
              <div className="divide-y divide-gray-200">
                {upcomingClasses.length === 0 ? (
                  <div className="py-10 px-4 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">No upcoming classes</h3>
                    <p className="text-xs text-gray-500">Classes will appear here once scheduled.</p>
                  </div>
                ) : upcomingClasses.map((classItem) => (
                  <div key={classItem.id} className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">{classItem.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{classItem.room}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-gray-500">{classItem.time}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-12 sm:w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              classItem.students === classItem.maxStudents ? "bg-red-500" :
                              classItem.students >= classItem.maxStudents * 0.8 ? "bg-yellow-500" : "bg-green-500"
                            }`}
                            style={{ width: `${(classItem.students / classItem.maxStudents) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{classItem.students}/{classItem.maxStudents}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                <Link href="/teacher/classes" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View full schedule
                </Link>
              </div>
            </div>
          </div>

          {/* Student Attendance */}
          <div className="order-3 flex flex-col">
            <div className="bg-white border border-gray-200 rounded-2xl flex-1 flex flex-col">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Student Attendance</h2>
                <p className="text-xs sm:text-sm text-gray-500">Track your regular students</p>
              </div>
              <div className="divide-y divide-gray-200">
                {studentAttendance.length === 0 ? (
                  <div className="py-10 px-4 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">No students yet</h3>
                    <p className="text-xs text-gray-500">Students will appear here after their first class.</p>
                  </div>
                ) : studentAttendance.map((student) => (
                  <div key={student.id} className="px-4 sm:px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <StudentAvatar name={student.name} initials={student.initials} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        {student.needsMakeup && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] sm:text-xs font-medium rounded whitespace-nowrap">
                            Needs makeup
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Last: {student.lastClass}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${
                        (student.classesAttended / student.totalClasses) >= 0.9 ? "text-green-600" :
                        (student.classesAttended / student.totalClasses) >= 0.7 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {Math.round((student.classesAttended / student.totalClasses) * 100)}%
                      </p>
                      <p className="text-xs text-gray-400">{student.classesAttended}/{student.totalClasses}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                <Link href="/teacher/students" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all students
                </Link>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Add Walk-in Student</h3>
                    <p className="text-sm text-gray-500">Add a drop-in student to a class</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWalkInModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Select Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select
                  value={walkInData.classId}
                  onChange={(e) => setWalkInData({ ...walkInData, classId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a class...</option>
                  {todaySchedule
                    .filter(c => c.status === "in-progress" || c.status === "upcoming")
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.time} ({c.room})
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                <input
                  type="text"
                  placeholder="Enter student name"
                  value={walkInData.name}
                  onChange={(e) => setWalkInData({ ...walkInData, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="student@email.com (optional)"
                  value={walkInData.email}
                  onChange={(e) => setWalkInData({ ...walkInData, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567 (optional)"
                  value={walkInData.phone}
                  onChange={(e) => setWalkInData({ ...walkInData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex gap-2">
                  <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    Walk-in students will be marked as attending this class. You can collect payment and create a full profile later.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setShowWalkInModal(false);
                  setWalkInData({ name: "", email: "", phone: "", classId: "" });
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWalkIn}
                disabled={!walkInData.name || !walkInData.classId || isSubmittingWalkIn}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingWalkIn ? "Adding..." : "Add Walk-in"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Makeup Modal */}
      {showScheduleMakeupModal && selectedMakeupRequest && (
        <ScheduleMakeupModal
          request={selectedMakeupRequest}
          availableClasses={upcomingClasses}
          onClose={() => {
            setShowScheduleMakeupModal(false);
            setSelectedMakeupRequest(null);
          }}
          onSchedule={async (classId) => {
            try {
              const response = await authFetch("/api/teacher/makeup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  requestId: selectedMakeupRequest.id,
                  classId,
                  action: "schedule",
                }),
              });

              const result = await response.json();

              if (response.ok) {
                showToast(result.message);
                setShowScheduleMakeupModal(false);
                setSelectedMakeupRequest(null);
              } else {
                showToast(result.error || "Failed to schedule makeup", "error");
              }
            } catch (error) {
              console.error("Schedule makeup error:", error);
              showToast("Failed to schedule makeup", "error");
            }
          }}
        />
      )}
    </div>
  );
}

// Schedule Makeup Modal Component
function ScheduleMakeupModal({
  request,
  availableClasses,
  onClose,
  onSchedule,
}: {
  request: MakeupRequest;
  availableClasses: UpcomingClass[];
  onClose: () => void;
  onSchedule: (classId: string) => Promise<void>;
}) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedClassId) return;
    setIsSubmitting(true);
    await onSchedule(selectedClassId);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Schedule Makeup Class</h3>
              <p className="text-sm text-gray-500 mt-1">For {request.studentName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Original class info */}
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-orange-800">Original Class:</p>
            <p className="text-sm text-orange-700">{request.originalClass} on {request.originalDate}</p>
          </div>

          {/* Select class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Makeup Class</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableClasses.map((cls) => (
                <label
                  key={cls.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedClassId === cls.id
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="makeupClass"
                    value={cls.id}
                    checked={selectedClassId === cls.id}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                    <p className="text-xs text-gray-500">{cls.time} • {cls.room}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{cls.students}/{cls.maxStudents} spots</p>
                    {cls.students >= cls.maxStudents && (
                      <span className="text-xs text-red-600">Full</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedClassId || isSubmitting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Scheduling..." : "Schedule Makeup"}
          </button>
        </div>
      </div>
    </div>
  );
}
