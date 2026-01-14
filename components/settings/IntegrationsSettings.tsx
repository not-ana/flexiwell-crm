"use client";

import { useState, useEffect } from "react";
import { CheckCircleIcon, ChevronIcon } from "@/components/icons";
import { WhatsAppSettings } from "./WhatsAppSettings";

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
}

const allIntegrations: IntegrationInfo[] = [
  { id: "wellhub", name: "Wellhub", icon: "W", color: "orange", description: "Corporate wellness marketplace", hasSettings: true },
  { id: "totalpass", name: "TotalPass", icon: "TP", color: "green", description: "Brazil fitness marketplace", hasSettings: true },
  { id: "classpass", name: "ClassPass", icon: "CP", color: "purple", description: "Global fitness marketplace", hasSettings: true },
  { id: "stripe", name: "Stripe", icon: "ST", color: "purple", description: "Payment processing", hasSettings: true },
  { id: "paypal", name: "PayPal", icon: "PP", color: "blue", description: "Accept PayPal payments", hasSettings: true },
  { id: "googleCalendar", name: "Google Calendar", icon: "GC", color: "blue", description: "Calendar sync & notifications", hasSettings: true },
  { id: "google_calendar", name: "Google Calendar", icon: "GC", color: "blue", description: "Calendar sync & notifications", hasSettings: true },
  { id: "whatsapp", name: "WhatsApp", icon: "WA", color: "green", description: "Client messaging via Twilio", hasSettings: true },
  { id: "sms", name: "SMS", icon: "SMS", color: "blue", description: "SMS notifications via Twilio", hasSettings: true },
  { id: "mailchimp", name: "Mailchimp", icon: "MC", color: "yellow", description: "Email marketing & newsletters", hasSettings: true },
  { id: "zapier", name: "Zapier", icon: "ZP", color: "orange", description: "Connect with 5000+ apps", hasSettings: false },
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

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/admin/integrations/status");
        if (res.ok) {
          const data = await res.json();
          setIntegrationStatus(data);
        }
      } catch (error) {
        console.error("Failed to fetch integration status:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // Filter to only show connected integrations
  const connectedIntegrations = allIntegrations.filter(
    (integration) => integrationStatus[integration.id]?.connected
  );

  const connectedCount = connectedIntegrations.length;

  const toggleExpanded = (id: string) => {
    setExpandedIntegration(expandedIntegration === id ? null : id);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
            <p className="text-sm text-gray-600 mt-1">Connected apps and services.</p>
          </div>
          <a
            href="/admin/integrations"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Manage all integrations →
          </a>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
          <p className="text-sm text-gray-600 mt-1">Connected apps and services.</p>
        </div>
        <a
          href="/admin/integrations"
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Manage all integrations →
        </a>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {connectedCount === 0 ? (
          <div className="text-center py-8 px-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No integrations connected</h3>
            <p className="text-sm text-gray-500 mb-4">Connect apps to extend FlexiWell's functionality.</p>
            <a
              href="/admin/integrations"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              Browse integrations
            </a>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                {connectedCount} integration{connectedCount !== 1 ? "s" : ""} connected
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {connectedIntegrations.map((integration) => {
                const status = integrationStatus[integration.id];
                const isExpanded = expandedIntegration === integration.id;

                return (
                  <div key={integration.id}>
                    <button
                      onClick={() => integration.hasSettings && toggleExpanded(integration.id)}
                      className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                        integration.hasSettings ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[integration.color]}`}>
                        <span className="font-bold text-xs">{integration.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          Connected{status?.lastSync ? ` • Last sync: ${new Date(status.lastSync).toLocaleDateString()}` : ""}
                        </p>
                      </div>
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
                    </button>

                    {isExpanded && integration.hasSettings && (
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
          </>
        )}
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
