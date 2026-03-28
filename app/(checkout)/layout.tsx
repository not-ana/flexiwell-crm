"use client";

import { Suspense } from "react";
import Image from "next/image";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
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

      <Suspense>{children}</Suspense>
    </div>
  );
}
