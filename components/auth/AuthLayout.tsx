"use client";

import Image from "next/image";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  side: React.ReactNode;
  mobileBanner?: React.ReactNode;
  /** Optional hero image displayed at the top of the left panel */
  sideImage?: { src: string; alt: string };
}

export default function AuthLayout({ children, side, mobileBanner, sideImage }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[52%] relative text-white flex-col overflow-hidden">
        {/* Layered gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-purple-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(107,60,237,0.3)_0%,transparent_60%)]" />

        {/* Decorative shapes */}
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full border border-white/[0.07]" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full border border-white/[0.07]" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />

        {/* Hero image area */}
        {sideImage && (
          <div className="relative z-10 w-full h-[40%] min-h-[240px]">
            <Image
              src={sideImage.src}
              alt={sideImage.alt}
              fill
              className="object-cover"
              priority
            />
            {/* Gradient fade into the panel below */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary-700 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className={`relative z-10 flex flex-col justify-between flex-1 p-12 ${sideImage ? "pt-0" : ""}`}>
          {!sideImage && (
            <div>
              <Link href="/">
                <Image
                  src="/flexiwell-logo-white.svg"
                  alt="FlexiWell"
                  width={130}
                  height={28}
                  priority
                />
              </Link>
            </div>
          )}
          {sideImage && (
            <div className="-mt-6">
              <Link href="/">
                <Image
                  src="/flexiwell-logo-white.svg"
                  alt="FlexiWell"
                  width={130}
                  height={28}
                  priority
                />
              </Link>
            </div>
          )}

          <div>{side}</div>

          <div className="text-xs text-primary-300">
            &copy; {new Date().getFullYear()} FlexiWell. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-[48%] bg-white flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden px-6 pt-6 pb-2">
          <Link href="/">
            <Image
              src="/flexiwell-logo.svg"
              alt="FlexiWell"
              width={110}
              height={24}
              priority
            />
          </Link>
          {mobileBanner && <div className="mt-4">{mobileBanner}</div>}
        </div>

        {/* Center the form */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
