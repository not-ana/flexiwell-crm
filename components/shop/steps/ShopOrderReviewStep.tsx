"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Lock,
  MapPin,
  Truck,
  CreditCard,
  Tag,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { TrustBadges } from "@/components/checkout/TrustBadges";
import type {
  CartItem,
  ShopCheckoutFormData,
  ShippingMethod,
} from "@/lib/shop/types";

interface ShopOrderReviewStepProps {
  formData: ShopCheckoutFormData;
  items: CartItem[];
  shippingMethod: ShippingMethod | undefined;
  subtotal: number;
  shippingCost: number;
  estimatedTax: number;
  discountAmount: number;
  total: number;
  formatCurrency: (amount: number) => string;
  promoCode: string;
  promoApplied: boolean;
  onPromoChange: (code: string) => void;
  onApplyPromo: () => void;
  promoError: boolean;
  onPlaceOrder: () => void;
  onBack: () => void;
}

export function ShopOrderReviewStep({
  formData,
  items,
  shippingMethod,
  subtotal,
  shippingCost,
  estimatedTax,
  discountAmount,
  total,
  formatCurrency,
  promoCode,
  promoApplied,
  onPromoChange,
  onApplyPromo,
  promoError,
  onPlaceOrder,
  onBack,
}: ShopOrderReviewStepProps) {
  const [promoExpanded, setPromoExpanded] = useState(false);
  const s = formData.shipping;

  const maskedCard = `ending in ${formData.cardNumber.replace(/\s/g, "").slice(-4)}`;
  const cardBrand =
    formData.cardNumber.startsWith("4")
      ? "Visa"
      : formData.cardNumber.startsWith("5")
      ? "Mastercard"
      : formData.cardNumber.startsWith("3")
      ? "Amex"
      : "Card";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Review Your Order
      </h1>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Items ({items.reduce((s, i) => s + i.quantity, 0)})
        </h2>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gray-50 relative overflow-hidden flex-shrink-0">
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  sizes="64px"
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {item.product.name}
                </p>
                <p className="text-xs text-gray-500">
                  SKU: {item.product.sku} &middot; Qty: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(item.product.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-primary-600" />
          <h2 className="text-base font-semibold text-gray-900">
            Shipping Address
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          {s.firstName} {s.lastName}
          <br />
          {s.address1}
          {s.address2 && (
            <>
              <br />
              {s.address2}
            </>
          )}
          <br />
          {s.city}, {s.state} {s.zip}
          <br />
          {s.country}
        </p>
      </div>

      {/* Shipping Method */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-4 h-4 text-primary-600" />
          <h2 className="text-base font-semibold text-gray-900">
            Shipping Method
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          {shippingMethod?.name ?? "Standard Shipping"}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {shippingMethod?.estimatedDays ?? "5-7 business days"}
        </p>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-primary-600" />
          <h2 className="text-base font-semibold text-gray-900">
            Payment Method
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          {cardBrand} {maskedCard}
        </p>
      </div>

      {/* Promo code accordion */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
        <button
          type="button"
          onClick={() => setPromoExpanded(!promoExpanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-700">
              {promoApplied ? "Promo code applied" : "Add a promo code"}
            </p>
          </div>
          {promoExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {promoExpanded && (
          <div className="mt-4">
            {!promoApplied ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => onPromoChange(e.target.value)}
                  placeholder="Enter promo code"
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <button
                  type="button"
                  onClick={onApplyPromo}
                  disabled={!promoCode.trim()}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            ) : null}
            {promoApplied && (
              <p className="text-sm text-green-600 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Discount applied
              </p>
            )}
            {promoError && !promoApplied && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5">
                <X className="w-4 h-4" />
                Invalid promo code
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
            <p className="text-sm text-gray-700">
              {formatCurrency(subtotal)}
            </p>
          </div>
          {discountAmount > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-600">Discount</p>
              <p className="text-sm text-green-600">
                -{formatCurrency(discountAmount)}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Shipping
              {shippingMethod ? ` (${shippingMethod.name})` : ""}
            </p>
            <p
              className={`text-sm ${
                shippingCost === 0
                  ? "text-green-600 font-medium"
                  : "text-gray-700"
              }`}
            >
              {shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Estimated Tax</p>
            <p className="text-sm text-gray-700">
              {formatCurrency(estimatedTax)}
            </p>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-gray-900">
              Order Total
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      </div>

      {/* Place Order CTA */}
      <Button
        variant="primary"
        size="xl"
        fullWidth
        leftIcon={<Lock className="w-5 h-5" />}
        onClick={onPlaceOrder}
      >
        Place Order — {formatCurrency(total)}
      </Button>

      <div className="mt-4">
        <TrustBadges variant="horizontal" showPaymentBrands />
      </div>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Back to Payment
        </button>
      </div>
    </div>
  );
}
