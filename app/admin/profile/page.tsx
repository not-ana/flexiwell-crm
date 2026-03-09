"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLinkIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { useInteractiveOnboarding } from "@/components/onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/hooks/useCurrency";

interface AdminUser {
  name: string;
  avatar?: string;
  initials: string;
  location: string;
  locationFlag: string;
  email: string;
  phone: string;
  role: string;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

interface AdminStats {
  totalClients: number;
  totalStaff: number;
  totalClasses: number;
  totalRevenue: number;
}

// Default values
const defaultUser: AdminUser = {
  name: "Loading...",
  initials: "...",
  location: "United States",
  locationFlag: "🇺🇸",
  email: "",
  phone: "",
  role: "Administrator",
};

const defaultStats: AdminStats = {
  totalClients: 0,
  totalStaff: 0,
  totalClasses: 0,
  totalRevenue: 0,
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
    <div className={`${sizeClasses[size]} bg-primary-500 rounded-full flex items-center justify-center text-white font-medium`}>
      {initials}
    </div>
  );
}

export default function AdminProfilePage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { formatCurrency } = useCurrency();

  // Use auth context data as initial values
  const getInitialUser = (): AdminUser => {
    if (authUser) {
      const initials = authUser.name
        ? authUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : authUser.email.substring(0, 2).toUpperCase();
      return {
        name: authUser.name || authUser.email.split("@")[0],
        avatar: authUser.avatar,
        initials,
        location: "United States",
        locationFlag: "🇺🇸",
        email: authUser.email,
        phone: authUser.phone || "",
        role: authUser.role === "admin" ? "Administrator" : authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1),
      };
    }
    return defaultUser;
  };

  const [adminUser, setAdminUser] = useState<AdminUser>(getInitialUser);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<AdminStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  // Update adminUser when authUser changes (including avatar changes)
  useEffect(() => {
    if (authUser) {
      setAdminUser(prev => ({
        ...prev,
        name: authUser.name || authUser.email.split("@")[0],
        email: authUser.email,
        avatar: authUser.avatar,
        initials: authUser.name
          ? authUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
          : authUser.email.substring(0, 2).toUpperCase(),
      }));
    }
  }, [authUser]);

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    try {
      const token = localStorage.getItem("flexiwell_access_token");
      const response = await fetch("/api/admin/profile", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAdminUser(data.user);
        setRecentActivity(data.recentActivity || []);
        setStats(data.stats);
      } else {
        console.error("Profile API returned:", response.status);
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
  const quickStats = [
    { label: "Total Clients", value: String(stats.totalClients) },
    { label: "Active Staff", value: String(stats.totalStaff) },
    { label: "This Month's Revenue", value: formatCurrency(stats.totalRevenue) },
    { label: "Classes This Month", value: String(stats.totalClasses) },
  ];

  // Onboarding replay
  const { resetOnboarding } = useInteractiveOnboarding("admin");

  const handleReplayOnboarding = () => {
    resetOnboarding();
    // Redirect to admin dashboard where the onboarding elements are
    router.push("/admin");
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
          <Avatar name={adminUser.name} avatar={adminUser.avatar} size="xl" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{adminUser.name}</h1>
            <span className="inline-block mt-1 px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
              {adminUser.role}
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
                <span className="text-lg">{adminUser.locationFlag}</span>
                <span className="text-gray-900">{adminUser.location}</span>
              </div>
            </div>

            {/* Email */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              {adminUser.email ? (
                <a
                  href={`mailto:${adminUser.email}`}
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                >
                  <span>{adminUser.email}</span>
                  <ExternalLinkIcon className="w-4 h-4" />
                </a>
              ) : (
                <span className="text-gray-400">Not provided</span>
              )}
            </div>

            {/* Phone */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              {adminUser.phone ? (
                <a
                  href={`tel:${adminUser.phone.replace(/\s/g, "")}`}
                  className="text-primary-600 hover:text-primary-700"
                >
                  {adminUser.phone}
                </a>
              ) : (
                <span className="text-gray-400">Not provided</span>
              )}
            </div>

            {/* Quick Stats */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Stats</p>
              <div className="space-y-3">
                {quickStats.map((stat) => (
                  <div key={stat.label} className="flex justify-between">
                    <span className="text-sm text-gray-500">{stat.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Activity */}
          <div className="flex-1">
            {/* Recent Activity Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {recentActivity.map((activity, index) => (
                  <div
                    key={activity.id}
                    className={`flex items-center justify-between px-4 py-3 ${
                      index !== recentActivity.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div>
                      <span className="text-gray-900">{activity.description}</span>
                    </div>
                    <span className="text-sm text-gray-500">{activity.timestamp}</span>
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
