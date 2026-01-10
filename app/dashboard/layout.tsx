"use client";

import { ResponsiveLayout } from "@/components/layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResponsiveLayout variant="client">
      {children}
    </ResponsiveLayout>
  );
}
