"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  User,
  CreditCard,
  Tag,
  Bell,
  Clock,
  ClipboardList,
  Users,
  Upload,
} from "lucide-react";
import { SettingsLayout, type SettingsTab, type SettingsTabGroup } from "@/components/settings/SettingsLayout";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { WaitlistSettings } from "@/components/settings/WaitlistSettings";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { IntegrationsSettings } from "@/components/settings/IntegrationsSettings";
import { IntakeFormSettings } from "@/components/settings/IntakeFormSettings";
import { PlansSettings } from "@/components/settings/PlansSettings";
type AdminSettingsTab = "general" | "subscription" | "plans" | "notifications" | "waitlist" | "intake" | "team" | "integrations";

const tabs: SettingsTab[] = [
  { id: "general", label: "General", icon: User, description: "Profile & password" },
  { id: "subscription", label: "Subscription", icon: CreditCard, description: "Billing & plan" },
  { id: "plans", label: "Plans", icon: Tag, description: "Client pricing" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts & emails" },
  { id: "waitlist", label: "Waitlist", icon: Clock, description: "Queue settings" },
  { id: "intake", label: "Intake Form", icon: ClipboardList, description: "Health forms" },
  { id: "team", label: "Staff", icon: Users, description: "Team members" },
  { id: "integrations", label: "Import", icon: Upload, description: "Data migration" },
];

const groups: SettingsTabGroup[] = [
  {
    label: "Account",
    tabs: [tabs[0], tabs[1]],
  },
  {
    label: "Business",
    tabs: [tabs[2], tabs[4]],
  },
  {
    label: "Communication",
    tabs: [tabs[3]],
  },
  {
    label: "Setup",
    tabs: [tabs[5], tabs[6], tabs[7]],
  },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as AdminSettingsTab | null;
  const validTabs = tabs.map((t) => t.id);
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : "general";
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>(initialTab as AdminSettingsTab);

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
    <SettingsLayout
      tabs={tabs}
      groups={groups}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as AdminSettingsTab)}
    >
      {renderTabContent()}
    </SettingsLayout>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
