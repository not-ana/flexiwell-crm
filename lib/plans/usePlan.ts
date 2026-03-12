"use client";

import { createContext, useContext } from "react";
import { PlanType, PlanFeatures, PlanLimits, plans, hasFeature, isWithinLimits, getLimit } from "./index";

// Context for the current organization's plan
interface PlanContextType {
  planId: PlanType;
  plan: typeof plans[PlanType];

  // Feature checks
  can: (feature: keyof PlanFeatures) => boolean;

  // Limit checks
  isWithinLimit: (resource: keyof PlanLimits, currentCount: number) => boolean;
  getResourceLimit: (resource: keyof PlanLimits) => number | "unlimited";

  // Upgrade prompts
  shouldShowUpgrade: (feature: keyof PlanFeatures) => boolean;
}

const PlanContext = createContext<PlanContextType | null>(null);

export function usePlan(): PlanContextType {
  const context = useContext(PlanContext);

  if (!context) {
    // Default to starter plan if no context (for development)
    const defaultPlanId: PlanType = "retention_pro"; // Change based on your default

    return {
      planId: defaultPlanId,
      plan: plans[defaultPlanId],
      can: (feature) => hasFeature(defaultPlanId, feature),
      isWithinLimit: (resource, count) => isWithinLimits(defaultPlanId, resource, count),
      getResourceLimit: (resource) => getLimit(defaultPlanId, resource),
      shouldShowUpgrade: (feature) => !hasFeature(defaultPlanId, feature),
    };
  }

  return context;
}

export { PlanContext };
export type { PlanContextType };
