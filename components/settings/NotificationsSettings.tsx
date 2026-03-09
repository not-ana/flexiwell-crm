"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { showToast } from "./shared";

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 h-6 w-11 ${
        enabled ? "bg-primary-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block rounded-full bg-white shadow-xs transition-transform h-4 w-4 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SMSIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function EmailIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CheckCircleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminderHours: number;
  confirmationEmail: boolean;
  marketingEmails: boolean;
}

interface NotificationLog {
  _id: string;
  type: string;
  channel: "email" | "sms" | "whatsapp";
  clientName: string;
  recipient: string;
  status: "sent" | "failed";
  sentAt?: string;
  error?: string;
  createdAt: string;
}

interface NotificationStats {
  totalSent: number;
  smsSent: number;
  emailSent: number;
  failedCount: number;
}

const defaultSettings: NotificationSettings = {
  emailEnabled: true,
  smsEnabled: true,
  reminderHours: 24,
  confirmationEmail: true,
  marketingEmails: false,
};

const typeLabels: Record<string, string> = {
  booking_confirmation: "Booking Confirmed",
  booking_cancellation: "Booking Cancelled",
  booking_reminder: "Class Reminder",
  waitlist_spot_available: "Waitlist Spot",
  plan_expiring: "Plan Expiring",
  payment_confirmation: "Payment Confirmed",
  welcome: "Welcome",
  class_cancelled: "Class Cancelled",
  intake_form: "Intake Form",
  custom: "Custom",
};

export function NotificationsSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [recentLogs, setRecentLogs] = useState<NotificationLog[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ totalSent: 0, smsSent: 0, emailSent: 0, failedCount: 0 });

  useEffect(() => {
    async function loadData() {
      try {
        const [settingsRes, logsRes] = await Promise.all([
          fetch("/api/settings?section=notifications"),
          fetch("/api/notifications/logs?limit=10"),
        ]);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.notifications) {
            const loaded = { ...defaultSettings, ...data.notifications };
            setSettings(loaded);
            setOriginalSettings(loaded);
          }
        }

        if (logsRes.ok) {
          const data = await logsRes.json();
          setRecentLogs(data.logs || []);
          setStats(data.stats || { totalSent: 0, smsSent: 0, emailSent: 0, failedCount: 0 });
        }
      } catch (error) {
        console.error("Failed to load notification settings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    setHasUnsavedChanges(JSON.stringify(settings) !== JSON.stringify(originalSettings));
  }, [settings, originalSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "notifications", data: settings }),
      });

      if (res.ok) {
        setOriginalSettings(settings);
        setHasUnsavedChanges(false);
        showToast("Notification settings saved", "success");
      } else {
        showToast("Failed to save settings", "error");
      }
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full size-8 border-2 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure how your studio communicates with clients. SMS + Email.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges}
          variant={hasUnsavedChanges ? "primary" : "secondary"}
        >
          {saving ? "Saving..." : hasUnsavedChanges ? "Save changes" : "Saved"}
        </Button>
      </div>

      {/* Delivery Stats */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Delivery overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs p-4">
            <p className="text-2xl font-semibold text-gray-900">{stats.totalSent}</p>
            <p className="text-sm text-gray-500 mt-1">Total sent</p>
          </div>
          <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs p-4">
            <div className="flex items-center gap-2">
              <SMSIcon className="size-4 text-blue-600" />
              <p className="text-2xl font-semibold text-gray-900">{stats.smsSent}</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">SMS sent</p>
          </div>
          <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs p-4">
            <div className="flex items-center gap-2">
              <EmailIcon className="size-4 text-violet-600" />
              <p className="text-2xl font-semibold text-gray-900">{stats.emailSent}</p>
            </div>
            <p className="text-sm text-gray-500 mt-1">Emails sent</p>
          </div>
          <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs p-4">
            <p className={`text-2xl font-semibold ${stats.failedCount > 0 ? "text-red-600" : "text-gray-900"}`}>{stats.failedCount}</p>
            <p className="text-sm text-gray-500 mt-1">Failed</p>
          </div>
        </div>
      </div>

      {/* Channel Settings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Channels</h3>
        <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
          {/* SMS */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <SMSIcon className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">SMS (Twilio)</p>
                <p className="text-sm text-gray-600 mt-0.5">Primary channel. Reminders, waitlist alerts, confirmations.</p>
              </div>
            </div>
            <Toggle enabled={settings.smsEnabled} onChange={() => setSettings({ ...settings, smsEnabled: !settings.smsEnabled })} />
          </div>

          {/* Email */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <EmailIcon className="size-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Email (Resend)</p>
                <p className="text-sm text-gray-600 mt-0.5">Confirmations, receipts, welcome emails, plan alerts.</p>
              </div>
            </div>
            <Toggle enabled={settings.emailEnabled} onChange={() => setSettings({ ...settings, emailEnabled: !settings.emailEnabled })} />
          </div>
        </div>
      </div>

      {/* Automation Settings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Automation</h3>
        <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
          {/* Reminder timing */}
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Class reminders</p>
              <p className="text-sm text-gray-600 mt-0.5">Send SMS reminder before each class</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={48}
                value={settings.reminderHours}
                onChange={(e) => setSettings({ ...settings, reminderHours: parseInt(e.target.value) || 24 })}
                className="w-16 px-2 py-1.5 text-sm text-center rounded-lg ring-1 ring-gray-300 shadow-xs focus:ring-2 focus:ring-primary-600 focus:outline-none"
              />
              <span className="text-sm text-gray-600">hours before</span>
            </div>
          </div>

          {/* Confirmation email */}
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Booking confirmation email</p>
              <p className="text-sm text-gray-600 mt-0.5">Email clients when they book a class</p>
            </div>
            <Toggle enabled={settings.confirmationEmail} onChange={() => setSettings({ ...settings, confirmationEmail: !settings.confirmationEmail })} />
          </div>

          {/* Marketing */}
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Marketing emails</p>
              <p className="text-sm text-gray-600 mt-0.5">Send promotions and studio updates</p>
            </div>
            <Toggle enabled={settings.marketingEmails} onChange={() => setSettings({ ...settings, marketingEmails: !settings.marketingEmails })} />
          </div>
        </div>
      </div>

      {/* How SMS costs work */}
      <div className="rounded-xl bg-blue-50 ring-1 ring-inset ring-blue-600/10 p-5">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <SMSIcon className="size-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">SMS pricing</p>
            <p className="text-sm text-gray-600 mt-1">
              SMS is sent via Twilio at ~$0.0079/message. A studio with 100 clients sending 4 reminders/week costs roughly <strong>$3/month</strong> — one saved no-show pays for months of SMS.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_SMS_NUMBER environment variables.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent notifications</h3>
        {recentLogs.length === 0 ? (
          <div className="rounded-xl bg-gray-50 ring-1 ring-inset ring-gray-200 py-8 flex flex-col items-center">
            <div className="size-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
              <CheckCircleIcon className="size-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No notifications sent yet</p>
            <p className="text-xs text-gray-400 mt-1">Notifications will appear here as they are sent</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
            {recentLogs.map((log) => (
              <div key={log._id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                    log.channel === "sms" ? "bg-blue-50" : "bg-violet-50"
                  }`}>
                    {log.channel === "sms" ? (
                      <SMSIcon className="size-4 text-blue-600" />
                    ) : (
                      <EmailIcon className="size-4 text-violet-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{log.clientName}</span>
                      <span className="text-xs text-gray-500">{typeLabels[log.type] || log.type}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{log.recipient}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
                    log.status === "sent"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                      : "bg-red-50 text-red-700 ring-red-600/10"
                  }`}>
                    {log.status === "sent" ? "Sent" : "Failed"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {log.sentAt ? new Date(log.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
