"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";

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
}

interface StudentAttendance {
  id: string;
  name: string;
  initials: string;
  classesAttended: number;
  totalClasses: number;
  lastClass: string;
}

const mockTodaySchedule: TodaySchedule[] = [
  { id: "1", name: "Morning Yoga", time: "07:00 - 08:00", status: "completed", students: 12 },
  { id: "2", name: "Pilates Basics", time: "09:00 - 10:00", status: "completed", students: 8 },
  { id: "3", name: "Core Training", time: "11:00 - 12:00", status: "in-progress", students: 15 },
  { id: "4", name: "Afternoon Stretch", time: "14:00 - 15:00", status: "upcoming", students: 10 },
  { id: "5", name: "Power Yoga", time: "17:00 - 18:00", status: "upcoming", students: 14 },
  { id: "6", name: "Evening Relaxation", time: "19:00 - 20:00", status: "upcoming", students: 6 },
];

const mockUpcomingClasses: UpcomingClass[] = [
  { id: "1", name: "Morning Yoga", time: "Tomorrow, 07:00", duration: "1h", students: 10, maxStudents: 15, room: "Studio A" },
  { id: "2", name: "Pilates Advanced", time: "Tomorrow, 10:00", duration: "1h", students: 8, maxStudents: 10, room: "Studio B" },
  { id: "3", name: "Core Training", time: "Wed, 11:00", duration: "1h", students: 12, maxStudents: 15, room: "Studio A" },
  { id: "4", name: "Power Yoga", time: "Wed, 17:00", duration: "1.5h", students: 14, maxStudents: 20, room: "Main Hall" },
];

const mockStudentAttendance: StudentAttendance[] = [
  { id: "1", name: "Lucas Ferreira", initials: "LF", classesAttended: 18, totalClasses: 20, lastClass: "Today" },
  { id: "2", name: "Camila Souza", initials: "CS", classesAttended: 15, totalClasses: 20, lastClass: "Yesterday" },
  { id: "3", name: "Rafael Lima", initials: "RL", classesAttended: 12, totalClasses: 20, lastClass: "2 days ago" },
  { id: "4", name: "Julia Martins", initials: "JM", classesAttended: 19, totalClasses: 20, lastClass: "Today" },
  { id: "5", name: "Pedro Alves", initials: "PA", classesAttended: 8, totalClasses: 20, lastClass: "1 week ago" },
];

const weeklyStats = {
  classesCompleted: 18,
  totalClasses: 24,
  studentsServed: 142,
  avgAttendance: 92,
  rating: 4.8,
  hoursTeaching: 22,
};

function StatCard({ label, value, subtext, color }: { label: string; value: string | number; subtext?: string; color?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color || "text-gray-900"}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: TodaySchedule["status"] }) {
  const styles = {
    completed: "bg-green-100 text-green-700",
    "in-progress": "bg-blue-100 text-blue-700",
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
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function StudentAvatar({ name, initials }: { name: string; initials: string }) {
  const colors = ["bg-purple-500", "bg-pink-500", "bg-blue-500", "bg-green-500", "bg-orange-500"];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div className={`w-9 h-9 ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
      {initials}
    </div>
  );
}

export default function TeacherDashboard() {
  const [showAllSchedule, setShowAllSchedule] = useState(false);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Welcome back, Maria!</h1>
            <p className="text-gray-600 mt-1">{currentDate}</p>
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
            Mark Attendance
          </button>
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <StatCard
            label="Classes This Week"
            value={`${weeklyStats.classesCompleted}/${weeklyStats.totalClasses}`}
            subtext="6 remaining"
          />
          <StatCard
            label="Students Served"
            value={weeklyStats.studentsServed}
            subtext="This week"
          />
          <StatCard
            label="Avg. Attendance"
            value={`${weeklyStats.avgAttendance}%`}
            color="text-green-600"
          />
          <StatCard
            label="Your Rating"
            value={weeklyStats.rating}
            subtext="Based on 86 reviews"
          />
          <StatCard
            label="Hours Teaching"
            value={`${weeklyStats.hoursTeaching}h`}
            subtext="This week"
          />
          <StatCard
            label="Next Class"
            value="14:00"
            subtext="Afternoon Stretch"
          />
        </div>

        <div className="grid grid-cols-[1fr_400px] gap-6">
          {/* Today's Schedule */}
          <div className="bg-white border border-gray-200 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
                <p className="text-sm text-gray-500">Your classes for today</p>
              </div>
              <button
                onClick={() => setShowAllSchedule(!showAllSchedule)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                {showAllSchedule ? "Show less" : "View all"}
                <ChevronIcon className="w-4 h-4" direction={showAllSchedule ? "up" : "down"} />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {(showAllSchedule ? mockTodaySchedule : mockTodaySchedule.slice(0, 4)).map((classItem) => (
                <div
                  key={classItem.id}
                  className={`px-6 py-4 flex items-center justify-between ${
                    classItem.status === "in-progress" ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 text-center">
                      <p className="text-sm font-medium text-gray-900">{classItem.time.split(" - ")[0]}</p>
                      <p className="text-xs text-gray-400">{classItem.time.split(" - ")[1]}</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{classItem.name}</p>
                      <p className="text-xs text-gray-500">{classItem.students} students enrolled</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={classItem.status} />
                    {classItem.status === "in-progress" && (
                      <button className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                        Take Attendance
                      </button>
                    )}
                    {classItem.status === "upcoming" && (
                      <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Upcoming Classes */}
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Classes</h2>
                <p className="text-sm text-gray-500">Next few days</p>
              </div>
              <div className="divide-y divide-gray-100">
                {mockUpcomingClasses.map((classItem) => (
                  <div key={classItem.id} className="px-6 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{classItem.name}</p>
                      <span className="text-xs text-gray-500">{classItem.room}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{classItem.time} • {classItem.duration}</p>
                      <p className="text-xs text-gray-500">
                        {classItem.students}/{classItem.maxStudents} students
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-gray-200">
                <Link href="/teacher/classes" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View full schedule
                </Link>
              </div>
            </div>

            {/* Student Attendance */}
            <div className="bg-white border border-gray-200 rounded-xl">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Student Attendance</h2>
                <p className="text-sm text-gray-500">Your regular students</p>
              </div>
              <div className="divide-y divide-gray-100">
                {mockStudentAttendance.map((student) => (
                  <div key={student.id} className="px-6 py-3 flex items-center gap-3">
                    <StudentAvatar name={student.name} initials={student.initials} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">Last: {student.lastClass}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {student.classesAttended}/{student.totalClasses}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round((student.classesAttended / student.totalClasses) * 100)}% attendance
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-gray-200">
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
