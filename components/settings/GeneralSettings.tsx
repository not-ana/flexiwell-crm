"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { BusinessType, businessTypes } from "@/lib/config/business-types";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { ReplayTourSection } from "@/components/settings/ReplayTourSection";
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
  });
  const [originalSettings, setOriginalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);

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
        {/* Profile Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => handleProfileChange("firstName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => handleProfileChange("lastName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
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
            placeholder="+1 (555) 000-0000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
          />
        </div>

        {/* Password Section - Collapsible */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowPasswordFields(!showPasswordFields)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showPasswordFields ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Change password
          </button>

          {showPasswordFields && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  autoComplete="current-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* Profile Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => {
            setPasswords({ current: "", new: "", confirm: "" });
            setShowPasswordFields(false);
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

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-0 divide-y divide-gray-100">
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-gray-500">Business Type</span>
          <span className="text-sm font-medium text-gray-900">{selectedBusinessType.icon} {selectedBusinessType.name}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-gray-500">Currency</span>
          <span className="text-sm font-medium text-gray-900">$ USD</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-gray-500">Account type</span>
          <span className="text-sm text-gray-500 capitalize">{user?.role}</span>
        </div>
      </div>

      {/* Replay Tour Section */}
      <ReplayTourSection role="admin" />

      {/* Account Settings Section */}
      <AccountSettings hideAccountInfo />
    </div>
  );
}
