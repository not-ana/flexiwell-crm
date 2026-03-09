"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Tag,
  Check,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calendar,
  MessageCircle,
  BookOpen,
  Users,
} from "lucide-react";
import Button from "@/components/ui/Button";
import type { PlanPackage, AddOn } from "@/lib/checkout/types";

interface OrderReviewStepProps {
  plan: PlanPackage;
  addOns: AddOn[];
  onToggleAddOn: (id: string) => void;
  couponCode: string;
  onCouponChange: (code: string) => void;
  onApplyCoupon: () => void;
  couponApplied: boolean;
  discountAmount: number;
  total: number;
  formatCurrency: (amount: number) => string;
  onContinue: () => void;
  onBack: () => void;
}

export function OrderReviewStep({
  plan,
  addOns,
  onToggleAddOn,
  couponCode,
  onCouponChange,
  onApplyCoupon,
  couponApplied,
  discountAmount,
  total,
  formatCurrency,
  onContinue,
  onBack,
}: OrderReviewStepProps) {
  const [couponError, setCouponError] = useState(false);
  const [couponExpanded, setCouponExpanded] = useState(false);

  const selectedAddOns = addOns.filter((a) => a.selected);
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const subtotal = plan.price + addOnsTotal;

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === "FLEX20") {
      setCouponError(false);
      onApplyCoupon();
    } else {
      setCouponError(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Review Your Order
      </h1>

      {/* Selected Plan Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{plan.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
          </div>
          {plan.popular && (
            <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              Popular
            </span>
          )}
          {plan.bestValue && (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              Best Value
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center bg-gray-50 rounded-lg py-3 px-2">
            <p className="text-xl font-bold text-gray-900">{plan.classes}</p>
            <p className="text-xs text-gray-500">
              {plan.classes === 1 ? "Class" : "Classes"}
            </p>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-3 px-2">
            <p className="text-xl font-bold text-gray-900">{plan.duration}</p>
            <p className="text-xs text-gray-500">Duration</p>
          </div>
          <div className="text-center bg-gray-50 rounded-lg py-3 px-2">
            <p className="text-xl font-bold text-primary-600">
              {formatCurrency(plan.pricePerClass)}
            </p>
            <p className="text-xs text-gray-500">Per Class</p>
          </div>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-gray-400" />
          <p className="text-xs text-gray-500">
            2,400+ members chose this plan
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700">Plan Total</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(plan.price)}
          </p>
        </div>

        <Link
          href="/plans"
          className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
        >
          Change plan
        </Link>
      </div>

      {/* Hormozi Value Stack — What's Included */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-primary-900 mb-3">
          Everything included with your plan
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-primary-800">Online Booking 24/7</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-primary-800">SMS Reminders</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-primary-800">Class Makeup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-primary-800">Certified Instructors</span>
          </div>
        </div>
      </div>

      {/* Enhance Your Experience - Add-ons */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Enhance Your Experience
          </h2>
        </div>

        <div className="space-y-3">
          {addOns.map((addOn) => (
            <button
              key={addOn.id}
              type="button"
              onClick={() => onToggleAddOn(addOn.id)}
              className={`w-full text-left bg-white rounded-2xl border-2 p-4 transition-all ${
                addOn.selected
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    addOn.selected
                      ? "bg-primary-600 border-primary-600"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {addOn.selected && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {addOn.name}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 ml-2">
                      +{formatCurrency(addOn.price)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {addOn.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Coupon Section — Collapsible Accordion */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
        <button
          type="button"
          onClick={() => setCouponExpanded(!couponExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-700">
              {couponApplied ? "Promo code applied" : "Add a promo code"}
            </p>
          </div>
          {couponExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {couponExpanded && (
          <div className="mt-4">
            {!couponApplied ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    onCouponChange(e.target.value);
                    setCouponError(false);
                  }}
                  placeholder="Enter coupon code"
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                >
                  Apply
                </Button>
              </div>
            ) : null}
            {couponApplied && (
              <p className="text-sm text-green-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Coupon FLEX20 applied — 20% off!
              </p>
            )}
            {couponError && !couponApplied && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                <X className="w-4 h-4" />
                Invalid coupon code
              </p>
            )}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Subtotal</p>
            <p className="text-sm text-gray-700">{formatCurrency(subtotal)}</p>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-600">Discount (20%)</p>
              <p className="text-sm text-green-600">
                -{formatCurrency(discountAmount)}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Estimated Tax</p>
            <p className="text-sm text-gray-700">{formatCurrency(0)}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Shipping</p>
            <p className="text-sm text-green-600 font-medium">Free</p>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-gray-900">Estimated Total</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        size="xl"
        fullWidth
        rightIcon={<ArrowRight className="w-5 h-5" />}
        onClick={onContinue}
      >
        Continue to Payment
      </Button>

      {/* Back link */}
      <div className="text-center mt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Back to Plans
        </button>
      </div>
    </div>
  );
}
