"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Plan {
  name: string;
  price: number;
  period: string;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    price: 79,
    period: "month",
    features: [
      "Up to 50 clients",
      "Basic scheduling",
      "Email notifications",
      "1 staff member",
    ],
  },
  {
    name: "Professional",
    price: 179,
    period: "month",
    popular: true,
    features: [
      "Up to 200 clients",
      "Advanced scheduling",
      "WhatsApp integration",
      "5 staff members",
      "Reports & analytics",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: 349,
    period: "month",
    features: [
      "Unlimited clients",
      "All integrations",
      "Unlimited staff",
      "Custom branding",
      "API access",
      "Dedicated support",
    ],
  },
];

export default function TrialExpiredPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trialStatus, setTrialStatus] = useState<{
    hasTrial: boolean;
    isExpired: boolean;
    subscriptionStatus: string;
  } | null>(null);

  useEffect(() => {
    async function checkTrialStatus() {
      try {
        const response = await fetch("/api/trial/status", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setTrialStatus(data);

          // If not expired or already subscribed, redirect to dashboard
          if (!data.isExpired || data.subscriptionStatus === "active") {
            router.push("/admin");
          }
        }
      } catch (error) {
        console.error("Error checking trial:", error);
      } finally {
        setLoading(false);
      }
    }

    checkTrialStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">FlexiWell</span>
          </div>
          <Link
            href="/login"
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            Sign out
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Trial ended message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Your Free Trial Has Ended
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Thank you for trying FlexiWell! To continue managing your studio and
            keep all your data, please choose a plan below.
          </p>
        </div>

        {/* Special offer */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 mb-12 text-center">
          <p className="text-sm font-medium text-green-100 mb-2">LIMITED TIME OFFER</p>
          <h2 className="text-2xl font-bold mb-2">Get 20% off your first 3 months!</h2>
          <p className="text-green-100">
            Use code <span className="bg-white/20 px-2 py-1 rounded font-mono font-bold">COMEBACK20</span> at checkout
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl shadow-lg p-6 relative ${
                plan.popular ? "ring-2 ring-indigo-600" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 shrink-0"
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
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={`/admin/billing?plan=${plan.name.toLowerCase()}`}
                className={`block w-full py-3 rounded-lg font-semibold text-center transition-colors ${
                  plan.popular
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Data safe notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="font-semibold">Your Data is Safe</span>
          </div>
          <p className="text-blue-600 text-sm">
            We keep your data for 30 days after your trial ends. Subscribe anytime to pick up
            right where you left off with all your clients, schedules, and settings intact.
          </p>
        </div>

        {/* Contact support */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Have questions?{" "}
          <a href="mailto:support@flexiwell.net" className="text-indigo-600 hover:underline">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}
