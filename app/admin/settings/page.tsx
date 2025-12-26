"use client";

import { useState } from "react";

interface SettingSection {
  id: string;
  title: string;
  description: string;
}

const settingSections: SettingSection[] = [
  { id: "general", title: "General", description: "Basic studio information and preferences" },
  { id: "billing", title: "Billing", description: "Payment methods and subscription" },
  { id: "notifications", title: "Notifications", description: "Email and push notification preferences" },
  { id: "team", title: "Team", description: "Manage team access and permissions" },
  { id: "integrations", title: "Integrations", description: "Connected apps and services" },
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

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState({
    studioName: "FlexiWell Studio",
    email: "contact@flexiwell.com",
    phone: "55 21 99999 0000",
    address: "Rua das Flores, 123 - Rio de Janeiro, RJ",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    language: "pt-BR",
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    weeklyReports: true,
    newClientAlerts: true,
    paymentAlerts: true,
    classReminders: true,
  });

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your studio preferences and configuration</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <p className="text-sm font-medium">{section.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 max-w-2xl">
            {activeSection === "general" && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Studio Name</label>
                    <input
                      type="text"
                      value={settings.studioName}
                      onChange={(e) => updateSetting("studioName", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSetting("email", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => updateSetting("phone", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => updateSetting("address", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => updateSetting("timezone", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                        <option value="America/New_York">New York (GMT-5)</option>
                        <option value="Europe/London">London (GMT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select
                        value={settings.currency}
                        onChange={(e) => updateSetting("currency", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="BRL">BRL (R$)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting("language", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                  <button className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeSection === "billing" && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
                  <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Professional Plan</p>
                      <p className="text-sm text-gray-600">R$ 299/month • Billed monthly</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      Active
                    </span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
                      Change Plan
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      View Invoices
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
                  <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">VISA</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                      <p className="text-sm text-gray-500">Expires 12/2026</p>
                    </div>
                    <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
                      Update
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>
                  <div className="space-y-3">
                    {[
                      { date: "Dec 1, 2024", amount: "R$ 299.00", status: "Paid" },
                      { date: "Nov 1, 2024", amount: "R$ 299.00", status: "Paid" },
                      { date: "Oct 1, 2024", amount: "R$ 299.00", status: "Paid" },
                    ].map((invoice, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">{invoice.date}</p>
                          <p className="text-sm text-gray-500">Professional Plan</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{invoice.amount}</p>
                          <span className="text-xs text-green-600 font-medium">{invoice.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Toggle
                      enabled={settings.emailNotifications}
                      onChange={(value) => updateSetting("emailNotifications", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Push Notifications</p>
                      <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                    </div>
                    <Toggle
                      enabled={settings.pushNotifications}
                      onChange={(value) => updateSetting("pushNotifications", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Marketing Emails</p>
                      <p className="text-sm text-gray-500">Receive tips and product updates</p>
                    </div>
                    <Toggle
                      enabled={settings.marketingEmails}
                      onChange={(value) => updateSetting("marketingEmails", value)}
                    />
                  </div>

                  <hr className="border-gray-200" />

                  <h3 className="font-medium text-gray-900">Alert Types</h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Reports</p>
                      <p className="text-sm text-gray-500">Get weekly summary of your studio</p>
                    </div>
                    <Toggle
                      enabled={settings.weeklyReports}
                      onChange={(value) => updateSetting("weeklyReports", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">New Client Alerts</p>
                      <p className="text-sm text-gray-500">When a new client registers</p>
                    </div>
                    <Toggle
                      enabled={settings.newClientAlerts}
                      onChange={(value) => updateSetting("newClientAlerts", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Payment Alerts</p>
                      <p className="text-sm text-gray-500">When payments are received</p>
                    </div>
                    <Toggle
                      enabled={settings.paymentAlerts}
                      onChange={(value) => updateSetting("paymentAlerts", value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Class Reminders</p>
                      <p className="text-sm text-gray-500">Reminders before classes start</p>
                    </div>
                    <Toggle
                      enabled={settings.classReminders}
                      onChange={(value) => updateSetting("classReminders", value)}
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                  <button className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {activeSection === "team" && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                  <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
                    Invite Member
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { name: "Ana Silva", email: "ana@flexiwell.com", role: "Admin", status: "Active" },
                    { name: "Maria Santos", email: "maria@flexiwell.com", role: "Teacher", status: "Active" },
                    { name: "Carlos Lima", email: "carlos@flexiwell.com", role: "Teacher", status: "Active" },
                    { name: "Pedro Costa", email: "pedro@flexiwell.com", role: "Receptionist", status: "Pending" },
                  ].map((member, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-700">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.name}</p>
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
            )}

            {activeSection === "integrations" && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Connected Integrations</h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">WH</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Wellhub</p>
                      <p className="text-sm text-gray-500">Connected • Last sync: 2 hours ago</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                    <button className="text-sm text-gray-600 font-medium hover:text-gray-900">
                      Settings
                    </button>
                  </div>

                  <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">ST</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Stripe</p>
                      <p className="text-sm text-gray-500">Payment processing</p>
                    </div>
                    <button className="px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
                      Connect
                    </button>
                  </div>

                  <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">GC</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Google Calendar</p>
                      <p className="text-sm text-gray-500">Calendar sync</p>
                    </div>
                    <button className="px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
                      Connect
                    </button>
                  </div>

                  <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">WA</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">WhatsApp Business</p>
                      <p className="text-sm text-gray-500">Customer messaging</p>
                    </div>
                    <button className="px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
