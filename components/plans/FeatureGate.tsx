"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePlan } from "@/lib/plans/usePlan";
import { PlanFeatures, featureDisplayNames, plans } from "@/lib/plans";

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  children: ReactNode;
  /**
   * What to show when feature is not available
   * - "hide": Don't render anything
   * - "blur": Show blurred content with upgrade prompt
   * - "upgrade": Show upgrade prompt
   * - custom: Render custom fallback
   */
  fallback?: "hide" | "blur" | "upgrade" | ReactNode;
}

export function FeatureGate({ feature, children, fallback = "upgrade" }: FeatureGateProps) {
  const { can, planId } = usePlan();

  if (can(feature)) {
    return <>{children}</>;
  }

  // Feature not available
  if (fallback === "hide") {
    return null;
  }

  if (fallback === "blur") {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
          <UpgradePrompt feature={feature} currentPlan={planId} />
        </div>
      </div>
    );
  }

  if (fallback === "upgrade") {
    return <UpgradePrompt feature={feature} currentPlan={planId} />;
  }

  // Custom fallback
  return <>{fallback}</>;
}

interface UpgradePromptProps {
  feature: keyof PlanFeatures;
  currentPlan: string;
  compact?: boolean;
}

export function UpgradePrompt({ feature, currentPlan, compact = false }: UpgradePromptProps) {
  const featureName = featureDisplayNames[feature];

  // Find the cheapest plan that has this feature
  const availableIn = (Object.keys(plans) as (keyof typeof plans)[]).find(
    (planKey) => plans[planKey].features[feature]
  );

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full">
        <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        <span className="text-sm text-purple-700">Upgrade to unlock</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{featureName}</h3>
      <p className="text-sm text-gray-600 mb-4 max-w-xs">
        This feature is available on the{" "}
        <span className="font-medium text-purple-600">
          {availableIn ? plans[availableIn].name : "Professional"}
        </span>{" "}
        plan and above.
      </p>
      <Link
        href="/admin/settings?tab=billing"
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
      >
        Upgrade Now
      </Link>
    </div>
  );
}

/**
 * Simple badge to show when a feature requires upgrade
 */
export function UpgradeBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-medium rounded-full ${className}`}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      Pro
    </span>
  );
}

/**
 * Wrapper for menu items that may require upgrade
 */
interface FeatureMenuItemProps {
  feature: keyof PlanFeatures;
  children: ReactNode;
  href: string;
}

export function FeatureMenuItem({ feature, children, href }: FeatureMenuItemProps) {
  const { can } = usePlan();

  if (can(feature)) {
    return <Link href={href}>{children}</Link>;
  }

  return (
    <div className="relative opacity-60 cursor-not-allowed">
      {children}
      <UpgradeBadge className="absolute top-1/2 right-2 -translate-y-1/2" />
    </div>
  );
}
