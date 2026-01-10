"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface TrialStatus {
  hasTrial: boolean;
  trialStatus?: "active" | "expired" | "converted";
  trialStartDate?: string;
  trialEndDate?: string;
  daysRemaining?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  subscriptionStatus?: string;
  planTier?: string;
}

interface UseTrialStatusOptions {
  redirectOnExpired?: boolean;
}

export function useTrialStatus(options: UseTrialStatusOptions = {}) {
  const { redirectOnExpired = false } = options;
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchTrialStatus() {
      try {
        const response = await fetch("/api/trial/status", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setTrialStatus(data);

          // Redirect to trial-expired page if expired and not already there
          if (
            redirectOnExpired &&
            data.isExpired &&
            data.subscriptionStatus !== "active" &&
            !pathname.includes("/trial-expired") &&
            !pathname.includes("/billing")
          ) {
            router.push("/admin/trial-expired");
          }
        } else {
          setError("Failed to fetch trial status");
        }
      } catch (err) {
        setError("Error connecting to server");
        console.error("Error fetching trial status:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrialStatus();
  }, [redirectOnExpired, router, pathname]);

  return {
    ...trialStatus,
    loading,
    error,
    isTrialing: trialStatus?.subscriptionStatus === "trialing",
    isSubscribed: trialStatus?.subscriptionStatus === "active",
    shouldShowUpgrade:
      trialStatus?.isExpired || trialStatus?.isExpiringSoon,
  };
}
