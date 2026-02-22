"use client";

import { Suspense } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Shop browse pages have their own ShopHeader — skip the minimal checkout header
  const isShopBrowse =
    pathname === "/shop" || pathname === "/shop/cart";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header - only for checkout flows (not shop browsing) */}
      {!isShopBrowse && (
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
            <Image
              src="/flexiwell-logo.svg"
              alt="FlexiWell"
              width={100}
              height={22}
              priority
            />
          </div>
        </header>
      )}

      {/* Page content */}
      <Suspense>{children}</Suspense>
    </div>
  );
}
