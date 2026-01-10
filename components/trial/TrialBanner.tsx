"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [dismissed, setDismissed] = useState(false);

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

  // Expired trial - show urgent banner
  if (isExpired) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold">Your free trial has expired</p>
              <p className="text-sm text-white/90">
                Subscribe now to continue using FlexiWell and keep your data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/billing"
              className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Choose a Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Expiring soon (7 days or less) - show warning banner
  if (isExpiringSoon) {
    const bgColor = daysRemaining! <= 3 ? "from-orange-500 to-yellow-500" : "from-yellow-400 to-amber-400";
    const textColor = daysRemaining! <= 3 ? "text-white" : "text-gray-900";

    return (
      <div className={`bg-gradient-to-r ${bgColor} ${textColor} px-4 py-3`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="font-semibold">
                {daysRemaining === 1
                  ? "Your trial ends tomorrow!"
                  : `Your trial ends in ${daysRemaining} days`}
              </p>
              <p className={`text-sm ${daysRemaining! <= 3 ? "text-white/90" : "text-gray-700"}`}>
                Subscribe now to keep all your data and continue using FlexiWell
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDismissed(true)}
              className={`${daysRemaining! <= 3 ? "text-white/70 hover:text-white" : "text-gray-600 hover:text-gray-900"} text-sm`}
            >
              Remind me later
            </button>
            <Link
              href="/admin/billing"
              className={`${daysRemaining! <= 3 ? "bg-white text-orange-600" : "bg-gray-900 text-white"} px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity`}
            >
              Choose a Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active trial with more than 7 days - show subtle info banner
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>✨</span>
          <p className="text-sm">
            <span className="font-semibold">Free Trial</span> - {daysRemaining} days remaining
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDismissed(true)}
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
