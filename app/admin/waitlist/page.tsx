"use client";

import { useState, useEffect, useCallback } from "react";
import type { WaitlistEntry, WaitlistRequestType, WaitlistStatus } from "@/lib/db/schemas";

interface DisplayEntry extends Omit<WaitlistEntry, "_id"> {
  _id: string;
}

interface AvailableClass {
  _id: string;
  title: string;
  scheduledDate: string;
  instructorName: string;
  maxCapacity: number;
  currentEnrollment: number;
}

const requestTypeLabels: Record<WaitlistRequestType, { label: string; color: string }> = {
  reschedule: { label: "Reschedule", color: "bg-blue-100 text-blue-700" },
  extra_class: { label: "Extra Class", color: "bg-purple-100 text-purple-700" },
  cancelled_by_studio: { label: "Studio Cancelled", color: "bg-red-100 text-red-700" },
};

const statusLabels: Record<WaitlistStatus, { label: string; color: string }> = {
  waiting: { label: "Waiting", color: "bg-yellow-100 text-yellow-700" },
  notified: { label: "Notified", color: "bg-blue-100 text-blue-700" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-700" },
  declined: { label: "Declined", color: "bg-red-100 text-red-700" },
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDaysAgo(date: Date | string) {
  const now = new Date();
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

// Priority Settings Modal
function PrioritySettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [config, setConfig] = useState({
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

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      const response = await fetch("/api/waitlist/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (response.ok) {
        alert("Priority settings saved!");
        onClose();
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Priority Settings</h2>
              <p className="text-sm text-gray-600 mt-1">Configure how priority scores are calculated</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Plan Type Points */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Plan Type Points</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: "annual" as const, label: "Annual", color: "bg-purple-100 text-purple-700" },
                { key: "quarterly" as const, label: "Quarterly", color: "bg-blue-100 text-blue-700" },
                { key: "monthly" as const, label: "Monthly", color: "bg-green-100 text-green-700" },
                { key: "drop-in" as const, label: "Drop-in", color: "bg-gray-100 text-gray-700" },
              ].map((plan) => (
                <div key={plan.key} className="p-3 border border-gray-200 rounded-lg">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${plan.color}`}>
                    {plan.label}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={config.planTypePoints[plan.key]}
                      onChange={(e) => setConfig({
                        ...config,
                        planTypePoints: { ...config.planTypePoints, [plan.key]: parseInt(e.target.value) || 0 },
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
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Bonus Points</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">VIP</span>
                  <span className="text-sm font-medium text-gray-900">VIP</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.vipBonus}
                    onChange={(e) => setConfig({ ...config, vipBonus: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">Studio Cancelled</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.cancelledByStudioBonus}
                    onChange={(e) => setConfig({ ...config, cancelledByStudioBonus: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">Urgent</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.urgentReasonBonus}
                    onChange={(e) => setConfig({ ...config, urgentReasonBonus: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Points */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Dynamic Points</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">Waiting Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={config.waitingTimePointsPerDay}
                    onChange={(e) => setConfig({ ...config, waitingTimePointsPerDay: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">pts/day</span>
                </div>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">Attendance Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={config.attendanceRateMultiplier}
                    onChange={(e) => setConfig({ ...config, attendanceRateMultiplier: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">pts/1%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Timing */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Notification Timing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Response Window</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.notificationWindowMinutes}
                    onChange={(e) => setConfig({ ...config, notificationWindowMinutes: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">min</span>
                </div>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Auto-decline after</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.autoDeclineAfterMinutes}
                    onChange={(e) => setConfig({ ...config, autoDeclineAfterMinutes: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">min</span>
                </div>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Max notifications</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.maxNotificationsPerSlot}
                    onChange={(e) => setConfig({ ...config, maxNotificationsPerSlot: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-xs text-gray-500">/slot</span>
                </div>
              </div>
            </div>
          </div>

          {/* Example Calculation */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Example Calculation</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Annual Plan ({config.planTypePoints.annual} pts) + VIP (+{config.vipBonus} pts) + 3 days waiting (+{config.waitingTimePointsPerDay * 3} pts) + 90% attendance (+{Math.round(config.attendanceRateMultiplier * 90)} pts)</p>
              <p className="font-semibold text-gray-900 pt-1">
                Total: {config.planTypePoints.annual + config.vipBonus + (config.waitingTimePointsPerDay * 3) + Math.round(config.attendanceRateMultiplier * 90)} points
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<DisplayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({ waiting: 0, notified: 0, confirmed: 0, expired: 0, declined: 0 });

  const [selectedEntry, setSelectedEntry] = useState<DisplayEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState<WaitlistStatus | "all">("all");
  const [filterType, setFilterType] = useState<WaitlistRequestType | "all">("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showPrioritySettings, setShowPrioritySettings] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([]);

  const fetchWaitlist = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterType !== "all") params.set("requestType", filterType);

      const response = await fetch(`/api/waitlist?${params}`);
      if (!response.ok) throw new Error("Failed to fetch waitlist");

      const data = await response.json();
      setEntries(data.entries.map((e: WaitlistEntry & { _id: { toString: () => string } }) => ({
        ...e,
        _id: e._id.toString(),
      })));
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  const fetchAvailableClasses = useCallback(async () => {
    try {
      const response = await fetch("/api/classes?hasAvailability=true&limit=20");
      if (response.ok) {
        const data = await response.json();
        setAvailableClasses(data.classes.map((c: AvailableClass & { _id: { toString: () => string } }) => ({
          ...c,
          _id: c._id.toString(),
        })));
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  }, []);

  useEffect(() => {
    fetchWaitlist();
    fetchAvailableClasses();
  }, [fetchWaitlist, fetchAvailableClasses]);

  const filteredEntries = entries.sort((a, b) => b.priorityScore - a.priorityScore);

  const handleAssignClass = async () => {
    if (!selectedEntry || !selectedClassId) return;
    const selectedClass = availableClasses.find((c) => c._id === selectedClassId);
    if (!selectedClass) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/waitlist/${selectedEntry._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          classId: selectedClassId,
          className: selectedClass.title,
          classDate: selectedClass.scheduledDate,
        }),
      });

      if (!response.ok) throw new Error("Failed to assign class");

      setShowAssignModal(false);
      setSelectedEntry(null);
      setSelectedClassId("");
      fetchWaitlist();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign class");
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotify = async (entry: DisplayEntry) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/waitlist/${entry._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "notify" }),
      });

      if (!response.ok) throw new Error("Failed to notify");
      fetchWaitlist();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send notification");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (entryId: string) => {
    if (!confirm("Are you sure you want to remove this entry from the waitlist?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/waitlist/${entryId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to remove");

      if (selectedEntry?._id === entryId) {
        setSelectedEntry(null);
        setShowDetailsPanel(false);
      }
      fetchWaitlist();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove entry");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <svg className="w-12 h-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading waitlist</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={fetchWaitlist} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Waitlist Management</h1>
            <p className="text-sm text-gray-600 mt-1 hidden lg:block">Manage client waitlist requests and priorities</p>
          </div>
          <button
            onClick={() => setShowPrioritySettings(true)}
            className="px-3 py-2 lg:px-4 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <span className="hidden lg:inline">Priority Settings</span>
            <span className="lg:hidden">Settings</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm font-medium text-yellow-700">Waiting</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.waiting}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-700">Notified</p>
            <p className="text-2xl font-bold text-blue-900">{stats.notified}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-medium text-green-700">Confirmed</p>
            <p className="text-2xl font-bold text-green-900">{stats.confirmed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as WaitlistStatus | "all")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="waiting">Waiting</option>
            <option value="notified">Notified</option>
            <option value="confirmed">Confirmed</option>
            <option value="expired">Expired</option>
            <option value="declined">Declined</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as WaitlistRequestType | "all")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="reschedule">Reschedule</option>
            <option value="extra_class">Extra Class</option>
            <option value="cancelled_by_studio">Studio Cancelled</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className={`flex-1 overflow-auto ${showDetailsPanel ? "hidden lg:block" : ""}`}>
          <div className="p-4 sm:p-6 space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">No waitlist entries found</p>
              </div>
            ) : (
              filteredEntries.map((entry, index) => (
                <div
                  key={entry._id}
                  className={`bg-white border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedEntry?._id === entry._id ? "border-primary-500 ring-2 ring-primary-100" : "border-gray-200"
                  }`}
                  onClick={() => {
                    setSelectedEntry(entry);
                    setShowDetailsPanel(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {/* Priority Rank */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? "bg-yellow-500 text-white"
                              : index === 1
                              ? "bg-gray-400 text-white"
                              : index === 2
                              ? "bg-orange-400 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{entry.priorityScore}pts</span>
                      </div>

                      {/* Client Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{entry.clientName}</h3>
                          {entry.isUrgent && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{entry.reason || "No reason provided"}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${requestTypeLabels[entry.requestType].color}`}>
                            {requestTypeLabels[entry.requestType].label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusLabels[entry.status].color}`}>
                            {statusLabels[entry.status].label}
                          </span>
                          <span className="text-xs text-gray-400">Added {formatDaysAgo(entry.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.status === "waiting" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotify(entry);
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                          >
                            Notify
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEntry(entry);
                              setShowAssignModal(true);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                          >
                            Assign
                          </button>
                        </>
                      )}
                      {entry.status === "notified" && entry.notificationExpiresAt && (
                        <span className="text-xs text-gray-500">
                          Expires {formatDate(entry.notificationExpiresAt)}
                        </span>
                      )}
                      {entry.status === "confirmed" && (
                        <span className="text-xs text-green-600 font-medium">
                          {entry.confirmedClassName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details Panel */}
        {showDetailsPanel && selectedEntry && (
          <>
            {/* Mobile overlay */}
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowDetailsPanel(false)}
            />
            <div className="fixed lg:static inset-y-0 right-0 w-full sm:w-96 lg:w-[400px] bg-white border-l border-gray-200 overflow-y-auto z-50">
              <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedEntry.clientName}</h2>
                    <p className="text-sm text-gray-500">{selectedEntry.clientEmail}</p>
                    {selectedEntry.clientPhone && (
                      <p className="text-sm text-gray-500">{selectedEntry.clientPhone}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowDetailsPanel(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Request Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Request Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Type</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${requestTypeLabels[selectedEntry.requestType].color}`}>
                          {requestTypeLabels[selectedEntry.requestType].label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Status</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusLabels[selectedEntry.status].color}`}>
                          {statusLabels[selectedEntry.status].label}
                        </span>
                      </div>
                      {selectedEntry.reason && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-sm text-gray-500 block mb-1">Reason</span>
                          <p className="text-sm text-gray-900">{selectedEntry.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Original Class (for reschedules) */}
                  {selectedEntry.originalClassName && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-orange-700 mb-2">Original Class</h3>
                      <p className="text-sm text-orange-900 font-medium">{selectedEntry.originalClassName}</p>
                      {selectedEntry.originalDate && (
                        <p className="text-sm text-orange-700">{formatDate(selectedEntry.originalDate)}</p>
                      )}
                    </div>
                  )}

                  {/* Preferences */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Preferences</h3>
                    <div className="space-y-2">
                      {selectedEntry.preferredClassTypes && selectedEntry.preferredClassTypes.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-500">Class Types</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedEntry.preferredClassTypes.map((type) => (
                              <span key={type} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full capitalize">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedEntry.preferredDays && selectedEntry.preferredDays.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-500">Preferred Days</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedEntry.preferredDays.map((day) => (
                              <span key={day} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full capitalize">
                                {day}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedEntry.preferredTimeSlots && selectedEntry.preferredTimeSlots.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-500">Time Slots</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedEntry.preferredTimeSlots.map((slot, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                                {slot.start} - {slot.end}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Priority Breakdown */}
                  <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-primary-700">Priority Score</h3>
                      <span className="text-lg font-bold text-primary-700">{selectedEntry.priorityScore} pts</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {selectedEntry.priorityBreakdown.planTypePoints > 0 && (
                        <div className="flex justify-between">
                          <span className="text-primary-600">Plan Type</span>
                          <span className="text-primary-700 font-medium">+{selectedEntry.priorityBreakdown.planTypePoints}</span>
                        </div>
                      )}
                      {selectedEntry.priorityBreakdown.waitingTimePoints > 0 && (
                        <div className="flex justify-between">
                          <span className="text-primary-600">Waiting Time</span>
                          <span className="text-primary-700 font-medium">+{selectedEntry.priorityBreakdown.waitingTimePoints}</span>
                        </div>
                      )}
                      {selectedEntry.priorityBreakdown.attendancePoints > 0 && (
                        <div className="flex justify-between">
                          <span className="text-primary-600">Attendance Rate</span>
                          <span className="text-primary-700 font-medium">+{selectedEntry.priorityBreakdown.attendancePoints}</span>
                        </div>
                      )}
                      {selectedEntry.priorityBreakdown.vipPoints > 0 && (
                        <div className="flex justify-between">
                          <span className="text-primary-600">VIP Bonus</span>
                          <span className="text-primary-700 font-medium">+{selectedEntry.priorityBreakdown.vipPoints}</span>
                        </div>
                      )}
                      {selectedEntry.priorityBreakdown.cancelledByStudioPoints > 0 && (
                        <div className="flex justify-between">
                          <span className="text-primary-600">Studio Cancelled</span>
                          <span className="text-primary-700 font-medium">+{selectedEntry.priorityBreakdown.cancelledByStudioPoints}</span>
                        </div>
                      )}
                      {selectedEntry.priorityBreakdown.urgentReasonPoints > 0 && (
                        <div className="flex justify-between">
                          <span className="text-primary-600">Urgent Reason</span>
                          <span className="text-primary-700 font-medium">+{selectedEntry.priorityBreakdown.urgentReasonPoints}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Confirmed Class */}
                  {selectedEntry.status === "confirmed" && selectedEntry.confirmedClassName && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-green-700 mb-2">Confirmed Class</h3>
                      <p className="text-sm text-green-900 font-medium">{selectedEntry.confirmedClassName}</p>
                      {selectedEntry.confirmedDate && (
                        <p className="text-sm text-green-700">{formatDate(selectedEntry.confirmedDate)}</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-4">
                    {selectedEntry.status === "waiting" && (
                      <>
                        <button
                          onClick={() => setShowAssignModal(true)}
                          disabled={actionLoading}
                          className="w-full px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                          Assign to Class
                        </button>
                        <button
                          onClick={() => handleNotify(selectedEntry)}
                          disabled={actionLoading}
                          className="w-full px-4 py-2.5 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 disabled:opacity-50"
                        >
                          Send Notification
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleRemove(selectedEntry._id)}
                      disabled={actionLoading}
                      className="w-full px-4 py-2.5 text-red-600 font-medium rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove from Waitlist
                    </button>
                  </div>

                  {/* Timestamps */}
                  <div className="text-xs text-gray-400 pt-4 border-t border-gray-200">
                    <p>Created: {formatDate(selectedEntry.createdAt)}</p>
                    <p>Updated: {formatDate(selectedEntry.updatedAt)}</p>
                    {selectedEntry.notifiedAt && <p>Notified: {formatDate(selectedEntry.notifiedAt)}</p>}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Assign Class Modal */}
      {showAssignModal && selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Assign Class</h2>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedClassId("");
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Assign {selectedEntry.clientName} to an available class
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-3">
              {availableClasses.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No available classes found</p>
              ) : (
                availableClasses.map((cls) => (
                  <button
                    key={cls._id}
                    onClick={() => setSelectedClassId(cls._id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedClassId === cls._id
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{cls.title}</p>
                        <p className="text-sm text-gray-500">{cls.instructorName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDate(cls.scheduledDate)}</p>
                        <p className="text-xs text-green-600">{cls.maxCapacity - cls.currentEnrollment} spots</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedClassId("");
                }}
                className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignClass}
                disabled={!selectedClassId || actionLoading}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priority Settings Modal */}
      <PrioritySettingsModal
        isOpen={showPrioritySettings}
        onClose={() => setShowPrioritySettings(false)}
      />
    </div>
  );
}
