"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ExternalLinkIcon,
  UserIcon,
  ClockIcon,
} from "@/components/icons";

// Teacher user data (matching Sidebar mockAccountsData)
const teacherUser = {
  name: "Maria Santos",
  avatar: undefined,
  initials: "MS",
  location: "São Paulo, Brazil",
  locationFlag: "🇧🇷",
  email: "maria@flexiwell.com",
  phone: "55 11 98888 7777",
  role: "Instructor",
  specialties: ["Pilates", "Yoga", "Stretching"],
  about: `I'm a certified Pilates and Yoga instructor with over 8 years of experience helping clients improve their flexibility, strength, and overall well-being.

I specialize in personalized training programs that adapt to each client's needs and fitness level. My approach combines traditional techniques with modern methods to deliver effective results.

I hold certifications from the Pilates Method Alliance and Yoga Alliance, and I'm constantly updating my skills through workshops and continuing education.`,
};

// Upcoming classes for teacher
const upcomingClasses = [
  {
    id: "1",
    title: "Morning Pilates",
    time: "8:00 AM - 9:00 AM",
    date: "Today",
    students: 8,
    maxStudents: 10,
  },
  {
    id: "2",
    title: "Afternoon Yoga",
    time: "2:00 PM - 3:30 PM",
    date: "Today",
    students: 6,
    maxStudents: 8,
  },
  {
    id: "3",
    title: "Evening Stretching",
    time: "6:00 PM - 7:00 PM",
    date: "Tomorrow",
    students: 10,
    maxStudents: 12,
  },
];

// Teacher stats
const teacherStats = [
  { label: "Total Students", value: "45" },
  { label: "Classes This Week", value: "12" },
  { label: "Avg. Rating", value: "4.9" },
  { label: "Years Experience", value: "8" },
];

// Avatar component
function Avatar({ name, avatar, size = "md" }: { name: string; avatar?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
  };
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return avatar ? (
    <img src={avatar} alt={name} className={`${sizeClasses[size]} rounded-full object-cover`} />
  ) : (
    <div className={`${sizeClasses[size]} bg-green-500 rounded-full flex items-center justify-center text-white font-medium`}>
      {initials}
    </div>
  );
}

export default function TeacherProfilePage() {
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const aboutPreviewLength = 300;
  const shouldTruncate = teacherUser.about.length > aboutPreviewLength;

  return (
    <div className="h-full overflow-auto">
      <div className="p-8 max-w-5xl">
        {/* Header with Avatar and Name */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar name={teacherUser.name} avatar={teacherUser.avatar} size="xl" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{teacherUser.name}</h1>
            <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
              {teacherUser.role}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-12">
          {/* Left Column - Contact Info */}
          <div className="w-64 flex-shrink-0 space-y-6">
            {/* Location */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Location</p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{teacherUser.locationFlag}</span>
                <span className="text-gray-900">{teacherUser.location}</span>
              </div>
            </div>

            {/* Email */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <a
                href={`mailto:${teacherUser.email}`}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <span>{teacherUser.email}</span>
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            </div>

            {/* Phone */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <a
                href={`tel:${teacherUser.phone.replace(/\s/g, "")}`}
                className="text-primary-600 hover:text-primary-700"
              >
                {teacherUser.phone}
              </a>
            </div>

            {/* Specialties */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Specialties</p>
              <div className="flex flex-wrap gap-2">
                {teacherUser.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Stats</p>
              <div className="space-y-3">
                {teacherStats.map((stat) => (
                  <div key={stat.label} className="flex justify-between">
                    <span className="text-sm text-gray-500">{stat.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - About and Classes */}
          <div className="flex-1">
            {/* About Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
              <div className="text-gray-600 whitespace-pre-line">
                {shouldTruncate && !isAboutExpanded
                  ? teacherUser.about.slice(0, aboutPreviewLength) + "..."
                  : teacherUser.about}
              </div>
              {shouldTruncate && (
                <button
                  onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                  className="mt-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  {isAboutExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>

            {/* Upcoming Classes Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">My Upcoming Classes</h2>
              <div className="space-y-3">
                {upcomingClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{classItem.title}</h3>
                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {classItem.time}
                          </span>
                          <span className="text-primary-600 font-medium">{classItem.date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <UserIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{classItem.students}</span>
                          <span className="text-gray-500">/ {classItem.maxStudents}</span>
                        </div>
                        <Link
                          href="/teacher/classes"
                          className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
