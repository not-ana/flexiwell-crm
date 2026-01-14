"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { showToast } from "./shared";

const flexiwellPlans = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 99,
    yearlyPrice: 79,
    description: "For solo instructors",
    limits: {
      clients: 100,
      staff: 1,
      locations: 1,
      storage: "5GB",
    },
    features: [
      "Up to 100 clients",
      "1 team account",
      "1 location",
      "Online scheduling",
      "Email reminders",
      "Basic reports",
    ],
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 179,
    yearlyPrice: 143,
    description: "For growing studios",
    limits: {
      clients: 500,
      staff: "unlimited",
      locations: 2,
      storage: "25GB",
    },
    features: [
      "Everything in Starter, plus:",
      "Up to 500 clients",
      "Unlimited team accounts",
      "2 locations",
      "SMS notifications",
      "WhatsApp notifications",
      "Smart Waitlist (basic)",
      "Advanced reports",
      "Chat support",
    ],
    highlight: false,
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 299,
    yearlyPrice: 239,
    description: "For established studios",
    limits: {
      clients: 2000,
      staff: "unlimited",
      locations: 5,
      storage: "100GB",
    },
    features: [
      "Everything in Growth, plus:",
      "Up to 2,000 clients",
      "5 locations",
      "Messaging Bot (5,000 msgs/month)",
      "AI Support Assistant (2,000 chats/mo)",
      "AI-powered smart waitlist",
      "Cancellation predictions",
      "Priority support (24h)",
    ],
    highlight: true,
    badge: "Most Popular",
  },
  {
    id: "professional",
    name: "Professional",
    monthlyPrice: 499,
    yearlyPrice: 399,
    description: "For large studios and networks",
    limits: {
      clients: "unlimited",
      staff: "unlimited",
      locations: "unlimited",
      storage: "500GB",
    },
    features: [
      "Everything in Business, plus:",
      "Unlimited clients",
      "Unlimited locations",
      "Messaging Bot (unlimited)",
      "AI Support Assistant (unlimited)",
      "Custom waitlist rules",
      "White-label branding",
      "Complete API access",
      "Dedicated account manager",
      "Priority support (12h)",
    ],
    highlight: false,
  },
];

function ChangePlanModal({
  isOpen,
  onClose,
  currentPlanId,
  billingCycle,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId: string;
  billingCycle: "monthly" | "yearly";
}) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId);
  const [selectedCycle, setSelectedCycle] = useState(billingCycle);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  if (!isOpen) return null;

  const currentPlan = flexiwellPlans.find((p) => p.id === currentPlanId);
  const newPlan = flexiwellPlans.find((p) => p.id === selectedPlan);
  const currentPrice = billingCycle === "yearly" ? currentPlan?.yearlyPrice : currentPlan?.monthlyPrice;
  const newPrice = selectedCycle === "yearly" ? newPlan?.yearlyPrice : newPlan?.monthlyPrice;
  const priceDifference = (newPrice || 0) - (currentPrice || 0);

  const currentPlanIndex = flexiwellPlans.findIndex((p) => p.id === currentPlanId);
  const selectedPlanIndex = flexiwellPlans.findIndex((p) => p.id === selectedPlan);
  const isUpgrade = selectedPlanIndex > currentPlanIndex || (selectedPlanIndex === currentPlanIndex && priceDifference > 0);
  const isDowngrade = selectedPlanIndex < currentPlanIndex || (selectedPlanIndex === currentPlanIndex && priceDifference < 0);

  const handleRequestChange = () => {
    if (selectedPlan === currentPlanId && selectedCycle === billingCycle) {
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmChange = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsProcessing(false);
    setShowConfirmModal(false);
    onClose();
    // Show success toast or redirect
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Change FlexiWell Plan</h2>
              <p className="text-sm text-gray-600 mt-1">Choose the ideal plan for your studio</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3 mt-4 p-1 bg-gray-100 rounded-lg w-fit mx-auto">
            <button
              onClick={() => setSelectedCycle("monthly")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                selectedCycle === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedCycle("yearly")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                selectedCycle === "yearly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
          {/* Responsive grid for 4 plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 gap-y-6 items-stretch">
            {flexiwellPlans.map((plan) => {
              const price = selectedCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
              const isCurrentPlan = currentPlanId === plan.id;
              const isSelected = selectedPlan === plan.id;

              return (
                <div className="relative h-full" key={plan.id}>
                  <button
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative w-full h-full p-5 sm:p-6 rounded-xl border-2 text-left transition-all flex flex-col ${
                      isSelected
                        ? "border-primary-600 bg-primary-50 ring-2 ring-primary-200"
                        : plan.highlight
                        ? "border-primary-200 bg-primary-50/30"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {/* Badge at top edge */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3.5 py-1.5 bg-primary-600 text-white text-[10px] font-bold rounded-full whitespace-nowrap uppercase tracking-wider shadow-md">
                          ⭐ {plan.badge}
                        </span>
                      </div>
                    )}

                    {/* Add top spacing for badge */}
                    <div className="h-4"></div>

                    {/* Current Plan badge inside card, below Most Popular */}
                    {isCurrentPlan && (
                      <div className="flex justify-center mb-3">
                        <span className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-semibold rounded-full uppercase tracking-wide shadow-sm">
                          Current Plan
                        </span>
                      </div>
                    )}

                  {/* Plan name and description */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 text-xl tracking-tight">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{plan.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold text-gray-900 tracking-tight">${price}</span>
                      <span className="text-base text-gray-500">/mo</span>
                    </div>
                    {selectedCycle === "yearly" && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-md">
                        <span className="text-xs text-green-700 font-semibold">
                          💰 Save ${(plan.monthlyPrice - price) * 12}/year
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Limits with icons */}
                  <div className="mb-5 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">👥</span>
                        <span className="text-gray-600">
                          <span className="font-semibold text-gray-900">
                            {plan.limits.clients === -1 ? "∞" : plan.limits.clients}
                          </span> clients
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">👤</span>
                        <span className="text-gray-600">
                          <span className="font-semibold text-gray-900">
                            {plan.limits.staff === -1 ? "∞" : plan.limits.staff}
                          </span> team
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📍</span>
                        <span className="text-gray-600">
                          <span className="font-semibold text-gray-900">{plan.limits.locations}</span> locations
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">💾</span>
                        <span className="text-gray-600">
                          <span className="font-semibold text-gray-900">{plan.limits.storage}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              </div>
              );
            })}
          </div>

          {/* Upgrade/Downgrade Notice */}
          {selectedPlan !== currentPlanId && (
            <div className={`mt-4 p-4 rounded-lg ${
              isUpgrade ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
            }`}>
              <div className="flex items-start gap-3">
                <svg className={`w-5 h-5 flex-shrink-0 ${isUpgrade ? "text-green-600" : "text-amber-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className={`font-medium ${isUpgrade ? "text-green-800" : "text-amber-800"}`}>
                    {isUpgrade ? "Plan upgrade" : "Plan downgrade"}
                  </p>
                  <p className={isUpgrade ? "text-green-700" : "text-amber-700"}>
                    {isUpgrade
                      ? "Your new plan will be activated immediately with access to all features."
                      : "When downgrading, you may lose access to some features. Data above the limit will be preserved but inaccessible."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRequestChange}
            disabled={selectedPlan === currentPlanId && selectedCycle === billingCycle}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Confirm Change"}
          </button>
        </div>
      </div>
    </div>

    {/* Confirmation Modal */}
    {showConfirmModal && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
          <div className="p-6">
            {/* Icon */}
            <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 ${
              isUpgrade ? "bg-green-100" : "bg-amber-100"
            }`}>
              {isUpgrade ? (
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
              {isUpgrade ? "Confirm Upgrade" : "Confirm Downgrade"}
            </h3>

            {/* Plan change summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Current Plan</p>
                  <p className="font-semibold text-gray-900">{currentPlan?.name}</p>
                  <p className="text-sm text-gray-600">R$ {currentPrice}/mo</p>
                </div>
                <div className="px-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">New Plan</p>
                  <p className="font-semibold text-gray-900">{newPlan?.name}</p>
                  <p className="text-sm text-gray-600">R$ {newPrice}/mo</p>
                </div>
              </div>

            </div>

            {/* Warning/Info message */}
            <div className={`p-3 rounded-lg mb-4 ${
              isUpgrade ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
            }`}>
              <p className={`text-sm ${isUpgrade ? "text-green-700" : "text-amber-700"}`}>
                {isUpgrade
                  ? "Your new plan will be activated immediately. You will be charged the prorated difference for the current billing period."
                  : "When downgrading, you may lose access to some features. Your current data will be preserved but may become inaccessible if it exceeds the new plan limits."}
              </p>
            </div>

            {/* Billing info */}
            <p className="text-xs text-gray-500 text-center">
              {selectedCycle === "yearly"
                ? `Billed annually at R$ ${(newPrice || 0) * 12}/year`
                : `Billed monthly at R$ ${newPrice}/month`
              }
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => setShowConfirmModal(false)}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmChange}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2.5 text-white font-medium rounded-lg transition-colors disabled:opacity-50 ${
                isUpgrade
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isProcessing ? "Processing..." : isUpgrade ? "Confirm Upgrade" : "Confirm Downgrade"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function UpdatePaymentModalAdmin({
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
    await new Promise((r) => setTimeout(r, 1500));
    setIsProcessing(false);

    alert("Payment method updated!\n\nYour new card will be used for future payments.");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update Payment</h2>
          <p className="text-sm text-gray-600 mt-1">Enter the new card details</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
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
            <p className="text-xs text-gray-500">Your data is protected with SSL encryption</p>
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

export function SubscriptionSettings() {
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const currentPlan = {
    id: "business",
    name: "Business",
    monthlyPrice: 299,
    yearlyPrice: 239,
    billingCycle: "monthly" as "monthly" | "yearly",
    nextBilling: "15 Jan 2025",
    usage: {
      clients: 342,
      clientsLimit: 2000,
      staff: 8,
      staffLimit: "unlimited",
      locations: 1,
      locationsLimit: 5,
      storage: "12GB",
      storageLimit: "100GB",
    },
  };

  const paymentMethod = {
    type: "Visa",
    last4: "4242",
    expiry: "12/26",
  };

  const billingHistory = [
    { id: "1", date: "Dec 1, 2024", description: "Business Plan", amount: "$299.00", status: "Paid" },
    { id: "2", date: "Nov 1, 2024", description: "Business Plan", amount: "$299.00", status: "Paid" },
    { id: "3", date: "Oct 1, 2024", description: "Business Plan", amount: "$299.00", status: "Paid" },
    { id: "4", date: "Sep 1, 2024", description: "Growth Plan", amount: "$179.00", status: "Paid" },
  ];

  const usagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Subscription</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your FlexiWell platform subscription.</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">Current subscription</h3>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                Most Popular
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{currentPlan.name}</p>
            <p className="text-sm text-gray-500">
              R$ {currentPlan.monthlyPrice}/month
              {currentPlan.billingCycle === "yearly" && " (yearly)"}
            </p>
          </div>
          <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full self-start">
            Active
          </span>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Clients</span>
              <span className="text-xs font-medium text-gray-700">
                {currentPlan.usage.clients}/{currentPlan.usage.clientsLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  usagePercentage(currentPlan.usage.clients, currentPlan.usage.clientsLimit) > 80
                    ? "bg-amber-500"
                    : "bg-primary-500"
                }`}
                style={{ width: `${usagePercentage(currentPlan.usage.clients, currentPlan.usage.clientsLimit)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Team</span>
              <span className="text-xs font-medium text-gray-700">
                {currentPlan.usage.staff}/{currentPlan.usage.staffLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${usagePercentage(currentPlan.usage.staff, currentPlan.usage.staffLimit)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Locations</span>
              <span className="text-xs font-medium text-gray-700">
                {currentPlan.usage.locations}/{currentPlan.usage.locationsLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${usagePercentage(currentPlan.usage.locations, currentPlan.usage.locationsLimit)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Storage</span>
              <span className="text-xs font-medium text-gray-700">
                {currentPlan.usage.storage}/{currentPlan.usage.storageLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `48%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Next billing</p>
            <p className="text-sm font-medium text-gray-900">{currentPlan.nextBilling}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChangePlanModal(true)}
              className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Change plan
            </button>
          </div>
        </div>
      </div>

      {/* Savings Tip */}
      {currentPlan.billingCycle === "monthly" && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Save 20% with yearly plan</p>
              <p className="text-sm text-green-700 mt-0.5">
                Switch to yearly billing and save R$ {Math.round((currentPlan.monthlyPrice - currentPlan.yearlyPrice) * 12)}/year
              </p>
            </div>
            <button
              onClick={() => setShowChangePlanModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors whitespace-nowrap"
            >
              View plans
            </button>
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Payment method</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold tracking-wide">VISA</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {paymentMethod.type} •••• {paymentMethod.last4}
              </p>
              <p className="text-xs text-gray-500">Expires {paymentMethod.expiry}</p>
            </div>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Update
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Billing history</h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
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
                  <td className="py-3 text-sm font-medium text-gray-900">{item.amount}</td>
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

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-3">
          {billingHistory.map((item) => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{item.description}</span>
                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                  {item.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{item.date}</span>
                <span className="font-medium text-gray-900">{item.amount}</span>
              </div>
              <button className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                Download invoice
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <ChangePlanModal
        isOpen={showChangePlanModal}
        onClose={() => setShowChangePlanModal(false)}
        currentPlanId={currentPlan.id}
        billingCycle={currentPlan.billingCycle}
      />
      <UpdatePaymentModalAdmin
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
}
