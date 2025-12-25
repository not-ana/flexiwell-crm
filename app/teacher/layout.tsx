"use client";

import { Sidebar } from "@/components/layout";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar variant="teacher" notificationCount={3} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
