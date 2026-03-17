"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { WaitlistSettings } from "@/components/settings/WaitlistSettings";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { IntegrationsSettings } from "@/components/settings/IntegrationsSettings";
import { IntakeFormSettings } from "@/components/settings/IntakeFormSettings";
import { SMSBotSettings } from "@/components/settings/SMSBotSettings";
import { PlansSettings } from "@/components/settings/PlansSettings";
import { TrialSettings } from "@/components/settings/TrialSettings";

type AdminSettingsTab = "general" | "subscription" | "plans" | "trial" | "notifications" | "sms-bot" | "waitlist" | "intake" | "team" | "integrations";

const tabs: { id: AdminSettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "subscription", label: "Subscription" },
  { id: "plans", label: "Plans" },
  { id: "trial", label: "Trial & Drop-in" },
  { id: "notifications", label: "Notifications" },
  { id: "sms-bot", label: "SMS Bot" },
  { id: "waitlist", label: "Waitlist" },
  { id: "intake", label: "Intake Form" },
  { id: "team", label: "Staff" },
  { id: "integrations", label: "Import" },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as AdminSettingsTab | null;
  const validTabs = tabs.map((t) => t.id);
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : "general";
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>(initialTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "subscription":
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Coming soon</p>
          </div>
        );
      case "plans":
        return <PlansSettings />;
      case "trial":
        return <TrialSettings />;
      case "notifications":
        return <NotificationsSettings />;
      case "sms-bot":
        return <SMSBotSettings />;
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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Settings</h1>

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

export default function AdminSettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
