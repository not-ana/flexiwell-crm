"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from "recharts";

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

const mockTodaySchedule: TodaySchedule[] = [
  { id: "1", name: "Morning Yoga", time: "07:00 - 08:00", status: "completed", students: 12, room: "Studio A" },
  { id: "2", name: "Pilates Basics", time: "09:00 - 10:00", status: "completed", students: 8, room: "Studio B" },
  { id: "3", name: "Core Training", time: "11:00 - 12:00", status: "in-progress", students: 15, room: "Studio A" },
  { id: "4", name: "Afternoon Stretch", time: "14:00 - 15:00", status: "upcoming", students: 10, room: "Main Hall" },
  { id: "5", name: "Power Yoga", time: "17:00 - 18:00", status: "upcoming", students: 14, room: "Studio A" },
  { id: "6", name: "Evening Relaxation", time: "19:00 - 20:00", status: "upcoming", students: 6, room: "Studio B" },
];

const mockUpcomingClasses: UpcomingClass[] = [
  { id: "1", name: "Morning Yoga", time: "Tomorrow, 07:00", duration: "1h", students: 10, maxStudents: 15, room: "Studio A" },
  { id: "2", name: "Pilates Advanced", time: "Tomorrow, 10:00", duration: "1h", students: 8, maxStudents: 10, room: "Studio B" },
  { id: "3", name: "Core Training", time: "Wed, 11:00", duration: "1h", students: 12, maxStudents: 15, room: "Studio A" },
  { id: "4", name: "Power Yoga", time: "Wed, 17:00", duration: "1.5h", students: 14, maxStudents: 20, room: "Main Hall" },
];

const mockStudentAttendance: StudentAttendance[] = [
  { id: "1", name: "Lucas Ferreira", initials: "LF", classesAttended: 18, totalClasses: 20, lastClass: "Today", needsMakeup: false },
  { id: "2", name: "Camila Souza", initials: "CS", classesAttended: 15, totalClasses: 20, lastClass: "Yesterday", needsMakeup: true },
  { id: "3", name: "Rafael Lima", initials: "RL", classesAttended: 12, totalClasses: 20, lastClass: "2 days ago", needsMakeup: true },
  { id: "4", name: "Julia Martins", initials: "JM", classesAttended: 19, totalClasses: 20, lastClass: "Today", needsMakeup: false },
  { id: "5", name: "Pedro Alves", initials: "PA", classesAttended: 8, totalClasses: 20, lastClass: "1 week ago", needsMakeup: true },
];

const mockMakeupRequests: MakeupRequest[] = [
  { id: "1", studentName: "Camila Souza", studentInitials: "CS", originalClass: "Morning Yoga", originalDate: "Dec 20", status: "pending" },
  { id: "2", studentName: "Rafael Lima", studentInitials: "RL", originalClass: "Core Training", originalDate: "Dec 18", requestedDate: "Dec 28, 10:00 AM", status: "scheduled" },
  { id: "3", studentName: "Pedro Alves", studentInitials: "PA", originalClass: "Pilates Basics", originalDate: "Dec 15", status: "pending" },
];

const weeklyStats = {
  classesCompleted: 18,
  totalClasses: 24,
  studentsServed: 142,
  avgAttendance: 92,
  rating: 4.8,
  hoursTeaching: 22,
  makeupPending: 3,
};

// Weekly class data for chart
const weeklyClassData = [
  { day: "Mon", classes: 4, students: 42 },
  { day: "Tue", classes: 5, students: 58 },
  { day: "Wed", classes: 3, students: 32 },
  { day: "Thu", classes: 5, students: 54 },
  { day: "Fri", classes: 4, students: 48 },
  { day: "Sat", classes: 2, students: 24 },
  { day: "Sun", classes: 1, students: 12 },
];

// Class type distribution
const classTypeData = [
  { name: "Yoga", value: 35, color: "#7C3AED" },
  { name: "Pilates", value: 30, color: "#EC4899" },
  { name: "Core", value: 20, color: "#3B82F6" },
  { name: "Stretch", value: 15, color: "#10B981" },
];

function StatusBadge({ status }: { status: TodaySchedule["status"] }) {
  const styles = {
    completed: "bg-green-100 text-green-700",
    "in-progress": "bg-blue-100 text-blue-700 animate-pulse",
    upcoming: "bg-gray-100 text-gray-600",
    canceled: "bg-red-100 text-red-700",
  };

  const labels = {
    completed: "Completed",
    "in-progress": "In Progress",
    upcoming: "Upcoming",
    canceled: "Canceled",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function StudentAvatar({ name, initials }: { name: string; initials: string }) {
  const colors = ["bg-purple-500", "bg-pink-500", "bg-blue-500", "bg-green-500", "bg-orange-500"];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div className={`w-10 h-10 ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
      {initials}
    </div>
  );
}

function MakeupStatusBadge({ status }: { status: MakeupRequest["status"] }) {
  const styles = {
    pending: "bg-yellow-100 text-yellow-700",
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function TeacherDashboard() {
  const [showAllSchedule, setShowAllSchedule] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "makeups">("today");

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const completedClasses = mockTodaySchedule.filter(c => c.status === "completed").length;
  const inProgressClass = mockTodaySchedule.find(c => c.status === "in-progress");

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-8">
        {/* Header with gradient */}
        <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-green-600 via-teal-500 to-cyan-500 p-8 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">{currentDate}</p>
              <h1 className="text-3xl font-bold mb-2">Welcome back, Maria!</h1>
              <p className="text-white/90 max-w-lg">
                You have <span className="font-semibold">{mockTodaySchedule.length} classes</span> scheduled today.
                {completedClasses > 0 && ` ${completedClasses} completed`}
                {inProgressClass && `, 1 in progress`}.
              </p>

              {/* Current Class Badge */}
              {inProgressClass && (
                <div className="mt-4 inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <div>
                    <p className="text-sm font-medium">Now Teaching: {inProgressClass.name}</p>
                    <p className="text-xs text-white/80">{inProgressClass.room} • {inProgressClass.students} students</p>
                  </div>
                  <button className="ml-4 px-3 py-1.5 bg-white text-green-600 text-sm font-medium rounded-lg hover:bg-white/90 transition-colors">
                    Take Attendance
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Link
                href="/teacher/classes"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Full Schedule
              </Link>
              <Link
                href="/teacher/students"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                My Students
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Classes</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{weeklyStats.classesCompleted}/{weeklyStats.totalClasses}</p>
            <p className="text-xs text-gray-400 mt-1">This week</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Students</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{weeklyStats.studentsServed}</p>
            <p className="text-xs text-gray-400 mt-1">This week</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Attendance</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{weeklyStats.avgAttendance}%</p>
            <p className="text-xs text-gray-400 mt-1">Average</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Rating</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{weeklyStats.rating}</p>
            <p className="text-xs text-gray-400 mt-1">86 reviews</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Hours</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{weeklyStats.hoursTeaching}h</p>
            <p className="text-xs text-gray-400 mt-1">This week</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-5 text-white hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-sm text-white/80">Makeups</p>
            </div>
            <p className="text-2xl font-bold">{weeklyStats.makeupPending}</p>
            <p className="text-xs text-white/70 mt-1">Pending</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          {/* Weekly Chart */}
          <div className="col-span-8 bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Weekly Overview</h2>
                <p className="text-sm text-gray-500 mt-1">Classes and students per day</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500" />
                  <span className="text-gray-600">Classes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-200" />
                  <span className="text-gray-600">Students</span>
                </div>
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyClassData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="classes" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Class Distribution */}
          <div className="col-span-4 bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Class Types</h2>
            <p className="text-sm text-gray-500 mb-4">Your teaching distribution</p>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {classTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {classTypeData.map((type) => (
                <div key={type.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
                  <span className="text-xs text-gray-600">{type.name}</span>
                  <span className="text-xs font-medium text-gray-900 ml-auto">{type.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_400px] gap-6">
          {/* Left Column - Schedule & Makeups */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white border border-gray-200 rounded-2xl">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab("today")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === "today"
                        ? "bg-teal-100 text-teal-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Today's Schedule
                  </button>
                  <button
                    onClick={() => setActiveTab("makeups")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeTab === "makeups"
                        ? "bg-orange-100 text-orange-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Makeup Classes
                    {mockMakeupRequests.filter(r => r.status === "pending").length > 0 && (
                      <span className="bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                        {mockMakeupRequests.filter(r => r.status === "pending").length}
                      </span>
                    )}
                  </button>
                </div>
                {activeTab === "today" && (
                  <button
                    onClick={() => setShowAllSchedule(!showAllSchedule)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    {showAllSchedule ? "Show less" : "View all"}
                    <ChevronIcon className="w-4 h-4" direction={showAllSchedule ? "up" : "down"} />
                  </button>
                )}
              </div>

              {activeTab === "today" ? (
                <div className="divide-y divide-gray-100">
                  {(showAllSchedule ? mockTodaySchedule : mockTodaySchedule.slice(0, 4)).map((classItem) => (
                    <div
                      key={classItem.id}
                      className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        classItem.status === "in-progress" ? "bg-teal-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                          classItem.status === "in-progress"
                            ? "bg-teal-500 text-white"
                            : classItem.status === "completed"
                            ? "bg-gray-100 text-gray-400"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          <p className="text-sm font-bold">{classItem.time.split(" - ")[0]}</p>
                          <p className="text-xs">{classItem.time.split(" - ")[1]}</p>
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900">{classItem.name}</p>
                          <p className="text-sm text-gray-500">{classItem.room} • {classItem.students} students</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={classItem.status} />
                        {classItem.status === "in-progress" && (
                          <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
                            Take Attendance
                          </button>
                        )}
                        {classItem.status === "upcoming" && (
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {mockMakeupRequests.map((request) => (
                    <div key={request.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <StudentAvatar name={request.studentName} initials={request.studentInitials} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{request.studentName}</p>
                          <p className="text-sm text-gray-500">
                            Missed: {request.originalClass} on {request.originalDate}
                          </p>
                          {request.requestedDate && (
                            <p className="text-xs text-blue-600 mt-0.5">Scheduled: {request.requestedDate}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MakeupStatusBadge status={request.status} />
                        {request.status === "pending" && (
                          <button className="px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors">
                            Schedule
                          </button>
                        )}
                        {request.status === "scheduled" && (
                          <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            Reschedule
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {mockMakeupRequests.length === 0 && (
                    <div className="px-6 py-12 text-center">
                      <p className="text-gray-500">No makeup requests at the moment</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Upcoming Classes */}
            <div className="bg-white border border-gray-200 rounded-2xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Classes</h2>
                <p className="text-sm text-gray-500">Next few days</p>
              </div>
              <div className="divide-y divide-gray-100">
                {mockUpcomingClasses.map((classItem) => (
                  <div key={classItem.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">{classItem.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{classItem.room}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">{classItem.time}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
              <div className="px-6 py-4 border-t border-gray-200">
                <Link href="/teacher/classes" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View full schedule
                </Link>
              </div>
            </div>

            {/* Students Needing Attention */}
            <div className="bg-white border border-gray-200 rounded-2xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Student Attendance</h2>
                <p className="text-sm text-gray-500">Track your regular students</p>
              </div>
              <div className="divide-y divide-gray-100">
                {mockStudentAttendance.map((student) => (
                  <div key={student.id} className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <StudentAvatar name={student.name} initials={student.initials} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        {student.needsMakeup && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                            Needs makeup
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Last: {student.lastClass}</p>
                    </div>
                    <div className="text-right">
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
              <div className="px-6 py-4 border-t border-gray-200">
                <Link href="/teacher/students" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View all students
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
