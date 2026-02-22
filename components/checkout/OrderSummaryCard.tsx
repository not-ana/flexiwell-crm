"use client";

import { useState } from "react";
import { ShieldCheck, HelpCircle, ChevronDown, ChevronUp, Tag, Check, Package } from "lucide-react";
import type { PlanPackage, AddOn } from "@/lib/checkout/types";

interface OrderSummaryCardProps {
  plan: PlanPackage;
  addOns?: AddOn[];
  discountAmount?: number;
  showGuaranteeBadge?: boolean;
  showSupportLink?: boolean;
  compact?: boolean;
  formatCurrency: (amount: number) => string;
  promoCode?: string;
  promoApplied?: boolean;
  onPromoChange?: (code: string) => void;
  onApplyPromo?: () => void;
}

export function OrderSummaryCard({
  plan,
  addOns = [],
  discountAmount = 0,
  showGuaranteeBadge = true,
  showSupportLink = true,
  compact = false,
  formatCurrency,
  promoCode,
  promoApplied,
  onPromoChange,
  onApplyPromo,
}: OrderSummaryCardProps) {
  const [promoExpanded, setPromoExpanded] = useState(false);

  const selectedAddOns = addOns.filter((a) => a.selected);
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const subtotal = plan.price + addOnsTotal;
  const total = subtotal - discountAmount;

  const hasPromoFeature = onPromoChange && onApplyPromo;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 ${compact ? "p-4" : "p-6"}`}>
      <h3 className={`font-semibold text-gray-900 ${compact ? "text-sm mb-3" : "text-lg mb-4"}`}>
        Order Summary
      </h3>

      {/* Plan with icon */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Package className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{plan.name}</p>
              <p className="text-xs text-gray-500">
                {plan.classes} {plan.classes === 1 ? "class" : "classes"} &middot; {plan.duration}
              </p>
            </div>
            <p className="text-sm font-medium text-gray-900 ml-2">{formatCurrency(plan.price)}</p>
          </div>
        </div>
      </div>

      {/* Add-ons */}
      {selectedAddOns.map((addOn) => (
        <div key={addOn.id} className="flex items-center justify-between mb-2 pl-[52px]">
          <p className="text-sm text-gray-600">{addOn.name}</p>
          <p className="text-sm text-gray-600">{formatCurrency(addOn.price)}</p>
        </div>
      ))}

      {/* Promo code accordion */}
      {hasPromoFeature && !compact && (
        <div className="mt-3 mb-3">
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
            <div className="flex gap-2 mt-2">
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
          )}
          {promoApplied && (
            <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              20% discount applied
            </p>
          )}
        </div>
      )}

      <hr className="border-gray-200 my-3" />

      {/* Subtotal */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">Subtotal</p>
        <p className="text-sm text-gray-700">{formatCurrency(subtotal)}</p>
      </div>

      {/* Discount */}
      {discountAmount > 0 && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-green-600">Discount</p>
          <p className="text-sm text-green-600">-{formatCurrency(discountAmount)}</p>
        </div>
      )}

      {/* Estimated Tax */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">Estimated Tax</p>
        <p className="text-sm text-gray-700">{formatCurrency(0)}</p>
      </div>

      {/* Shipping */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">Shipping</p>
        <p className="text-sm text-green-600 font-medium">Free</p>
      </div>

      <hr className="border-gray-200 my-3" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900">Estimated Total</p>
        <p className="text-xl font-bold text-gray-900">{formatCurrency(total)}</p>
      </div>

      {/* Guarantee badge */}
      {showGuaranteeBadge && !compact && (
        <div className="mt-4 flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs font-medium">7-day money-back guarantee</p>
        </div>
      )}

      {/* Support link */}
      {showSupportLink && !compact && (
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
