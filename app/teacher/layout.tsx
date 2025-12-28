"use client";

import { ResponsiveLayout } from "@/components/layout";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResponsiveLayout variant="teacher" notificationCount={3}>
      {children}
    </ResponsiveLayout>
  );
}
