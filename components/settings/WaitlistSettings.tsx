"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { showToast } from "./shared";
import {
  sourcePriorities,
  defaultWaitlistSettings,
  defaultSourcePriorities,
  type WaitlistSettings as WaitlistSettingsType,
  type ClientSource,
} from "@/lib/config/waitlist";

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
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasUnsavedChanges(hasChanges);
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Waitlist Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure how the waitlist works for your classes
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges}
          variant={hasUnsavedChanges ? "primary" : "secondary"}
        >
          {saving ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Saved"}
        </Button>
      </div>

      {/* General Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">General</h3>
        <div className="space-y-4">
          {/* Enable Waitlist */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Enable Waitlist</p>
              <p className="text-sm text-gray-500">Allow clients to join a waitlist when classes are full</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enabled ? "bg-primary-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Max per class */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Max Waitlist Size</p>
              <p className="text-sm text-gray-500">Maximum number of people per class waitlist</p>
            </div>
            <input
              type="number"
              min={1}
              max={50}
              value={settings.maxPerClass}
              onChange={(e) => setSettings({ ...settings, maxPerClass: parseInt(e.target.value) || 10 })}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
            />
          </div>

          {/* WhatsApp Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">WhatsApp Notifications</p>
              <p className="text-sm text-gray-500">Notify clients via WhatsApp when a spot opens</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, notifyViaWhatsapp: !settings.notifyViaWhatsapp })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifyViaWhatsapp ? "bg-primary-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifyViaWhatsapp ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Auto-confirm Direct Clients */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Auto-confirm Direct Clients</p>
              <p className="text-sm text-gray-500">Automatically confirm direct clients when a spot opens</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, autoConfirmDirect: !settings.autoConfirmDirect })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoConfirmDirect ? "bg-primary-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoConfirmDirect ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Priority Settings */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Priority by Client Source</h3>
        <p className="text-sm text-gray-500 mb-4">
          Enable and configure priority points for each client source. Higher points = higher priority.
        </p>
        <div className="space-y-3">
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
              <div
                key={priority.source}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isEnabled ? "bg-gray-50" : "bg-gray-100/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggle}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      isEnabled ? "bg-primary-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        isEnabled ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <div
                    className={`w-3 h-3 rounded-full transition-opacity ${!isEnabled && "opacity-40"}`}
                    style={{ backgroundColor: priority.color }}
                  />
                  <span className={`font-medium ${isEnabled ? "text-gray-900" : "text-gray-400"}`}>
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
                    className={`w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center ${
                      !isEnabled && "opacity-50 cursor-not-allowed"
                    }`}
                  />
                  <span className={`text-sm ${isEnabled ? "text-gray-500" : "text-gray-400"}`}>
                    points
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          * Points increase by 1 per hour in queue (max +24 points/day)
        </p>
      </div>
    </div>
  );
}
