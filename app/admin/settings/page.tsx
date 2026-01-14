"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui";
import { BusinessType, businessTypes, getBusinessTypeOptions } from "@/lib/config/business-types";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { getStoredTokens, api } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";

// Toast notification helper - centered at top
function showToast(message: string, type: "success" | "error" = "success") {
  const toast = document.createElement("div");
  toast.className = `fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white text-sm font-medium z-50 shadow-lg ${
    type === "success" ? "bg-green-600" : "bg-red-600"
  }`;
  toast.style.transform = "translateX(-50%)";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

type AdminSettingsTab = "general" | "plans" | "waitlist" | "establishments" | "rooms" | "subscription" | "notifications" | "team" | "integrations" | "whatsapp";

const tabs: { id: AdminSettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "plans", label: "Plans" },
  { id: "waitlist", label: "Waitlist" },
  { id: "team", label: "Team" },
  { id: "establishments", label: "Establishments" },
  { id: "rooms", label: "Rooms" },
  { id: "subscription", label: "Subscription" },
  { id: "notifications", label: "Notifications" },
  { id: "integrations", label: "Integrations" },
  { id: "whatsapp", label: "WhatsApp" },
];

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

// Helper to get initials from name
function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.[0]?.toUpperCase() || "";
  const last = lastName?.[0]?.toUpperCase() || "";
  return first + last || "??";
}

// General Settings Component
function GeneralSettings() {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [settings, setSettings] = useState({
    studioName: "FlexiWell Studio",
    email: "contact@flexiwell.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street - New York, NY 10001",
    timezone: "America/New_York",
    currency: "USD",
    language: "en-US",
    businessType: "pilates" as BusinessType,
    customTerminology: {
      classes: "Classes",
      teachers: "Instructors",
      clients: "Clients",
      studio: "Studio",
    },
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get<{
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
          avatar: string | null;
        }>("/api/profile");

        if (response.data) {
          setProfileData({
            firstName: response.data.firstName || "",
            lastName: response.data.lastName || "",
            email: response.data.email || "",
            phone: response.data.phone || "",
          });
        } else if (user) {
          const nameParts = user.name?.split(" ") || [];
          setProfileData({
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            email: user.email || "",
            phone: "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setProfileLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  // Load settings from API
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings?section=general");
        if (res.ok) {
          const data = await res.json();
          if (data.general) {
            setSettings(prev => ({ ...prev, ...data.general }));
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData({ ...profileData, [field]: value });
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      // Validate passwords if changing (only when user actually wants to change password)
      if (passwords.new) {
        if (!passwords.current) {
          setProfileError("Current password is required to change password");
          setProfileSaving(false);
          return;
        }
        if (passwords.new !== passwords.confirm) {
          setProfileError("New passwords do not match");
          setProfileSaving(false);
          return;
        }
        if (passwords.new.length < 8) {
          setProfileError("New password must be at least 8 characters");
          setProfileSaving(false);
          return;
        }
      }

      const updateData: Record<string, string | undefined> = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
      };

      if (passwords.current && passwords.new) {
        updateData.currentPassword = passwords.current;
        updateData.newPassword = passwords.new;
      }

      const response = await api.put<{ success: boolean; error?: string; user?: { name: string; avatar?: string } }>("/api/profile", updateData);

      if (response.error) {
        throw new Error(response.error.error || "Failed to update profile");
      }

      if (user) {
        updateUser({
          ...user,
          name: response.data?.user?.name || `${profileData.firstName} ${profileData.lastName}`.trim(),
        });
      }

      setProfileSuccess("Profile updated successfully!");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "general", data: settings }),
      });
      if (res.ok) {
        showToast("Settings saved successfully");
      } else {
        showToast("Failed to save settings", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const businessTypeOptions = getBusinessTypeOptions();
  const selectedBusinessType = businessTypes[settings.businessType];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-600 mt-1">Update your personal information.</p>
      </div>

      {profileError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{profileError}</p>
        </div>
      )}

      {profileSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">{profileSuccess}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-6">
        {/* Account Info */}
        <div className="flex justify-end">
          <div className="text-right space-y-1">
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

        {/* Profile Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => handleProfileChange("firstName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => handleProfileChange("lastName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={profileData.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => handleProfileChange("phone", e.target.value)}
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

        {/* Profile Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => {
            setPasswords({ current: "", new: "", confirm: "" });
            setProfileError("");
            setProfileSuccess("");
          }}>Cancel</Button>
          <Button onClick={handleProfileSave} disabled={profileSaving}>
            {profileSaving ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </div>

      {/* Studio Settings Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Studio Settings</h2>
        <p className="text-sm text-gray-600 mt-1">Basic studio information and preferences.</p>
      </div>

      {/* Business Type Selection */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Business Type</h3>
          <p className="text-sm text-gray-600 mt-1">
            Select your business type to customize terminology throughout the app.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {businessTypeOptions.map((option) => {
            const isSelected = settings.businessType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateSetting("businessType", option.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">{option.icon}</span>
                <span className={`text-sm font-medium text-center ${
                  isSelected ? "text-primary-700" : "text-gray-700"
                }`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Terminology Preview / Custom Terminology */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {settings.businessType === "other"
              ? "Customize your terminology:"
              : `Terminology preview for ${selectedBusinessType.name}:`}
          </p>
          {settings.businessType === "other" ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sessions</label>
                <input
                  type="text"
                  value={settings.customTerminology.classes}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    customTerminology: { ...prev.customTerminology, classes: e.target.value }
                  }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Classes, Sessions"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Staff</label>
                <input
                  type="text"
                  value={settings.customTerminology.teachers}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    customTerminology: { ...prev.customTerminology, teachers: e.target.value }
                  }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Instructors, Coaches"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Clients</label>
                <input
                  type="text"
                  value={settings.customTerminology.clients}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    customTerminology: { ...prev.customTerminology, clients: e.target.value }
                  }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Clients, Members"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Location</label>
                <input
                  type="text"
                  value={settings.customTerminology.studio}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    customTerminology: { ...prev.customTerminology, studio: e.target.value }
                  }))}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Studio, Gym"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Sessions:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedBusinessType.terminology.classes}</span>
              </div>
              <div>
                <span className="text-gray-500">Staff:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedBusinessType.terminology.teachers}</span>
              </div>
              <div>
                <span className="text-gray-500">Clients:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedBusinessType.terminology.clients}</span>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedBusinessType.terminology.studio}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Settings Section */}
      <AccountSettings hideAccountInfo />
    </div>
  );
}

// Establishments Settings Component
interface Teacher {
  id: string;
  name: string;
  email: string;
  initials: string;
}

interface Establishment {
  id: string;
  name: string;
  location: string;
  assignedTeachers: string[];
}

function EstablishmentsSettings() {
  const [establishments, setEstablishments] = useState<Establishment[]>([
    { id: "1", name: "FlexiWell Downtown", location: "Downtown, New York", assignedTeachers: ["1", "2"] },
    { id: "2", name: "FlexiWell Midtown", location: "Midtown, New York", assignedTeachers: ["1", "3"] },
    { id: "3", name: "FlexiWell Uptown", location: "Uptown, New York", assignedTeachers: ["2"] },
  ]);

  const allTeachers: Teacher[] = [
    { id: "1", name: "Sarah Johnson", email: "sarah@flexiwell.com", initials: "SJ" },
    { id: "2", name: "Michael Chen", email: "michael@flexiwell.com", initials: "MC" },
    { id: "3", name: "Emily Davis", email: "emily@flexiwell.com", initials: "ED" },
    { id: "4", name: "James Wilson", email: "james@flexiwell.com", initials: "JW" },
  ];

  const [editingEstablishment, setEditingEstablishment] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEstablishment, setNewEstablishment] = useState({ name: "", location: "" });

  const toggleTeacherAssignment = (establishmentId: string, teacherId: string) => {
    setEstablishments(prev => prev.map(est => {
      if (est.id !== establishmentId) return est;
      const isAssigned = est.assignedTeachers.includes(teacherId);
      return {
        ...est,
        assignedTeachers: isAssigned
          ? est.assignedTeachers.filter(id => id !== teacherId)
          : [...est.assignedTeachers, teacherId]
      };
    }));
  };

  const getTeacherById = (id: string) => allTeachers.find(t => t.id === id);

  const handleAddEstablishment = () => {
    if (!newEstablishment.name || !newEstablishment.location) return;
    const newId = String(establishments.length + 1);
    setEstablishments([...establishments, { id: newId, ...newEstablishment, assignedTeachers: [] }]);
    setNewEstablishment({ name: "", location: "" });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Establishments</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your locations and assign teachers to each establishment.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Establishment</Button>
      </div>

      {/* Establishments List */}
      <div className="space-y-4">
        {establishments.map((establishment) => (
          <div key={establishment.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Establishment Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{establishment.name}</h3>
                  <p className="text-sm text-gray-500">{establishment.location}</p>
                </div>
                <button
                  onClick={() => setEditingEstablishment(editingEstablishment === establishment.id ? null : establishment.id)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {editingEstablishment === establishment.id ? "Done" : "Manage Teachers"}
                </button>
              </div>

              {/* Assigned Teachers Preview */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-gray-500">Teachers:</span>
                <div className="flex -space-x-2">
                  {establishment.assignedTeachers.slice(0, 4).map((teacherId) => {
                    const teacher = getTeacherById(teacherId);
                    if (!teacher) return null;
                    return (
                      <div
                        key={teacherId}
                        className="w-7 h-7 rounded-full bg-green-100 border-2 border-white flex items-center justify-center"
                        title={teacher.name}
                      >
                        <span className="text-xs font-medium text-green-700">{teacher.initials}</span>
                      </div>
                    );
                  })}
                  {establishment.assignedTeachers.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">+{establishment.assignedTeachers.length - 4}</span>
                    </div>
                  )}
                </div>
                {establishment.assignedTeachers.length === 0 && (
                  <span className="text-xs text-gray-400 italic">No teachers assigned</span>
                )}
              </div>
            </div>

            {/* Teacher Assignment Panel */}
            {editingEstablishment === establishment.id && (
              <div className="p-6 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-3">Select teachers for this establishment:</p>
                <div className="grid grid-cols-2 gap-3">
                  {allTeachers.map((teacher) => {
                    const isAssigned = establishment.assignedTeachers.includes(teacher.id);
                    return (
                      <button
                        key={teacher.id}
                        onClick={() => toggleTeacherAssignment(establishment.id, teacher.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          isAssigned
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isAssigned ? "bg-green-100" : "bg-gray-100"
                        }`}>
                          <span className={`text-sm font-medium ${isAssigned ? "text-green-700" : "text-gray-600"}`}>
                            {teacher.initials}
                          </span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-sm font-medium ${isAssigned ? "text-green-700" : "text-gray-900"}`}>
                            {teacher.name}
                          </p>
                          <p className="text-xs text-gray-500">{teacher.email}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isAssigned ? "border-green-500 bg-green-500" : "border-gray-300"
                        }`}>
                          {isAssigned && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Establishment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add Establishment</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g., FlexiWell Downtown"
                  value={newEstablishment.name}
                  onChange={(e) => setNewEstablishment({ ...newEstablishment, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g., Downtown, São Paulo"
                  value={newEstablishment.location}
                  onChange={(e) => setNewEstablishment({ ...newEstablishment, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEstablishment}
                disabled={!newEstablishment.name || !newEstablishment.location}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Add Establishment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Rooms Settings Component
interface Room {
  id: string;
  name: string;
  capacity: number;
  establishmentId: string;
  amenities: string[];
  isActive: boolean;
}

function RoomsSettings() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [establishments, setEstablishments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState({ name: "", capacity: 10, establishmentId: "", amenities: "" });
  const [saving, setSaving] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // Load rooms and establishments from API
  useEffect(() => {
    async function loadData() {
      try {
        const [roomsRes, establishmentsRes] = await Promise.all([
          fetch("/api/rooms"),
          fetch("/api/establishments"),
        ]);

        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          setRooms(roomsData.rooms?.map((r: { _id: { toString: () => string }; name: string; capacity: number; establishmentId: string; equipment?: string[]; isActive: boolean }) => ({
            id: r._id?.toString() || "",
            name: r.name,
            capacity: r.capacity,
            establishmentId: r.establishmentId,
            amenities: r.equipment || [],
            isActive: r.isActive,
          })) || []);
        }

        if (establishmentsRes.ok) {
          const establishmentsData = await establishmentsRes.json();
          const estList = establishmentsData.establishments?.map((e: { _id: { toString: () => string }; name: string }) => ({
            id: e._id?.toString() || "",
            name: e.name,
          })) || [];
          setEstablishments(estList);
          if (estList.length > 0 && !newRoom.establishmentId) {
            setNewRoom(prev => ({ ...prev, establishmentId: estList[0].id }));
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getEstablishmentName = (id: string) => establishments.find(e => e.id === id)?.name || "Unknown";

  const handleAddRoom = async () => {
    if (!newRoom.name || !newRoom.establishmentId) return;
    setSaving(true);
    try {
      const amenitiesArray = newRoom.amenities.split(",").map(a => a.trim()).filter(a => a);
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoom.name,
          establishmentId: newRoom.establishmentId,
          capacity: newRoom.capacity,
          equipment: amenitiesArray,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRooms([...rooms, {
          id: data.room._id?.toString() || "",
          name: data.room.name,
          capacity: data.room.capacity,
          establishmentId: data.room.establishmentId,
          amenities: data.room.equipment || [],
          isActive: data.room.isActive,
        }]);
        setNewRoom({ name: "", capacity: 10, establishmentId: establishments[0]?.id || "", amenities: "" });
        setShowAddModal(false);
        showToast("Room created successfully");
      } else {
        showToast("Failed to create room", "error");
      }
    } catch (error) {
      console.error("Create room error:", error);
      showToast("Failed to create room", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: room.isActive ? "deactivate" : "activate" }),
      });

      if (res.ok) {
        setRooms(prev => prev.map(r =>
          r.id === roomId ? { ...r, isActive: !r.isActive } : r
        ));
        showToast(`Room ${room.isActive ? "deactivated" : "activated"}`);
      } else {
        showToast("Failed to update room", "error");
      }
    } catch (error) {
      console.error("Toggle room error:", error);
      showToast("Failed to update room", "error");
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;

    try {
      const res = await fetch(`/api/rooms/${roomToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setRooms(prev => prev.filter(room => room.id !== roomToDelete.id));
        showToast("Room deleted");
      } else {
        showToast("Failed to delete room", "error");
      }
    } catch (error) {
      console.error("Delete room error:", error);
      showToast("Failed to delete room", "error");
    } finally {
      setRoomToDelete(null);
    }
  };

  const handleStartEdit = (room: Room) => {
    setEditingRoom(room);
    setNewRoom({
      name: room.name,
      capacity: room.capacity,
      establishmentId: room.establishmentId,
      amenities: room.amenities.join(", "),
    });
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom || !newRoom.name || !newRoom.establishmentId) return;
    setSaving(true);
    try {
      const amenitiesArray = newRoom.amenities.split(",").map(a => a.trim()).filter(a => a);
      const res = await fetch(`/api/rooms/${editingRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoom.name,
          establishmentId: newRoom.establishmentId,
          capacity: newRoom.capacity,
          equipment: amenitiesArray,
        }),
      });

      if (res.ok) {
        setRooms(prev => prev.map(r =>
          r.id === editingRoom.id
            ? { ...r, name: newRoom.name, capacity: newRoom.capacity, establishmentId: newRoom.establishmentId, amenities: amenitiesArray }
            : r
        ));
        setEditingRoom(null);
        setNewRoom({ name: "", capacity: 10, establishmentId: establishments[0]?.id || "", amenities: "" });
        showToast("Room updated successfully");
      } else {
        showToast("Failed to update room", "error");
      }
    } catch (error) {
      console.error("Update room error:", error);
      showToast("Failed to update room", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingRoom(null);
    setNewRoom({ name: "", capacity: 10, establishmentId: establishments[0]?.id || "", amenities: "" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Group rooms by establishment
  const roomsByEstablishment = establishments.map(est => ({
    ...est,
    rooms: rooms.filter(room => room.establishmentId === est.id)
  })).filter(est => est.rooms.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Rooms</h2>
          <p className="text-sm text-gray-600 mt-1">Manage rooms and spaces across your establishments.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Room</Button>
      </div>

      {/* Rooms grouped by establishment */}
      <div className="space-y-6">
        {roomsByEstablishment.map((establishment) => (
          <div key={establishment.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Establishment Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">{establishment.name}</h3>
                <p className="text-sm text-gray-500">{establishment.rooms.length} room{establishment.rooms.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Rooms List */}
            <div className="divide-y divide-gray-100">
              {establishment.rooms.map((room) => (
                <div key={room.id} className={`p-4 sm:p-6 ${!room.isActive ? "bg-gray-50" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${room.isActive ? "bg-blue-100" : "bg-gray-200"}`}>
                        <svg className={`w-6 h-6 ${room.isActive ? "text-blue-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${room.isActive ? "text-gray-900" : "text-gray-500"}`}>{room.name}</h4>
                          {!room.isActive && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">Inactive</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">Capacity: {room.capacity} people</p>
                        {room.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {room.amenities.map((amenity, idx) => (
                              <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(room)}
                        className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit room"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(room.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          room.isActive ? "bg-primary-600" : "bg-gray-300"
                        }`}
                        title={room.isActive ? "Active - Click to deactivate" : "Inactive - Click to activate"}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            room.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => setRoomToDelete(room)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete room"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {roomsByEstablishment.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No rooms yet</h3>
            <p className="text-gray-500 mb-4">Add your first room to get started.</p>
            <Button onClick={() => setShowAddModal(true)}>Add Room</Button>
          </div>
        )}
      </div>

      {/* Add/Edit Room Modal */}
      {(showAddModal || editingRoom) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{editingRoom ? "Edit Room" : "Add Room"}</h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                <input
                  type="text"
                  placeholder="e.g., Studio A"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Establishment</label>
                <select
                  value={newRoom.establishmentId}
                  onChange={(e) => setNewRoom({ ...newRoom, establishmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>{est.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newRoom.capacity}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const numValue = parseInt(value) || 0;
                    setNewRoom({ ...newRoom, capacity: numValue });
                  }}
                  onBlur={() => {
                    if (newRoom.capacity < 2) {
                      setNewRoom({ ...newRoom, capacity: 2 });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum capacity: 2 (student + instructor)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
                <input
                  type="text"
                  placeholder="e.g., Mirrors, Sound System, Air Conditioning"
                  value={newRoom.amenities}
                  onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Separate amenities with commas</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingRoom ? handleUpdateRoom : handleAddRoom}
                disabled={!newRoom.name || newRoom.capacity < 2 || saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingRoom ? "Save Changes" : "Add Room"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {roomToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Room?</h3>
              <p className="text-sm text-gray-600 text-center">
                Are you sure you want to delete <span className="font-medium">{roomToDelete.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setRoomToDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Plans Settings Component - Admin manages plans sold to clients
function PlansSettings() {
  const [plans, setPlans] = useState([
    {
      id: "starter",
      name: "Starter",
      price: 49,
      period: "month",
      classes: 8,
      features: ["8 classes/month", "Online booking", "Email reminders"],
      isActive: true,
    },
    {
      id: "growth",
      name: "Growth",
      price: 79,
      period: "month",
      classes: 16,
      features: ["16 classes/month", "Priority booking", "WhatsApp reminders", "Cancel anytime"],
      isPopular: true,
      isActive: true,
    },
    {
      id: "professional",
      name: "Professional",
      price: 149,
      period: "month",
      classes: -1,
      features: ["Unlimited classes", "VIP booking", "Personal trainer", "24/7 access"],
      isActive: true,
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<typeof plans[0] | null>(null);
  const [planToDelete, setPlanToDelete] = useState<typeof plans[0] | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: "",
    classes: "",
    features: "",
  });

  const handleTogglePlan = (planId: string) => {
    setPlans(prev => prev.map(p =>
      p.id === planId ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const handleSetPopular = (planId: string) => {
    setPlans(prev => prev.map(p => ({
      ...p,
      isPopular: p.id === planId,
    })));
  };

  const handleAddPlan = () => {
    if (!newPlan.name || !newPlan.price) return;

    const plan = {
      id: newPlan.name.toLowerCase().replace(/\s+/g, "-"),
      name: newPlan.name,
      price: parseFloat(newPlan.price),
      period: "month" as const,
      classes: parseInt(newPlan.classes) || -1,
      features: newPlan.features.split("\n").filter(f => f.trim()),
      isActive: true,
    };

    setPlans(prev => [...prev, plan]);
    setNewPlan({ name: "", price: "", classes: "", features: "" });
    setShowAddModal(false);
  };

  const handleDeletePlan = (plan: typeof plans[0]) => {
    setPlanToDelete(plan);
  };

  const confirmDeletePlan = () => {
    if (planToDelete) {
      setPlans(prev => prev.filter(p => p.id !== planToDelete.id));
      setPlanToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Subscription Plans</h2>
          <p className="text-sm text-gray-600 mt-1">Manage plans available for your clients.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Plan
        </Button>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white border rounded-xl p-6 ${
              plan.isActive ? "border-gray-200" : "border-gray-200 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  {plan.isPopular && (
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                      Most Popular
                    </span>
                  )}
                  {!plan.isActive && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${plan.price}
                  <span className="text-sm font-normal text-gray-500">/{plan.period}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {plan.classes === -1 ? "Unlimited classes" : `${plan.classes} classes/month`}
                </p>
                <ul className="mt-3 space-y-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSetPopular(plan.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    plan.isPopular
                      ? "bg-primary-100 text-primary-600"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                  title="Set as most popular"
                >
                  <svg className="w-5 h-5" fill={plan.isPopular ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <Toggle enabled={plan.isActive} onChange={() => handleTogglePlan(plan.id)} />
                <button
                  onClick={() => handleDeletePlan(plan)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete plan"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Plan</h2>
              <p className="text-sm text-gray-600 mt-1">Create a subscription plan for clients</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="e.g., Premium"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($/month) *</label>
                  <input
                    type="number"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                    placeholder="99"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classes/month</label>
                  <input
                    type="number"
                    value={newPlan.classes}
                    onChange={(e) => setNewPlan({ ...newPlan, classes: e.target.value })}
                    placeholder="-1 for unlimited"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (one per line)</label>
                <textarea
                  value={newPlan.features}
                  onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                  placeholder="Priority booking&#10;WhatsApp reminders&#10;Cancel anytime"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAddPlan}>
                Add Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Plan Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Plan
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Are you sure you want to delete <span className="font-medium text-gray-900">{planToDelete.name}</span>? Existing subscribers will keep their current plan.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setPlanToDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePlan}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// FlexiWell SaaS Plans for Studios
// Updated 2025 pricing from IMPLEMENTATION_GUIDE.md
const flexiwellPlans = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: "For solo instructors",
    limits: {
      clients: 100,
      staff: 1,
      locations: 1,
      storage: "5GB",
    },
    features: [
      "Up to 100 clients",
      "1 staff account",
      "1 location",
      "Online scheduling",
      "Email reminders",
      "Basic reports",
    ],
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 99,
    yearlyPrice: 79,
    description: "For growing studios",
    limits: {
      clients: 250,
      staff: 5,
      locations: 1,
      storage: "10GB",
    },
    features: [
      "Up to 250 clients",
      "5 team accounts",
      "1 location",
      "Online scheduling",
      "Email reminders",
      "Advanced reports",
      "Chat support",
    ],
    highlight: false,
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 179,
    yearlyPrice: 149,
    description: "For established studios",
    limits: {
      clients: 500,
      staff: 8,
      locations: 2,
      storage: "50GB",
    },
    features: [
      "Up to 500 clients",
      "8 team accounts",
      "2 locations",
      "Online scheduling",
      "Email + SMS + WhatsApp",
      "AI Support Basic (500 chats/mo)",
      "WhatsApp Bot (1,000 msgs/month)",
      "AI-powered smart waitlist",
      "Advanced reports",
      "Priority support (24h)",
    ],
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "professional",
    name: "Professional",
    monthlyPrice: 249,
    yearlyPrice: 199,
    description: "For large studios",
    limits: {
      clients: 2000,
      staff: 15,
      locations: 5,
      storage: "200GB",
    },
    features: [
      "Up to 2,000 clients",
      "15 team accounts",
      "5 locations",
      "Online scheduling",
      "Email + SMS + WhatsApp",
      "AI Support Pro (2,000 chats/mo)",
      "WhatsApp Bot (5,000 msgs/month)",
      "Instagram Bot",
      "Advanced reports",
      "Priority support (12h)",
    ],
    highlight: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 399,
    yearlyPrice: 319,
    description: "For studio networks",
    limits: {
      clients: -1,
      staff: -1,
      locations: 10,
      storage: "500GB",
    },
    features: [
      "Unlimited clients",
      "Unlimited team",
      "Up to 10 locations",
      "AI Support Enterprise (unlimited)",
      "WhatsApp + Instagram Bot (unlimited)",
      "White-label (your brand)",
      "Complete API access",
      "Dedicated account manager",
      "Custom onboarding",
      "SLA 99.9%",
    ],
    highlight: false,
  },
];

// Change Plan Modal Component
function ChangePlanModal({
  isOpen,
  onClose,
  currentPlanId,
  billingCycle,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId: string;
  billingCycle: "monthly" | "yearly";
}) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId);
  const [selectedCycle, setSelectedCycle] = useState(billingCycle);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!isOpen) return null;

  const currentPlan = flexiwellPlans.find((p) => p.id === currentPlanId);
  const newPlan = flexiwellPlans.find((p) => p.id === selectedPlan);
  const currentPrice = billingCycle === "yearly" ? currentPlan?.yearlyPrice : currentPlan?.monthlyPrice;
  const newPrice = selectedCycle === "yearly" ? newPlan?.yearlyPrice : newPlan?.monthlyPrice;
  const priceDifference = (newPrice || 0) - (currentPrice || 0);

  const currentPlanIndex = flexiwellPlans.findIndex((p) => p.id === currentPlanId);
  const selectedPlanIndex = flexiwellPlans.findIndex((p) => p.id === selectedPlan);
  const isUpgrade = selectedPlanIndex > currentPlanIndex || (selectedPlanIndex === currentPlanIndex && priceDifference > 0);
  const isDowngrade = selectedPlanIndex < currentPlanIndex || (selectedPlanIndex === currentPlanIndex && priceDifference < 0);

  const handleRequestChange = () => {
    if (selectedPlan === currentPlanId && selectedCycle === billingCycle) {
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmChange = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsProcessing(false);
    setShowConfirmModal(false);
    onClose();
    // Show success toast or redirect
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-[98vw] 2xl:max-w-[1600px] max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Change FlexiWell Plan</h2>
              <p className="text-sm text-gray-600 mt-1">Choose the ideal plan for your studio</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3 mt-4 p-1 bg-gray-100 rounded-lg w-fit mx-auto">
            <button
              onClick={() => setSelectedCycle("monthly")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                selectedCycle === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedCycle("yearly")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                selectedCycle === "yearly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
          {/* Responsive grid for 5 plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 gap-y-8 items-start">
            {flexiwellPlans.map((plan) => {
              const price = selectedCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
              const isCurrentPlan = currentPlanId === plan.id;
              const isSelected = selectedPlan === plan.id;

              return (
                <div className="relative h-full">
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative w-full h-full p-4 sm:p-5 rounded-xl border-2 text-left transition-all flex flex-col ${
                      isSelected
                        ? "border-primary-600 bg-primary-50 ring-2 ring-primary-200"
                        : plan.highlight
                        ? "border-primary-200 bg-primary-50/30"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Badge at top edge */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3.5 py-1.5 bg-primary-600 text-white text-[10px] font-bold rounded-full whitespace-nowrap uppercase tracking-wider shadow-md">
                          ⭐ {plan.badge}
                        </span>
                      </div>
                    )}

                    {/* Add top spacing for badge */}
                    <div className="h-4"></div>

                    {/* Current Plan badge inside card, below Most Popular */}
                    {isCurrentPlan && (
                      <div className="flex justify-center mb-3">
                        <span className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-semibold rounded-full uppercase tracking-wide shadow-sm">
                          Current Plan
                        </span>
                      </div>
                    )}

                  {/* Plan name and description */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 text-xl tracking-tight">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{plan.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold text-gray-900 tracking-tight">${price}</span>
                      <span className="text-base text-gray-500">/mo</span>
                    </div>
                    {selectedCycle === "yearly" && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-md">
                        <span className="text-xs text-green-700 font-semibold">
                          💰 Save ${(plan.monthlyPrice - price) * 12}/year
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Limits with icons */}
                  <div className="mb-5 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">👥</span>
                        <span className="text-gray-600">
                          <span className="font-semibold text-gray-900">
                            {plan.limits.clients === -1 ? "∞" : plan.limits.clients}
                          </span> clients
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">👤</span>
                        <span className="text-gray-600">
                          <span className="font-semibold text-gray-900">
                            {plan.limits.staff === -1 ? "∞" : plan.limits.staff}
                          </span> team
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📍</span>
                        <span className="text-gray-600">
                          <span className="font-semibold text-gray-900">{plan.limits.locations}</span> locations
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">💾</span>
                        <span className="text-gray-600">
                          <span className="font-semibold text-gray-900">{plan.limits.storage}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              </div>
              );
            })}
          </div>

          {/* Upgrade/Downgrade Notice */}
          {selectedPlan !== currentPlanId && (
            <div className={`mt-4 p-4 rounded-lg ${
              isUpgrade ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
            }`}>
              <div className="flex items-start gap-3">
                <svg className={`w-5 h-5 flex-shrink-0 ${isUpgrade ? "text-green-600" : "text-amber-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className={`font-medium ${isUpgrade ? "text-green-800" : "text-amber-800"}`}>
                    {isUpgrade ? "Plan upgrade" : "Plan downgrade"}
                  </p>
                  <p className={isUpgrade ? "text-green-700" : "text-amber-700"}>
                    {isUpgrade
                      ? "Your new plan will be activated immediately with access to all features."
                      : "When downgrading, you may lose access to some features. Data above the limit will be preserved but inaccessible."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRequestChange}
            disabled={selectedPlan === currentPlanId && selectedCycle === billingCycle}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Confirm Change"}
          </button>
        </div>
      </div>
    </div>

    {/* Confirmation Modal */}
    {showConfirmModal && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
          <div className="p-6">
            {/* Icon */}
            <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${
              isUpgrade ? "bg-green-100" : "bg-amber-100"
            }`}>
              {isUpgrade ? (
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              {isUpgrade ? "Confirm Upgrade" : "Confirm Downgrade"}
            </h3>

            {/* Plan change summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Current Plan</p>
                  <p className="font-semibold text-gray-900">{currentPlan?.name}</p>
                  <p className="text-sm text-gray-600">R$ {currentPrice}/mo</p>
                </div>
                <div className="px-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">New Plan</p>
                  <p className="font-semibold text-gray-900">{newPlan?.name}</p>
                  <p className="text-sm text-gray-600">R$ {newPrice}/mo</p>
                </div>
              </div>

            </div>

            {/* Warning/Info message */}
            <div className={`p-3 rounded-lg mb-4 ${
              isUpgrade ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
            }`}>
              <p className={`text-sm ${isUpgrade ? "text-green-700" : "text-amber-700"}`}>
                {isUpgrade
                  ? "Your new plan will be activated immediately. You will be charged the prorated difference for the current billing period."
                  : "When downgrading, you may lose access to some features. Your current data will be preserved but may become inaccessible if it exceeds the new plan limits."}
              </p>
            </div>

            {/* Billing info */}
            <p className="text-xs text-gray-500 text-center">
              {selectedCycle === "yearly"
                ? `Billed annually at R$ ${(newPrice || 0) * 12}/year`
                : `Billed monthly at R$ ${newPrice}/month`
              }
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmChange}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2.5 text-white font-medium rounded-lg transition-colors disabled:opacity-50 ${
                isUpgrade
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isProcessing ? "Processing..." : isUpgrade ? "Confirm Upgrade" : "Confirm Downgrade"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// Update Payment Modal
function UpdatePaymentModalAdmin({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleSubmit = async () => {
    if (!cardNumber || !expiry || !cvc) {
      alert("Please fill in all card details");
      return;
    }

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsProcessing(false);

    alert("Payment method updated!\n\nYour new card will be used for future payments.");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update Payment</h2>
          <p className="text-sm text-gray-600 mt-1">Enter the new card details</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                placeholder="123"
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-xs text-gray-500">Your data is protected with SSL encryption</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isProcessing ? "Updating..." : "Update Card"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Subscription Settings Component (FlexiWell platform subscription)
function SubscriptionSettings() {
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const currentPlan = {
    id: "business",
    name: "Business",
    monthlyPrice: 179,
    yearlyPrice: 143,
    billingCycle: "monthly" as "monthly" | "yearly",
    nextBilling: "15 Jan 2025",
    usage: {
      clients: 342,
      clientsLimit: 500,
      staff: 8,
      staffLimit: 15,
      locations: 1,
      locationsLimit: 2,
      storage: "12GB",
      storageLimit: "25GB",
    },
  };

  const paymentMethod = {
    type: "Visa",
    last4: "4242",
    expiry: "12/26",
  };

  const billingHistory = [
    { id: "1", date: "Dec 1, 2024", description: "Business Plan", amount: "$179.00", status: "Paid" },
    { id: "2", date: "Nov 1, 2024", description: "Business Plan", amount: "$179.00", status: "Paid" },
    { id: "3", date: "Oct 1, 2024", description: "Business Plan", amount: "$179.00", status: "Paid" },
    { id: "4", date: "Sep 1, 2024", description: "Professional Plan", amount: "$99.00", status: "Paid" },
  ];

  const usagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Subscription</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your FlexiWell platform subscription.</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">Current subscription</h3>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                Most Popular
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{currentPlan.name}</p>
            <p className="text-sm text-gray-500">
              R$ {currentPlan.monthlyPrice}/month
              {currentPlan.billingCycle === "yearly" && " (yearly)"}
            </p>
          </div>
          <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full self-start">
            Active
          </span>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Clients</span>
              <span className="text-xs font-medium text-gray-700">
                {currentPlan.usage.clients}/{currentPlan.usage.clientsLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  usagePercentage(currentPlan.usage.clients, currentPlan.usage.clientsLimit) > 80
                    ? "bg-amber-500"
                    : "bg-primary-500"
                }`}
                style={{ width: `${usagePercentage(currentPlan.usage.clients, currentPlan.usage.clientsLimit)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Team</span>
              <span className="text-xs font-medium text-gray-700">
                {currentPlan.usage.staff}/{currentPlan.usage.staffLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${usagePercentage(currentPlan.usage.staff, currentPlan.usage.staffLimit)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Locations</span>
              <span className="text-xs font-medium text-gray-700">
                {currentPlan.usage.locations}/{currentPlan.usage.locationsLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${usagePercentage(currentPlan.usage.locations, currentPlan.usage.locationsLimit)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Storage</span>
              <span className="text-xs font-medium text-gray-700">
                {currentPlan.usage.storage}/{currentPlan.usage.storageLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `48%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Next billing</p>
            <p className="text-sm font-medium text-gray-900">{currentPlan.nextBilling}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChangePlanModal(true)}
              className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Change plan
            </button>
          </div>
        </div>
      </div>

      {/* Savings Tip */}
      {currentPlan.billingCycle === "monthly" && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Save 20% with yearly plan</p>
              <p className="text-sm text-green-700 mt-0.5">
                Switch to yearly billing and save R$ {Math.round((currentPlan.monthlyPrice - currentPlan.yearlyPrice) * 12)}/year
              </p>
            </div>
            <button
              onClick={() => setShowChangePlanModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors whitespace-nowrap"
            >
              View plans
            </button>
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Payment method</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold tracking-wide">VISA</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {paymentMethod.type} •••• {paymentMethod.last4}
              </p>
              <p className="text-xs text-gray-500">Expires {paymentMethod.expiry}</p>
            </div>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Update
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Billing history</h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Description</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase pb-3">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {billingHistory.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-sm text-gray-600">{item.date}</td>
                  <td className="py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="py-3 text-sm font-medium text-gray-900">{item.amount}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-3">
          {billingHistory.map((item) => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{item.description}</span>
                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                  {item.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{item.date}</span>
                <span className="font-medium text-gray-900">{item.amount}</span>
              </div>
              <button className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                Download invoice
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ChangePlanModal
        isOpen={showChangePlanModal}
        onClose={() => setShowChangePlanModal(false)}
        currentPlanId={currentPlan.id}
        billingCycle={currentPlan.billingCycle}
      />
      <UpdatePaymentModalAdmin
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
}

// Notifications Settings Component
function NotificationsSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    weeklyReports: true,
    newClientAlerts: true,
    paymentAlerts: true,
    classReminders: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("/api/settings?section=notifications");
        if (res.ok) {
          const data = await res.json();
          if (data.notifications) {
            setSettings(prev => ({ ...prev, ...data.notifications }));
          }
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    }
    loadNotifications();
  }, []);

  const updateSetting = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "notifications", data: settings }),
      });
      if (res.ok) {
        showToast("Notification settings saved");
      } else {
        showToast("Failed to save settings", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        <p className="text-sm text-gray-600 mt-1">Configure how you receive notifications.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Email Notifications</p>
            <p className="text-sm text-gray-500">Receive notifications via email</p>
          </div>
          <Toggle enabled={settings.emailNotifications} onChange={(v) => updateSetting("emailNotifications", v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Push Notifications</p>
            <p className="text-sm text-gray-500">Receive push notifications in browser</p>
          </div>
          <Toggle enabled={settings.pushNotifications} onChange={(v) => updateSetting("pushNotifications", v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
            <p className="text-sm text-gray-500">Receive tips and product updates</p>
          </div>
          <Toggle enabled={settings.marketingEmails} onChange={(v) => updateSetting("marketingEmails", v)} />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Alert Types</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Weekly Reports</p>
                <p className="text-sm text-gray-500">Get weekly summary of your studio</p>
              </div>
              <Toggle enabled={settings.weeklyReports} onChange={(v) => updateSetting("weeklyReports", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">New Client Alerts</p>
                <p className="text-sm text-gray-500">When a new client registers</p>
              </div>
              <Toggle enabled={settings.newClientAlerts} onChange={(v) => updateSetting("newClientAlerts", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Payment Alerts</p>
                <p className="text-sm text-gray-500">When payments are received</p>
              </div>
              <Toggle enabled={settings.paymentAlerts} onChange={(v) => updateSetting("paymentAlerts", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Class Reminders</p>
                <p className="text-sm text-gray-500">Reminders before classes start</p>
              </div>
              <Toggle enabled={settings.classReminders} onChange={(v) => updateSetting("classReminders", v)} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary">Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Team Member interface
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Teacher" | "Receptionist";
  status: "Active" | "Pending";
}

// Invite Member Modal
function InviteMemberModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Teacher" as TeamMember["role"],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      showToast("Please fill in name and email", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role.toLowerCase(),
        }),
      });
      if (res.ok) {
        showToast(`Team member ${formData.name} added successfully`);
        setFormData({ name: "", email: "", role: "Teacher" });
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to add team member", "error");
      }
    } catch (error) {
      console.error("Add member error:", error);
      showToast("Failed to add team member", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Invite Team Member</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as TeamMember["role"] })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Admin">Admin</option>
              <option value="Teacher">Teacher</option>
              <option value="Receptionist">Receptionist</option>
            </select>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Invitation Email</p>
                <p className="text-sm text-blue-700 mt-1">
                  The team member will receive an email to set up their account and password.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Member Action Menu
function MemberActionMenu({
  member,
  onEdit,
  onResendInvite,
  onRemove,
}: {
  member: TeamMember;
  onEdit: () => void;
  onResendInvite: () => void;
  onRemove: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Member
            </button>
            {member.status === "Pending" && (
              <button
                onClick={() => {
                  onResendInvite();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Resend Invite
              </button>
            )}
            <button
              onClick={() => {
                onRemove();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Remove Member
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Team Settings Component
function TeamSettings() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Load team members from API
  const loadTeamMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.staff?.map((s: { _id: { toString: () => string }; name: string; email: string; role: string; status: string }) => ({
          id: s._id?.toString() || "",
          name: s.name,
          email: s.email,
          role: (s.role.charAt(0).toUpperCase() + s.role.slice(1)) as TeamMember["role"],
          status: s.status === "active" ? "Active" : "Pending",
        })) || []);
      }
    } catch (error) {
      console.error("Failed to load team members:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  const handleEditMember = (member: TeamMember) => {
    // For simplicity, we'll just show an alert. In production, this would open an edit modal.
    showToast(`Edit functionality for ${member.name} - coming soon`);
  };

  const handleResendInvite = (member: TeamMember) => {
    showToast(`Invitation reminder sent to ${member.email}`);
  };

  const handleRemoveMember = (member: TeamMember) => {
    setMemberToRemove(member);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      const res = await fetch(`/api/staff/${memberToRemove.id}`, { method: "DELETE" });
      if (res.ok) {
        setTeamMembers(prev => prev.filter(m => m.id !== memberToRemove.id));
        showToast(`${memberToRemove.name} has been removed from the team`);
        setMemberToRemove(null);
      } else {
        showToast("Failed to remove team member", "error");
      }
    } catch (error) {
      console.error("Remove member error:", error);
      showToast("Failed to remove team member", "error");
    } finally {
      setIsRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team</h2>
          <p className="text-sm text-gray-600 mt-1">Manage team access and permissions.</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>Invite Member</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-700">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                member.role === "Admin" ? "bg-primary-100 text-primary-700" :
                member.role === "Teacher" ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {member.role}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                member.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                {member.status}
              </span>
              <MemberActionMenu
                member={member}
                onEdit={() => handleEditMember(member)}
                onResendInvite={() => handleResendInvite(member)}
                onRemove={() => handleRemoveMember(member)}
              />
            </div>
          ))}
        </div>
      </div>

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={loadTeamMembers}
      />

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Remove Team Member</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <span className="font-semibold text-gray-900">{memberToRemove.name}</span> from the team? They will lose access to the system immediately.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setMemberToRemove(null)}
                  disabled={isRemoving}
                  className="px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveMember}
                  disabled={isRemoving}
                  className="px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isRemoving && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  Remove Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// WhatsApp Settings Component
type WhatsAppPlan = "starter" | "pro" | "enterprise";

interface WhatsAppPlanDetails {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

const whatsappPlans: Record<WhatsAppPlan, WhatsAppPlanDetails> = {
  starter: {
    name: "Starter",
    price: "$49/month",
    features: [
      "View scheduled classes",
      "Confirm attendance",
      "500 conversations/month",
      "Basic automated messages",
    ],
  },
  pro: {
    name: "Pro",
    price: "$99/month",
    features: [
      "Everything in Starter",
      "Cancel classes",
      "Book new classes",
      "2,000 conversations/month",
      "Proactive notifications",
      "Automatic reminders",
    ],
    highlighted: true,
  },
  enterprise: {
    name: "Enterprise",
    price: "$199/month",
    features: [
      "Everything in Pro",
      "Unlimited conversations",
      "Multiple phone numbers",
      "Advanced reports",
      "Priority support",
      "Custom integrations",
    ],
  },
};

function WhatsAppSettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WhatsAppPlan>("pro");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [twilioConfig, setTwilioConfig] = useState({
    accountSid: "",
    authToken: "",
    whatsappNumber: "",
  });

  // Load WhatsApp config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/admin/integrations");
        if (res.ok) {
          const data = await res.json();
          const whatsapp = data.integrations?.find((i: { id: string }) => i.id === "whatsapp");
          if (whatsapp?.status === "connected") {
            setIsEnabled(true);
          }
        }
      } catch (error) {
        console.error("Failed to load WhatsApp config:", error);
      }
    }
    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    if (!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.whatsappNumber) {
      showToast("All fields are required", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: "whatsapp",
          credentials: {
            accountSid: twilioConfig.accountSid,
            authToken: twilioConfig.authToken,
            phoneNumber: twilioConfig.whatsappNumber,
          },
        }),
      });

      if (res.ok) {
        showToast("WhatsApp connected successfully");
        setShowConfigModal(false);
        setIsEnabled(true);
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to save configuration", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save configuration", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">WhatsApp Business</h2>
        <p className="text-sm text-gray-600 mt-1">
          Let your clients check classes, confirm attendance, and cancel via WhatsApp.
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">WhatsApp Bot</p>
              <p className="text-sm text-gray-500">
                {isEnabled ? "Active • " + whatsappPlans[selectedPlan].name + " Plan" : "Not configured"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  Active
                </span>
                <Button variant="secondary" onClick={() => setShowConfigModal(true)}>
                  Configure
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowConfigModal(true)}>
                Enable WhatsApp
              </Button>
            )}
          </div>
        </div>

        {isEnabled && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">1,247</p>
                <p className="text-xs text-gray-500">Messages this month</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">89%</p>
                <p className="text-xs text-gray-500">Response rate</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">156</p>
                <p className="text-xs text-gray-500">Bot confirmations</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Plans */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">WhatsApp Plans</h3>
        <div className="grid grid-cols-3 gap-4">
          {(Object.keys(whatsappPlans) as WhatsAppPlan[]).map((planKey) => {
            const plan = whatsappPlans[planKey];
            const isSelected = selectedPlan === planKey;
            return (
              <div
                key={planKey}
                className={`relative bg-white border-2 rounded-xl p-5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary-500 ring-2 ring-primary-100"
                    : "border-gray-200 hover:border-gray-300"
                } ${plan.highlighted ? "shadow-lg" : ""}`}
                onClick={() => setSelectedPlan(planKey)}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                      Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-4">
                  <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{plan.price}</p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                      isSelected
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {isSelected ? "Current Plan" : "Select"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bot Features */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Bot Features</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">View Classes</p>
              <p className="text-xs text-gray-500">Client views their upcoming scheduled classes</p>
            </div>
            <Toggle enabled={true} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Confirm Attendance</p>
              <p className="text-xs text-gray-500">Client confirms attendance for classes</p>
            </div>
            <Toggle enabled={true} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Cancel Class</p>
              <p className="text-xs text-gray-500">Client cancels class directly</p>
            </div>
            <Toggle enabled={selectedPlan !== "starter"} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Book New Class</p>
              <p className="text-xs text-gray-500">Client books new classes via WhatsApp</p>
            </div>
            <Toggle enabled={selectedPlan !== "starter"} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Automatic Reminders</p>
              <p className="text-xs text-gray-500">Send reminder 24h before class</p>
            </div>
            <Toggle enabled={selectedPlan !== "starter"} onChange={() => {}} />
          </div>
        </div>
      </div>

      {/* Twilio Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Configure Twilio</h3>
                </div>
                <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  To use WhatsApp Business, you need a Twilio account.
                  <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="font-medium underline ml-1">
                    Create free account
                  </a>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account SID</label>
                <input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={twilioConfig.accountSid}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Found in Twilio Console</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••"
                  value={twilioConfig.authToken}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="+15551234567"
                  value={twilioConfig.whatsappNumber}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, whatsappNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">WhatsApp approved number in Twilio</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Webhook URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-xs text-gray-600 overflow-x-auto">
                    https://your-domain.com/api/webhook/whatsapp/twilio
                  </code>
                  <button className="px-3 py-2 text-xs font-medium text-primary-600 border border-primary-200 rounded hover:bg-primary-50">
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Configure this URL in Twilio Console → Messaging → WhatsApp Sandbox</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={!twilioConfig.accountSid || !twilioConfig.authToken || !twilioConfig.whatsappNumber}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Save and Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// NOTE: Branding Settings Component moved to /components/features-future/BrandingSettings.tsx
// This is a future feature that will be sold as a premium add-on (+$39/month)

// Waitlist Settings Component
function WaitlistSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    maxWaitlistSize: 10,
    autoNotifyOnCancel: true,
    showPositionToClient: true,
    allowAutoConfirm: true,
    notificationChannels: ["whatsapp", "email"] as string[],
    confirmationMethod: "link" as "link" | "reply" | "app",
    noShowPenalty: {
      enabled: true,
      maxNoShows: 2,
      penaltyDays: 7,
    },
    priorityBoost: {
      enabled: true,
      attendanceThreshold: 8,
      boostPercentage: 20,
    },
  });
  const [saving, setSaving] = useState(false);

  // Priority Score Configuration (matches WaitlistPriorityConfig schema)
  const [priorityConfig, setPriorityConfig] = useState({
    planTypePoints: {
      annual: 50,
      quarterly: 30,
      monthly: 15,
      "drop-in": 5,
    },
    waitingTimePointsPerDay: 2,
    attendanceRateMultiplier: 0.5,
    vipBonus: 100,
    cancelledByStudioBonus: 75,
    urgentReasonBonus: 25,
    notificationWindowMinutes: 30,
    autoDeclineAfterMinutes: 120,
    maxNotificationsPerSlot: 3,
  });

  const [priorityTiers, setPriorityTiers] = useState([
    {
      id: "vip",
      label: "VIP Members",
      responseTimeMinutes: 240,
      cancellationGraceHours: 2,
      sources: ["Native VIP"],
      color: "#6938EF",
      enabled: true,
    },
    {
      id: "high",
      label: "Direct Clients",
      responseTimeMinutes: 120,
      cancellationGraceHours: 4,
      sources: ["Native", "Packages"],
      color: "#8870E9",
      enabled: true,
    },
    {
      id: "medium",
      label: "ClassPass",
      responseTimeMinutes: 60,
      cancellationGraceHours: 12,
      sources: ["ClassPass"],
      color: "#DD2590",
      enabled: true,
    },
    {
      id: "low",
      label: "Aggregators",
      responseTimeMinutes: 30,
      cancellationGraceHours: 24,
      sources: ["Gympass", "TotalPass", "Urban"],
      color: "#98A2B3",
      enabled: true,
    },
  ]);

  useEffect(() => {
    async function loadWaitlistSettings() {
      try {
        const res = await fetch("/api/settings?section=waitlist");
        if (res.ok) {
          const data = await res.json();
          if (data.waitlist) {
            if (data.waitlist.settings) setSettings(prev => ({ ...prev, ...data.waitlist.settings }));
            if (data.waitlist.priorityConfig) setPriorityConfig(prev => ({ ...prev, ...data.waitlist.priorityConfig }));
            if (data.waitlist.priorityTiers) setPriorityTiers(data.waitlist.priorityTiers);
          }
        }
      } catch (error) {
        console.error("Failed to load waitlist settings:", error);
      }
    }
    loadWaitlistSettings();
  }, []);

  const updateTier = (tierId: string, field: string, value: number | boolean) => {
    setPriorityTiers(prev =>
      prev.map(tier =>
        tier.id === tierId ? { ...tier, [field]: value } : tier
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "waitlist",
          data: {
            settings,
            priorityConfig,
            priorityTiers,
          },
        }),
      });
      if (res.ok) {
        showToast("Waitlist settings saved");
      } else {
        showToast("Failed to save settings", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Waitlist Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure smart waitlist with priority-based notifications and automatic spot filling.
        </p>
      </div>

      {/* Waitlist Toggle */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Enable Waitlist</h3>
              <p className="text-sm text-gray-600">Allow clients to join waitlist when classes are full</p>
            </div>
          </div>
          <Toggle enabled={settings.enabled} onChange={(v) => setSettings({ ...settings, enabled: v })} />
        </div>
      </div>

      {/* Priority Tiers */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900">Priority Tiers</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure priority levels for different client sources. Higher priority clients get notified first and have more time to respond.
          </p>
        </div>

        <div className="space-y-4">
          {priorityTiers.map((tier, index) => (
            <div
              key={tier.id}
              className={`border rounded-xl p-4 transition-all ${
                tier.enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: tier.color }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{tier.label}</h4>
                    <p className="text-xs text-gray-500">{tier.sources.join(", ")}</p>
                  </div>
                </div>
                <Toggle enabled={tier.enabled} onChange={(v) => updateTier(tier.id, "enabled", v)} />
              </div>

              {tier.enabled && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Response Time
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={tier.responseTimeMinutes}
                        onChange={(e) => updateTier(tier.id, "responseTimeMinutes", parseInt(e.target.value))}
                        className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-xs text-gray-500">minutes to confirm</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cancellation Grace
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={tier.cancellationGraceHours}
                        onChange={(e) => updateTier(tier.id, "cancellationGraceHours", parseInt(e.target.value))}
                        className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-xs text-gray-500">hours before class</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-primary-50 rounded-lg">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-primary-800">
              <p className="font-medium mb-1">How Priority Works</p>
              <p>When a spot opens up, the client with the highest priority on the waitlist is notified first. If they don't confirm within the response time, the next person is automatically notified.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Score Configuration */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900">Priority Points Configuration</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure how many points each criterion adds to the client's priority score.
          </p>
        </div>

        {/* Plan Type Points */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Points by Plan Type</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: "annual" as const, label: "Annual", color: "bg-purple-100 text-purple-700" },
              { key: "quarterly" as const, label: "Quarterly", color: "bg-blue-100 text-blue-700" },
              { key: "monthly" as const, label: "Monthly", color: "bg-green-100 text-green-700" },
              { key: "drop-in" as const, label: "Drop-in", color: "bg-gray-100 text-gray-700" },
            ].map((plan) => (
              <div key={plan.key} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${plan.color}`}>
                    {plan.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priorityConfig.planTypePoints[plan.key]}
                    onChange={(e) => setPriorityConfig({
                      ...priorityConfig,
                      planTypePoints: {
                        ...priorityConfig.planTypePoints,
                        [plan.key]: parseInt(e.target.value) || 0,
                      },
                    })}
                    className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bonus Points */}
        <div className="mb-6 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Bonus Points</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⭐</span>
                <span className="text-sm font-medium text-gray-900">VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priorityConfig.vipBonus}
                  onChange={(e) => setPriorityConfig({ ...priorityConfig, vipBonus: parseInt(e.target.value) || 0 })}
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500">bonus pts</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Clients marked as VIP</p>
            </div>

            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🏢</span>
                <span className="text-sm font-medium text-gray-900">Cancelled by Studio</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priorityConfig.cancelledByStudioBonus}
                  onChange={(e) => setPriorityConfig({ ...priorityConfig, cancelledByStudioBonus: parseInt(e.target.value) || 0 })}
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500">bonus pts</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">When studio cancels the class</p>
            </div>

            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🚨</span>
                <span className="text-sm font-medium text-gray-900">Urgent Reason</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priorityConfig.urgentReasonBonus}
                  onChange={(e) => setPriorityConfig({ ...priorityConfig, urgentReasonBonus: parseInt(e.target.value) || 0 })}
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500">bonus pts</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Requests marked as urgent</p>
            </div>
          </div>
        </div>

        {/* Dynamic Points */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Dynamic Points</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⏳</span>
                <span className="text-sm font-medium text-gray-900">Waiting Time</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={priorityConfig.waitingTimePointsPerDay}
                  onChange={(e) => setPriorityConfig({ ...priorityConfig, waitingTimePointsPerDay: parseFloat(e.target.value) || 0 })}
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500">pts / day waiting</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Points added for each day in queue</p>
            </div>

            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📊</span>
                <span className="text-sm font-medium text-gray-900">Attendance Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={priorityConfig.attendanceRateMultiplier}
                  onChange={(e) => setPriorityConfig({ ...priorityConfig, attendanceRateMultiplier: parseFloat(e.target.value) || 0 })}
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-xs text-gray-500">pts / 1% attendance</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">E.g.: 80% attendance = +40 pts (0.5 × 80)</p>
            </div>
          </div>
        </div>

        {/* Example Calculation */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Calculation Example</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Client with <span className="font-medium">Annual</span> plan ({priorityConfig.planTypePoints.annual} pts)</p>
            <p>+ Marked as <span className="font-medium">VIP</span> (+{priorityConfig.vipBonus} pts)</p>
            <p>+ Waiting for <span className="font-medium">3 days</span> (+{priorityConfig.waitingTimePointsPerDay * 3} pts)</p>
            <p>+ <span className="font-medium">90%</span> attendance (+{Math.round(priorityConfig.attendanceRateMultiplier * 90)} pts)</p>
            <div className="pt-2 mt-2 border-t border-gray-200">
              <p className="font-semibold text-gray-900">
                Total: {priorityConfig.planTypePoints.annual + priorityConfig.vipBonus + (priorityConfig.waitingTimePointsPerDay * 3) + Math.round(priorityConfig.attendanceRateMultiplier * 90)} points
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Timing */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900">Notification Timing</h3>
          <p className="text-sm text-gray-600 mt-1">Configure how long clients have to respond to notifications.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notification Window</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priorityConfig.notificationWindowMinutes}
                onChange={(e) => setPriorityConfig({ ...priorityConfig, notificationWindowMinutes: parseInt(e.target.value) || 0 })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-500">minutes</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Time for client to respond</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Auto-decline after</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priorityConfig.autoDeclineAfterMinutes}
                onChange={(e) => setPriorityConfig({ ...priorityConfig, autoDeclineAfterMinutes: parseInt(e.target.value) || 0 })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-500">minutes</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">No response = next in queue</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max notifications/slot</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priorityConfig.maxNotificationsPerSlot}
                onChange={(e) => setPriorityConfig({ ...priorityConfig, maxNotificationsPerSlot: parseInt(e.target.value) || 0 })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-500">people</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Attempts before giving up</p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Notification Settings</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Channels</label>
            <div className="flex flex-wrap gap-3">
              {[
                { id: "whatsapp", label: "WhatsApp", icon: "💬" },
                { id: "sms", label: "SMS", icon: "📱" },
                { id: "email", label: "Email", icon: "📧" },
                { id: "push", label: "Push", icon: "🔔" },
              ].map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    const channels = settings.notificationChannels.includes(channel.id)
                      ? settings.notificationChannels.filter(c => c !== channel.id)
                      : [...settings.notificationChannels, channel.id];
                    setSettings({ ...settings, notificationChannels: channels });
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    settings.notificationChannels.includes(channel.id)
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span>{channel.icon}</span>
                  <span className="text-sm font-medium">{channel.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-notify on cancellation</p>
              <p className="text-xs text-gray-500">Immediately notify next in line when someone cancels</p>
            </div>
            <Toggle enabled={settings.autoNotifyOnCancel} onChange={(v) => setSettings({ ...settings, autoNotifyOnCancel: v })} />
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Show queue position</p>
              <p className="text-xs text-gray-500">Let clients see their position in the waitlist</p>
            </div>
            <Toggle enabled={settings.showPositionToClient} onChange={(v) => setSettings({ ...settings, showPositionToClient: v })} />
          </div>

          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Allow auto-confirm</p>
              <p className="text-xs text-gray-500">Let clients opt-in to automatic booking when spot opens</p>
            </div>
            <Toggle enabled={settings.allowAutoConfirm} onChange={(v) => setSettings({ ...settings, allowAutoConfirm: v })} />
          </div>
        </div>
      </div>

      {/* No-Show Penalty */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">No-Show Penalty</h3>
            <p className="text-sm text-gray-600">Penalize clients who don't show up after getting a waitlist spot</p>
          </div>
          <Toggle enabled={settings.noShowPenalty.enabled} onChange={(v) => setSettings({ ...settings, noShowPenalty: { ...settings.noShowPenalty, enabled: v } })} />
        </div>

        {settings.noShowPenalty.enabled && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max No-Shows</label>
              <select
                value={settings.noShowPenalty.maxNoShows}
                onChange={(e) => setSettings({ ...settings, noShowPenalty: { ...settings.noShowPenalty, maxNoShows: parseInt(e.target.value) } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={1}>1 no-show</option>
                <option value={2}>2 no-shows</option>
                <option value={3}>3 no-shows</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Duration</label>
              <select
                value={settings.noShowPenalty.penaltyDays}
                onChange={(e) => setSettings({ ...settings, noShowPenalty: { ...settings.noShowPenalty, penaltyDays: parseInt(e.target.value) } })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Priority Boost */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Loyalty Priority Boost</h3>
            <p className="text-sm text-gray-600">Give priority boost to frequent attendees</p>
          </div>
          <Toggle enabled={settings.priorityBoost.enabled} onChange={(v) => setSettings({ ...settings, priorityBoost: { ...settings.priorityBoost, enabled: v } })} />
        </div>

        {settings.priorityBoost.enabled && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Threshold</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.priorityBoost.attendanceThreshold}
                  onChange={(e) => setSettings({ ...settings, priorityBoost: { ...settings.priorityBoost, attendanceThreshold: parseInt(e.target.value) } })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500">classes/month</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority Boost</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.priorityBoost.boostPercentage}
                  onChange={(e) => setSettings({ ...settings, priorityBoost: { ...settings.priorityBoost, boostPercentage: parseInt(e.target.value) } })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500">% priority increase</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* General Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">General Settings</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Waitlist Size</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={settings.maxWaitlistSize}
              onChange={(e) => setSettings({ ...settings, maxWaitlistSize: parseInt(e.target.value) })}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-500">people per class</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Maximum number of people that can join the waitlist for a single class</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary">Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Waitlist Settings"}
        </Button>
      </div>
    </div>
  );
}

// Integrations Settings Component
function IntegrationsSettings() {
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, { connected: boolean; lastSync?: string; loading?: boolean }>>({
    wellhub: { connected: false },
    stripe: { connected: false },
    googleCalendar: { connected: false },
    whatsapp: { connected: false },
    instagram: { connected: false },
    mailchimp: { connected: false },
    zapier: { connected: false },
    paypal: { connected: false },
  });
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeKeys, setStripeKeys] = useState({ publishableKey: "", secretKey: "" });
  const [showWellhubModal, setShowWellhubModal] = useState(false);
  const [wellhubKeys, setWellhubKeys] = useState({ apiKey: "", gymId: "" });

  useEffect(() => {
    // Fetch integration status
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/admin/integrations/status");
        if (res.ok) {
          const data = await res.json();
          setIntegrationStatus(data);
        }
      } catch (error) {
        console.error("Failed to fetch integration status:", error);
      }
    };
    fetchStatus();
  }, []);

  const handleConnectStripe = async () => {
    if (!stripeKeys.publishableKey || !stripeKeys.secretKey) {
      showToast("Please enter both Stripe keys", "error");
      return;
    }

    setIntegrationStatus(prev => ({ ...prev, stripe: { ...prev.stripe, loading: true } }));

    try {
      const res = await fetch("/api/admin/integrations/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripeKeys),
      });

      if (res.ok) {
        setIntegrationStatus(prev => ({
          ...prev,
          stripe: { connected: true, lastSync: new Date().toISOString() },
        }));
        setShowStripeModal(false);
        setStripeKeys({ publishableKey: "", secretKey: "" });
        showToast("Stripe connected successfully!");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to connect Stripe", "error");
      }
    } catch (error) {
      showToast("Failed to connect Stripe", "error");
    } finally {
      setIntegrationStatus(prev => ({ ...prev, stripe: { ...prev.stripe, loading: false } }));
    }
  };

  const handleConnectGoogleCalendar = async () => {
    setIntegrationStatus(prev => ({ ...prev, googleCalendar: { ...prev.googleCalendar, loading: true } }));

    try {
      // Use admin route for Google OAuth
      const res = await fetch("/api/admin/integrations/google-calendar");
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      } else {
        const data = await res.json();
        if (data.missingConfig) {
          showToast("Google Calendar not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env", "error");
        } else {
          showToast(data.error || "Failed to start Google Calendar connection", "error");
        }
      }
    } catch (error) {
      showToast("Failed to connect Google Calendar", "error");
    } finally {
      setIntegrationStatus(prev => ({ ...prev, googleCalendar: { ...prev.googleCalendar, loading: false } }));
    }
  };

  const handleDisconnect = async (integration: string) => {
    if (!confirm(`Are you sure you want to disconnect ${integration}?`)) return;

    try {
      const res = await fetch(`/api/admin/integrations/${integration}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setIntegrationStatus(prev => ({
          ...prev,
          [integration]: { connected: false },
        }));
        showToast(`${integration} disconnected`);
      } else {
        showToast("Failed to disconnect", "error");
      }
    } catch (error) {
      showToast("Failed to disconnect", "error");
    }
  };

  const integrations = [
    {
      id: "wellhub",
      name: "Wellhub",
      icon: "WH",
      color: "green",
      description: integrationStatus.wellhub?.connected
        ? `Connected • Last sync: ${integrationStatus.wellhub.lastSync ? new Date(integrationStatus.wellhub.lastSync).toLocaleString() : "Never"}`
        : "Gym marketplace integration",
      onConnect: () => setShowWellhubModal(true),
    },
    {
      id: "stripe",
      name: "Stripe",
      icon: "ST",
      color: "purple",
      description: integrationStatus.stripe?.connected
        ? `Connected • Last sync: ${integrationStatus.stripe.lastSync ? new Date(integrationStatus.stripe.lastSync).toLocaleString() : "Never"}`
        : "Payment processing",
      onConnect: () => setShowStripeModal(true),
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: "PP",
      color: "blue",
      description: integrationStatus.paypal?.connected
        ? `Connected • Accepting PayPal payments`
        : "Accept PayPal payments",
      onConnect: () => window.location.href = "/admin/integrations",
    },
    {
      id: "googleCalendar",
      name: "Google Calendar",
      icon: "GC",
      color: "blue",
      description: integrationStatus.googleCalendar?.connected
        ? `Connected • Syncing classes automatically`
        : "Calendar sync & notifications",
      onConnect: handleConnectGoogleCalendar,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: "WA",
      color: "green",
      description: integrationStatus.whatsapp?.connected
        ? `Connected • Messaging active`
        : "Client messaging via Twilio",
      onConnect: () => window.location.href = "/admin/integrations",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: "IG",
      color: "pink",
      description: integrationStatus.instagram?.connected
        ? `Connected • DMs active`
        : "Receive and respond to DMs",
      onConnect: () => window.location.href = "/admin/integrations",
    },
    {
      id: "mailchimp",
      name: "Mailchimp",
      icon: "MC",
      color: "yellow",
      description: integrationStatus.mailchimp?.connected
        ? `Connected • Email marketing active`
        : "Email marketing & newsletters",
      onConnect: () => window.location.href = "/admin/integrations",
    },
    {
      id: "zapier",
      name: "Zapier",
      icon: "ZP",
      color: "orange",
      description: integrationStatus.zapier?.connected
        ? `Connected • Automations active`
        : "Connect with 5000+ apps",
      onConnect: () => window.location.href = "/admin/integrations",
    },
  ];

  const colorClasses: Record<string, string> = {
    green: "bg-green-100 text-green-600",
    purple: "bg-primary-100 text-primary-600",
    blue: "bg-blue-100 text-blue-600",
    pink: "bg-pink-100 text-pink-600",
    yellow: "bg-yellow-100 text-yellow-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-600 mt-1">Connected apps and services.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-4">
          {integrations.map((integration) => {
            const status = integrationStatus[integration.id];
            const isConnected = status?.connected;
            const isLoading = status?.loading;

            return (
              <div key={integration.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[integration.color]}`}>
                  <span className="font-bold text-sm">{integration.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                  <p className="text-sm text-gray-500">{integration.description}</p>
                </div>
                {isConnected ? (
                  <>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="text-sm text-red-600 font-medium hover:text-red-700"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={integration.onConnect}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stripe Modal */}
      {showStripeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Stripe</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your Stripe API keys to enable payment processing.
              You can find these in your{" "}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                Stripe Dashboard
              </a>.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publishable Key
                </label>
                <input
                  type="text"
                  value={stripeKeys.publishableKey}
                  onChange={(e) => setStripeKeys(prev => ({ ...prev, publishableKey: e.target.value }))}
                  placeholder="pk_live_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={stripeKeys.secretKey}
                  onChange={(e) => setStripeKeys(prev => ({ ...prev, secretKey: e.target.value }))}
                  placeholder="sk_live_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStripeModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectStripe}
                disabled={integrationStatus.stripe?.loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {integrationStatus.stripe?.loading ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wellhub Modal */}
      {showWellhubModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Wellhub</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your Wellhub API credentials to sync classes and bookings.
              You can find these in your{" "}
              <a
                href="https://partners.wellhub.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                Wellhub Partner Dashboard
              </a>.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={wellhubKeys.apiKey}
                  onChange={(e) => setWellhubKeys(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Your Wellhub API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gym ID
                </label>
                <input
                  type="text"
                  value={wellhubKeys.gymId}
                  onChange={(e) => setWellhubKeys(prev => ({ ...prev, gymId: e.target.value }))}
                  placeholder="Your Wellhub Gym ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWellhubModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!wellhubKeys.apiKey || !wellhubKeys.gymId) {
                    showToast("Please enter both API Key and Gym ID", "error");
                    return;
                  }
                  setIntegrationStatus(prev => ({ ...prev, wellhub: { ...prev.wellhub, loading: true } }));
                  try {
                    const res = await fetch("/api/admin/integrations/wellhub", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(wellhubKeys),
                    });
                    if (res.ok) {
                      setIntegrationStatus(prev => ({
                        ...prev,
                        wellhub: { connected: true, lastSync: new Date().toISOString() },
                      }));
                      setShowWellhubModal(false);
                      setWellhubKeys({ apiKey: "", gymId: "" });
                      showToast("Wellhub connected successfully!");
                    } else {
                      const data = await res.json();
                      showToast(data.error || "Failed to connect Wellhub", "error");
                    }
                  } catch {
                    showToast("Failed to connect Wellhub", "error");
                  } finally {
                    setIntegrationStatus(prev => ({ ...prev, wellhub: { ...prev.wellhub, loading: false } }));
                  }
                }}
                disabled={integrationStatus.wellhub?.loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {integrationStatus.wellhub?.loading ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>("general");

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "plans":
        return <PlansSettings />;
      case "waitlist":
        return <WaitlistSettings />;
      case "establishments":
        return <EstablishmentsSettings />;
      case "rooms":
        return <RoomsSettings />;
      case "subscription":
        return <SubscriptionSettings />;
      case "notifications":
        return <NotificationsSettings />;
      case "team":
        return <TeamSettings />;
      case "integrations":
        return <IntegrationsSettings />;
      case "whatsapp":
        return <WhatsAppSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Settings</h1>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
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
