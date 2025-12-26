"use client";

import { ReactNode, useMemo } from "react";
import { PlanContext, PlanContextType } from "./usePlan";
import { PlanType, plans, hasFeature, isWithinLimits, getLimit, PlanFeatures, PlanLimits } from "./index";

interface PlanProviderProps {
  children: ReactNode;
  planId: PlanType;
}

export function PlanProvider({ children, planId }: PlanProviderProps) {
  const value = useMemo<PlanContextType>(
    () => ({
      planId,
      plan: plans[planId],
      can: (feature: keyof PlanFeatures) => hasFeature(planId, feature),
      isWithinLimit: (resource: keyof PlanLimits, count: number) => isWithinLimits(planId, resource, count),
      getResourceLimit: (resource: keyof PlanLimits) => getLimit(planId, resource),
      shouldShowUpgrade: (feature: keyof PlanFeatures) => !hasFeature(planId, feature),
    }),
    [planId]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}
