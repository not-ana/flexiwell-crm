"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createCheckoutForPlan, redirectToCheckout } from "@/lib/stripe/client";
import type { PlanTier, BillingPeriod } from "@/lib/config/pricing";
import { foundingMemberOffer, foundingMemberBenefits } from "@/lib/config/pricing";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
    if (planId === "enterprise") {
      window.location.href = "/contact?plan=enterprise";
      return;
    }

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
                Join the Waitlist
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero - Pain-based headline (Hormozi: lead with the problem) */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {canceled && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl max-w-md mx-auto">
              <p className="text-yellow-800 text-sm">
                Checkout was canceled. Feel free to try again when you&apos;re ready.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-md mx-auto">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Scarcity badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full mb-8">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-sm font-medium text-red-200">
              Only {spotsRemaining} Founding Member spots left
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
            {foundingMemberOffer.painPoints.headline}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-4">
            {foundingMemberOffer.painPoints.subheadline}
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Recover ${foundingMemberOffer.painPoints.stats[2].value} in lost revenue with smart waitlist,
            SMS reminders, and online scheduling — for less than what you lose to a single no-show.
          </p>
        </div>
      </section>

      {/* Why Switch? (Hormozi: agitate the problem before solution) */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Studios Are Switching</h2>
            <p className="text-gray-600 mt-2">Three problems costing you thousands every month</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl border-2 border-gray-100">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Overpaying for Generic Software</h3>
              <p className="text-gray-600">
                Mindbody charges {foundingMemberOffer.competitorAnchoring.mindbody.range}/mo {foundingMemberOffer.competitorAnchoring.mindbody.note}. You deserve better for less.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl border-2 border-gray-100">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No-Shows Costing {foundingMemberOffer.painPoints.stats[1].value} of Revenue</h3>
              <p className="text-gray-600">
                Every empty spot is money left on the table. Research shows automated reminders cut no-shows by 35%.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl border-2 border-gray-100">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">10+ Hours Wasted on Admin</h3>
              <p className="text-gray-600">
                Manual scheduling, phone calls, and spreadsheets. Time you should be spending teaching.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founding Member Offer (Hormozi: Grand Slam Offer) */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 text-sm font-medium rounded-full mb-4">
              Founding Member Offer
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need. One Simple Price.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              No per-seat fees. No hidden charges. No contracts. Just results.
            </p>
          </div>

          {/* Main pricing card */}
          <div className="max-w-2xl mx-auto">
            <div className="relative bg-white rounded-3xl border-2 border-primary-500 shadow-2xl shadow-primary-100 overflow-hidden">
              {/* Badge */}
              <div className="absolute -top-0 left-0 right-0">
                <div className="bg-primary-600 text-white text-center py-2 text-sm font-medium">
                  Founding Member — Only {spotsRemaining} Spots Left
                </div>
              </div>

              <div className="pt-14 p-8 sm:p-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">FlexiWell Pro</h3>
                <p className="text-gray-600 mb-6">Everything your pilates studio needs to recover revenue and grow.</p>

                {/* Price anchoring */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold text-gray-900">${foundingMemberOffer.foundingPrice}</span>
                    <span className="text-xl text-gray-500">/month</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-lg text-gray-400 line-through">${foundingMemberOffer.regularPrice}/mo regular price</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      SAVE ${foundingMemberOffer.regularPrice - foundingMemberOffer.foundingPrice}/mo
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Price locked for {foundingMemberOffer.lockedMonths} months. Competitors charge {foundingMemberOffer.competitorAnchoring.mindbody.range}.
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSubscribe("growth")}
                  disabled={loadingPlan !== null}
                  className="w-full py-4 px-6 bg-primary-600 text-white text-lg font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {loadingPlan === "growth" ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Claim My Founding Member Spot"
                  )}
                </button>
                <p className="text-center text-sm text-gray-500">
                  30-day free trial. Cancel anytime. No risk.
                </p>

                {/* What's included */}
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4">Everything included:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {foundingMemberBenefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2">
                        <CheckIcon className="w-5 h-5 text-green-500 shrink-0" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Stacking (Hormozi: show total value) */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Here&apos;s What You&apos;re Really Getting</h2>
            <p className="text-gray-600 mt-2">Total value breakdown for Founding Members</p>
          </div>

          <div className="space-y-4">
            {/* Platform */}
            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900">FlexiWell Pro Platform</p>
                <p className="text-sm text-gray-600">Smart waitlist, scheduling, CRM, payments, reminders</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">${foundingMemberOffer.foundingPrice}/mo</p>
                <p className="text-sm text-gray-400 line-through">${foundingMemberOffer.regularPrice}/mo</p>
              </div>
            </div>

            {/* Bonuses */}
            {foundingMemberOffer.bonuses.map((bonus) => (
              <div key={bonus.name} className="flex items-center justify-between p-5 bg-green-50 rounded-xl border border-green-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded">FREE</span>
                    <p className="font-semibold text-gray-900">{bonus.name}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{bonus.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">$0</p>
                  <p className="text-sm text-gray-400 line-through">${bonus.value.toLocaleString()}</p>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between p-5 bg-primary-50 rounded-xl border-2 border-primary-200">
              <div>
                <p className="font-bold text-gray-900 text-lg">Total Value</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary-600 text-lg">${foundingMemberOffer.foundingPrice}/mo</p>
                <p className="text-sm text-gray-500">
                  + ${foundingMemberOffer.totalBonusValue.toLocaleString()} in free bonuses
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee (Hormozi: Risk reversal) */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            {foundingMemberOffer.guarantee.days}-Day No-Show Guarantee
          </h2>
          <p className="text-xl text-gray-300 mb-4">
            {foundingMemberOffer.guarantee.promise}
          </p>
          <p className="text-gray-400 max-w-xl mx-auto">
            {foundingMemberOffer.guarantee.description} We&apos;re so confident FlexiWell will work for your studio that we take all the risk.
          </p>
        </div>
      </section>

      {/* How It Works (3 simple steps) */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-600 mt-2">From sign up to recovering revenue in 3 steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Join the Waitlist</h3>
              <p className="text-gray-600">
                Claim your Founding Member spot. Only {spotsRemaining} remaining at ${foundingMemberOffer.foundingPrice}/mo.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">We Migrate Your Data</h3>
              <p className="text-gray-600">
                Our team moves everything from Mindbody, Glofox, or spreadsheets. No effort on your end.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Start Recovering Revenue</h3>
              <p className="text-gray-600">
                Smart waitlist + automated reminders start filling empty spots from day one.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ (Hormozi: objection handling) */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What if I don't see results in 60 days?",
                a: `We guarantee ${foundingMemberOffer.guarantee.promise}. ${foundingMemberOffer.guarantee.description} There's literally zero risk to trying.`,
              },
              {
                q: `Why is it only $${foundingMemberOffer.foundingPrice}/mo when competitors charge ${foundingMemberOffer.competitorAnchoring.mindbody.range}?`,
                a: `This is our Founding Member price — locked for ${foundingMemberOffer.lockedMonths} months for the first ${foundingMemberOffer.totalSpots} studios. The regular price will be $${foundingMemberOffer.regularPrice}/mo. We're offering this rate because founding members get direct input on our roadmap and help shape the product.`,
              },
              {
                q: "How does migration from Mindbody/Glofox work?",
                a: "Our team handles everything. Export your data (CSV), send it to us, and we'll import all clients, schedules, and payment history. Most studios are fully migrated within 48 hours. This is a $2,000 service included free for Founding Members.",
              },
              {
                q: "Do I need a credit card for the free trial?",
                a: "Yes, but you won't be charged during the 30-day trial. Cancel anytime before the trial ends, and you'll never pay a penny. We require a card to prevent abuse and ensure serious studios get priority.",
              },
              {
                q: "What happens when the founding member spots run out?",
                a: `New members will pay $${foundingMemberOffer.regularPrice}/mo — the regular price. If you join now, your $${foundingMemberOffer.foundingPrice}/mo rate is locked for ${foundingMemberOffer.lockedMonths} months, guaranteed.`,
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. No contracts, no cancellation fees, no strings attached. If FlexiWell isn't working for you, cancel with one click. We keep your data for 30 days in case you change your mind.",
              },
              {
                q: "Is there a limit on clients or instructors?",
                a: "No. Unlimited clients and unlimited instructors on the Founding Member plan. No per-seat fees, ever. You can also manage up to 3 locations.",
              },
            ].map((faq, i) => (
              <details key={i} className="bg-white border border-gray-200 rounded-xl p-6 group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <svg
                    className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform shrink-0 ml-4"
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

      {/* Final CTA (Hormozi: one more push with urgency) */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 rounded-full mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-sm font-medium">
              {spotsRemaining} of {foundingMemberOffer.totalSpots} spots remaining
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Stop Losing ${foundingMemberOffer.painPoints.stats[0].value}/mo.<br />
            Start Recovering It.
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join the first {foundingMemberOffer.totalSpots} Founding Members at ${foundingMemberOffer.foundingPrice}/mo
            (locked {foundingMemberOffer.lockedMonths} months). Includes ${foundingMemberOffer.totalBonusValue.toLocaleString()} in free migration & onboarding.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-xl w-full sm:w-auto"
            >
              Claim My Founding Member Spot
            </Link>
          </div>

          <p className="text-sm text-primary-200">
            {foundingMemberOffer.guarantee.days}-day money-back guarantee. No contracts. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
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
