"use client";

import { ResponsiveLayout } from "@/components/layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResponsiveLayout variant="client" notificationCount={8}>
      {children}
    </ResponsiveLayout>
  );
}
