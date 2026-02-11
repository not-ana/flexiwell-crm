"use client";

import { useState, useEffect } from "react";

type NotificationChannel = "none" | "in-app" | "email";

interface NotificationSetting {
  id: string;
  label: string;
  value: NotificationChannel;
}

interface NotificationGroup {
  title: string;
  description: string;
  settings: NotificationSetting[];
}

const channelOptions: { value: NotificationChannel; label: string }[] = [
  { value: "none", label: "None" },
  { value: "in-app", label: "In-app" },
  { value: "email", label: "Email" },
];

function ChannelSelector({
  value,
  onChange,
}: {
  value: NotificationChannel;
  onChange: (value: NotificationChannel) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
      {channelOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            value === option.value
              ? "bg-gray-100 text-gray-900"
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function NotificationRow({
  setting,
  onUpdate,
}: {
  setting: NotificationSetting;
  onUpdate: (value: NotificationChannel) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-sm text-gray-900">{setting.label}</span>
      <ChannelSelector value={setting.value} onChange={onUpdate} />
    </div>
  );
}

function NotificationSection({
  group,
  onUpdate,
}: {
  group: NotificationGroup;
  onUpdate: (id: string, value: NotificationChannel) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 py-6 border-b border-gray-200 last:border-b-0">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{group.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{group.description}</p>
      </div>
      <div className="divide-y divide-gray-100">
        {group.settings.map((setting) => (
          <NotificationRow
            key={setting.id}
            setting={setting}
            onUpdate={(value) => onUpdate(setting.id, value)}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminNotificationsPage() {
  const [generalSettings, setGeneralSettings] = useState<NotificationSetting[]>([
    { id: "mentioned", label: "I'm mentioned in a message", value: "in-app" },
    { id: "replies", label: "Someone replies to any message", value: "in-app" },
    { id: "assigned", label: "I'm assigned a task", value: "in-app" },
    { id: "overdue", label: "A task is overdue", value: "in-app" },
    { id: "status-updated", label: "A task status is updated", value: "email" },
  ]);

  const [summarySettings, setSummarySettings] = useState<NotificationSetting[]>([
    { id: "daily", label: "Daily summary", value: "email" },
    { id: "weekly", label: "Weekly summary", value: "email" },
    { id: "monthly", label: "Monthly summary", value: "none" },
    { id: "quarterly", label: "Quarterly summary", value: "none" },
  ]);

  const [businessSettings, setBusinessSettings] = useState<NotificationSetting[]>([
    { id: "new-client", label: "New client registration", value: "in-app" },
    { id: "enrollment-request", label: "Class enrollment request", value: "email" },
    { id: "instructor-change", label: "Instructor change request", value: "email" },
    { id: "payment-received", label: "Payment received", value: "email" },
    { id: "payment-failed", label: "Payment failed", value: "email" },
    { id: "subscription-expiring", label: "Subscription expiring soon", value: "email" },
    { id: "class-full", label: "Class is full", value: "in-app" },
  ]);

  const [staffSettings, setStaffSettings] = useState<NotificationSetting[]>([
    { id: "staff-joined", label: "New staff member joined", value: "in-app" },
    { id: "time-off-request", label: "Staff requests time off", value: "email" },
    { id: "schedule-change", label: "Schedule change request", value: "email" },
    { id: "support-ticket", label: "New support ticket", value: "email" },
  ]);

  const updateSetting = (
    settings: NotificationSetting[],
    setSettings: React.Dispatch<React.SetStateAction<NotificationSetting[]>>,
    id: string,
    value: NotificationChannel
  ) => {
    setSettings(settings.map((s) => (s.id === id ? { ...s, value } : s)));
  };

  const groups: NotificationGroup[] = [
    {
      title: "General notifications",
      description: "Select when you'll be notified when the following changes occur.",
      settings: generalSettings,
    },
    {
      title: "Summary notifications",
      description: "Select when you'll be notified when the following summaries or reports are ready.",
      settings: summarySettings,
    },
    {
      title: "Business notifications",
      description: "Select when you'll be notified about client and business activities.",
      settings: businessSettings,
    },
    {
      title: "Staff notifications",
      description: "Select when you'll be notified about staff activities and requests.",
      settings: staffSettings,
    },
  ];

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [generalSettings, summarySettings, businessSettings, staffSettings]);

  const handleUpdate = (groupIndex: number, id: string, value: NotificationChannel) => {
    switch (groupIndex) {
      case 0:
        updateSetting(generalSettings, setGeneralSettings, id, value);
        break;
      case 1:
        updateSetting(summarySettings, setSummarySettings, id, value);
        break;
      case 2:
        updateSetting(businessSettings, setBusinessSettings, id, value);
        break;
      case 3:
        updateSetting(staffSettings, setStaffSettings, id, value);
        break;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general: generalSettings,
          summary: summarySettings,
          business: businessSettings,
          staff: staffSettings,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notification preferences");
      }

      setHasChanges(false);
      // Show success toast
      const toast = document.createElement("div");
      toast.className = "fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 bg-green-600";
      toast.textContent = "Notification preferences saved successfully!";
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      const toast = document.createElement("div");
      toast.className = "fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 bg-red-600";
      toast.textContent = "Failed to save preferences. Please try again.";
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">Select when and how you&apos;ll be notified.</p>
      </div>

      {/* Notification Sections */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-6">
          {groups.map((group, index) => (
            <NotificationSection
              key={group.title}
              group={group}
              onUpdate={(id, value) => handleUpdate(index, id, value)}
            />
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
