"use client";

import { useState } from "react";
import Image from "next/image";
import { ShieldCheck, HelpCircle, Tag, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import type { CartItem } from "@/lib/shop/types";

interface ShopOrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  shippingMethodName?: string;
  estimatedTax: number;
  discountAmount: number;
  total: number;
  formatCurrency: (amount: number) => string;
  promoCode?: string;
  promoApplied?: boolean;
  promoError?: boolean;
  onPromoChange?: (code: string) => void;
  onApplyPromo?: () => void;
  compact?: boolean;
  showGuaranteeBadge?: boolean;
}

export function ShopOrderSummary({
  items,
  subtotal,
  shippingCost,
  shippingMethodName,
  estimatedTax,
  discountAmount,
  total,
  formatCurrency,
  promoCode,
  promoApplied,
  promoError,
  onPromoChange,
  onApplyPromo,
  compact = false,
  showGuaranteeBadge = true,
}: ShopOrderSummaryProps) {
  const [promoExpanded, setPromoExpanded] = useState(false);

  const hasPromoFeature = onPromoChange && onApplyPromo;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 ${compact ? "p-4" : "p-6"}`}>
      <h3 className={`font-semibold text-gray-900 ${compact ? "text-sm mb-3" : "text-lg mb-4"}`}>
        Order Summary
      </h3>

      {/* Cart items */}
      <div className="space-y-3 mb-3">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-50 relative overflow-hidden flex-shrink-0">
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                sizes="48px"
                className="object-cover rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 line-clamp-1">
                {item.product.name}
              </p>
              <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-medium text-gray-900 flex-shrink-0">
              {formatCurrency(item.product.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Promo code accordion */}
      {hasPromoFeature && !compact && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setPromoExpanded(!promoExpanded)}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Tag className="w-3.5 h-3.5" />
            {promoApplied ? "Promo code applied" : "Add a promo code"}
            {promoExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {promoExpanded && !promoApplied && (
            <div className="mt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode || ""}
                  onChange={(e) => onPromoChange!(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={onApplyPromo}
                  disabled={!promoCode?.trim()}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
              {promoError && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <X className="w-3 h-3" />
                  Invalid promo code
                </p>
              )}
            </div>
          )}
          {promoApplied && (
            <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Discount applied
            </p>
          )}
        </div>
      )}

      <hr className="border-gray-200 my-3" />

      {/* Totals */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Subtotal</p>
          <p className="text-sm text-gray-700">{formatCurrency(subtotal)}</p>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-green-600">Discount</p>
            <p className="text-sm text-green-600">-{formatCurrency(discountAmount)}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Shipping{shippingMethodName ? ` (${shippingMethodName})` : ""}
          </p>
          <p className={`text-sm ${shippingCost === 0 ? "text-green-600 font-medium" : "text-gray-700"}`}>
            {shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Estimated Tax</p>
          <p className="text-sm text-gray-700">{formatCurrency(estimatedTax)}</p>
        </div>
      </div>

      <hr className="border-gray-200 my-3" />

      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900">Estimated Total</p>
        <p className="text-xl font-bold text-gray-900">{formatCurrency(total)}</p>
      </div>

      {/* Guarantee badge */}
      {showGuaranteeBadge && !compact && (
        <div className="mt-4 flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs font-medium">30-day money-back guarantee</p>
        </div>
      )}

      {/* Support link */}
      {!compact && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">
            Need help?{" "}
            <a href="mailto:support@flexiwell.com" className="text-primary-600 hover:underline">
              Contact support
            </a>
          </span>
        </div>
      )}
    </div>
  );
}
