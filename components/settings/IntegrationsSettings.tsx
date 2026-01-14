"use client";

import { useState, useEffect } from "react";
import { showToast } from "./shared";

export function IntegrationsSettings() {
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, { connected: boolean; lastSync?: string; loading?: boolean }>>({
    wellhub: { connected: false },
    stripe: { connected: false },
    googleCalendar: { connected: false },
    whatsapp: { connected: false },
    instagram: { connected: false },
    mailchimp: { connected: false },
    zapier: { connected: false },
    paypal: { connected: false },
  });
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeKeys, setStripeKeys] = useState({ publishableKey: "", secretKey: "" });
  const [showWellhubModal, setShowWellhubModal] = useState(false);
  const [wellhubKeys, setWellhubKeys] = useState({ apiKey: "", gymId: "" });

  useEffect(() => {
    // Fetch integration status
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/admin/integrations/status");
        if (res.ok) {
          const data = await res.json();
          setIntegrationStatus(data);
        }
      } catch (error) {
        console.error("Failed to fetch integration status:", error);
      }
    };
    fetchStatus();
  }, []);

  const handleConnectStripe = async () => {
    if (!stripeKeys.publishableKey || !stripeKeys.secretKey) {
      showToast("Please enter both Stripe keys", "error");
      return;
    }

    setIntegrationStatus(prev => ({ ...prev, stripe: { ...prev.stripe, loading: true } }));

    try {
      const res = await fetch("/api/admin/integrations/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripeKeys),
      });

      if (res.ok) {
        setIntegrationStatus(prev => ({
          ...prev,
          stripe: { connected: true, lastSync: new Date().toISOString() },
        }));
        setShowStripeModal(false);
        setStripeKeys({ publishableKey: "", secretKey: "" });
        showToast("Stripe connected successfully!");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to connect Stripe", "error");
      }
    } catch (error) {
      showToast("Failed to connect Stripe", "error");
    } finally {
      setIntegrationStatus(prev => ({ ...prev, stripe: { ...prev.stripe, loading: false } }));
    }
  };

  const handleConnectGoogleCalendar = async () => {
    setIntegrationStatus(prev => ({ ...prev, googleCalendar: { ...prev.googleCalendar, loading: true } }));

    try {
      // Use admin route for Google OAuth
      const res = await fetch("/api/admin/integrations/google-calendar");
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      } else {
        const data = await res.json();
        if (data.missingConfig) {
          showToast("Google Calendar not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env", "error");
        } else {
          showToast(data.error || "Failed to start Google Calendar connection", "error");
        }
      }
    } catch (error) {
      showToast("Failed to connect Google Calendar", "error");
    } finally {
      setIntegrationStatus(prev => ({ ...prev, googleCalendar: { ...prev.googleCalendar, loading: false } }));
    }
  };

  const handleDisconnect = async (integration: string) => {
    if (!confirm(`Are you sure you want to disconnect ${integration}?`)) return;

    try {
      const res = await fetch(`/api/admin/integrations/${integration}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setIntegrationStatus(prev => ({
          ...prev,
          [integration]: { connected: false },
        }));
        showToast(`${integration} disconnected`);
      } else {
        showToast("Failed to disconnect", "error");
      }
    } catch (error) {
      showToast("Failed to disconnect", "error");
    }
  };

  const integrations = [
    {
      id: "wellhub",
      name: "Wellhub",
      icon: "WH",
      color: "green",
      description: integrationStatus.wellhub?.connected
        ? `Connected • Last sync: ${integrationStatus.wellhub.lastSync ? new Date(integrationStatus.wellhub.lastSync).toLocaleString() : "Never"}`
        : "Gym marketplace integration",
      onConnect: () => setShowWellhubModal(true),
    },
    {
      id: "stripe",
      name: "Stripe",
      icon: "ST",
      color: "purple",
      description: integrationStatus.stripe?.connected
        ? `Connected • Last sync: ${integrationStatus.stripe.lastSync ? new Date(integrationStatus.stripe.lastSync).toLocaleString() : "Never"}`
        : "Payment processing",
      onConnect: () => setShowStripeModal(true),
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: "PP",
      color: "blue",
      description: integrationStatus.paypal?.connected
        ? `Connected • Accepting PayPal payments`
        : "Accept PayPal payments",
      onConnect: () => window.location.href = "/admin/integrations",
    },
    {
      id: "googleCalendar",
      name: "Google Calendar",
      icon: "GC",
      color: "blue",
      description: integrationStatus.googleCalendar?.connected
        ? `Connected • Syncing classes automatically`
        : "Calendar sync & notifications",
      onConnect: handleConnectGoogleCalendar,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: "WA",
      color: "green",
      description: integrationStatus.whatsapp?.connected
        ? `Connected • Messaging active`
        : "Client messaging via Twilio",
      onConnect: () => window.location.href = "/admin/integrations",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: "IG",
      color: "pink",
      description: integrationStatus.instagram?.connected
        ? `Connected • DMs active`
        : "Receive and respond to DMs",
      onConnect: () => window.location.href = "/admin/integrations",
    },
    {
      id: "mailchimp",
      name: "Mailchimp",
      icon: "MC",
      color: "yellow",
      description: integrationStatus.mailchimp?.connected
        ? `Connected • Email marketing active`
        : "Email marketing & newsletters",
      onConnect: () => window.location.href = "/admin/integrations",
    },
    {
      id: "zapier",
      name: "Zapier",
      icon: "ZP",
      color: "orange",
      description: integrationStatus.zapier?.connected
        ? `Connected • Automations active`
        : "Connect with 5000+ apps",
      onConnect: () => window.location.href = "/admin/integrations",
    },
  ];

  const colorClasses: Record<string, string> = {
    green: "bg-green-100 text-green-600",
    purple: "bg-primary-100 text-primary-600",
    blue: "bg-blue-100 text-blue-600",
    pink: "bg-pink-100 text-pink-600",
    yellow: "bg-yellow-100 text-yellow-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-600 mt-1">Connected apps and services.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-4">
          {integrations.map((integration) => {
            const status = integrationStatus[integration.id];
            const isConnected = status?.connected;
            const isLoading = status?.loading;

            return (
              <div key={integration.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[integration.color]}`}>
                  <span className="font-bold text-sm">{integration.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                  <p className="text-sm text-gray-500">{integration.description}</p>
                </div>
                {isConnected ? (
                  <>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="text-sm text-red-600 font-medium hover:text-red-700"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={integration.onConnect}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stripe Modal */}
      {showStripeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Stripe</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your Stripe API keys to enable payment processing.
              You can find these in your{" "}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                Stripe Dashboard
              </a>.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publishable Key
                </label>
                <input
                  type="text"
                  value={stripeKeys.publishableKey}
                  onChange={(e) => setStripeKeys(prev => ({ ...prev, publishableKey: e.target.value }))}
                  placeholder="pk_live_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={stripeKeys.secretKey}
                  onChange={(e) => setStripeKeys(prev => ({ ...prev, secretKey: e.target.value }))}
                  placeholder="sk_live_..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStripeModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectStripe}
                disabled={integrationStatus.stripe?.loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {integrationStatus.stripe?.loading ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wellhub Modal */}
      {showWellhubModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect Wellhub</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your Wellhub API credentials to sync classes and bookings.
              You can find these in your{" "}
              <a
                href="https://partners.wellhub.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                Wellhub Partner Dashboard
              </a>.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={wellhubKeys.apiKey}
                  onChange={(e) => setWellhubKeys(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Your Wellhub API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gym ID
                </label>
                <input
                  type="text"
                  value={wellhubKeys.gymId}
                  onChange={(e) => setWellhubKeys(prev => ({ ...prev, gymId: e.target.value }))}
                  placeholder="Your Wellhub Gym ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowWellhubModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!wellhubKeys.apiKey || !wellhubKeys.gymId) {
                    showToast("Please enter both API Key and Gym ID", "error");
                    return;
                  }
                  setIntegrationStatus(prev => ({ ...prev, wellhub: { ...prev.wellhub, loading: true } }));
                  try {
                    const res = await fetch("/api/admin/integrations/wellhub", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(wellhubKeys),
                    });
                    if (res.ok) {
                      setIntegrationStatus(prev => ({
                        ...prev,
                        wellhub: { connected: true, lastSync: new Date().toISOString() },
                      }));
                      setShowWellhubModal(false);
                      setWellhubKeys({ apiKey: "", gymId: "" });
                      showToast("Wellhub connected successfully!");
                    } else {
                      const data = await res.json();
                      showToast(data.error || "Failed to connect Wellhub", "error");
                    }
                  } catch {
                    showToast("Failed to connect Wellhub", "error");
                  } finally {
                    setIntegrationStatus(prev => ({ ...prev, wellhub: { ...prev.wellhub, loading: false } }));
                  }
                }}
                disabled={integrationStatus.wellhub?.loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {integrationStatus.wellhub?.loading ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
