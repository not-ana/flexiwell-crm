"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { showToast } from "./shared";
import {
  sourcePriorities,
  defaultWaitlistSettings,
  defaultSourcePriorities,
  type WaitlistSettings as WaitlistSettingsType,
} from "@/lib/config/waitlist";

function Toggle({
  enabled,
  onChange,
  size = "md",
}: {
  enabled: boolean;
  onChange: () => void;
  size?: "sm" | "md";
}) {
  const dims = size === "sm"
    ? { track: "h-5 w-9", thumb: "h-3.5 w-3.5", on: "translate-x-4", off: "translate-x-0.5" }
    : { track: "h-6 w-11", thumb: "h-4 w-4", on: "translate-x-6", off: "translate-x-1" };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={`relative inline-flex items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${dims.track} ${
        enabled ? "bg-primary-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block rounded-full bg-white shadow-xs transition-transform ${dims.thumb} ${
          enabled ? dims.on : dims.off
        }`}
      />
    </button>
  );
}

export function WaitlistSettings() {
  const [settings, setSettings] = useState<WaitlistSettingsType>(defaultWaitlistSettings);
  const [originalSettings, setOriginalSettings] = useState<WaitlistSettingsType>(defaultWaitlistSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings?section=waitlist");
        if (res.ok) {
          const data = await res.json();
          if (data.waitlist) {
            const loadedSettings = { ...defaultWaitlistSettings, ...data.waitlist };
            setSettings(loadedSettings);
            setOriginalSettings(loadedSettings);
          }
        }
      } catch (error) {
        console.error("Failed to load waitlist settings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
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
        body: JSON.stringify({ section: "waitlist", data: settings }),
      });

      if (res.ok) {
        setOriginalSettings(settings);
        setHasUnsavedChanges(false);
        showToast("Waitlist settings saved successfully", "success");
      } else {
        showToast("Failed to save settings", "error");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
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
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Waitlist</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure how the waitlist works for your classes.
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

      {/* General Settings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">General</h3>
        <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
          {/* Enable Waitlist */}
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Enable waitlist</p>
              <p className="text-sm text-gray-600 mt-0.5">Allow clients to join a waitlist when classes are full</p>
            </div>
            <Toggle enabled={settings.enabled} onChange={() => setSettings({ ...settings, enabled: !settings.enabled })} />
          </div>

          {/* Max per class */}
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Max waitlist size</p>
              <p className="text-sm text-gray-600 mt-0.5">Maximum number of people per class waitlist</p>
            </div>
            <input
              type="number"
              min={1}
              max={50}
              value={settings.maxPerClass}
              onChange={(e) => setSettings({ ...settings, maxPerClass: parseInt(e.target.value) || 10 })}
              className="w-20 px-3 py-2 text-sm text-center rounded-lg ring-1 ring-gray-300 shadow-xs focus:ring-2 focus:ring-primary-600 focus:outline-none"
            />
          </div>

          {/* SMS */}
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">SMS notifications</p>
              <p className="text-sm text-gray-600 mt-0.5">Text clients via SMS when a spot opens (via Twilio)</p>
            </div>
            <Toggle enabled={settings.notifyViaSMS} onChange={() => setSettings({ ...settings, notifyViaSMS: !settings.notifyViaSMS })} />
          </div>

          {/* Email */}
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Email notifications</p>
              <p className="text-sm text-gray-600 mt-0.5">Send email when a spot opens (as backup)</p>
            </div>
            <Toggle enabled={settings.notifyViaEmail} onChange={() => setSettings({ ...settings, notifyViaEmail: !settings.notifyViaEmail })} />
          </div>

          {/* Auto-confirm */}
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto-confirm direct clients</p>
              <p className="text-sm text-gray-600 mt-0.5">Automatically confirm direct clients when a spot opens</p>
            </div>
            <Toggle enabled={settings.autoConfirmDirect} onChange={() => setSettings({ ...settings, autoConfirmDirect: !settings.autoConfirmDirect })} />
          </div>
        </div>
      </div>

      {/* Priority Settings */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Priority by client source</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure priority points for each client source. Higher points = higher priority in the queue.
          </p>
        </div>

        <div className="rounded-xl bg-white ring-1 ring-gray-200 shadow-xs divide-y divide-gray-200">
          {sourcePriorities.map((priority) => {
            const config = settings.sourcePriorities?.find(s => s.source === priority.source)
              || defaultSourcePriorities.find(s => s.source === priority.source)!;
            const isEnabled = config?.enabled ?? false;

            const handleToggle = () => {
              const newPriorities = (settings.sourcePriorities || defaultSourcePriorities).map(s =>
                s.source === priority.source ? { ...s, enabled: !s.enabled } : s
              );
              setSettings({ ...settings, sourcePriorities: newPriorities });
            };

            const handlePointsChange = (points: number) => {
              const newPriorities = (settings.sourcePriorities || defaultSourcePriorities).map(s =>
                s.source === priority.source ? { ...s, points } : s
              );
              setSettings({ ...settings, sourcePriorities: newPriorities });
            };

            return (
              <div key={priority.source} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3">
                  <Toggle size="sm" enabled={isEnabled} onChange={handleToggle} />
                  <div
                    className={`size-3 rounded-full transition-opacity ${!isEnabled ? "opacity-30" : ""}`}
                    style={{ backgroundColor: priority.color }}
                  />
                  <span className={`text-sm font-medium ${isEnabled ? "text-gray-900" : "text-gray-400"}`}>
                    {priority.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={config?.points ?? priority.points}
                    onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0)}
                    disabled={!isEnabled}
                    className={`w-16 px-2 py-1.5 text-sm text-center rounded-lg ring-1 ring-gray-300 shadow-xs focus:ring-2 focus:ring-primary-600 focus:outline-none ${
                      !isEnabled ? "opacity-40 cursor-not-allowed bg-gray-50" : ""
                    }`}
                  />
                  <span className={`text-sm ${isEnabled ? "text-gray-600" : "text-gray-400"}`}>
                    pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Points increase by 1 per hour in queue (max +24 points/day).
        </p>
      </div>
    </div>
  );
}
