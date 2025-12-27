"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type AdminSettingsTab = "general" | "billing" | "notifications" | "team" | "integrations";

const tabs: { id: AdminSettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "billing", label: "Billing" },
  { id: "notifications", label: "Notifications" },
  { id: "team", label: "Team" },
  { id: "integrations", label: "Integrations" },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-primary-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// General Settings Component
function GeneralSettings() {
  const [settings, setSettings] = useState({
    studioName: "FlexiWell Studio",
    email: "contact@flexiwell.com",
    phone: "55 21 99999 0000",
    address: "Rua das Flores, 123 - Rio de Janeiro, RJ",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    language: "pt-BR",
  });

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">General</h2>
        <p className="text-sm text-gray-600 mt-1">Basic studio information and preferences.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Studio Name</label>
          <input
            type="text"
            value={settings.studioName}
            onChange={(e) => updateSetting("studioName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => updateSetting("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => updateSetting("phone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={settings.address}
            onChange={(e) => updateSetting("address", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => updateSetting("timezone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
              <option value="America/New_York">New York (GMT-5)</option>
              <option value="Europe/London">London (GMT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => updateSetting("currency", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="BRL">BRL (R$)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              value={settings.language}
              onChange={(e) => updateSetting("language", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

// Billing Settings Component
function BillingSettings() {
  const currentPlan = {
    name: "Professional Plan",
    price: "R$ 299",
    period: "month",
  };

  const paymentMethod = {
    type: "Visa",
    last4: "4242",
    expiry: "12/26",
  };

  const billingHistory = [
    { id: "1", date: "Dec 1, 2024", description: "Professional Plan", amount: "R$ 299.00", status: "Paid" },
    { id: "2", date: "Nov 1, 2024", description: "Professional Plan", amount: "R$ 299.00", status: "Paid" },
    { id: "3", date: "Oct 1, 2024", description: "Professional Plan", amount: "R$ 299.00", status: "Paid" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your subscription and payment methods.</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Current plan</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{currentPlan.name}</p>
            <p className="text-sm text-gray-500">{currentPlan.price}/{currentPlan.period}</p>
          </div>
          <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
            Active
          </span>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Change plan
          </button>
          <span className="text-gray-300">|</span>
          <button className="text-sm text-gray-600 hover:text-gray-700 font-medium">
            View invoices
          </button>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Payment method</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">VISA</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {paymentMethod.type} ending in {paymentMethod.last4}
              </p>
              <p className="text-xs text-gray-500">Expires {paymentMethod.expiry}</p>
            </div>
          </div>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Update
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Billing history</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Description</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase pb-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase pb-3">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {billingHistory.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 text-sm text-gray-600">{item.date}</td>
                  <td className="py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="py-3 text-sm text-gray-900">{item.amount}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Notifications Settings Component
function NotificationsSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    weeklyReports: true,
    newClientAlerts: true,
    paymentAlerts: true,
    classReminders: true,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        <p className="text-sm text-gray-600 mt-1">Configure how you receive notifications.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Email Notifications</p>
            <p className="text-sm text-gray-500">Receive notifications via email</p>
          </div>
          <Toggle enabled={settings.emailNotifications} onChange={(v) => updateSetting("emailNotifications", v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Push Notifications</p>
            <p className="text-sm text-gray-500">Receive push notifications in browser</p>
          </div>
          <Toggle enabled={settings.pushNotifications} onChange={(v) => updateSetting("pushNotifications", v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
            <p className="text-sm text-gray-500">Receive tips and product updates</p>
          </div>
          <Toggle enabled={settings.marketingEmails} onChange={(v) => updateSetting("marketingEmails", v)} />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Alert Types</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Weekly Reports</p>
                <p className="text-sm text-gray-500">Get weekly summary of your studio</p>
              </div>
              <Toggle enabled={settings.weeklyReports} onChange={(v) => updateSetting("weeklyReports", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">New Client Alerts</p>
                <p className="text-sm text-gray-500">When a new client registers</p>
              </div>
              <Toggle enabled={settings.newClientAlerts} onChange={(v) => updateSetting("newClientAlerts", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Payment Alerts</p>
                <p className="text-sm text-gray-500">When payments are received</p>
              </div>
              <Toggle enabled={settings.paymentAlerts} onChange={(v) => updateSetting("paymentAlerts", v)} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Class Reminders</p>
                <p className="text-sm text-gray-500">Reminders before classes start</p>
              </div>
              <Toggle enabled={settings.classReminders} onChange={(v) => updateSetting("classReminders", v)} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button variant="secondary">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

// Team Settings Component
function TeamSettings() {
  const teamMembers = [
    { name: "Ana Silva", email: "ana@flexiwell.com", role: "Admin", status: "Active" },
    { name: "Maria Santos", email: "maria@flexiwell.com", role: "Teacher", status: "Active" },
    { name: "Carlos Lima", email: "carlos@flexiwell.com", role: "Teacher", status: "Active" },
    { name: "Pedro Costa", email: "pedro@flexiwell.com", role: "Receptionist", status: "Pending" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team</h2>
          <p className="text-sm text-gray-600 mt-1">Manage team access and permissions.</p>
        </div>
        <Button>Invite Member</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-4">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-700">
                  {member.name.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                member.role === "Admin" ? "bg-purple-100 text-purple-700" :
                member.role === "Teacher" ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {member.role}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                member.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                {member.status}
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Integrations Settings Component
function IntegrationsSettings() {
  const integrations = [
    { name: "Wellhub", icon: "WH", color: "green", status: "Active", description: "Connected • Last sync: 2 hours ago" },
    { name: "Stripe", icon: "ST", color: "purple", status: null, description: "Payment processing" },
    { name: "Google Calendar", icon: "GC", color: "blue", status: null, description: "Calendar sync" },
    { name: "WhatsApp Business", icon: "WA", color: "green", status: null, description: "Customer messaging" },
  ];

  const colorClasses: Record<string, string> = {
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
        <p className="text-sm text-gray-600 mt-1">Connected apps and services.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-4">
          {integrations.map((integration, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[integration.color]}`}>
                <span className="font-bold text-sm">{integration.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                <p className="text-sm text-gray-500">{integration.description}</p>
              </div>
              {integration.status ? (
                <>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {integration.status}
                  </span>
                  <button className="text-sm text-gray-600 font-medium hover:text-gray-900">
                    Settings
                  </button>
                </>
              ) : (
                <button className="px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<AdminSettingsTab>("general");

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "billing":
        return <BillingSettings />;
      case "notifications":
        return <NotificationsSettings />;
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
      <div className="p-8">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
        <div className="max-w-2xl">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
