"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { BusinessType, businessTypes, getBusinessTypeOptions } from "@/lib/config/business-types";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { api } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "./shared";

export function GeneralSettings() {
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
  const [originalSettings, setOriginalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
            const loadedSettings = { ...settings, ...data.general };
            setSettings(loadedSettings);
            setOriginalSettings(loadedSettings);
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

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasUnsavedChanges(hasChanges);
  }, [settings, originalSettings]);

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
        setOriginalSettings(settings);
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              {settings.businessType === "other"
                ? "Customize your terminology:"
                : `Terminology preview for ${selectedBusinessType.name}:`}
            </p>
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Unsaved changes
              </span>
            )}
          </div>
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

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
          <Button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className={hasUnsavedChanges ? "ring-2 ring-amber-400 ring-offset-2" : ""}
          >
            {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Account Settings Section */}
      <AccountSettings hideAccountInfo />
    </div>
  );
}
