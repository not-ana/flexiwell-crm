"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/hooks/useCurrency";
import { planPackages } from "@/lib/checkout/planPackages";
import { PlanPackage } from "@/lib/checkout/types";
import { CheckoutStepIndicator } from "@/components/checkout/CheckoutStepIndicator";
import { TrustBadges } from "@/components/checkout/TrustBadges";
import { ShieldCheck, ArrowRight, Check, X, Users, Zap } from "lucide-react";

export default function PlansPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [showComparison, setShowComparison] = useState(false);

  const handleSelectPlan = (plan: PlanPackage) => {
    router.push(`/plans/checkout?plan=${plan.id}`);
  };

  // Comparison table feature data
  const comparisonFeatures = [
    {
      label: "Classes",
      type: "text" as const,
      values: planPackages.map((p) => `${p.classes}`),
    },
    {
      label: "Price / Class",
      type: "text" as const,
      values: planPackages.map((p) => formatCurrency(p.pricePerClass)),
    },
    {
      label: "Savings",
      type: "text" as const,
      values: planPackages.map((p) => (p.savings ? formatCurrency(p.savings) : "--")),
    },
    {
      label: "Duration",
      type: "text" as const,
      values: planPackages.map((p) => p.duration),
    },
    {
      label: "Online Booking",
      type: "boolean" as const,
      values: planPackages.map(() => true),
    },
    {
      label: "SMS Reminders",
      type: "boolean" as const,
      values: planPackages.map(() => true),
    },
    {
      label: "Class Makeup",
      type: "boolean" as const,
      values: planPackages.map((p) => p.classes > 1),
    },
    {
      label: "Certified Instructors",
      type: "boolean" as const,
      values: planPackages.map(() => true),
    },
  ];

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hormozi Urgency Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl px-4 py-3 mb-8 flex items-center justify-center gap-3">
          <Zap className="w-4 h-4 text-primary-200" />
          <p className="text-sm font-medium text-white">
            Founding member pricing — limited availability
          </p>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plans & Packages</h1>
          <p className="text-gray-600 mb-3">Choose the ideal plan for your practice</p>
          {/* Social Proof */}
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-sm">
            <Users className="w-4 h-4" />
            Join 2,400+ active members
          </div>
        </div>

        {/* Step Indicator */}
        <CheckoutStepIndicator currentStep={1} />

        {/* Compare Features Toggle */}
        <div className="flex items-center justify-end mb-4 gap-2">
          <span className="text-sm text-gray-600">Compare features</span>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              showComparison ? "bg-primary-600" : "bg-gray-300"
            }`}
            role="switch"
            aria-checked={showComparison}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                showComparison ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {planPackages.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 transition-all hover:shadow-lg cursor-pointer ${
                plan.popular
                  ? "border-primary-500 shadow-lg"
                  : "border-gray-200 hover:border-primary-300"
              }`}
              onClick={() => handleSelectPlan(plan)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {plan.bestValue && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Best Value
                  </span>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-gray-500 text-sm">/{plan.duration}</span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{plan.classes} {plan.classes === 1 ? "class" : "classes"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{formatCurrency(plan.pricePerClass)}/class</span>
                  </div>
                  {plan.savings && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-green-600 font-medium">Save {formatCurrency(plan.savings)}</span>
                    </div>
                  )}
                </div>

                <button
                  className={`w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  Choose Plan
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        {showComparison && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="sticky left-0 bg-white z-10 text-left py-4 px-4 text-sm font-semibold text-gray-900 min-w-[160px]">
                      Feature
                    </th>
                    {planPackages.map((plan) => (
                      <th
                        key={plan.id}
                        className={`text-center py-4 px-3 text-sm font-semibold min-w-[110px] ${
                          plan.popular ? "bg-primary-50 text-primary-700" : "text-gray-900"
                        }`}
                      >
                        <div>{plan.name}</div>
                        {plan.popular && (
                          <span className="inline-block mt-1 text-[10px] font-medium bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                        {plan.bestValue && (
                          <span className="inline-block mt-1 text-[10px] font-medium bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                            Best Value
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, featureIndex) => (
                    <tr
                      key={feature.label}
                      className={featureIndex < comparisonFeatures.length - 1 ? "border-b border-gray-100" : ""}
                    >
                      <td className="sticky left-0 bg-white z-10 py-3 px-4 text-sm font-medium text-gray-700">
                        {feature.label}
                      </td>
                      {feature.values.map((value, planIndex) => (
                        <td
                          key={planIndex}
                          className={`text-center py-3 px-3 text-sm ${
                            planPackages[planIndex].popular ? "bg-primary-50/50" : ""
                          }`}
                        >
                          {feature.type === "boolean" ? (
                            value ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-900">{value as string}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trust Section */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-full text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            7-day money-back guarantee on all plans
          </div>
          <div className="mt-4">
            <TrustBadges variant="horizontal" showPaymentBrands />
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            All plans include
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Online Booking</h3>
              <p className="text-sm text-gray-500">Book your classes 24/7 via app or website</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">SMS Reminders</h3>
              <p className="text-sm text-gray-500">Never miss a class with automatic text reminders</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Class Makeup</h3>
              <p className="text-sm text-gray-500">Cancel 12h ahead and reschedule</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Certified Instructors</h3>
              <p className="text-sm text-gray-500">Qualified and experienced professionals</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Can I cancel my plan?</h3>
              <p className="text-sm text-gray-600">
                Yes, you can cancel at any time. Remaining classes stay valid until the plan expires.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2">How does class makeup work?</h3>
              <p className="text-sm text-gray-600">
                Cancel at least 12 hours in advance and the credit will be refunded automatically.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Can I freeze my plan?</h3>
              <p className="text-sm text-gray-600">
                Quarterly and annual plans allow freezing for up to 30 days. Contact support for assistance.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-2">Can I transfer classes to someone else?</h3>
              <p className="text-sm text-gray-600">
                Classes are non-transferable, but you can bring a friend to your class (subject to availability).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
