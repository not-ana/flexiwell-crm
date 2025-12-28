"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type TeacherSettingsTab = "profile" | "availability" | "notifications";

const tabs: { id: TeacherSettingsTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "availability", label: "Availability" },
  { id: "notifications", label: "Notifications" },
];

// Profile Settings Component
function ProfileSettings() {
  const [formData, setFormData] = useState({
    firstName: "Maria",
    lastName: "Santos",
    email: "maria@flexiwell.com",
    phone: "+55 11 98765-4321",
    bio: "Certified Pilates instructor with 8 years of experience. Specialized in rehabilitation and posture correction.",
    specialties: ["Pilates", "Yoga", "Stretching"],
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-600 mt-1">Update your personal information.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-pink-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-lg sm:text-xl font-semibold text-primary-600">MS</span>
          </div>
          <div>
            <button className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Change photo
            </button>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
          <div className="flex flex-wrap gap-2">
            {formData.specialties.map((specialty) => (
              <span key={specialty} className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {specialty}
              </span>
            ))}
            <button className="px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 rounded-full text-sm hover:border-gray-400">
              + Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Password Section */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Change password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                type="password"
                placeholder="Enter current password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                placeholder="Enter new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
          <Button variant="secondary">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-primary-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// Notifications Settings Component
function NotificationsSettings() {
  const [notifications, setNotifications] = useState({
    classReminders: true,
    newStudentEnrolled: true,
    classCancellations: true,
    scheduleChanges: true,
    studentMessages: true,
    weeklyReport: false,
    emailNotifications: true,
    pushNotifications: true,
  });

  const updateNotification = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Notifications</h2>
        <p className="text-sm text-gray-600 mt-1">Manage how you receive notifications.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Class Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Class reminders</p>
                <p className="text-sm text-gray-500">Get notified before your classes start</p>
              </div>
              <Toggle
                enabled={notifications.classReminders}
                onChange={(value) => updateNotification("classReminders", value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">New student enrolled</p>
                <p className="text-sm text-gray-500">When a student enrolls in your class</p>
              </div>
              <Toggle
                enabled={notifications.newStudentEnrolled}
                onChange={(value) => updateNotification("newStudentEnrolled", value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Class cancellations</p>
                <p className="text-sm text-gray-500">When a student cancels their booking</p>
              </div>
              <Toggle
                enabled={notifications.classCancellations}
                onChange={(value) => updateNotification("classCancellations", value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Schedule changes</p>
                <p className="text-sm text-gray-500">When admin changes your schedule</p>
              </div>
              <Toggle
                enabled={notifications.scheduleChanges}
                onChange={(value) => updateNotification("scheduleChanges", value)}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Communication</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Student messages</p>
                <p className="text-sm text-gray-500">When a student sends you a message</p>
              </div>
              <Toggle
                enabled={notifications.studentMessages}
                onChange={(value) => updateNotification("studentMessages", value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Weekly report</p>
                <p className="text-sm text-gray-500">Receive a weekly summary of your classes</p>
              </div>
              <Toggle
                enabled={notifications.weeklyReport}
                onChange={(value) => updateNotification("weeklyReport", value)}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Email notifications</p>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Toggle
                enabled={notifications.emailNotifications}
                onChange={(value) => updateNotification("emailNotifications", value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Push notifications</p>
                <p className="text-sm text-gray-500">Receive push notifications on your device</p>
              </div>
              <Toggle
                enabled={notifications.pushNotifications}
                onChange={(value) => updateNotification("pushNotifications", value)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

// Availability Settings Component
function AvailabilitySettings() {
  const [schedule, setSchedule] = useState([
    { day: "monday", enabled: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
    { day: "tuesday", enabled: true, slots: [{ start: "10:00", end: "12:00" }, { start: "15:00", end: "19:00" }] },
    { day: "wednesday", enabled: true, slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "18:00" }] },
    { day: "thursday", enabled: true, slots: [{ start: "10:00", end: "12:00" }, { start: "16:00", end: "20:00" }] },
    { day: "friday", enabled: true, slots: [{ start: "09:00", end: "12:00" }] },
    { day: "saturday", enabled: false, slots: [] },
    { day: "sunday", enabled: false, slots: [] },
  ]);

  const dayNames: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Availability</h2>
        <p className="text-sm text-gray-600 mt-1">Set your working hours for each day.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="space-y-4">
          {schedule.map((day, dayIndex) => (
            <div key={day.day} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 py-4 border-b border-gray-100 last:border-0">
              <div className="sm:w-32">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => {
                      const newSchedule = [...schedule];
                      newSchedule[dayIndex].enabled = e.target.checked;
                      setSchedule(newSchedule);
                    }}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className={`text-sm font-medium ${day.enabled ? "text-gray-900" : "text-gray-400"}`}>
                    {dayNames[day.day]}
                  </span>
                </label>
              </div>

              {day.enabled ? (
                <div className="flex-1 space-y-2">
                  {day.slots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => {
                          const newSchedule = [...schedule];
                          newSchedule[dayIndex].slots[slotIndex].start = e.target.value;
                          setSchedule(newSchedule);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-gray-400 text-sm">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => {
                          const newSchedule = [...schedule];
                          newSchedule[dayIndex].slots[slotIndex].end = e.target.value;
                          setSchedule(newSchedule);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {day.slots.length > 1 && (
                        <button
                          onClick={() => {
                            const newSchedule = [...schedule];
                            newSchedule[dayIndex].slots.splice(slotIndex, 1);
                            setSchedule(newSchedule);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newSchedule = [...schedule];
                      newSchedule[dayIndex].slots.push({ start: "09:00", end: "17:00" });
                      setSchedule(newSchedule);
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Add time slot
                  </button>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Unavailable</span>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-gray-200">
          <Button variant="secondary">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherSettingsPage() {
  const [activeTab, setActiveTab] = useState<TeacherSettingsTab>("profile");

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "availability":
        return <AvailabilitySettings />;
      case "notifications":
        return <NotificationsSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Settings</h1>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6 sm:mb-8 overflow-x-auto">
          <nav className="flex gap-1 -mb-px min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="max-w-2xl">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
