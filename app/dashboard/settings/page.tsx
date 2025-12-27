"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type ClientSettingsTab = "profile" | "billing";

const tabs: { id: ClientSettingsTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "billing", label: "Billing" },
];

// Profile Settings Component
function ProfileSettings() {
  const [formData, setFormData] = useState({
    firstName: "Olivia",
    lastName: "Rhye",
    email: "olivia@flexitrack.net",
    phone: "+1 (555) 123-4567",
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-600 mt-1">Update your personal information.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-pink-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-semibold text-primary-600">OR</span>
          </div>
          <div>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              Change photo
            </button>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Password Section */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Change password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                type="password"
                placeholder="Enter current password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                placeholder="Enter new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
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
    name: "Premium Monthly",
    price: "$79",
    period: "month",
    classesIncluded: 16,
    classesUsed: 8,
    nextBilling: "Jan 15, 2025",
  };

  const paymentMethod = {
    type: "Visa",
    last4: "4242",
    expiry: "12/26",
  };

  const billingHistory = [
    { id: "1", date: "Dec 15, 2024", description: "Premium Monthly", amount: "$79.00", status: "Paid" },
    { id: "2", date: "Nov 15, 2024", description: "Premium Monthly", amount: "$79.00", status: "Paid" },
    { id: "3", date: "Oct 15, 2024", description: "Premium Monthly", amount: "$79.00", status: "Paid" },
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

        {/* Usage */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Classes used this month</span>
            <span className="text-sm font-medium text-gray-900">
              {currentPlan.classesUsed} / {currentPlan.classesIncluded}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${(currentPlan.classesUsed / currentPlan.classesIncluded) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {currentPlan.classesIncluded - currentPlan.classesUsed} classes remaining
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Next billing date</p>
            <p className="text-sm font-medium text-gray-900">{currentPlan.nextBilling}</p>
          </div>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Change plan
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

export default function ClientSettingsPage() {
  const [activeTab, setActiveTab] = useState<ClientSettingsTab>("profile");

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "billing":
        return <BillingSettings />;
      default:
        return <ProfileSettings />;
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
