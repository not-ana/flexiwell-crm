"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CheckCircleIcon, ChevronIcon } from "@/components/icons";
import { WhatsAppSettings } from "./WhatsAppSettings";
import { WellhubSettings } from "./WellhubSettings";
import { api } from "@/lib/api/client";

interface IntegrationStatus {
  connected: boolean;
  lastSync?: string;
}

interface IntegrationInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  hasSettings?: boolean;
  image?: string;
}

const allIntegrations: IntegrationInfo[] = [
  { id: "wellhub", name: "Wellhub", icon: "W", color: "orange", description: "Corporate wellness marketplace", hasSettings: true, image: "/wellhub.png" },
  { id: "totalpass", name: "TotalPass", icon: "TP", color: "green", description: "Brazil fitness marketplace", hasSettings: true, image: "/totalpass.jpg" },
  { id: "classpass", name: "ClassPass", icon: "CP", color: "purple", description: "Global fitness marketplace", hasSettings: true, image: "/classpass.png" },
  { id: "stripe", name: "Stripe", icon: "ST", color: "purple", description: "Payment processing", hasSettings: true, image: "/stripe.webp" },
  { id: "paypal", name: "PayPal", icon: "PP", color: "blue", description: "Accept PayPal payments", hasSettings: true },
  { id: "googleCalendar", name: "Google Calendar", icon: "GC", color: "blue", description: "Calendar sync & notifications", hasSettings: true },
  { id: "whatsapp", name: "WhatsApp", icon: "WA", color: "green", description: "Client messaging via Twilio", hasSettings: true },
  { id: "sms", name: "SMS", icon: "SMS", color: "blue", description: "SMS notifications via Twilio", hasSettings: true },
  { id: "mailchimp", name: "Mailchimp", icon: "MC", color: "yellow", description: "Email marketing & newsletters", hasSettings: true },
  { id: "zapier", name: "Zapier", icon: "ZP", color: "orange", description: "Connect with 5000+ apps", hasSettings: false, image: "/zapier.png" },
];

const colorClasses: Record<string, string> = {
  green: "bg-green-100 text-green-600",
  purple: "bg-primary-100 text-primary-600",
  blue: "bg-blue-100 text-blue-600",
  pink: "bg-pink-100 text-pink-600",
  yellow: "bg-yellow-100 text-yellow-600",
  orange: "bg-orange-100 text-orange-600",
};

export function IntegrationsSettings() {
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, IntegrationStatus>>({});
  const [loading, setLoading] = useState(true);
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);
  const [activeSettingsView, setActiveSettingsView] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectedCount = allIntegrations.filter(
    (integration) => integrationStatus[integration.id]?.connected
  ).length;

  const toggleExpanded = (id: string) => {
    setExpandedIntegration(expandedIntegration === id ? null : id);
  };

  const handleConnectClick = (integrationId: string) => {
    // For integrations with dedicated settings pages, navigate to them
    if (integrationId === "wellhub" || integrationId === "whatsapp" || integrationId === "totalpass" || integrationId === "classpass") {
      setActiveSettingsView(integrationId);
      return;
    }
    // For other integrations, you could open a modal or redirect
  };

  const handleBackFromSettings = () => {
    setActiveSettingsView(null);
    // Refresh status after coming back from settings
    fetchStatus();
  };

  const fetchStatus = async () => {
    try {
      const { data } = await api.get<Record<string, IntegrationStatus>>("/api/admin/integrations/status");
      if (data) {
        setIntegrationStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch integration status:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderIntegrationSettings = (integrationId: string) => {
    switch (integrationId) {
      case "whatsapp":
        return <WhatsAppSettings />;
      case "stripe":
        return <StripeSettingsInline />;
      case "wellhub":
      case "totalpass":
      case "classpass":
        return <MarketplaceSettingsInline name={allIntegrations.find(i => i.id === integrationId)?.name || ""} />;
      default:
        return <GenericIntegrationSettings name={allIntegrations.find(i => i.id === integrationId)?.name || ""} />;
    }
  };

  // Render full-page settings views
  if (activeSettingsView === "wellhub" || activeSettingsView === "totalpass" || activeSettingsView === "classpass") {
    return <WellhubSettings onBack={handleBackFromSettings} provider={activeSettingsView} />;
  }

  if (activeSettingsView === "whatsapp") {
    return <WhatsAppSettings onBack={handleBackFromSettings} />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-600 mt-1">Connect apps and services to extend FlexiWell.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-600 mt-1">
          Connect apps and services to extend FlexiWell.
          {connectedCount > 0 && ` ${connectedCount} connected.`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {allIntegrations.map((integration) => {
          const isConnected = integrationStatus[integration.id]?.connected;
          const status = integrationStatus[integration.id];
          const isExpanded = expandedIntegration === integration.id;

          return (
            <div
              key={integration.id}
              className={`bg-white border rounded-xl overflow-hidden transition-all ${
                isConnected ? "border-green-200 ring-1 ring-green-100" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                onClick={() => {
                  // For marketplace integrations and WhatsApp, always open full-page settings (connected or not)
                  if (integration.id === "wellhub" || integration.id === "totalpass" || integration.id === "classpass" || integration.id === "whatsapp") {
                    setActiveSettingsView(integration.id);
                    return;
                  }
                  // For other integrations, only expand if connected
                  if (isConnected && integration.hasSettings) {
                    toggleExpanded(integration.id);
                  }
                }}
                className={`flex items-center gap-4 p-4 ${
                  (integration.id === "wellhub" || integration.id === "totalpass" || integration.id === "classpass" || integration.id === "whatsapp" || (isConnected && integration.hasSettings))
                    ? "cursor-pointer hover:bg-gray-50"
                    : ""
                }`}
              >
                {integration.image ? (
                  <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-gray-50 flex items-center justify-center">
                    <Image
                      src={integration.image}
                      alt={integration.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[integration.color]}`}>
                    <span className="font-bold text-xs">{integration.icon}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {isConnected
                      ? `Connected${status?.lastSync ? ` • Last sync: ${new Date(status.lastSync).toLocaleDateString()}` : ""}`
                      : integration.description}
                  </p>
                </div>
                {isConnected ? (
                  <>
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <CheckCircleIcon className="w-3 h-3" />
                      Active
                    </span>
                    {integration.hasSettings && (
                      <ChevronIcon
                        direction={isExpanded ? "up" : "down"}
                        className="w-5 h-5 text-gray-400"
                      />
                    )}
                  </>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnectClick(integration.id);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>

              {isExpanded && isConnected && integration.hasSettings && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                  <div className="pt-4">
                    {renderIntegrationSettings(integration.id)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Inline settings components for different integration types
function StripeSettingsInline() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">$12,450</p>
          <p className="text-sm text-gray-500">This month</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">156</p>
          <p className="text-sm text-gray-500">Transactions</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Open Stripe Dashboard →
        </a>
        <button className="text-sm text-red-600 hover:text-red-700 font-medium">
          Disconnect
        </button>
      </div>
    </div>
  );
}

function MarketplaceSettingsInline({ name }: { name: string }) {
  const [autoSync, setAutoSync] = useState(true);
  const [importClients, setImportClients] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">24</p>
          <p className="text-sm text-gray-500">Classes synced</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">89</p>
          <p className="text-sm text-gray-500">Bookings</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">$2,340</p>
          <p className="text-sm text-gray-500">Revenue</p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setAutoSync(!autoSync)}
          className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
        >
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">Auto-sync classes</p>
            <p className="text-xs text-gray-500">Automatically sync class schedules</p>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors ${autoSync ? "bg-primary-600" : "bg-gray-300"}`}>
            <div className={`w-5 h-5 mt-0.5 bg-white rounded-full shadow transition-transform ${autoSync ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
          </div>
        </button>

        <button
          onClick={() => setImportClients(!importClients)}
          className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
        >
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">Import client profiles</p>
            <p className="text-xs text-gray-500">Sync client data from {name}</p>
          </div>
          <div className={`w-10 h-6 rounded-full transition-colors ${importClients ? "bg-primary-600" : "bg-gray-300"}`}>
            <div className={`w-5 h-5 mt-0.5 bg-white rounded-full shadow transition-transform ${importClients ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
          </div>
        </button>
      </div>

      <div className="flex items-center justify-end">
        <button className="text-sm text-red-600 hover:text-red-700 font-medium">
          Disconnect
        </button>
      </div>
    </div>
  );
}

function GenericIntegrationSettings({ name }: { name: string }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600">
          {name} is connected and working properly.
        </p>
      </div>
      <div className="flex items-center justify-end">
        <button className="text-sm text-red-600 hover:text-red-700 font-medium">
          Disconnect
        </button>
      </div>
    </div>
  );
}
