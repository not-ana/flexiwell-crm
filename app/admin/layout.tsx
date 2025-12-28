"use client";

import { ResponsiveLayout } from "@/components/layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResponsiveLayout variant="admin" notificationCount={5}>
      {children}
    </ResponsiveLayout>
  );
}
