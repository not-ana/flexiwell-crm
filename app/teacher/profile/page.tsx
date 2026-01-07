"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLinkIcon,
  UserIcon,
  ClockIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { useInteractiveOnboarding } from "@/components/onboarding";

interface TeacherUser {
  name: string;
  avatar?: string;
  initials: string;
  location: string;
  locationFlag: string;
  email: string;
  phone: string;
  role: string;
  specialties: string[];
  about: string;
}

interface UpcomingClass {
  id: string;
  title: string;
  time: string;
  date: string;
  students: number;
  maxStudents: number;
}

interface TeacherStats {
  totalStudents: number;
  classesThisWeek: number;
  avgRating: number;
  yearsExperience: number;
}

// Default values
const defaultUser: TeacherUser = {
  name: "Loading...",
  initials: "...",
  location: "Brasil",
  locationFlag: "🇧🇷",
  email: "",
  phone: "",
  role: "Instructor",
  specialties: [],
  about: "",
};

const defaultStats: TeacherStats = {
  totalStudents: 0,
  classesThisWeek: 0,
  avgRating: 0,
  yearsExperience: 0,
};

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
  const router = useRouter();
  const [teacherUser, setTeacherUser] = useState<TeacherUser>(defaultUser);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [stats, setStats] = useState<TeacherStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const aboutPreviewLength = 300;
  const shouldTruncate = teacherUser.about.length > aboutPreviewLength;

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    try {
      const response = await fetch("/api/teacher/profile");
      if (response.ok) {
        const data = await response.json();
        setTeacherUser(data.user);
        setUpcomingClasses(data.upcomingClasses);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Format stats for display
  const teacherStats = [
    { label: "Total Students", value: String(stats.totalStudents) },
    { label: "Classes This Week", value: String(stats.classesThisWeek) },
    { label: "Avg. Rating", value: stats.avgRating.toFixed(1) },
    { label: "Years Experience", value: String(stats.yearsExperience) },
  ];

  // Onboarding replay
  const { resetOnboarding } = useInteractiveOnboarding("teacher");

  const handleReplayOnboarding = () => {
    resetOnboarding();
    // Redirect to teacher dashboard where the onboarding elements are
    router.push("/teacher");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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

            {/* Platform Tour Section */}
            <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Platform Tour</h3>
                  <p className="text-sm text-gray-500">Replay the onboarding walkthrough to learn about all features</p>
                </div>
                <Button variant="secondary" onClick={handleReplayOnboarding}>
                  Replay Onboarding
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
