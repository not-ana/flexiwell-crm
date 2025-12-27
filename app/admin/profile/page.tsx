"use client";

import { useState } from "react";
import {
  MapPinIcon,
  ExternalLinkIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { InteractiveOnboarding, useInteractiveOnboarding } from "@/components/onboarding";

// Admin user data (matching Sidebar mockAccountsData)
const adminUser = {
  name: "Ana Silva",
  avatar: undefined,
  initials: "AS",
  location: "Rio de Janeiro, Brazil",
  locationFlag: "🇧🇷",
  email: "ana@flexiwell.com",
  phone: "55 21 99999 8888",
  role: "Administrator",
  about: `I'm the administrator of FlexiWell, managing studio operations, client relationships, and business growth. I oversee the day-to-day activities of our wellness centers across multiple locations.

My responsibilities include managing staff, coordinating class schedules, handling client inquiries, and ensuring our services meet the highest quality standards.

With over 5 years of experience in wellness management, I'm passionate about creating spaces where people can achieve their health and fitness goals.`,
};

// Activity data for admin
const recentActivity = [
  { id: "1", action: "Added new client", target: "Maria Santos", time: "2 hours ago" },
  { id: "2", action: "Updated class schedule", target: "Afternoon Pilates", time: "4 hours ago" },
  { id: "3", action: "Approved instructor", target: "Carlos Lima", time: "1 day ago" },
  { id: "4", action: "Generated monthly report", target: "December 2024", time: "2 days ago" },
  { id: "5", action: "Updated pricing", target: "Monthly Plans", time: "3 days ago" },
];

// Quick stats
const quickStats = [
  { label: "Total Clients", value: "248" },
  { label: "Active Staff", value: "12" },
  { label: "This Month's Revenue", value: "$24,500" },
  { label: "Classes This Week", value: "45" },
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
    <div className={`${sizeClasses[size]} bg-primary-500 rounded-full flex items-center justify-center text-white font-medium`}>
      {initials}
    </div>
  );
}

export default function AdminProfilePage() {
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const aboutPreviewLength = 300;
  const shouldTruncate = adminUser.about.length > aboutPreviewLength;

  // Onboarding replay
  const { resetOnboarding } = useInteractiveOnboarding("admin");
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const handleReplayOnboarding = () => {
    resetOnboarding();
    setShowOnboardingModal(true);
  };

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
              <a
                href={`mailto:${adminUser.email}`}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <span>{adminUser.email}</span>
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            </div>

            {/* Phone */}
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <a
                href={`tel:${adminUser.phone.replace(/\s/g, "")}`}
                className="text-primary-600 hover:text-primary-700"
              >
                {adminUser.phone}
              </a>
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

          {/* Right Column - About and Activity */}
          <div className="flex-1">
            {/* About Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
              <div className="text-gray-600 whitespace-pre-line">
                {shouldTruncate && !isAboutExpanded
                  ? adminUser.about.slice(0, aboutPreviewLength) + "..."
                  : adminUser.about}
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
                      <span className="text-gray-900">{activity.action}</span>
                      <span className="text-primary-600 font-medium ml-1">{activity.target}</span>
                    </div>
                    <span className="text-sm text-gray-500">{activity.time}</span>
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

      {/* Onboarding Modal */}
      <InteractiveOnboarding
        role="admin"
        isOpen={showOnboardingModal}
        onComplete={() => setShowOnboardingModal(false)}
      />
    </div>
  );
}
