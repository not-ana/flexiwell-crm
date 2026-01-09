"use client";

import { usePostHog, useFeatureFlagEnabled } from "posthog-js/react";
import { posthog } from "./provider";

// Track custom events
export function useTrackEvent() {
  const posthogClient = usePostHog();

  return (eventName: string, properties?: Record<string, unknown>) => {
    posthogClient?.capture(eventName, properties);
  };
}

// Check if a feature flag is enabled
export function useFeatureFlag(flagKey: string): boolean {
  return useFeatureFlagEnabled(flagKey) ?? false;
}

// Identify user (call after login)
export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    role?: string;
    plan?: string;
    [key: string]: unknown;
  }
) {
  posthog.identify(userId, properties);
}

// Reset user (call after logout)
export function resetUser() {
  posthog.reset();
}

// Track page view manually (if needed)
export function trackPageView(pageName?: string) {
  posthog.capture("$pageview", pageName ? { page: pageName } : undefined);
}

// Feature flag helpers for conditional rendering
export const FeatureFlags = {
  // Module flags - use these to control access to features
  WHATSAPP_BOT: "whatsapp-bot",
  AI_SUPPORT: "ai-support",
  ADVANCED_REPORTS: "advanced-reports",
  MULTI_LOCATION: "multi-location",
  WAITLIST_INTELLIGENCE: "waitlist-intelligence",
  WHITE_LABEL: "white-label",

  // Beta features
  BETA_DASHBOARD: "beta-dashboard",
  BETA_CALENDAR: "beta-calendar",

  // A/B tests
  NEW_PRICING_PAGE: "new-pricing-page",
  ONBOARDING_V2: "onboarding-v2",
} as const;
