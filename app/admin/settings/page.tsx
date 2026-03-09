"use client";

import { useState } from "react";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { PlansSettings } from "@/components/settings/PlansSettings";
import { WaitlistSettings } from "@/components/settings/WaitlistSettings";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { IntegrationsSettings } from "@/components/settings/IntegrationsSettings";
import { IntakeFormSettings } from "@/components/settings/IntakeFormSettings";

type AdminSettingsTab = "general" | "plans" | "notifications" | "waitlist" | "intake" | "team" | "integrations";

const tabs: { id: AdminSettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "plans", label: "Plans" },
  { id: "notifications", label: "Notifications" },
  { id: "waitlist", label: "Waitlist" },
  { id: "intake", label: "Intake Form" },
  { id: "team", label: "Staff" },
  { id: "integrations", label: "Import" },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>("general");

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "plans":
        return <PlansSettings />;
      case "notifications":
        return <NotificationsSettings />;
      case "waitlist":
        return <WaitlistSettings />;
      case "intake":
        return <IntakeFormSettings />;
      case "team":
        return <TeamSettings />;
      case "integrations":
        return <IntegrationsSettings />;
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
        <div>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
