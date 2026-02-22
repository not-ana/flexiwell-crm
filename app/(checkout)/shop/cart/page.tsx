"use client";

import Link from "next/link";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/lib/shop/CartContext";
import { FREE_SHIPPING_THRESHOLD, getShippingMethods } from "@/lib/shop/shippingMethods";
import { CartItemRow } from "@/components/shop/CartItemRow";
import { ShopOrderSummary } from "@/components/shop/ShopOrderSummary";
import { ShoppingCart, ArrowLeft, ArrowRight, Truck } from "lucide-react";
import { useState } from "react";
import { validatePromoCode } from "@/lib/shop/cartUtils";

export default function CartPage() {
  const { formatCurrency } = useCurrency();
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const shippingMethods = getShippingMethods(subtotal);
  const defaultShipping = shippingMethods[0];
  const shippingCost = defaultShipping.price;
  const estimatedTax = 0; // Tax calculated at checkout with address
  const total = subtotal + shippingCost - discountAmount;

  const freeShippingRemaining = FREE_SHIPPING_THRESHOLD - subtotal;

  const handleApplyPromo = () => {
    const result = validatePromoCode(promoCode, subtotal);
    if (result.valid) {
      setDiscountAmount(result.discountAmount);
      setPromoApplied(true);
      setPromoError(false);
    } else {
      setPromoError(true);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-gray-300" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Browse our collection and add items to get started.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Shopping Cart ({items.length} {items.length === 1 ? "item" : "items"})
          </h1>
          <Link
            href="/shop"
            className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Free shipping progress */}
        {freeShippingRemaining > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Truck className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">
                You&apos;re <span className="font-semibold">{formatCurrency(freeShippingRemaining)}</span> away from free shipping!
              </p>
            </div>
            <div className="w-full bg-green-200 rounded-full h-1.5">
              <div
                className="h-1.5 bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-5 lg:gap-8">
          {/* Left: Cart items */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
              {items.map((item) => (
                <CartItemRow
                  key={item.product.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="mt-6 lg:mt-0 lg:col-span-2">
            <div className="lg:sticky lg:top-6 space-y-4">
              <ShopOrderSummary
                items={items}
                subtotal={subtotal}
                shippingCost={shippingCost}
                shippingMethodName={defaultShipping.name}
                estimatedTax={estimatedTax}
                discountAmount={discountAmount}
                total={total}
                formatCurrency={formatCurrency}
                promoCode={promoCode}
                promoApplied={promoApplied}
                promoError={promoError}
                onPromoChange={(code) => {
                  setPromoCode(code);
                  setPromoError(false);
                }}
                onApplyPromo={handleApplyPromo}
              />

              <Link
                href="/shop/checkout"
                className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
