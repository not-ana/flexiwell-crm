"use client";

import { Sidebar } from "@/components/layout";

// TODO: Replace with real user data from auth context
const mockUser = {
  name: "Olivia Rhye",
  email: "olivia@flexitrack.net",
  initials: "OR",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={mockUser} notificationCount={8} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
