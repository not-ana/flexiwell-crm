"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { showToast, Toggle } from "./shared";

export function WaitlistSettings() {
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
