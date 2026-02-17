"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useInteractiveOnboarding, type UserRole } from "@/components/onboarding";

const dashboardPaths: Record<UserRole, string> = {
  admin: "/admin",
  teacher: "/teacher",
  client: "/dashboard",
};

export function ReplayTourSection({ role }: { role: UserRole }) {
  const router = useRouter();
  const { resetOnboarding } = useInteractiveOnboarding(role);

  const handleReplayTour = () => {
    resetOnboarding();
    router.push(dashboardPaths[role]);
  };

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Guided Tour</h2>
        <p className="text-sm text-gray-600 mt-1">
          Replay the onboarding tour to revisit key features of your dashboard.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Dashboard tour</h3>
            <p className="text-sm text-gray-500 mt-1">
              Walk through the main features and navigation of your dashboard.
            </p>
          </div>
          <Button variant="secondary" onClick={handleReplayTour}>
            Replay tour
          </Button>
        </div>
      </div>
    </>
  );
}
