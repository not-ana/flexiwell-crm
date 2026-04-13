"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createCheckoutForPlan, redirectToCheckout } from "@/lib/stripe/client";
import type { PlanTier, BillingPeriod } from "@/lib/config/pricing";
import { foundingMemberOffer } from "@/lib/config/pricing";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function PricingContent() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const canceled = searchParams.get("canceled") === "true";
  const spotsRemaining = foundingMemberOffer.totalSpots - foundingMemberOffer.spotsClaimed;

  const handleSubscribe = async (planId: string) => {
    setLoadingPlan(planId);
    setError(null);

    try {
      const billingPeriod: BillingPeriod = "monthly";
      const response = await createCheckoutForPlan({
        planTier: planId as PlanTier,
        billingPeriod,
      });

      if (response.url) {
        window.location.href = response.url;
      } else if (response.sessionId) {
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
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                Lock In My Price
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Social proof bar */}
      <div className="bg-white border-b border-gray-100 py-3">
        <p className="text-center text-sm text-gray-600">
          <span className="font-semibold text-gray-900">&ldquo;No-shows dropped from 34% to 11% in 6 weeks&rdquo;</span>
          {" "}&mdash; MovePilates Studio, Austin TX
        </p>
      </div>

      {canceled && (
        <div className="max-w-md mx-auto mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-yellow-800 text-sm text-center">
            Checkout was canceled. Feel free to try again when you&apos;re ready.
          </p>
        </div>
      )}

      {error && (
        <div className="max-w-md mx-auto mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-800 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Hero + Pricing Card — ONE focused section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Headline */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {foundingMemberOffer.painPoints.headline}
            </h1>
            <p className="text-xl text-gray-600">
              {foundingMemberOffer.painPoints.subheadline}
            </p>
          </div>

          {/* Guarantee — leads the card (Hormozi: de-risk before price) */}
          <div className="flex items-center gap-2.5 justify-center mb-8 px-5 py-3 bg-green-50 border border-green-200 rounded-xl mx-auto w-fit">
            <ShieldIcon className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-800">
              {foundingMemberOffer.guarantee.promise}
            </p>
          </div>

          {/* THE CARD */}
          <div className="relative bg-white rounded-3xl border-2 border-primary-500 shadow-2xl shadow-primary-100 overflow-hidden">
            {/* Badge */}
            <div className="bg-primary-600 text-white text-center py-2.5 text-sm font-medium">
              Founding Member Pricing
            </div>

            <div className="p-8 sm:p-10">
              {/* Price */}
              <div className="mb-2">
                <span className="text-gray-400 line-through text-lg">${foundingMemberOffer.regularPrice}/mo</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-lg text-gray-400">$</span>
                <span className="text-6xl font-bold text-gray-900">{foundingMemberOffer.foundingPrice}</span>
                <span className="text-xl text-gray-500">/mo</span>
              </div>
              <p className="text-sm text-gray-500 mb-8">
                Locked for {foundingMemberOffer.lockedMonths} months. Even when we raise prices.
              </p>

              {/* CTA */}
              <button
                onClick={() => handleSubscribe("retention_pro")}
                disabled={loadingPlan !== null}
                className="w-full py-4 px-6 bg-primary-600 text-white text-lg font-bold rounded-xl hover:bg-primary-700 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-2"
              >
                {loadingPlan === "retention_pro" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <>Lock In My ${foundingMemberOffer.foundingPrice}/mo Price &rarr;</>
                )}
              </button>
              <p className="text-center text-sm text-gray-500 mb-6">
                No credit card required. No commitment until launch.
              </p>

              {/* Scarcity — visual, once */}
              <div className="mb-8">
                <div className="flex items-center gap-1.5 mb-1.5">
                  {Array.from({ length: foundingMemberOffer.totalSpots }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 flex-1 rounded-full ${
                        i < foundingMemberOffer.spotsClaimed
                          ? "bg-primary-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {foundingMemberOffer.spotsClaimed}/{foundingMemberOffer.totalSpots} spots claimed
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-8">
                {/* Features — outcome-focused, concise */}
                <div className="space-y-3">
                  {[
                    "Unlimited clients & instructors — no per-head fees",
                    "Smart waitlist — recovers ~3 lost clients/month",
                    "Automated SMS reminders — cuts no-shows by 35%",
                    "Online scheduling + payments (Stripe)",
                    "White-glove migration from your current CRM ($2,000 value)",
                    "Direct access to the founder",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <CheckIcon className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Value anchor — one line, below card */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Mindbody charges {foundingMemberOffer.competitorAnchoring.mindbody.range}/mo for less. You pay ${foundingMemberOffer.foundingPrice}.
          </p>

        </div>
      </section>

      {/* FAQ — handles remaining objections */}
      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Common Questions</h2>

          <div className="space-y-3">
            {[
              {
                q: "What if I don't see results?",
                a: `${foundingMemberOffer.guarantee.promise}. ${foundingMemberOffer.guarantee.description}`,
              },
              {
                q: "How does migration work?",
                a: "Export your data (CSV), send it to us, and we import everything — clients, schedules, payment history. Most studios are migrated within 48 hours.",
              },
              {
                q: "Why so cheap compared to full price?",
                a: `Founding Member pricing — locked for ${foundingMemberOffer.lockedMonths} months for the first ${foundingMemberOffer.totalSpots} studios. After that, Early Adopter is $${foundingMemberOffer.earlyAdopterPrice}/mo, then full price $${foundingMemberOffer.regularPrice}/mo.`,
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. No contracts, no cancellation fees. Cancel with one click.",
              },
              {
                q: "Any limits on clients or instructors?",
                a: "None. Unlimited clients and unlimited instructors.",
              },
            ].map((faq, i) => (
              <details key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-5 group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-medium text-gray-900 text-sm">{faq.q}</span>
                  <svg
                    className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform shrink-0 ml-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="text-gray-600 text-sm mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — compact */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            ${foundingMemberOffer.foundingPrice}/mo. {spotsRemaining} spots left.
          </h2>
          <p className="text-gray-400 mb-8">
            {foundingMemberOffer.guarantee.days}-day guarantee. Price locked {foundingMemberOffer.lockedMonths} months. Cancel anytime.
          </p>
          <button
            onClick={() => handleSubscribe("retention_pro")}
            disabled={loadingPlan !== null}
            className="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all w-full sm:w-auto disabled:opacity-50"
          >
            {loadingPlan === "retention_pro" ? "Processing..." : (
              <>Lock In My ${foundingMemberOffer.foundingPrice}/mo Price &rarr;</>
            )}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Image src="/flexiwell-logo.svg" alt="FlexiWell" width={100} height={24} className="brightness-200" />
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <a href="mailto:support@flexiwell.net" className="hover:text-white transition-colors">support@flexiwell.net</a>
            </div>
            <p className="text-sm">&copy; 2026 FlexiWell. All rights reserved.</p>
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
