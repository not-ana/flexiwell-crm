"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";

interface Activity {
  id: number;
  action: string;
  name: string;
  time: string;
  date: string;
  type: "client" | "class" | "payment" | "booking" | "cancel" | "staff" | "system";
  details?: string;
}

// Extended activity data
const allActivities: Activity[] = [
  { id: 1, action: "New client registration", name: "Lucas Ferreira", time: "5 min ago", date: "Dec 25, 2024", type: "client", details: "Monthly - 8 classes plan" },
  { id: 2, action: "Class completed", name: "Morning Yoga", time: "1 hour ago", date: "Dec 25, 2024", type: "class", details: "8 attendees" },
  { id: 3, action: "Payment received", name: "$350.00", time: "2 hours ago", date: "Dec 25, 2024", type: "payment", details: "From Maria Costa" },
  { id: 4, action: "New booking", name: "Pilates - Maria S.", time: "3 hours ago", date: "Dec 25, 2024", type: "booking", details: "Dec 27 at 2:00 PM" },
  { id: 5, action: "Class canceled", name: "Evening Stretch", time: "5 hours ago", date: "Dec 25, 2024", type: "cancel", details: "Instructor unavailable" },
  { id: 6, action: "Staff schedule updated", name: "Maria Santos", time: "6 hours ago", date: "Dec 25, 2024", type: "staff", details: "New availability added" },
  { id: 7, action: "New client registration", name: "João Silva", time: "Yesterday", date: "Dec 24, 2024", type: "client", details: "Monthly - 12 classes plan" },
  { id: 8, action: "Payment received", name: "$280.00", time: "Yesterday", date: "Dec 24, 2024", type: "payment", details: "From Pedro Santos" },
  { id: 9, action: "Class completed", name: "Afternoon Pilates", time: "Yesterday", date: "Dec 24, 2024", type: "class", details: "10 attendees" },
  { id: 10, action: "New booking", name: "Yoga - Carlos M.", time: "Yesterday", date: "Dec 24, 2024", type: "booking", details: "Dec 26 at 10:00 AM" },
  { id: 11, action: "System backup completed", name: "Automatic backup", time: "Yesterday", date: "Dec 24, 2024", type: "system", details: "All data secured" },
  { id: 12, action: "Client plan renewed", name: "Ana Oliveira", time: "2 days ago", date: "Dec 23, 2024", type: "client", details: "Monthly - 8 classes" },
  { id: 13, action: "Payment received", name: "$450.00", time: "2 days ago", date: "Dec 23, 2024", type: "payment", details: "From Lucas Ferreira" },
  { id: 14, action: "New staff member", name: "Carlos Lima", time: "2 days ago", date: "Dec 23, 2024", type: "staff", details: "Teacher role" },
  { id: 15, action: "Class canceled", name: "Morning Pilates", time: "3 days ago", date: "Dec 22, 2024", type: "cancel", details: "Low enrollment" },
  { id: 16, action: "New booking", name: "Stretching - Rita B.", time: "3 days ago", date: "Dec 22, 2024", type: "booking", details: "Dec 24 at 4:00 PM" },
  { id: 17, action: "Payment received", name: "$180.00", time: "3 days ago", date: "Dec 22, 2024", type: "payment", details: "From João Silva" },
  { id: 18, action: "Class completed", name: "Evening Yoga", time: "4 days ago", date: "Dec 21, 2024", type: "class", details: "6 attendees" },
  { id: 19, action: "New client registration", name: "Fernanda Lima", time: "4 days ago", date: "Dec 21, 2024", type: "client", details: "Drop-in class" },
  { id: 20, action: "Staff schedule updated", name: "Ana Silva", time: "5 days ago", date: "Dec 20, 2024", type: "staff", details: "Holiday hours" },
];

type FilterType = "all" | "client" | "class" | "payment" | "booking" | "cancel" | "staff" | "system";

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "All Activities" },
  { value: "client", label: "Clients" },
  { value: "class", label: "Classes" },
  { value: "payment", label: "Payments" },
  { value: "booking", label: "Bookings" },
  { value: "cancel", label: "Cancellations" },
  { value: "staff", label: "Staff" },
  { value: "system", label: "System" },
];

function ActivityIcon({ type }: { type: Activity["type"] }) {
  const styles = {
    client: "bg-blue-100 text-blue-600",
    class: "bg-green-100 text-green-600",
    payment: "bg-primary-100 text-primary-600",
    booking: "bg-orange-100 text-orange-600",
    cancel: "bg-red-100 text-red-600",
    staff: "bg-yellow-100 text-yellow-600",
    system: "bg-gray-100 text-gray-600",
  };

  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles[type]}`}>
      {type === "client" && (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )}
      {type === "class" && (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {type === "payment" && (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )}
      {type === "booking" && (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      {type === "cancel" && (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {type === "staff" && (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )}
      {type === "system" && (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const filteredActivities = filter === "all"
    ? allActivities
    : allActivities.filter(a => a.type === filter);

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = activity.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronIcon className="w-5 h-5 text-gray-500" direction="left" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
              <p className="text-gray-600 mt-1">All activity from your studio</p>
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-700 font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {filterOptions.find(f => f.value === filter)?.label}
              <ChevronIcon className="w-4 h-4 text-gray-400" direction={showFilterDropdown ? "up" : "down"} />
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      filter === option.value ? "font-medium text-primary-600 bg-primary-50" : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity List */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {Object.entries(groupedActivities).map(([date, activities], groupIndex) => (
            <div key={date}>
              {/* Date Header */}
              <div className={`px-6 py-3 bg-gray-50 border-b border-gray-200 ${groupIndex > 0 ? "border-t" : ""}`}>
                <h3 className="text-sm font-semibold text-gray-700">{date}</h3>
              </div>

              {/* Activities for this date */}
              <div className="divide-y divide-gray-100">
                {activities.map((activity) => (
                  <div key={activity.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.name}</p>
                      {activity.details && (
                        <p className="text-xs text-gray-400 mt-0.5">{activity.details}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No activities found for this filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
