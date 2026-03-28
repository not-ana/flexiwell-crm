"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";

interface SyncStatus {
  connected: boolean;
  lastSync: {
    startedAt: string;
    completedAt: string;
    clients: { imported: number; updated: number; skipped: number; errors: number };
    visits: { imported: number; skipped: number };
    contracts: { imported: number };
  } | null;
  totals: {
    clients: number;
    visits: number;
  };
}

interface SyncResult {
  success: boolean;
  summary: SyncStatus["lastSync"];
  message: string;
}

export function MindbodySync() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookbackMonths, setLookbackMonths] = useState(6);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Credentials form
  const [siteId, setSiteId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get<SyncStatus>("/api/admin/integrations/mindbody/status");
      if (data) setStatus(data);
    } catch {
      // Credentials not configured — that's fine
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      const { data } = await api.post<SyncResult>("/api/admin/integrations/mindbody/sync", {
        lookbackMonths,
      });
      if (data) {
        setResult(data);
        fetchStatus();
      }
    } catch (err: any) {
      setError(err?.message || "Sync failed. Check your Mindbody credentials and try again.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="animate-pulse h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Mindbody API Sync</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Pull clients, attendance history, and memberships directly from your Mindbody account.
          </p>
        </div>
        {status?.connected && (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Connected
          </span>
        )}
      </div>

      {!status?.connected ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setError(null);
            try {
              await api.post("/api/admin/integrations", {
                integrationId: "mindbody",
                credentials: { siteId, apiKey, username, password },
              });
              await fetchStatus();
            } catch (err: any) {
              setError(err?.message || "Failed to save credentials.");
            } finally {
              setSaving(false);
            }
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="mb-site-id" className="block text-xs font-medium text-gray-600 mb-1">Site ID</label>
              <input
                id="mb-site-id"
                type="text"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                placeholder="e.g. -99999"
                required
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="mb-api-key" className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
              <input
                id="mb-api-key"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your Mindbody API key"
                required
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="mb-username" className="block text-xs font-medium text-gray-600 mb-1">Staff Username</label>
              <input
                id="mb-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Staff login username"
                required
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="mb-password" className="block text-xs font-medium text-gray-600 mb-1">Staff Password</label>
              <input
                id="mb-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Staff login password"
                required
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Connecting..." : "Connect Mindbody"}
          </button>
        </form>
      ) : (
        <>
          {/* Sync controls */}
          <div className="flex items-end gap-4">
            <div>
              <label htmlFor="lookback" className="block text-xs font-medium text-gray-600 mb-1">
                History to import
              </label>
              <select
                id="lookback"
                value={lookbackMonths}
                onChange={(e) => setLookbackMonths(Number(e.target.value))}
                disabled={syncing}
                className="block w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
              >
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={9}>Last 9 months</option>
                <option value={12}>Last 12 months</option>
              </select>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Syncing...
                </>
              ) : (
                "Import from Mindbody"
              )}
            </button>
          </div>

          {syncing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Pulling data from Mindbody... This may take a few minutes depending on how many clients and visits you have.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Sync result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-green-800">{result.message}</p>
              {result.summary && (
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-900">
                      {result.summary.clients.imported + result.summary.clients.updated}
                    </p>
                    <p className="text-xs text-green-700">Clients synced</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-900">{result.summary.visits.imported}</p>
                    <p className="text-xs text-green-700">Visits imported</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-900">{result.summary.contracts.imported}</p>
                    <p className="text-xs text-green-700">Memberships</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Previous sync stats */}
          {status.lastSync && !result && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">
                Last sync: {new Date(status.lastSync.completedAt).toLocaleString()}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{status.totals.clients}</p>
                  <p className="text-xs text-gray-500">Clients</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{status.totals.visits}</p>
                  <p className="text-xs text-gray-500">Visits</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{status.lastSync.contracts.imported}</p>
                  <p className="text-xs text-gray-500">Memberships</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* CSV fallback note */}
      <p className="text-xs text-gray-400">
        Prefer CSV? Use the uploader below to import a Mindbody export file manually.
      </p>
    </div>
  );
}
