"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  flexiLaunchPackages,
  earlyAdopterOffer,
  integrationBenefits,
  comparisonTable,
  growthBundleROI,
  testimonials,
} from "@/lib/config/flexilaunch-integration";

export default function BundlePage() {
  const spotsRemaining = earlyAdopterOffer.limited - earlyAdopterOffer.claimed;

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
              <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                CRM Pricing
              </Link>
              <Link
                href="#contact"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero with Urgency */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-medium">
                Early Adopter Special • Only {spotsRemaining} spots remaining
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              Website + CRM Bundle
              <br />
              <span className="text-primary-200">Built for Wellness Studios</span>
            </h1>

            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Launch your professional website and powerful CRM together. Save ${earlyAdopterOffer.savings.toLocaleString()}, get 6 months free CRM, and join the first {earlyAdopterOffer.limited} studios with lifetime benefits.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="#packages"
                className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-xl w-full sm:w-auto"
              >
                See Packages
              </Link>
              <Link
                href="#calculator"
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors w-full sm:w-auto"
              >
                Calculate Savings
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="text-4xl font-bold mb-2">${earlyAdopterOffer.savings.toLocaleString()}</div>
                <div className="text-primary-100">Total Savings</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="text-4xl font-bold mb-2">4-6</div>
                <div className="text-primary-100">Weeks to Launch</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="text-4xl font-bold mb-2">100%</div>
                <div className="text-primary-100">Integrated</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Bundle Website + CRM?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Most studios waste time and money managing separate vendors. Our integrated solution just works.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {integrationBenefits.map((benefit) => (
              <div key={benefit.title} className="bg-gray-50 rounded-xl p-6">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-primary-600 mb-2">{benefit.value}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Package
            </h2>
            <p className="text-xl text-gray-600">
              All packages include professional website + FlexiWell CRM integration
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {flexiLaunchPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-2xl border-2 ${
                  pkg.highlighted ? "border-primary-500 shadow-2xl" : "border-gray-200"
                }`}
              >
                {pkg.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-full">
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900">{pkg.name}</h3>
                  <p className="text-gray-600 mt-2 min-h-[48px]">{pkg.description}</p>

                  <div className="mt-6">
                    {pkg.discountedPrice ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl text-gray-400 line-through">
                            ${pkg.price.toLocaleString()}
                          </span>
                          <span className="text-4xl font-bold text-gray-900">
                            ${pkg.discountedPrice.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-green-600 font-medium mt-1">
                          Save ${(pkg.price - pkg.discountedPrice).toLocaleString()} (
                          {Math.round(((pkg.price - pkg.discountedPrice) / pkg.price) * 100)}% off)
                        </p>
                      </>
                    ) : (
                      <div className="text-4xl font-bold text-gray-900">
                        ${pkg.price.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <button
                    className={`w-full mt-6 px-6 py-3 text-sm font-medium rounded-xl transition-colors ${
                      pkg.highlighted
                        ? "bg-primary-600 text-white hover:bg-primary-700"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    Get Started
                  </button>

                  {/* Website Features */}
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3">Website Includes:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>✓ {pkg.included.website.pages} custom pages</li>
                      <li>✓ {pkg.included.website.customDomain ? "Custom domain" : "Subdomain"}</li>
                      <li>✓ {pkg.included.website.seoOptimization ? "SEO optimization" : "Basic SEO"}</li>
                      {pkg.included.website.photography && <li>✓ Professional photoshoot</li>}
                      {pkg.included.website.branding && <li>✓ Logo + brand identity</li>}
                      {pkg.included.website.contentCreation && <li>✓ Professional copywriting</li>}
                    </ul>
                  </div>

                  {/* CRM Features */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3">CRM Includes:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>✓ FlexiWell {pkg.included.crm.planTier.charAt(0).toUpperCase() + pkg.included.crm.planTier.slice(1)} plan</li>
                      <li>✓ {pkg.included.crm.freeMonths} months FREE (value: ${pkg.included.crm.freeMonths * 99})</li>
                      {pkg.included.crm.setup && <li>✓ White-glove setup</li>}
                      {pkg.included.crm.training && <li>✓ Staff training</li>}
                      {pkg.included.crm.dataImport && <li>✓ Competitor data migration</li>}
                    </ul>
                  </div>

                  {/* Timeline */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-3">Timeline:</h4>
                    <p className="text-sm text-gray-600">
                      {pkg.timeline.total} days total • {pkg.revisions} rounds of revisions
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How We Compare
            </h2>
            <p className="text-xl text-gray-600">
              See why smart studios choose the FlexiLaunch + FlexiWell bundle
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-4 px-6 text-left font-semibold text-gray-900">Option</th>
                  <th className="py-4 px-6 text-center font-semibold text-gray-900">Year 1 Cost</th>
                  <th className="py-4 px-6 text-center font-semibold text-gray-900">Time Invested</th>
                  <th className="py-4 px-6 text-left font-semibold text-gray-900">Notes</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTable.options.map((option, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${idx === 2 ? "bg-primary-50" : ""}`}>
                    <td className="py-4 px-6 font-medium">{option.name}</td>
                    <td className="py-4 px-6 text-center font-bold text-lg">
                      ${option.total.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-center">{option.timeInvested}</td>
                    <td className="py-4 px-6">
                      <ul className="space-y-1 text-sm text-gray-600">
                        {(option.issues || option.benefits)?.map((item, i) => (
                          <li key={i} className={option.issues ? "text-red-600" : "text-green-600"}>
                            {option.issues ? "✗" : "✓"} {item}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section id="calculator" className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Your Investment ROI</h2>
          <p className="text-xl text-gray-300 mb-12">
            Growth Accelerator Bundle Breakdown
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-3xl font-bold text-primary-400 mb-2">
                ${growthBundleROI.directSavings.toLocaleString()}
              </div>
              <div className="text-gray-300">CRM Savings (6 months free)</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-3xl font-bold text-primary-400 mb-2">
                ${growthBundleROI.timeSavings.toLocaleString()}
              </div>
              <div className="text-gray-300">Time Savings Value (50 hours)</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {growthBundleROI.roi}%
              </div>
              <div className="text-gray-300">Return on Investment</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {growthBundleROI.paybackPeriod} mo
              </div>
              <div className="text-gray-300">Payback Period</div>
            </div>
          </div>

          <p className="text-lg text-gray-300 mb-8">
            Total value: ${growthBundleROI.totalValue.toLocaleString()} • Investment: $3,999 • Net benefit: ${(growthBundleROI.totalValue - 3999).toLocaleString()}
          </p>

          <Link
            href="#contact"
            className="inline-block px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Claim Your Spot
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              See how studios like yours are thriving with our bundle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.studioName} className="bg-gray-50 rounded-xl p-8">
                <div className="mb-4">
                  <div className="text-lg font-bold text-gray-900">{testimonial.studioName}</div>
                  <div className="text-sm text-gray-600">
                    {testimonial.location} • {testimonial.packageUsed}
                  </div>
                </div>

                <p className="text-gray-700 italic mb-6">&ldquo;{testimonial.quote}&rdquo;</p>

                <div className="space-y-2">
                  {testimonial.results.map((result) => (
                    <div key={result.metric} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{result.metric}</span>
                      <span className="font-bold text-primary-600">{result.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-900">- {testimonial.owner}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20 bg-gradient-to-r from-primary-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-medium">
              Only {spotsRemaining} early adopter spots left
            </span>
          </div>

          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Studio?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join the first 50 studios and lock in your lifetime benefits today.
          </p>

          <form className="max-w-md mx-auto space-y-4">
            <input
              type="text"
              placeholder="Studio Name"
              className="w-full px-4 py-3 rounded-lg text-gray-900"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-lg text-gray-900"
            />
            <input
              type="tel"
              placeholder="Phone"
              className="w-full px-4 py-3 rounded-lg text-gray-900"
            />
            <button
              type="submit"
              className="w-full px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-xl"
            >
              Claim My Early Adopter Spot
            </button>
          </form>

          <p className="text-sm text-primary-200 mt-6">
            30-day money-back guarantee • No long-term contracts
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              <Image src="/flexiwell-logo.svg" alt="FlexiWell" width={100} height={24} className="brightness-200" />
              <span className="text-gray-500">+</span>
              <div className="text-xl font-bold text-white">FlexiLaunch</div>
            </div>
            <p className="text-sm">© 2025 FlexiWell + FlexiLaunch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
