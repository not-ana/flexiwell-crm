"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Toggle } from "@/components/ui/Toggle";
import { showToast } from "./shared";

// ============================================================================
// Types
// ============================================================================

interface ClassPassSettingsProps {
  onBack?: () => void;
}

interface ClassPassStatus {
  connected: boolean;
  venueId?: string;
  classesSynced?: number;
  totalBookings?: number;
  revenue?: number;
  lastSync?: string;
  error?: string;
}

interface ClassPassConfig {
  autoSyncClasses: boolean;
  importClients: boolean;
  syncInterval: "hourly" | "daily" | "manual";
}

interface ClassSyncInfo {
  classId: string;
  className: string;
  classpassScheduleId?: string;
  classpassSyncEnabled: boolean;
  classpassSyncStatus?: "synced" | "pending" | "failed";
  classpassSyncError?: string;
  classpassLastSyncAt?: string;
}

// ============================================================================
// Icons
// ============================================================================

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LoadingSpinner = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

// ============================================================================
// Connection Form
// ============================================================================

function ConnectionForm({
  onConnect,
  connecting,
}: {
  onConnect: (apiKey: string, venueId: string, webhookSecret: string) => Promise<void>;
  connecting: boolean;
}) {
  const [apiKey, setApiKey] = useState("");
  const [venueId, setVenueId] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConnect(apiKey, venueId, webhookSecret);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
          <span className="font-bold text-lg text-purple-600">CP</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Connect to ClassPass</h3>
          <p className="text-sm text-gray-600 mt-1">
            Enter your ClassPass partner credentials to start receiving bookings.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">ClassPass Benefits</h4>
        <div className="space-y-2">
          {[
            "Access to millions of ClassPass members worldwide",
            "Fill empty spots in your classes automatically",
            "Real-time booking and availability sync",
            "Detailed analytics on ClassPass performance",
          ].map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Your ClassPass API key"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Found in your ClassPass partner dashboard under API settings</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue ID</label>
          <input
            type="text"
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            placeholder="e.g. venue_abc123"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Your unique venue identifier from ClassPass</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
          <input
            type="password"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder="Webhook signing secret"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Used to verify incoming webhook events from ClassPass</p>
        </div>

        <Button
          type="submit"
          disabled={connecting || !apiKey || !venueId || !webhookSecret}
          className="w-full bg-purple-500 hover:bg-purple-600"
        >
          {connecting ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner />
              Connecting...
            </span>
          ) : (
            "Connect"
          )}
        </Button>
      </form>

      {/* Help link */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">Need help?</p>
        <a
          href="https://partners.classpass.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium mt-1"
        >
          Visit the ClassPass partner portal
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// Webhook Info Card
// ============================================================================

function WebhookInfoCard() {
  const [copied, setCopied] = useState(false);
  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhook/classpass`
    : "/api/webhook/classpass";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Webhook Configuration</h3>
      <p className="text-sm text-gray-600 mb-4">
        Add this URL in your ClassPass partner dashboard under webhook settings to receive real-time booking updates.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-800 font-mono truncate">
          {webhookUrl}
        </code>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
        >
          <CopyIcon />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Events handled: reservation.created, reservation.cancelled, reservation.checkin, reservation.no_show
      </p>
    </div>
  );
}

// ============================================================================
// Class Sync Management
// ============================================================================

function ClassSyncCard({
  onSync,
  syncing,
}: {
  onSync: () => Promise<void>;
  syncing: boolean;
}) {
  const [classes, setClasses] = useState<ClassSyncInfo[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [togglingClass, setTogglingClass] = useState<string | null>(null);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const res = await fetch("/api/classpass/classes", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleToggleSync = async (classId: string, enable: boolean) => {
    setTogglingClass(classId);
    try {
      const res = await fetch("/api/classpass/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: enable ? "enable" : "disable",
          classId,
        }),
      });
      if (res.ok) {
        showToast(enable ? "Class sync enabled" : "Class sync disabled");
        await fetchClasses();
      }
    } catch (error) {
      console.error("Failed to toggle class sync:", error);
    } finally {
      setTogglingClass(null);
    }
  };

  const statusColors: Record<string, string> = {
    synced: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Class Sync</h3>
          <p className="text-sm text-gray-600 mt-1">Manage which classes appear on ClassPass</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchClasses}
            disabled={loadingClasses}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshIcon />
            Refresh
          </button>
          <Button
            onClick={onSync}
            disabled={syncing}
            className="bg-purple-500 hover:bg-purple-600"
          >
            {syncing ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Syncing...
              </span>
            ) : (
              "Sync All"
            )}
          </Button>
        </div>
      </div>

      {loadingClasses ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No classes found. Create classes in your schedule first.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {classes.map((cls) => (
            <div
              key={cls.classId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{cls.className}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {cls.classpassSyncStatus && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[cls.classpassSyncStatus] || "bg-gray-100 text-gray-600"}`}>
                      {cls.classpassSyncStatus}
                    </span>
                  )}
                  {cls.classpassSyncError && (
                    <span className="text-xs text-red-500 truncate">{cls.classpassSyncError}</span>
                  )}
                  {cls.classpassLastSyncAt && (
                    <span className="text-xs text-gray-400">
                      Last sync: {new Date(cls.classpassLastSyncAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <Toggle
                enabled={cls.classpassSyncEnabled}
                onChange={() => handleToggleSync(cls.classId, !cls.classpassSyncEnabled)}
                disabled={togglingClass === cls.classId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Settings Card
// ============================================================================

function SettingsCard({
  config,
  onConfigChange,
  onSave,
  onDisconnect,
  saving,
  disconnecting,
}: {
  config: ClassPassConfig;
  onConfigChange: (config: ClassPassConfig) => void;
  onSave: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  saving: boolean;
  disconnecting: boolean;
}) {
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">Auto-sync classes</p>
            <p className="text-xs text-gray-500">Automatically sync schedule with ClassPass</p>
          </div>
          <Toggle
            enabled={config.autoSyncClasses}
            onChange={() => onConfigChange({ ...config, autoSyncClasses: !config.autoSyncClasses })}
          />
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">Import client profiles</p>
            <p className="text-xs text-gray-500">Create profiles for clients who book via ClassPass</p>
          </div>
          <Toggle
            enabled={config.importClients}
            onChange={() => onConfigChange({ ...config, importClients: !config.importClients })}
          />
        </div>

        {config.autoSyncClasses && (
          <div className="py-3 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-900 mb-2">Sync frequency</label>
            <select
              value={config.syncInterval}
              onChange={(e) => onConfigChange({ ...config, syncInterval: e.target.value as ClassPassConfig["syncInterval"] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={onSave}
            disabled={saving}
            className="w-full bg-purple-500 hover:bg-purple-600"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                Saving...
              </span>
            ) : (
              "Save Settings"
            )}
          </Button>

          <div className="pt-4 border-t border-gray-200">
            {showDisconnectConfirm ? (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-red-700">Are you sure you want to disconnect ClassPass?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onDisconnect}
                    disabled={disconnecting}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    {disconnecting ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ClassPassSettings({ onBack }: ClassPassSettingsProps) {
  const [status, setStatus] = useState<ClassPassStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [config, setConfig] = useState<ClassPassConfig>({
    autoSyncClasses: true,
    importClients: true,
    syncInterval: "daily",
  });

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/integrations/status", { credentials: "include" });
      const data = await res.json();
      const cp = data.classpass;
      if (res.ok && cp) {
        setStatus({
          connected: cp.connected,
          lastSync: cp.lastSync,
          classesSynced: cp.classesSynced || 0,
          totalBookings: cp.totalBookings || 0,
          revenue: cp.revenue || 0,
          venueId: cp.venueId,
        });
        if (cp.config) {
          setConfig(cp.config);
        }
      } else {
        setStatus({ connected: false });
      }
    } catch (error) {
      console.error("Failed to check ClassPass status:", error);
      setStatus({ connected: false, error: "Failed to check status" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleConnect = async (apiKey: string, venueId: string, webhookSecret: string) => {
    setConnecting(true);
    try {
      const res = await fetch("/api/admin/integrations/classpass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ apiKey, venueId, webhookSecret }),
      });

      if (res.ok) {
        showToast("ClassPass connected successfully!");
        await checkStatus();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to connect ClassPass");
      }
    } catch (error) {
      console.error("Failed to connect ClassPass:", error);
      showToast("Failed to connect ClassPass");
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/integrations/classpass", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        showToast("Settings saved!");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/classpass/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "sync_all" }),
      });
      if (res.ok) {
        showToast("All classes synced to ClassPass!");
        await checkStatus();
      }
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/admin/integrations/classpass", {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        showToast("ClassPass disconnected");
        setStatus({ connected: false });
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = status?.connected ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
          >
            <BackIcon />
            Back to Integrations
          </button>
        )}
        <h2 className="text-lg font-semibold text-gray-900">ClassPass</h2>
        <p className="text-sm text-gray-600 mt-1">
          Connect your studio to ClassPass and fill empty spots with millions of members.
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isConnected ? "bg-purple-100" : status?.error ? "bg-red-100" : "bg-gray-100"
            }`}>
              <span className={`font-bold text-lg ${
                isConnected ? "text-purple-600" : status?.error ? "text-red-600" : "text-gray-400"
              }`}>CP</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">ClassPass</p>
              <p className="text-sm text-gray-500">
                {loading ? "Checking..." : isConnected ? status?.venueId || "Connected" : status?.error || "Not configured"}
              </p>
            </div>
          </div>
          <div>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <LoadingSpinner />
                <span className="text-sm">Checking...</span>
              </div>
            ) : isConnected ? (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                <CheckIcon />
                Connected
              </span>
            ) : status?.error ? (
              <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                <XIcon />
                Error
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                Not configured
              </span>
            )}
          </div>
        </div>

        {isConnected && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{status?.classesSynced ?? 0}</p>
                <p className="text-xs text-gray-500">Classes Synced</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{status?.totalBookings ?? 0}</p>
                <p className="text-xs text-gray-500">Bookings</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">${status?.revenue ?? 0}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
            {status?.lastSync && (
              <p className="text-xs text-gray-500 mt-4 text-center">
                Last sync: {new Date(status.lastSync).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Connection Form or Connected State */}
      {!loading && !isConnected && (
        <ConnectionForm onConnect={handleConnect} connecting={connecting} />
      )}

      {isConnected && (
        <>
          <WebhookInfoCard />
          <ClassSyncCard onSync={handleSync} syncing={syncing} />
          <SettingsCard
            config={config}
            onConfigChange={setConfig}
            onSave={handleSaveSettings}
            onDisconnect={handleDisconnect}
            saving={saving}
            disconnecting={disconnecting}
          />
        </>
      )}
    </div>
  );
}