"use client";

import { useState } from "react";
import { SearchIcon, CheckCircleIcon, ToggleIcon } from "@/components/icons";

interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  category: "marketplace" | "payment" | "marketing" | "scheduling" | "analytics";
  status: "connected" | "available" | "coming_soon";
  features: string[];
  connectedAt?: string;
  stats?: {
    label: string;
    value: string;
  }[];
}

const mockIntegrations: Integration[] = [
  {
    id: "wellhub",
    name: "Wellhub",
    description: "Connect with Wellhub (formerly Gympass) to reach thousands of corporate wellness clients. Automatically sync classes and manage check-ins.",
    logo: "W",
    category: "marketplace",
    status: "connected",
    features: ["Class sync", "Check-in management", "Revenue reports", "Client profiles"],
    connectedAt: "Dec 15, 2024",
    stats: [
      { label: "Monthly check-ins", value: "234" },
      { label: "Revenue this month", value: "$4,560" },
    ],
  },
  {
    id: "classpass",
    name: "ClassPass",
    description: "List your classes on ClassPass to attract new clients looking for fitness and wellness experiences in your area.",
    logo: "CP",
    category: "marketplace",
    status: "available",
    features: ["Class listings", "Booking management", "Dynamic pricing", "Analytics"],
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept online payments securely with Stripe. Process credit cards, subscriptions, and recurring payments.",
    logo: "S",
    category: "payment",
    status: "connected",
    features: ["Card payments", "Subscriptions", "Invoicing", "Fraud protection"],
    connectedAt: "Nov 1, 2024",
    stats: [
      { label: "Transactions", value: "156" },
      { label: "This month", value: "$12,340" },
    ],
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Accept PayPal payments and offer more payment options to your clients worldwide.",
    logo: "PP",
    category: "payment",
    status: "available",
    features: ["PayPal checkout", "Pay Later options", "International payments"],
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Sync your client list with Mailchimp for email marketing campaigns and automated newsletters.",
    logo: "MC",
    category: "marketing",
    status: "available",
    features: ["Contact sync", "Automated campaigns", "Segmentation", "Analytics"],
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync classes and appointments with Google Calendar for seamless scheduling.",
    logo: "GC",
    category: "scheduling",
    status: "connected",
    features: ["Two-way sync", "Reminders", "Availability", "Room booking"],
    connectedAt: "Oct 20, 2024",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Offer virtual classes with automatic Zoom meeting creation and link sharing.",
    logo: "Z",
    category: "scheduling",
    status: "available",
    features: ["Auto meeting creation", "Link sharing", "Recording", "Attendance tracking"],
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Track website traffic and understand how clients find your wellness business online.",
    logo: "GA",
    category: "analytics",
    status: "available",
    features: ["Traffic analysis", "Conversion tracking", "User behavior", "Reports"],
  },
  {
    id: "mindbody",
    name: "Mindbody",
    description: "Import your existing data from Mindbody and keep both systems in sync during transition.",
    logo: "MB",
    category: "marketplace",
    status: "coming_soon",
    features: ["Data import", "Client migration", "Schedule sync", "Two-way sync"],
  },
  {
    id: "square",
    name: "Square",
    description: "Accept in-person payments with Square POS integration for your front desk.",
    logo: "SQ",
    category: "payment",
    status: "coming_soon",
    features: ["POS integration", "In-person payments", "Hardware support", "Inventory"],
  },
];

const categoryLabels = {
  marketplace: { label: "Marketplace", color: "bg-purple-100 text-purple-700" },
  payment: { label: "Payment", color: "bg-green-100 text-green-700" },
  marketing: { label: "Marketing", color: "bg-blue-100 text-blue-700" },
  scheduling: { label: "Scheduling", color: "bg-orange-100 text-orange-700" },
  analytics: { label: "Analytics", color: "bg-pink-100 text-pink-700" },
};

const logoColors: Record<string, string> = {
  wellhub: "bg-orange-500",
  classpass: "bg-purple-600",
  stripe: "bg-indigo-600",
  paypal: "bg-blue-600",
  mailchimp: "bg-yellow-500",
  "google-calendar": "bg-blue-500",
  zoom: "bg-blue-600",
  "google-analytics": "bg-orange-500",
  mindbody: "bg-teal-600",
  square: "bg-gray-900",
};

function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onConfigure,
}: {
  integration: Integration;
  onConnect: () => void;
  onDisconnect: () => void;
  onConfigure: () => void;
}) {
  const category = categoryLabels[integration.category];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 ${logoColors[integration.id]} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <span className="text-white font-bold text-lg">{integration.logo}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{integration.name}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${category.color}`}>
              {category.label}
            </span>
            {integration.status === "connected" && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                <CheckCircleIcon className="w-3 h-3" />
                Connected
              </span>
            )}
            {integration.status === "coming_soon" && (
              <span className="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-3">{integration.description}</p>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-4">
            {integration.features.map((feature) => (
              <span key={feature} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                {feature}
              </span>
            ))}
          </div>

          {/* Stats for connected integrations */}
          {integration.status === "connected" && integration.stats && (
            <div className="flex items-center gap-6 mb-4 p-3 bg-gray-50 rounded-lg">
              {integration.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-500">Connected</p>
                <p className="text-sm text-gray-700">{integration.connectedAt}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {integration.status === "connected" ? (
              <>
                <button
                  onClick={onConfigure}
                  className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Configure
                </button>
                <button
                  onClick={onDisconnect}
                  className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : integration.status === "available" ? (
              <button
                onClick={onConnect}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Connect
              </button>
            ) : (
              <button
                disabled
                className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
              >
                Coming Soon
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfigureModal({
  integration,
  isOpen,
  onClose,
}: {
  integration: Integration | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !integration) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${logoColors[integration.id]} rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold">{integration.logo}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{integration.name} Settings</h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Sync Settings */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Sync Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Auto-sync classes</p>
                  <p className="text-sm text-gray-500">Automatically sync class schedules</p>
                </div>
                <ToggleIcon className="w-10 h-6 text-primary-600" active />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Import client profiles</p>
                  <p className="text-sm text-gray-500">Sync client data from this platform</p>
                </div>
                <ToggleIcon className="w-10 h-6 text-gray-300" active={false} />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Revenue reports</p>
                  <p className="text-sm text-gray-500">Include in financial reports</p>
                </div>
                <ToggleIcon className="w-10 h-6 text-primary-600" active />
              </label>
            </div>
          </div>

          {/* Connection Status */}
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">Connection is active and healthy</p>
            </div>
            <p className="text-sm text-green-600 mt-1">Last synced: 5 minutes ago</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ConnectModal({
  integration,
  isOpen,
  onClose,
  onConfirm,
}: {
  integration: Integration | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      onConfirm();
    }, 1500);
  };

  if (!isOpen || !integration) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Connect {integration.name}</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
              <span className="text-primary-600 font-bold text-2xl">F</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gray-300" />
              <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
              <div className="w-8 h-0.5 bg-gray-300" />
            </div>
            <div className={`w-16 h-16 ${logoColors[integration.id]} rounded-xl flex items-center justify-center`}>
              <span className="text-white font-bold text-2xl">{integration.logo}</span>
            </div>
          </div>

          <p className="text-gray-600 text-center mb-6">
            This will allow FlexiWell to access your {integration.name} account to sync data and automate workflows.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">FlexiWell will be able to:</p>
            <ul className="space-y-2">
              {integration.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 flex items-center justify-center gap-2"
          >
            {connecting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                Connecting...
              </>
            ) : (
              "Connect"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [configureModal, setConfigureModal] = useState<Integration | null>(null);
  const [connectModal, setConnectModal] = useState<Integration | null>(null);
  const [integrations, setIntegrations] = useState(mockIntegrations);

  const handleConnect = (integration: Integration) => {
    setConnectModal(integration);
  };

  const handleConfirmConnect = () => {
    if (connectModal) {
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === connectModal.id
            ? { ...i, status: "connected" as const, connectedAt: "Just now" }
            : i
        )
      );
      setConnectModal(null);
    }
  };

  const handleDisconnect = (integration: Integration) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === integration.id ? { ...i, status: "available" as const, connectedAt: undefined, stats: undefined } : i
      )
    );
  };

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || integration.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || integration.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const connectedCount = integrations.filter((i) => i.status === "connected").length;
  const availableCount = integrations.filter((i) => i.status === "available").length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">
            Connect FlexiWell with your favorite tools and platforms
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
            <p className="text-sm text-gray-500">Connected</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{availableCount}</p>
            <p className="text-sm text-gray-500">Available</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-center gap-4 mb-6 bg-white rounded-xl px-4 py-3 border border-gray-200">
        {/* Search */}
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All categories</option>
          <option value="marketplace">Marketplace</option>
          <option value="payment">Payment</option>
          <option value="marketing">Marketing</option>
          <option value="scheduling">Scheduling</option>
          <option value="analytics">Analytics</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All statuses</option>
          <option value="connected">Connected</option>
          <option value="available">Available</option>
          <option value="coming_soon">Coming Soon</option>
        </select>
      </div>

      {/* Connected Integrations Section */}
      {filteredIntegrations.some((i) => i.status === "connected") && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredIntegrations
              .filter((i) => i.status === "connected")
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={() => handleConnect(integration)}
                  onDisconnect={() => handleDisconnect(integration)}
                  onConfigure={() => setConfigureModal(integration)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Available Integrations Section */}
      {filteredIntegrations.some((i) => i.status === "available") && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredIntegrations
              .filter((i) => i.status === "available")
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={() => handleConnect(integration)}
                  onDisconnect={() => handleDisconnect(integration)}
                  onConfigure={() => setConfigureModal(integration)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Coming Soon Section */}
      {filteredIntegrations.some((i) => i.status === "coming_soon") && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredIntegrations
              .filter((i) => i.status === "coming_soon")
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={() => handleConnect(integration)}
                  onDisconnect={() => handleDisconnect(integration)}
                  onConfigure={() => setConfigureModal(integration)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No integrations found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Modals */}
      <ConfigureModal
        integration={configureModal}
        isOpen={!!configureModal}
        onClose={() => setConfigureModal(null)}
      />
      <ConnectModal
        integration={connectModal}
        isOpen={!!connectModal}
        onClose={() => setConnectModal(null)}
        onConfirm={handleConfirmConnect}
      />
    </div>
  );
}
