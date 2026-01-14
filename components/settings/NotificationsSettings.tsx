"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { showToast, Toggle } from "./shared";

export function NotificationsSettings() {
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
