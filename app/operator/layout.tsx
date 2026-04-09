"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// The operator surface is intentionally bare. No PlanProvider, no admin
// sidebar, no notification polling — none of that belongs to ana, it belongs
// to the studios. The only chrome here is "you are an operator, here are the
// studios". Once she clicks Enter on a studio she's in /admin and gets the
// full shell.
export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) return; // AuthContext will redirect to /login
    // Hard gate at the layout level so non-operators can't poke at the URL.
    if (!user.isOperator) {
      router.replace("/admin");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !user.isOperator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
