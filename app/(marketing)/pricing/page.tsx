"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createCheckoutForPlan, redirectToCheckout } from "@/lib/stripe/client";
import type { PlanTier, BillingPeriod } from "@/lib/config/pricing";

// FlexiWell CRM Premium Pricing
// Target: Studios with 50+ active clients, established businesses, tech-savvy owners
// Free Trial: 30 days (no credit card required)
// Bundle: FlexiLaunch + FlexiWell for early adopters

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number; // per month when billed annually
  yearlyTotal: number;
  highlighted?: boolean;
  badge?: string;
  customPricing?: boolean; // For enterprise - contact sales instead of showing price
  features: {
    category: string;
    items: { name: string; included: boolean; note?: string }[];
  }[];
  limits: {
    activeClients: number | "unlimited";
    staff: number | "unlimited";
    locations: number;
    storageGB: number;
  };
  support: string;
  cta: string;
}

interface AddOn {
  name: string;
  description: string;
  price: number;
  oneTime?: boolean;
  badge?: string;
}

const plans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for solo instructors and small studios starting their digital journey.",
    monthlyPrice: 99,
    yearlyPrice: 79,
    yearlyTotal: 948,
    features: [
      {
        category: "Client Management",
        items: [
          { name: "Complete CRM with history", included: true },
          { name: "Up to 100 active clients", included: true },
          { name: "Online scheduling", included: true },
          { name: "Automatic reminders (email)", included: true },
          { name: "Basic client portal", included: true },
        ],
      },
      {
        category: "Class Management",
        items: [
          { name: "Class calendar", included: true },
          { name: "Attendance tracking", included: true },
          { name: "Basic waitlist", included: true },
          { name: "Makeup classes", included: true },
          { name: "Single modality", included: true },
        ],
      },
      {
        category: "Financial",
        items: [
          { name: "Payment tracking", included: true },
          { name: "Invoice generation", included: true },
          { name: "Basic reports", included: true },
          { name: "Pix integration", included: false },
          { name: "Automatic recurring billing", included: false },
        ],
      },
      {
        category: "Automation & AI",
        items: [
          { name: "Automatic emails", included: true },
          { name: "AI Support Basic (500 chats/mo)", included: false },
          { name: "WhatsApp Bot", included: false },
          { name: "Instagram Bot", included: false },
        ],
      },
    ],
    limits: {
      activeClients: 100,
      staff: 1,
      locations: 1,
      storageGB: 5,
    },
    support: "Email (48h)",
    cta: "Start free trial",
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing studios ready to scale with smart automation and AI.",
    monthlyPrice: 179,
    yearlyPrice: 143,
    yearlyTotal: 1716,
    highlighted: true,
    badge: "Most Popular",
    features: [
      {
        category: "Client Management",
        items: [
          { name: "Complete CRM with history", included: true },
          { name: "Up to 150 active clients", included: true },
          { name: "Online scheduling", included: true },
          { name: "Automatic reminders (email)", included: true },
          { name: "Client portal", included: true },
        ],
      },
      {
        category: "Class Management",
        items: [
          { name: "Class calendar", included: true },
          { name: "Attendance tracking", included: true },
          { name: "Basic waitlist", included: true },
          { name: "Makeup classes", included: true },
          { name: "Multiple modalities", included: true },
        ],
      },
      {
        category: "Financial",
        items: [
          { name: "Payment tracking", included: true },
          { name: "Invoice generation", included: true },
          { name: "Basic reports", included: true },
          { name: "Pix integration", included: false },
          { name: "Automatic recurring billing", included: false },
        ],
      },
      {
        category: "Automation",
        items: [
          { name: "Automatic emails", included: true },
          { name: "WhatsApp Bot", included: false },
          { name: "Instagram Bot", included: false },
          { name: "Custom workflows", included: false },
        ],
      },
    ],
    limits: {
      activeClients: 500,
      staff: "unlimited",
      locations: 2,
      storageGB: 25,
    },
    support: "Email (48h)",
    cta: "Get started",
  },
  {
    id: "business",
    name: "Business",
    description: "For established studios looking to scale with intelligent automation.",
    monthlyPrice: 299,
    yearlyPrice: 239,
    yearlyTotal: 2868,
    highlighted: true,
    badge: "Most Popular",
    features: [
      {
        category: "Client Management",
        items: [
          { name: "Complete CRM with history", included: true },
          { name: "Up to 500 active clients", included: true },
          { name: "Online scheduling", included: true },
          { name: "Automatic reminders (email + SMS)", included: true },
          { name: "Advanced client portal", included: true },
        ],
      },
      {
        category: "Class Management",
        items: [
          { name: "Class calendar", included: true },
          { name: "Attendance tracking", included: true },
          { name: "AI-powered smart waitlist", included: true },
          { name: "Automatic makeup classes", included: true },
          { name: "Multiple modalities", included: true },
        ],
      },
      {
        category: "Financial",
        items: [
          { name: "Payment tracking", included: true },
          { name: "Invoice and receipt generation", included: true },
          { name: "Advanced reports", included: true },
          { name: "Pix QR Code integration", included: true },
          { name: "Automatic recurring billing", included: true },
        ],
      },
      {
        category: "Automation & AI",
        items: [
          { name: "Automatic emails", included: true },
          { name: "AI Support Basic (500 chats/mo)", included: true },
          { name: "WhatsApp Bot (1,000 msgs/month)", included: true },
          { name: "Instagram Bot", included: false },
          { name: "Custom workflows (5)", included: true },
        ],
      },
    ],
    limits: {
      activeClients: 2000,
      staff: "unlimited",
      locations: 5,
      storageGB: 100,
    },
    support: "Chat + Email (24h)",
    cta: "Start free trial",
  },
  {
    id: "professional",
    name: "Professional",
    description: "For established studios with multiple locations and advanced needs.",
    monthlyPrice: 499,
    yearlyPrice: 399,
    yearlyTotal: 4788,
    features: [
      {
        category: "Client Management",
        items: [
          { name: "Complete CRM with history", included: true },
          { name: "Up to 2,000 active clients", included: true },
          { name: "Online scheduling", included: true },
          { name: "Automatic reminders (email + SMS + WhatsApp)", included: true },
          { name: "Advanced client portal with app", included: true },
        ],
      },
      {
        category: "Class Management",
        items: [
          { name: "Class calendar", included: true },
          { name: "Attendance tracking + analytics", included: true },
          { name: "AI-powered smart waitlist", included: true },
          { name: "Automatic makeup classes", included: true },
          { name: "Multiple modalities + rooms", included: true },
        ],
      },
      {
        category: "Financial",
        items: [
          { name: "Payment tracking", included: true },
          { name: "Automatic invoice + receipt generation", included: true },
          { name: "Advanced analytics + BI", included: true },
          { name: "Custom payment gateway", included: true },
          { name: "Recurring billing + split payments", included: true },
        ],
      },
      {
        category: "Automation & AI",
        items: [
          { name: "Automatic emails", included: true },
          { name: "AI Support Pro (2,000 chats/mo)", included: true },
          { name: "WhatsApp Bot (5,000 msgs/month)", included: true },
          { name: "Instagram Bot", included: true },
          { name: "Custom workflows (unlimited)", included: true },
        ],
      },
    ],
    limits: {
      activeClients: "unlimited",
      staff: "unlimited",
      locations: "unlimited",
      storageGB: 500,
    },
    support: "Priority (12h) + Phone",
    cta: "Start free trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For studio networks and franchises requiring unlimited scale and customization.",
    monthlyPrice: 0, // Custom pricing - contact sales
    yearlyPrice: 0,
    yearlyTotal: 0,
    badge: "White Label Included",
    customPricing: true,
    features: [
      {
        category: "Client Management",
        items: [
          { name: "Complete CRM with history", included: true },
          { name: "Unlimited clients", included: true },
          { name: "Online scheduling", included: true },
          { name: "Automatic reminders (email + SMS + WhatsApp)", included: true },
          { name: "White-label mobile app", included: true },
        ],
      },
      {
        category: "Class Management",
        items: [
          { name: "Class calendar", included: true },
          { name: "Attendance tracking + biometrics", included: true },
          { name: "AI-powered smart waitlist", included: true },
          { name: "Automatic makeup classes", included: true },
          { name: "Multiple modalities + rooms", included: true },
        ],
      },
      {
        category: "Financial",
        items: [
          { name: "Payment tracking", included: true },
          { name: "Automatic invoice + receipt generation", included: true },
          { name: "Complete BI + dashboards", included: true },
          { name: "Custom payment gateway", included: true },
          { name: "Recurring billing + split payments", included: true },
        ],
      },
      {
        category: "Automation & AI",
        items: [
          { name: "Automatic emails", included: true },
          { name: "AI Support Enterprise (unlimited)", included: true },
          { name: "WhatsApp Bot (unlimited)", included: true },
          { name: "Instagram Bot + Facebook Bot", included: true },
          { name: "Custom workflows (unlimited)", included: true },
        ],
      },
    ],
    limits: {
      activeClients: "unlimited",
      staff: "unlimited",
      locations: 10,
      storageGB: 500,
    },
    support: "Dedicated + Onboarding",
    cta: "Contact sales",
  },
];

const addOns: AddOn[] = [
  {
    name: "AI Support Upgrade",
    description: "+1,500 conversations/month",
    price: 29,
  },
  {
    name: "WhatsApp Bot Extra",
    description: "+2,000 messages/month",
    price: 19,
  },
  {
    name: "Additional Location",
    description: "For each extra location",
    price: 49,
  },
  {
    name: "White Label",
    description: "Custom branding + domain",
    price: 79,
  },
  {
    name: "Premium Onboarding",
    description: "Complete setup + training",
    price: 199,
    oneTime: true,
  },
  {
    name: "Custom Integration",
    description: "Custom API development",
    price: 99,
  },
  {
    name: "FlexiLaunch Bundle",
    description: "Website + CRM package",
    price: 499,
    oneTime: true,
    badge: "Early Adopter",
  },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PricingContent() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const canceled = searchParams.get("canceled") === "true";

  const handleSubscribe = async (planId: string) => {
    // Enterprise plan goes to contact sales
    if (planId === "enterprise") {
      window.location.href = "/contact?plan=enterprise";
      return;
    }

    setLoadingPlan(planId);
    setError(null);

    try {
      const billingPeriod: BillingPeriod = billingCycle === "yearly" ? "annual" : "monthly";
      const response = await createCheckoutForPlan({
        planTier: planId as PlanTier,
        billingPeriod,
      });

      if (response.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.url;
      } else if (response.sessionId) {
        // Fallback to client-side redirect
        await redirectToCheckout(response.sessionId);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/flexiwell-logo.svg" alt="FlexiWell" width={120} height={28} />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Log in
              </Link>
              <Link
                href="/demo"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                Book a Demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {canceled && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl max-w-md mx-auto">
              <p className="text-yellow-800 text-sm">
                Checkout was canceled. Feel free to try again when you're ready.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-md mx-auto">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 text-sm font-medium rounded-full mb-6">
            30-day free trial • Cancel anytime
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Invest in technology that<br />
            <span className="text-primary-600">delivers results</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Plans designed for tech-savvy studios that want to grow with AI automation,
            intelligent waitlist management, and powerful integrations. Start your 30-day trial today.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-gray-100 rounded-full">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
                billingCycle === "yearly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 ${
                  plan.highlighted
                    ? "border-primary-500 shadow-xl shadow-primary-100"
                    : "border-gray-200"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span
                      className={`px-4 py-1.5 text-sm font-medium rounded-full ${
                        plan.highlighted
                          ? "bg-primary-600 text-white"
                          : "bg-gray-900 text-white"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mt-2 min-h-[40px]">{plan.description}</p>

                  <div className="mt-6">
                    {plan.customPricing ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-gray-900">Custom</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Tailored pricing for your needs
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-gray-900">
                            ${billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                          </span>
                          <span className="text-gray-500">/month</span>
                        </div>
                        {billingCycle === "yearly" && (
                          <p className="text-sm text-gray-500 mt-1">
                            ${plan.yearlyTotal.toLocaleString()}/year (save ${((plan.monthlyPrice - plan.yearlyPrice) * 12).toLocaleString()})
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingPlan !== null}
                    className={`w-full mt-6 px-6 py-3 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.highlighted
                        ? "bg-primary-600 text-white hover:bg-primary-700"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      plan.cta
                    )}
                  </button>

                  {/* Limits */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Clients</p>
                        <p className="font-medium text-gray-900">
                          {plan.limits.activeClients === "unlimited" ? "Unlimited" : `Up to ${plan.limits.activeClients}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Staff</p>
                        <p className="font-medium text-gray-900">
                          {plan.limits.staff === "unlimited" ? "Unlimited" : `Up to ${plan.limits.staff}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Locations</p>
                        <p className="font-medium text-gray-900">{plan.limits.locations}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Storage</p>
                        <p className="font-medium text-gray-900">{plan.limits.storageGB} GB</p>
                      </div>
                    </div>
                  </div>

                  {/* Support */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm">
                      <span className="text-gray-500">Support:</span>{" "}
                      <span className="font-medium text-gray-900">{plan.support}</span>
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div className="px-6 sm:px-8 pb-8">
                  {plan.features.map((category) => (
                    <div key={category.category} className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">{category.category}</h4>
                      <ul className="space-y-2">
                        {category.items.map((item) => (
                          <li key={item.name} className="flex items-start gap-2">
                            {item.included ? (
                              <CheckIcon className="w-5 h-5 text-green-500 shrink-0" />
                            ) : (
                              <XIcon className="w-5 h-5 text-gray-300 shrink-0" />
                            )}
                            <span className={`text-sm ${item.included ? "text-gray-700" : "text-gray-400"}`}>
                              {item.name}
                              {item.note && <span className="text-gray-400 ml-1">({item.note})</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Add-ons</h2>
            <p className="text-gray-600 mt-2">Extra features to boost your studio</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon) => (
              <div key={addon.name} className={`bg-gray-50 rounded-xl p-6 border-2 ${addon.badge ? 'border-primary-500 relative' : 'border-gray-200'}`}>
                {addon.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                      {addon.badge}
                    </span>
                  </div>
                )}
                <h3 className="font-semibold text-gray-900">{addon.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                <p className="mt-4">
                  <span className="text-2xl font-bold text-gray-900">${addon.price}</span>
                  <span className="text-gray-500">/{addon.oneTime ? "one-time" : "month"}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Why serious studios choose FlexiWell</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Guided Setup</h3>
              <p className="text-gray-400">
                Personalized onboarding to ensure you get the most out of the platform from day 1.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Hidden Fees</h3>
              <p className="text-gray-400">
                Fixed and predictable pricing. No transaction fees, no invoice surprises.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Free Migration</h3>
              <p className="text-gray-400">
                Our team migrates all your data from your current system at no extra cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What makes FlexiWell different from competitors?",
                a: "FlexiWell combines modern technology (Next.js, React, AI) with studio-specific features. We offer native AI support, intelligent waitlist management, and WhatsApp automation - features that competitors charge extra for. Plus, our API-first architecture allows unlimited customization for tech-savvy studios.",
              },
              {
                q: "What is the FlexiLaunch bundle?",
                a: "FlexiLaunch is our web design agency that creates professional websites for wellness studios. The Early Adopter Bundle ($499 one-time) includes a custom website + 3 months of FlexiWell CRM free. Perfect for studios starting their digital transformation.",
              },
              {
                q: "How does the 30-day free trial work?",
                a: "Add your payment method and start using FlexiWell immediately with full access to all features in your chosen plan. You won't be charged during the 30-day trial. Cancel anytime before the trial ends to avoid charges.",
              },
              {
                q: "What if I need more clients or locations?",
                a: "You can upgrade at any time. We add extra locations for $39/month each. If you need custom limits, contact us for a tailored Enterprise plan.",
              },
              {
                q: "Do you offer a discount for annual payment?",
                a: "Yes! Annual payment offers a 20% discount on the monthly price. In addition to the savings, you lock in the price for 12 months.",
              },
              {
                q: "How does support work?",
                a: "Professional has email support (48h response). Business includes live chat (24h response). Enterprise has a dedicated account manager and complete onboarding.",
              },
            ].map((faq, i) => (
              <details key={i} className="bg-white border border-gray-200 rounded-xl p-6 group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <svg
                    className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="text-gray-600 mt-4">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to professionalize your studio?
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            Schedule a free demo and discover how FlexiWell can transform your operation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/demo"
              className="px-8 py-3 bg-white text-primary-600 font-medium rounded-xl hover:bg-primary-50 transition-colors"
            >
              Schedule a Demo
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 border-2 border-white text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Image src="/flexiwell-logo.svg" alt="FlexiWell" width={100} height={24} className="brightness-200" />
            <p className="text-sm">© 2024 FlexiWell. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
