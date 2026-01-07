"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { SearchIcon, PlusIcon, ChevronIcon } from "@/components/icons";

interface ClassItem {
  id: string;
  title: string;
  type: string;
  instructorId: string;
  instructorName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxCapacity: number;
  currentEnrollment: number;
  status: "scheduled" | "completed" | "cancelled";
  location?: string;
}

const typeColors: Record<string, string> = {
  yoga: "bg-purple-100 text-purple-700",
  pilates: "bg-pink-100 text-pink-700",
  stretching: "bg-green-100 text-green-700",
  meditation: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-700",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isToday(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isTomorrow(dateStr: string) {
  const date = new Date(dateStr);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("upcoming");

  const fetchClasses = useCallback(async () => {
    try {
      const response = await fetch("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Filter classes
  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !cls.title.toLowerCase().includes(query) &&
          !cls.instructorName.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== "all" && cls.type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && cls.status !== statusFilter) {
        return false;
      }

      // Date filter
      const classDate = new Date(cls.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === "today") {
        return isToday(cls.scheduledDate);
      } else if (dateFilter === "upcoming") {
        return classDate >= today;
      } else if (dateFilter === "past") {
        return classDate < today;
      }

      return true;
    });
  }, [classes, searchQuery, typeFilter, statusFilter, dateFilter]);

  // Group classes by date
  const groupedClasses = useMemo(() => {
    const groups: Record<string, ClassItem[]> = {};

    filteredClasses.forEach((cls) => {
      const dateKey = new Date(cls.scheduledDate).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(cls);
    });

    // Sort by time within each group
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return groups;
  }, [filteredClasses]);

  // Sort date keys
  const sortedDates = Object.keys(groupedClasses).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Stats
  const todayClasses = classes.filter((c) => isToday(c.scheduledDate) && c.status === "scheduled").length;
  const upcomingClasses = classes.filter((c) => {
    const date = new Date(c.scheduledDate);
    return date >= new Date() && c.status === "scheduled";
  }).length;
  const totalEnrolled = filteredClasses.reduce((sum, c) => sum + c.currentEnrollment, 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Class Schedule</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and view all classes</p>
          </div>
          <Link
            href="/admin/classes/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Class
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Today's Classes</p>
            <p className="text-2xl font-bold text-primary-600 mt-1">{todayClasses}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{upcomingClasses}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Total Enrolled</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{totalEnrolled}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">Total Classes</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{classes.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search classes or instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="yoga">Yoga</option>
              <option value="pilates">Pilates</option>
              <option value="stretching">Stretching</option>
              <option value="meditation">Meditation</option>
              <option value="other">Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Classes List */}
        {filteredClasses.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No classes found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {classes.length === 0
                ? "Get started by creating your first class."
                : "Try adjusting your filters to find classes."}
            </p>
            {classes.length === 0 && (
              <Link
                href="/admin/classes/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
              >
                <PlusIcon className="w-4 h-4" />
                Create First Class
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => {
              const dateClasses = groupedClasses[dateKey];
              const displayDate = isToday(dateKey)
                ? "Today"
                : isTomorrow(dateKey)
                ? "Tomorrow"
                : formatDate(dateKey);

              return (
                <div key={dateKey}>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {displayDate}
                  </h2>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {dateClasses.map((cls, index) => (
                      <div
                        key={cls.id}
                        className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                          index !== dateClasses.length - 1 ? "border-b border-gray-100" : ""
                        }`}
                      >
                        {/* Time */}
                        <div className="w-20 text-center">
                          <p className="text-sm font-semibold text-gray-900">{cls.startTime}</p>
                          <p className="text-xs text-gray-500">{cls.endTime}</p>
                        </div>

                        {/* Class Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{cls.title}</h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[cls.type] || typeColors.other}`}>
                              {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[cls.status]}`}>
                              {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {cls.instructorName} • {cls.duration} min
                            {cls.location && ` • ${cls.location}`}
                          </p>
                        </div>

                        {/* Enrollment */}
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {cls.currentEnrollment}/{cls.maxCapacity}
                          </p>
                          <div className="w-20 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                cls.currentEnrollment >= cls.maxCapacity
                                  ? "bg-red-500"
                                  : cls.currentEnrollment >= cls.maxCapacity * 0.8
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${(cls.currentEnrollment / cls.maxCapacity) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <Link
                          href={`/admin/classes/${cls.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                          <ChevronIcon className="w-5 h-5" direction="right" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
