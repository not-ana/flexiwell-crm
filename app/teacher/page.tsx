"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from "recharts";
import { InteractiveOnboarding, useInteractiveOnboarding } from "@/components/onboarding";

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
  { id: "1", name: "Lucas Brooks", initials: "LB", classesAttended: 18, totalClasses: 20, lastClass: "Today", needsMakeup: false },
  { id: "2", name: "Camille Stone", initials: "CS", classesAttended: 15, totalClasses: 20, lastClass: "Yesterday", needsMakeup: true },
  { id: "3", name: "Ryan Lewis", initials: "RL", classesAttended: 12, totalClasses: 20, lastClass: "2 days ago", needsMakeup: true },
  { id: "4", name: "Julia Martin", initials: "JM", classesAttended: 19, totalClasses: 20, lastClass: "Today", needsMakeup: false },
  { id: "5", name: "Patrick Adams", initials: "PA", classesAttended: 8, totalClasses: 20, lastClass: "1 week ago", needsMakeup: true },
];

const mockMakeupRequests: MakeupRequest[] = [
  { id: "1", studentName: "Camille Stone", studentInitials: "CS", originalClass: "Morning Yoga", originalDate: "Dec 20", status: "pending" },
  { id: "2", studentName: "Ryan Lewis", studentInitials: "RL", originalClass: "Core Training", originalDate: "Dec 18", requestedDate: "Dec 28, 10:00 AM", status: "scheduled" },
  { id: "3", studentName: "Patrick Adams", studentInitials: "PA", originalClass: "Pilates Basics", originalDate: "Dec 15", status: "pending" },
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

// Class type distribution - Using accent theme colors (pink/magenta)
const classTypeData = [
  { name: "Yoga", value: 35, color: "#DD2590" },   // accent-600
  { name: "Pilates", value: 30, color: "#EB2B95" }, // accent-500
  { name: "Core", value: 20, color: "#FF437E" },    // accent-400
  { name: "Stretch", value: 15, color: "#FD6F8E" }, // accent-300
];

function StatusBadge({ status }: { status: TodaySchedule["status"] }) {
  const styles = {
    completed: "bg-accent-100 text-accent-700",
    "in-progress": "bg-accent-50 text-accent-600 animate-pulse",
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
  const colors = ["bg-accent-500", "bg-accent-400", "bg-accent-600", "bg-accent-300", "bg-accent-700"];
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
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInData, setWalkInData] = useState({
    name: "",
    email: "",
    phone: "",
    classId: "",
  });

  // Onboarding
  const { shouldShow: showOnboarding, markComplete } = useInteractiveOnboarding("teacher");

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
      {/* Interactive Onboarding */}
      <InteractiveOnboarding
        role="teacher"
        isOpen={showOnboarding}
        onComplete={markComplete}
      />

      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Good morning, Sarah
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowWalkInModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Walk-in
              </button>
              <Link
                href="/teacher/settings"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Classes */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Classes This Week</p>
              <p className="text-2xl font-bold text-gray-900">{weeklyStats.classesCompleted}/{weeklyStats.totalClasses}</p>
              <p className="text-sm text-gray-600">completed</p>
            </div>

            {/* Students */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Students Served</p>
              <p className="text-2xl font-bold text-gray-900">{weeklyStats.studentsServed}</p>
              <p className="text-sm text-gray-600">this week</p>
            </div>

            {/* Attendance */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Avg. Attendance</p>
              <p className="text-2xl font-bold text-green-600">{weeklyStats.avgAttendance}%</p>
              <p className="text-sm text-gray-600">this week</p>
            </div>

            {/* Rating */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <p className="text-xs text-gray-500">Your Rating</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{weeklyStats.rating}</p>
              <p className="text-sm text-gray-600">86 reviews</p>
            </div>
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
                  <div className="w-3 h-3 rounded-full bg-accent-500" />
                  <span className="text-gray-600">Classes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-200" />
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
                  <Bar dataKey="classes" fill="#DD2590" radius={[4, 4, 0, 0]} />
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
                    formatter={(value) => [`${value}%`, ""]}
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
                        ? "bg-accent-100 text-accent-700"
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
                    className="text-sm text-accent-600 hover:text-accent-700 font-medium flex items-center gap-1"
                  >
                    {showAllSchedule ? "Show less" : "View all"}
                    <ChevronIcon className="w-4 h-4" direction={showAllSchedule ? "up" : "down"} />
                  </button>
                )}
              </div>

              {activeTab === "today" ? (
                <div className="divide-y divide-gray-200">
                  {(showAllSchedule ? mockTodaySchedule : mockTodaySchedule.slice(0, 4)).map((classItem) => (
                    <div
                      key={classItem.id}
                      className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        classItem.status === "in-progress" ? "bg-accent-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                          classItem.status === "in-progress"
                            ? "bg-accent-500 text-white"
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
                          <button
                            onClick={() => {
                              // In production: navigate to attendance page or open modal
                              alert(`Taking attendance for ${classItem.name}`);
                            }}
                            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            Take Attendance
                          </button>
                        )}
                        {classItem.status === "upcoming" && (
                          <button
                            onClick={() => {
                              // In production: open class details modal
                              alert(`Class: ${classItem.name}\nTime: ${classItem.time}\nRoom: ${classItem.room}\nStudents: ${classItem.students}`);
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
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
                          <button
                            onClick={() => {
                              // In production: open scheduling modal
                              alert(`Scheduling makeup class for ${request.studentName}\nOriginal: ${request.originalClass} on ${request.originalDate}`);
                            }}
                            className="px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                          >
                            Schedule
                          </button>
                        )}
                        {request.status === "scheduled" && (
                          <button
                            onClick={() => {
                              // In production: open rescheduling modal
                              alert(`Rescheduling makeup for ${request.studentName}\nCurrently scheduled: ${request.requestedDate}`);
                            }}
                            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
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
              <div className="divide-y divide-gray-200">
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
                <Link href="/teacher/classes" className="text-sm text-accent-600 hover:text-accent-700 font-medium">
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
              <div className="divide-y divide-gray-200">
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
                <Link href="/teacher/students" className="text-sm text-accent-600 hover:text-accent-700 font-medium">
                  View all students
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  {mockTodaySchedule
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
                onClick={() => {
                  // In production: await api.addWalkInStudent(walkInData);
                  const selectedClass = mockTodaySchedule.find(c => c.id === walkInData.classId);
                  console.log("Adding walk-in:", walkInData);
                  alert(`Walk-in student "${walkInData.name}" added to ${selectedClass?.name || "class"}!`);
                  setShowWalkInModal(false);
                  setWalkInData({ name: "", email: "", phone: "", classId: "" });
                }}
                disabled={!walkInData.name || !walkInData.classId}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Walk-in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
