"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type ClientSettingsTab = "profile" | "plans" | "billing";

const tabs: { id: ClientSettingsTab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "plans", label: "Plans" },
  { id: "billing", label: "Billing" },
];

// Profile Settings Component
function ProfileSettings() {
  const initialData = {
    firstName: "Olivia",
    lastName: "Rhye",
    email: "olivia@flexitrack.net",
    phone: "+1 (555) 123-4567",
  };

  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCancel = () => {
    setFormData(initialData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // In production: await api.updateProfile(formData);
    console.log("Saving profile:", formData);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
    alert("Profile updated successfully!");
  };

  const handlePhotoChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // In production: await api.uploadAvatar(file);
        console.log("Photo selected:", file.name);
        alert(`Photo "${file.name}" selected. Upload will be available soon.`);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Profile</h2>
        <p className="text-sm text-gray-600 mt-1">Update your personal information.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-100 to-pink-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-lg sm:text-xl font-semibold text-primary-600">OR</span>
          </div>
          <div>
            <button
              onClick={handlePhotoChange}
              className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Change photo
            </button>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Available plans for Change Plan modal
const availablePlans = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    period: "month",
    classes: 8,
    features: ["8 classes/month", "Online booking", "Email reminders"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 79,
    period: "month",
    classes: 16,
    features: ["16 classes/month", "Priority booking", "WhatsApp reminders", "Cancel anytime"],
    popular: true,
  },
  {
    id: "professional",
    name: "Professional",
    price: 149,
    period: "month",
    classes: -1, // unlimited
    features: ["Unlimited classes", "VIP booking", "Personal trainer", "24/7 access"],
  },
];

// Change Plan Modal
function ChangePlanModal({
  isOpen,
  onClose,
  currentPlanId,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId: string;
}) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirmChange = async () => {
    if (selectedPlan === currentPlanId) {
      alert("You're already on this plan.");
      return;
    }

    setIsProcessing(true);
    // In production: await api.changePlan(selectedPlan) or redirect to Stripe Checkout
    await new Promise((r) => setTimeout(r, 1500));
    setIsProcessing(false);

    const plan = availablePlans.find((p) => p.id === selectedPlan);
    alert(`Plan changed to ${plan?.name}!\n\nYour new plan will be active immediately.\nYou will be charged $${plan?.price}/${plan?.period} starting from your next billing cycle.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Change Plan</h2>
          <p className="text-sm text-gray-600 mt-1">Select a new plan for your subscription</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availablePlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPlan === plan.id
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full">
                    Most Popular
                  </span>
                )}
                {currentPlanId === plan.id && (
                  <span className="absolute -top-2 right-2 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                    Current
                  </span>
                )}
                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${plan.price}
                  <span className="text-sm font-normal text-gray-500">/{plan.period}</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmChange}
            disabled={isProcessing || selectedPlan === currentPlanId}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Confirm Change"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Update Payment Modal
function UpdatePaymentModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleSubmit = async () => {
    if (!cardNumber || !expiry || !cvc) {
      alert("Please fill in all card details");
      return;
    }

    setIsProcessing(true);
    // In production: await stripe.createPaymentMethod() and api.updatePaymentMethod()
    await new Promise((r) => setTimeout(r, 1500));
    setIsProcessing(false);

    alert("Payment method updated successfully!\n\nYour new card will be used for future payments.");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update Payment Method</h2>
          <p className="text-sm text-gray-600 mt-1">Enter your new card details</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                placeholder="123"
                maxLength={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-xs text-gray-500">Your payment info is encrypted and secure</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isProcessing ? "Updating..." : "Update Card"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Plans Settings Component
function PlansSettings() {
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);

  const currentPlan = {
    id: "growth",
    name: "Premium Monthly",
    price: "$79",
    period: "month",
    classesIncluded: 16,
    classesUsed: 8,
    nextBilling: "Jan 15, 2025",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Plans</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your subscription plan.</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
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
          <button onClick={() => setShowChangePlanModal(true)} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Change plan
          </button>
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Available plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-4 rounded-xl border-2 ${
                currentPlan.id === plan.id
                  ? "border-primary-600 bg-primary-50"
                  : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary-600 text-white text-xs font-medium rounded-full">
                  Most Popular
                </span>
              )}
              {currentPlan.id === plan.id && (
                <span className="absolute -top-2 right-2 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                  Current
                </span>
              )}
              <h4 className="font-semibold text-gray-900">{plan.name}</h4>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${plan.price}
                <span className="text-sm font-normal text-gray-500">/{plan.period}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              {currentPlan.id !== plan.id && (
                <button
                  onClick={() => setShowChangePlanModal(true)}
                  className="w-full mt-4 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  {plan.price > 79 ? "Upgrade" : "Downgrade"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Change Plan Modal */}
      <ChangePlanModal
        isOpen={showChangePlanModal}
        onClose={() => setShowChangePlanModal(false)}
        currentPlanId={currentPlan.id}
      />
    </div>
  );
}

// Billing Settings Component
function BillingSettings() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  const handleDownloadInvoice = (invoiceId: string) => {
    // In production: await api.downloadInvoice(invoiceId)
    console.log("Downloading invoice:", invoiceId);
    alert(`Invoice download coming soon! Invoice #${invoiceId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Billing</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your payment methods and view billing history.</p>
      </div>

      {/* Payment Method */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Payment method</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 bg-blue-600 rounded flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">VISA</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {paymentMethod.type} ending in {paymentMethod.last4}
              </p>
              <p className="text-xs text-gray-500">Expires {paymentMethod.expiry}</p>
            </div>
          </div>
          <button onClick={() => setShowPaymentModal(true)} className="text-sm text-primary-600 hover:text-primary-700 font-medium self-end sm:self-auto">
            Update
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Billing history</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
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
                    <button
                      onClick={() => handleDownloadInvoice(item.id)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Payment Modal */}
      <UpdatePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
}

export default function ClientSettingsPage() {
  const [activeTab, setActiveTab] = useState<ClientSettingsTab>("profile");

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "plans":
        return <PlansSettings />;
      case "billing":
        return <BillingSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Settings</h1>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6 sm:mb-8 overflow-x-auto">
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
        <div className="max-w-4xl">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
