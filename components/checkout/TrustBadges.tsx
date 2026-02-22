"use client";

import Image from "next/image";
import { Lock, Shield, ShieldCheck, HelpCircle } from "lucide-react";

const paymentBrands = [
  { src: "/cards/visa.svg", alt: "Visa" },
  { src: "/cards/mastercard.svg", alt: "Mastercard" },
  { src: "/cards/amex.svg", alt: "American Express" },
];

interface TrustBadgesProps {
  variant?: "horizontal" | "vertical";
  showPaymentBrands?: boolean;
  showHelpBanner?: boolean;
}

export function TrustBadges({
  variant = "horizontal",
  showPaymentBrands = false,
  showHelpBanner = false,
}: TrustBadgesProps) {
  return (
    <div className="space-y-4">
      {showHelpBanner && (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <HelpCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-gray-900">Need Help?</span>{" "}
            <span className="text-gray-500">Connect with a support agent.</span>{" "}
            <a
              href="mailto:support@flexiwell.com"
              className="text-primary-600 font-medium hover:underline"
            >
              Contact Us
            </a>
          </div>
        </div>
      )}

      <div
        className={`flex items-center justify-center gap-6 ${
          variant === "vertical" ? "flex-col gap-4" : "flex-wrap gap-4 sm:gap-6"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-green-500" />
          <span className="text-xs sm:text-sm text-gray-500">Secure Checkout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-green-500" />
          <span className="text-xs sm:text-sm text-gray-500">256-bit Encryption</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span className="text-xs sm:text-sm text-gray-500">Money-back Guarantee</span>
        </div>
        {showPaymentBrands && (
          <div className="flex items-center gap-1.5">
            {paymentBrands.map((brand) => (
              <Image
                key={brand.alt}
                src={brand.src}
                alt={brand.alt}
                width={36}
                height={22}
                className="rounded"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
