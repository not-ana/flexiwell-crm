"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/shop/CartContext";
import { useCurrency } from "@/hooks/useCurrency";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shop/shippingMethods";
import Button from "@/components/ui/Button";

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    itemCount,
    subtotal,
    isDrawerOpen,
    closeDrawer,
  } = useCart();
  const { formatCurrency } = useCurrency();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    if (isDrawerOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isDrawerOpen, closeDrawer]);

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(
    100,
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isDrawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            <h2 className="text-base font-semibold text-gray-900">
              Your Cart
            </h2>
            <span className="text-sm text-gray-500">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping progress */}
        {items.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            {freeShippingRemaining > 0 ? (
              <p className="text-xs text-gray-600 mb-1.5">
                Add{" "}
                <span className="font-semibold text-primary-600">
                  {formatCurrency(freeShippingRemaining)}
                </span>{" "}
                more for free shipping
              </p>
            ) : (
              <p className="text-xs text-green-600 font-medium mb-1.5">
                You qualify for free shipping!
              </p>
            )}
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  freeShippingRemaining > 0 ? "bg-primary-500" : "bg-green-500"
                }`}
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                Your cart is empty
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Browse our products and add items to get started.
              </p>
              <button
                type="button"
                onClick={closeDrawer}
                className="text-sm text-primary-600 font-medium hover:text-primary-700"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-gray-50 relative overflow-hidden flex-shrink-0 border border-gray-100">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      sizes="64px"
                      className="object-cover rounded-lg"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          SKU: {item.product.sku}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                        {formatCurrency(item.product.price * item.quantity)}
                      </p>
                    </div>

                    {/* Qty controls + remove */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-gray-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-medium text-gray-900 min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity + 1
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-gray-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — totals + CTA */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Subtotal</p>
              <p className="text-base font-bold text-gray-900">
                {formatCurrency(subtotal)}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Shipping &amp; taxes calculated at checkout
            </p>

            <div className="mt-4">
              <Link href="/shop/checkout" onClick={closeDrawer}>
                <Button
                  variant="primary"
                  size="xl"
                  fullWidth
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Checkout
                </Button>
              </Link>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={closeDrawer}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
