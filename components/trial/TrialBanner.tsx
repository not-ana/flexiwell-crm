"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { foundingMemberOffer } from "@/lib/config/pricing";

interface TrialStatus {
  hasTrial: boolean;
  trialStatus?: "active" | "expired" | "converted";
  trialEndDate?: string;
  daysRemaining?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  subscriptionStatus?: string;
}

export function TrialBanner() {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("trial_banner_dismissed") === "true";
    }
    return false;
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("trial_banner_dismissed", "true");
  };

  useEffect(() => {
    async function fetchTrialStatus() {
      try {
        const response = await fetch("/api/trial/status", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setTrialStatus(data);
        }
      } catch (error) {
        console.error("Error fetching trial status:", error);
      }
    }

    fetchTrialStatus();
  }, []);

  // Don't show if no trial, dismissed, or already subscribed
  if (!trialStatus?.hasTrial || dismissed) {
    return null;
  }

  if (trialStatus.subscriptionStatus === "active") {
    return null;
  }

  const { daysRemaining, isExpired, isExpiringSoon } = trialStatus;
  const spotsRemaining = foundingMemberOffer.totalSpots - foundingMemberOffer.spotsClaimed;

  // Expired trial - pain-based urgent banner (Hormozi: agitate the cost of inaction)
  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Your trial has expired — you&apos;re missing out on {foundingMemberOffer.painPoints.stats[2].value}/mo in recovered revenue</p>
              <p className="text-xs text-white/80">
                Lock in Founding Member pricing at ${foundingMemberOffer.foundingPrice}/mo before the {spotsRemaining} remaining spots are gone
              </p>
            </div>
          </div>
          <Link
            href="/admin/billing"
            className="bg-white text-red-600 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors shrink-0"
          >
            Claim My Spot
          </Link>
        </div>
      </div>
    );
  }

  // Expiring soon (7 days or less) - urgency + scarcity (Hormozi: deadline + limited spots)
  if (isExpiringSoon) {
    return (
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">
                {daysRemaining === 1
                  ? "Last day! Your trial ends tomorrow"
                  : `${daysRemaining} days left — lock in $${foundingMemberOffer.foundingPrice}/mo before your trial ends`}
              </p>
              <p className="text-xs text-white/80">
                Only {spotsRemaining} Founding Member spots left. {foundingMemberOffer.guarantee.days}-day money-back guarantee.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white text-sm"
            >
              Later
            </button>
            <Link
              href="/admin/billing"
              className="bg-white text-orange-600 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-orange-50 transition-colors"
            >
              Choose a Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active trial with 7+ days - value reinforcement (Hormozi: remind them what they're getting)
  return (
    <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-sm">
              <span className="font-semibold">Free Trial</span> — {daysRemaining} days left.
              You&apos;re saving ${foundingMemberOffer.totalBonusValue.toLocaleString()}+ in migration & onboarding.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white text-sm"
          >
            Dismiss
          </button>
          <Link
            href="/admin/billing"
            className="text-sm font-medium hover:underline"
          >
            View Plans →
          </Link>
        </div>
      </div>
    </div>
  );
}
