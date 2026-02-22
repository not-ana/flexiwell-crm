"use client";

import Image from "next/image";
import Link from "next/link";

const paymentBrands = [
  { src: "/cards/visa.svg", alt: "Visa" },
  { src: "/cards/mastercard.svg", alt: "Mastercard" },
  { src: "/cards/amex.svg", alt: "American Express" },
  { src: "/cards/paypal.svg", alt: "PayPal" },
  { src: "/cards/applepay.svg", alt: "Apple Pay" },
];

export function ShopFooter() {
  return (
    <footer className="bg-primary-900 text-primary-200 mt-12">
      {/* Main footer */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/flexiwell-logo.svg"
              alt="FlexiWell"
              width={90}
              height={20}
              className="brightness-0 invert mb-3"
            />
            <p className="text-sm text-primary-300 mb-4">
              Premium wellness essentials for Pilates & yoga studios.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-primary-300 bg-primary-800 px-2 py-1 rounded">
                Beta
              </span>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/shop"
                  className="text-sm text-primary-300 hover:text-white transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="text-sm text-primary-300 hover:text-white transition-colors"
                >
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="text-sm text-primary-300 hover:text-white transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="text-sm text-primary-300 hover:text-white transition-colors"
                >
                  On Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Support</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-primary-300">
                  Shipping & Returns
                </span>
              </li>
              <li>
                <span className="text-sm text-primary-300">FAQ</span>
              </li>
              <li>
                <a
                  href="mailto:support@flexiwell.com"
                  className="text-sm text-primary-300 hover:text-white transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <span className="text-sm text-primary-300">Track Order</span>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/plans"
                  className="text-sm text-primary-300 hover:text-white transition-colors"
                >
                  Class Plans
                </Link>
              </li>
              <li>
                <span className="text-sm text-primary-300">About Us</span>
              </li>
              <li>
                <span className="text-sm text-primary-300">Privacy Policy</span>
              </li>
              <li>
                <span className="text-sm text-primary-300">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-primary-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-400">
            &copy; 2026 FlexiWell. All rights reserved.
          </p>

          {/* Payment brands — real SVG icons */}
          <div className="flex items-center gap-2">
            {paymentBrands.map((brand) => (
              <Image
                key={brand.alt}
                src={brand.src}
                alt={brand.alt}
                width={42}
                height={26}
                className="rounded"
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
