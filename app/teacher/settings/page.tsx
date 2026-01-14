"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { api, getStoredTokens } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";

type TeacherSettingsTab = "profile" | "availability" | "notifications";

const tabs: { id: TeacherSettingsTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "availability", label: "Availability" },
  { id: "notifications", label: "Notifications" },
];

// Helper to get initials from name
function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.[0]?.toUpperCase() || "";
  const last = lastName?.[0]?.toUpperCase() || "";
  return first + last || "??";
}

// Profile Settings Component
function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    specialties: [] as string[],
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [originalAvatar, setOriginalAvatar] = useState<string | null>(null);
  const [pendingPhotoBase64, setPendingPhotoBase64] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Fetch profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get<{
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
          avatar: string | null;
          name: string;
        }>("/api/profile");

        if (response.data) {
          const data = response.data;
          setFormData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            phone: data.phone || "",
            bio: "",
            specialties: [],
          });
          setAvatar(data.avatar);
          setOriginalAvatar(data.avatar);
        } else if (response.error) {
          console.error("Failed to fetch profile:", response.error);
          // Fallback to auth user data
          if (user) {
            const nameParts = user.name?.split(" ") || [];
            setFormData({
              firstName: nameParts[0] || "",
              lastName: nameParts.slice(1).join(" ") || "",
              email: user.email || "",
              phone: "",
              bio: "",
              specialties: [],
            });
            setAvatar(user.avatar || null);
            setOriginalAvatar(user.avatar || null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCancel = async () => {
    // Refetch profile to reset
    setIsLoading(true);
    try {
      const response = await api.get<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        avatar: string | null;
      }>("/api/profile");

      if (response.data) {
        setFormData({
          firstName: response.data.firstName || "",
          lastName: response.data.lastName || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          bio: "",
          specialties: [],
        });
        setAvatar(response.data.avatar);
        setOriginalAvatar(response.data.avatar);
      }
      setPasswords({ current: "", new: "", confirm: "" });
      setPendingPhotoBase64(null);
      setError("");
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // Validate passwords if changing (only when user actually wants to change password)
      if (passwords.new) {
        if (!passwords.current) {
          setError("Current password is required to change password");
          setIsSaving(false);
          return;
        }
        if (passwords.new !== passwords.confirm) {
          setError("New passwords do not match");
          setIsSaving(false);
          return;
        }
        if (passwords.new.length < 8) {
          setError("New password must be at least 8 characters");
          setIsSaving(false);
          return;
        }
      }

      const { accessToken } = getStoredTokens();
      const authHeaders: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        authHeaders["Authorization"] = `Bearer ${accessToken}`;
      }

      let newAvatarUrl: string | undefined;

      // Upload pending photo if there is one
      if (pendingPhotoBase64) {
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            type: "profile",
            data: pendingPhotoBase64,
          }),
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || "Failed to upload photo");
        }

        newAvatarUrl = uploadData.url;
      }

      const updateData: Record<string, string | undefined> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      if (newAvatarUrl) {
        updateData.avatar = newAvatarUrl;
      }

      if (passwords.current && passwords.new) {
        updateData.currentPassword = passwords.current;
        updateData.newPassword = passwords.new;
      }

      const response = await api.put<{ success: boolean; error?: string; user?: { name: string; avatar?: string } }>("/api/profile", updateData);

      if (response.error) {
        throw new Error(response.error.error || "Failed to update profile");
      }

      // Update local state with new avatar
      if (newAvatarUrl) {
        setAvatar(newAvatarUrl);
        setOriginalAvatar(newAvatarUrl);
        setPendingPhotoBase64(null);
      }

      // Update AuthContext with new user data
      if (user) {
        updateUser({
          ...user,
          name: response.data?.user?.name || `${formData.firstName} ${formData.lastName}`.trim(),
          avatar: newAvatarUrl || avatar || undefined,
        });
      }

      setSuccess("Profile updated successfully!");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          setError("Image must be less than 2MB");
          return;
        }

        // Convert to base64 for preview only - actual upload happens on Save
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setPendingPhotoBase64(base64);
          setAvatar(base64); // Show preview immediately
          setError("");
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-600 mt-1">Update your personal information.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-6">
        {/* Avatar and Account Info */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-lg sm:text-xl font-semibold text-white">
                  {getInitials(formData.firstName, formData.lastName)}
                </span>
              </div>
            )}
            <div>
              <button
                onClick={handlePhotoChange}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Change photo
              </button>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>

          {/* Account Info - Right side */}
          <div className="sm:ml-auto sm:text-right space-y-1">
            <div className="flex items-center gap-2 sm:justify-end">
              <span className="text-sm text-gray-500">Email:</span>
              <span className="text-sm text-gray-900">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <span className="text-sm text-gray-500">Type:</span>
              <span className="text-sm text-gray-900 capitalize">{user?.role}</span>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <span className="text-sm text-gray-500">ID:</span>
              <span className="text-sm text-gray-400 font-mono text-xs">{user?.id}</span>
              <button
                type="button"
                onClick={() => {
                  if (user?.id) {
                    navigator.clipboard.writeText(user.id);
                  }
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Copy Account ID"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
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
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
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

        {/* Password Section */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Change password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Account Settings Section */}
      <AccountSettings hideAccountInfo />
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
        <div className="max-w-4xl">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
