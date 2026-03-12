"use client";

import { useEffect, useState } from "react";
import { ResponsiveLayout } from "@/components/layout";
import { TrialBanner } from "@/components/trial/TrialBanner";
import { PlanProvider } from "@/lib/plans/PlanProvider";
import { useAuth } from "@/contexts/AuthContext";
import { PlanType } from "@/lib/plans";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [conversationCount, setConversationCount] = useState(0);
  const { user } = useAuth();

  // Get plan from user or default to starter
  const planId: PlanType = (user?.planTier as PlanType) || "retention_pro";

  // Fetch real conversation count
  useEffect(() => {
    async function fetchConversationStats() {
      try {
        const response = await fetch("/api/conversations/stats");
        if (response.ok) {
          const data = await response.json();
          setConversationCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch conversation stats:", error);
      }
    }

    fetchConversationStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchConversationStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PlanProvider planId={planId}>
      <TrialBanner />
      <ResponsiveLayout variant="admin" notificationCount={conversationCount}>
        {children}
      </ResponsiveLayout>
    </PlanProvider>
  );
}
