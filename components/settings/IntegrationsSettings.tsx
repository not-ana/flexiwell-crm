"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CheckCircleIcon, ChevronIcon } from "@/components/icons";
import { WhatsAppSettings } from "./WhatsAppSettings";
import { WellhubSettings } from "./WellhubSettings";
import { api } from "@/lib/api/client";
import { DataImportUploader } from "@/components/import/DataImportUploader";
import { platformConfigs } from "@/lib/config/import-platforms";

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
  importType?: "api" | "spreadsheet";
  docsUrl?: string;
}

// No API integrations here - they've been moved to Add-ons
const allIntegrations: IntegrationInfo[] = [];

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
  const [selectedPlatform, setSelectedPlatform] = useState<keyof typeof platformConfigs>("classpass");

  useEffect(() => {
    fetchStatus();
   
  }, []);

  const connectedCount = allIntegrations.filter(
    (integration) => integrationStatus[integration.id]?.connected
  ).length;

  const toggleExpanded = (id: string) => {
    setExpandedIntegration(expandedIntegration === id ? null : id);
  };

  const handleConnectClick = (integration: IntegrationInfo) => {
    // For spreadsheet imports, navigate to import page
    if (integration.importType === "spreadsheet" && integration.docsUrl) {
      window.location.href = integration.docsUrl;
      return;
    }

    // For API integrations with dedicated settings pages, navigate to them
    if (integration.id === "wellhub" || integration.id === "whatsapp" || integration.id === "totalpass") {
      setActiveSettingsView(integration.id);
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

  const handleImport = async (data: Record<string, string>[]) => {
    try {
      const response = await api.post("/api/clients/import", {
        clientsData: data,
      });

      if (response.data.success) {
        console.log(`Successfully imported ${response.data.results.success} clients from ${selectedPlatform}`);
        if (response.data.results.failed > 0) {
          console.warn(`${response.data.results.failed} records failed to import:`, response.data.results.errors);
        }
      }
    } catch (error) {
      console.error(`Failed to import ${selectedPlatform} data:`, error);
      throw error;
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
        return <MarketplaceSettingsInline name={allIntegrations.find(i => i.id === integrationId)?.name || ""} />;
      default:
        return <GenericIntegrationSettings name={allIntegrations.find(i => i.id === integrationId)?.name || ""} />;
    }
  };

  // Render full-page settings views
  if (activeSettingsView === "wellhub" || activeSettingsView === "totalpass") {
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

  const config = platformConfigs[selectedPlatform];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Data Import</h2>
        <p className="text-sm text-gray-600 mt-1">
          Import your data from other platforms using CSV files.
        </p>
      </div>

      {/* Data Import Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <DataImportUploader
          platform={config.name}
          platformLogo={config.logo}
          platformColor={config.color}
          description={config.description}
          docsUrl={config.docsUrl}
          templateUrl={config.templateUrl}
          fields={config.fields}
          onImport={handleImport}
          platformSelector={
            <div>
              <label htmlFor="platform-select" className="block text-sm font-medium text-gray-900 mb-2">
                Select Platform
              </label>
              <select
                id="platform-select"
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value as keyof typeof platformConfigs)}
                className="block w-full lg:w-1/2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="classpass">ClassPass</option>
                <option value="mindbody">Mindbody</option>
                <option value="glofox">Glofox</option>
                <option value="tecnofit">Tecnofit</option>
              </select>
            </div>
          }
        />
      </div>

      {/* API Integrations Section */}
      <div className="grid gap-4 sm:grid-cols-2">
          {allIntegrations.filter((integration) => integration.importType === "api").map((integration) => {
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
                  // For spreadsheet imports, navigate to import page
                  if (integration.importType === "spreadsheet" && integration.docsUrl && !isConnected) {
                    window.location.href = integration.docsUrl;
                    return;
                  }
                  // For API marketplace integrations and WhatsApp, always open full-page settings
                  if (integration.id === "wellhub" || integration.id === "totalpass" || integration.id === "whatsapp") {
                    setActiveSettingsView(integration.id);
                    return;
                  }
                  // For other integrations, only expand if connected
                  if (isConnected && integration.hasSettings) {
                    toggleExpanded(integration.id);
                  }
                }}
                className={`flex items-center gap-4 p-4 ${
                  (integration.importType === "spreadsheet" || integration.id === "wellhub" || integration.id === "totalpass" || integration.id === "whatsapp" || (isConnected && integration.hasSettings))
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
                      handleConnectClick(integration);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    {integration.importType === "spreadsheet" ? "View Guide" : "Connect"}
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
