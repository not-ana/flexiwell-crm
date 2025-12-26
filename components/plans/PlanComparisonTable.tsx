"use client";

import { useState } from "react";
import { plans, PlanType, featureCategories, featureDisplayNames, PlanFeatures } from "@/lib/plans";

interface PlanComparisonTableProps {
  currentPlan?: PlanType;
  onSelectPlan?: (planId: PlanType) => void;
}

export function PlanComparisonTable({ currentPlan, onSelectPlan }: PlanComparisonTableProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const planOrder: PlanType[] = ["starter", "professional", "enterprise"];

  const categoryLabels: Record<string, string> = {
    core: "Core Features",
    communication: "Communication",
    reporting: "Reports & Analytics",
    advanced: "Advanced Features",
    integrations: "Integrations",
    infrastructure: "Infrastructure",
    support: "Support",
  };

  return (
    <div className="w-full">
      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              billingCycle === "yearly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
            }`}
          >
            Yearly
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {planOrder.map((planId) => {
          const plan = plans[planId];
          const price = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;
          const isCurrent = currentPlan === planId;
          const isPopular = plan.popular;

          return (
            <div
              key={planId}
              className={`relative rounded-2xl border-2 p-6 ${
                isPopular
                  ? "border-purple-500 bg-gradient-to-b from-purple-50 to-white"
                  : isCurrent
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                  Current Plan
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">${price}</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                {billingCycle === "yearly" && (
                  <p className="text-sm text-gray-500 mt-1">Billed annually</p>
                )}
              </div>

              {/* Limits */}
              <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Clients</span>
                  <span className="font-medium text-gray-900">
                    {plan.limits.maxClients === -1 ? "Unlimited" : `Up to ${plan.limits.maxClients}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Staff</span>
                  <span className="font-medium text-gray-900">
                    {plan.limits.maxStaff === -1 ? "Unlimited" : `Up to ${plan.limits.maxStaff}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Locations</span>
                  <span className="font-medium text-gray-900">
                    {plan.limits.maxLocations === -1 ? "Unlimited" : plan.limits.maxLocations}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectPlan?.(planId)}
                disabled={isCurrent}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isCurrent
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isPopular
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                {isCurrent ? "Current Plan" : "Get Started"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Features</th>
              {planOrder.map((planId) => (
                <th key={planId} className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                  {plans[planId].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(featureCategories).map(([category, features]) => (
              <>
                <tr key={`category-${category}`} className="bg-gray-50">
                  <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-gray-700">
                    {categoryLabels[category]}
                  </td>
                </tr>
                {features.map((feature) => (
                  <tr key={feature} className="border-b border-gray-100">
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {featureDisplayNames[feature as keyof PlanFeatures]}
                    </td>
                    {planOrder.map((planId) => (
                      <td key={`${planId}-${feature}`} className="px-6 py-3 text-center">
                        {plans[planId].features[feature as keyof PlanFeatures] ? (
                          <svg
                            className="w-5 h-5 text-green-500 mx-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-gray-300 mx-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
