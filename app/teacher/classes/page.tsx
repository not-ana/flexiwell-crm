"use client";

import { useState } from "react";
import { SearchIcon, FilterIcon, ChevronIcon } from "@/components/icons";

type ClassStatus = "scheduled" | "in-progress" | "completed" | "canceled";
type ViewMode = "list" | "calendar";

interface Student {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  attended?: boolean;
}

interface Class {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string;
  duration: string;
  unit: string;
  room: string;
  capacity: number;
  enrolled: number;
  status: ClassStatus;
  students: Student[];
}

// Mock data for teacher's classes
const mockClasses: Class[] = [
  {
    id: "1",
    name: "Intermediate Pilates",
    type: "Pilates",
    date: "Today",
    time: "14:00",
    duration: "50 min",
    unit: "FlexiWell Centro",
    room: "Room 1",
    capacity: 8,
    enrolled: 6,
    status: "scheduled",
    students: [
      { id: "1", name: "Olivia Rhye", initials: "OR" },
      { id: "2", name: "Phoenix Baker", initials: "PB" },
      { id: "3", name: "Lana Steiner", initials: "LS" },
      { id: "4", name: "Demi Wilkinson", initials: "DW" },
      { id: "5", name: "Candice Wu", initials: "CW" },
      { id: "6", name: "Natali Craig", initials: "NC" },
    ],
  },
  {
    id: "2",
    name: "Beginner Yoga",
    type: "Yoga",
    date: "Today",
    time: "16:00",
    duration: "60 min",
    unit: "FlexiWell Centro",
    room: "Room 2",
    capacity: 10,
    enrolled: 8,
    status: "scheduled",
    students: [
      { id: "7", name: "Drew Cano", initials: "DC" },
      { id: "8", name: "Kate Morrison", initials: "KM" },
      { id: "1", name: "Olivia Rhye", initials: "OR" },
      { id: "9", name: "Orlando Diggs", initials: "OD" },
      { id: "10", name: "Andi Lane", initials: "AL" },
      { id: "11", name: "Koray Okumus", initials: "KO" },
      { id: "12", name: "Aliah Lane", initials: "AL" },
      { id: "13", name: "Amélie Laurent", initials: "AL" },
    ],
  },
  {
    id: "3",
    name: "Advanced Pilates",
    type: "Pilates",
    date: "Tomorrow",
    time: "09:00",
    duration: "50 min",
    unit: "FlexiWell Jardins",
    room: "Room 1",
    capacity: 6,
    enrolled: 6,
    status: "scheduled",
    students: [
      { id: "14", name: "Phoenix Baker", initials: "PB" },
      { id: "15", name: "Lana Steiner", initials: "LS" },
      { id: "16", name: "Demi Wilkinson", initials: "DW" },
      { id: "17", name: "Candice Wu", initials: "CW" },
      { id: "18", name: "Natali Craig", initials: "NC" },
      { id: "19", name: "Drew Cano", initials: "DC" },
    ],
  },
  {
    id: "4",
    name: "Functional Training",
    type: "Functional",
    date: "Tomorrow",
    time: "11:00",
    duration: "45 min",
    unit: "FlexiWell Jardins",
    room: "Room 3",
    capacity: 12,
    enrolled: 9,
    status: "scheduled",
    students: [
      { id: "20", name: "Kate Morrison", initials: "KM" },
      { id: "21", name: "Orlando Diggs", initials: "OD" },
      { id: "22", name: "Andi Lane", initials: "AL" },
      { id: "23", name: "Koray Okumus", initials: "KO" },
      { id: "24", name: "Aliah Lane", initials: "AL" },
      { id: "25", name: "Amélie Laurent", initials: "AL" },
      { id: "26", name: "Olivia Rhye", initials: "OR" },
      { id: "27", name: "Phoenix Baker", initials: "PB" },
      { id: "28", name: "Lana Steiner", initials: "LS" },
    ],
  },
  {
    id: "5",
    name: "Intermediate Yoga",
    type: "Yoga",
    date: "Yesterday",
    time: "10:00",
    duration: "60 min",
    unit: "FlexiWell Centro",
    room: "Room 2",
    capacity: 10,
    enrolled: 7,
    status: "completed",
    students: [
      { id: "29", name: "Demi Wilkinson", initials: "DW", attended: true },
      { id: "30", name: "Candice Wu", initials: "CW", attended: true },
      { id: "31", name: "Natali Craig", initials: "NC", attended: true },
      { id: "32", name: "Drew Cano", initials: "DC", attended: false },
      { id: "33", name: "Kate Morrison", initials: "KM", attended: true },
      { id: "34", name: "Orlando Diggs", initials: "OD", attended: true },
      { id: "35", name: "Andi Lane", initials: "AL", attended: true },
    ],
  },
];

const statusStyles: Record<ClassStatus, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "bg-blue-50", text: "text-blue-700", label: "Scheduled" },
  "in-progress": { bg: "bg-green-50", text: "text-green-700", label: "In Progress" },
  completed: { bg: "bg-gray-50", text: "text-gray-700", label: "Completed" },
  canceled: { bg: "bg-red-50", text: "text-red-700", label: "Canceled" },
};

function StatusBadge({ status }: { status: ClassStatus }) {
  const style = statusStyles[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function ClassCard({ classItem, onTakeAttendance }: { classItem: Class; onTakeAttendance: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFull = classItem.enrolled >= classItem.capacity;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Class Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
              <StatusBadge status={classItem.status} />
              {isFull && (
                <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs font-medium rounded-full">
                  Full
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{classItem.type}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">{classItem.time}</p>
            <p className="text-sm text-gray-500">{classItem.duration}</p>
          </div>
        </div>

        {/* Class Info */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{classItem.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>{classItem.unit}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span>{classItem.room}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>{classItem.enrolled}/{classItem.capacity} students</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <span>View students ({classItem.enrolled})</span>
            <ChevronIcon className="w-4 h-4" direction={isExpanded ? "up" : "down"} />
          </button>
          {classItem.status === "scheduled" && (
            <button
              onClick={onTakeAttendance}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Start class
            </button>
          )}
          {classItem.status === "in-progress" && (
            <button
              onClick={onTakeAttendance}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Take attendance
            </button>
          )}
          {classItem.status === "completed" && (
            <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              View report
            </button>
          )}
        </div>
      </div>

      {/* Students List */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Enrolled students</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {classItem.students.map((student) => (
              <div
                key={student.id}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  student.attended === true
                    ? "bg-green-50"
                    : student.attended === false
                    ? "bg-red-50"
                    : "bg-white"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary-700">{student.initials}</span>
                </div>
                <span className="text-sm text-gray-900 truncate">{student.name}</span>
                {student.attended === true && (
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {student.attended === false && (
                  <svg className="w-4 h-4 text-red-600 flex-shrink-0 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherClassesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClassStatus>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Get unique units
  const units = Array.from(new Set(mockClasses.map((c) => c.unit)));

  // Filter classes
  const filteredClasses = mockClasses.filter((classItem) => {
    const matchesSearch =
      classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || classItem.status === statusFilter;
    const matchesUnit = unitFilter === "all" || classItem.unit === unitFilter;
    return matchesSearch && matchesStatus && matchesUnit;
  });

  // Group by date
  const groupedClasses = filteredClasses.reduce((acc, classItem) => {
    if (!acc[classItem.date]) {
      acc[classItem.date] = [];
    }
    acc[classItem.date].push(classItem);
    return acc;
  }, {} as Record<string, Class[]>);

  const todayClasses = mockClasses.filter((c) => c.date === "Today").length;
  const totalStudentsToday = mockClasses
    .filter((c) => c.date === "Today")
    .reduce((acc, c) => acc + c.enrolled, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600 mt-1">Manage your classes and track attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "list" ? "bg-primary-100 text-primary-600" : "text-gray-400 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "calendar" ? "bg-primary-100 text-primary-600" : "text-gray-400 hover:bg-gray-100"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Classes Today</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{todayClasses}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Students Today</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">{totalStudentsToday}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">This Week</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockClasses.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Attendance Rate</p>
          <p className="text-2xl font-bold text-green-600 mt-1">92%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-center gap-4 mb-6 bg-white rounded-xl px-4 py-3">
        {/* Search */}
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Unit Filter */}
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All locations</option>
          {units.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <FilterIcon className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Classes List */}
      <div className="space-y-6">
        {Object.entries(groupedClasses).map(([date, classes]) => (
          <div key={date}>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{date}</h2>
            <div className="space-y-4">
              {classes.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  onTakeAttendance={() => console.log("Take attendance for", classItem.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {filteredClasses.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No classes found</h3>
            <p className="text-gray-500">Try adjusting your search filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
