"use client";

import { useState } from "react";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { PlansSettings } from "@/components/settings/PlansSettings";
import { WaitlistSettings } from "@/components/settings/WaitlistSettings";
import { EstablishmentsSettings } from "@/components/settings/EstablishmentsSettings";
import { RoomsSettings } from "@/components/settings/RoomsSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { IntegrationsSettings } from "@/components/settings/IntegrationsSettings";
import { AddonsSettings } from "@/components/settings/AddonsSettings";
import { WhatsAppSettings } from "@/components/settings/WhatsAppSettings";
import { SMSSettings } from "@/components/settings/SMSSettings";
import { SMSBotSettings } from "@/components/settings/SMSBotSettings";

type AdminSettingsTab = "general" | "plans" | "waitlist" | "establishments" | "rooms" | "subscription" | "notifications" | "team" | "integrations" | "addons" | "whatsapp" | "sms" | "sms-bot";

const tabs: { id: AdminSettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "plans", label: "Plans" },
  { id: "waitlist", label: "Waitlist" },
  { id: "team", label: "Team" },
  { id: "establishments", label: "Establishments" },
  { id: "rooms", label: "Rooms" },
  { id: "integrations", label: "Integrations" },
  { id: "addons", label: "Add-ons" },
  { id: "subscription", label: "Subscription" },
  { id: "notifications", label: "Notifications" },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>("general");

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "plans":
        return <PlansSettings />;
      case "waitlist":
        return <WaitlistSettings />;
      case "establishments":
        return <EstablishmentsSettings />;
      case "rooms":
        return <RoomsSettings />;
      case "subscription":
        return <SubscriptionSettings />;
      case "notifications":
        return <NotificationsSettings />;
      case "team":
        return <TeamSettings />;
      case "integrations":
        return <IntegrationsSettings />;
      case "addons":
        return <AddonsSettings onNavigate={setActiveTab} />;
      case "whatsapp":
        return <WhatsAppSettings onBack={() => setActiveTab("addons")} />;
      case "sms":
        return <SMSSettings onBack={() => setActiveTab("addons")} />;
      case "sms-bot":
        return <SMSBotSettings onBack={() => setActiveTab("addons")} />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Settings</h1>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
          <nav className="flex gap-1 -mb-px min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="max-w-5xl">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
