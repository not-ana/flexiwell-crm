"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/lib/shop/CartContext";
import { ShopCheckoutStepIndicator } from "@/components/checkout/ShopCheckoutStepIndicator";
import { GuestCheckoutStep } from "@/components/shop/steps/GuestCheckoutStep";
import { ShippingStep } from "@/components/shop/steps/ShippingStep";
import { ShopPaymentStep } from "@/components/shop/steps/ShopPaymentStep";
import { ShopOrderReviewStep } from "@/components/shop/steps/ShopOrderReviewStep";
import { ProcessingStep } from "@/components/checkout/steps/ProcessingStep";
import { getShippingMethods, getShippingCost } from "@/lib/shop/shippingMethods";
import {
  calculateSubtotal,
  calculateEstimatedTax,
  calculateTotal,
  validatePromoCode,
  validateShopCheckoutForm,
  getShippingCostForCheckout,
} from "@/lib/shop/cartUtils";
import type { ShopCheckoutStep, ShopCheckoutFormData } from "@/lib/shop/types";
import { INITIAL_SHOP_FORM } from "@/lib/shop/types";

const DEV_FORM_DATA: ShopCheckoutFormData = {
  email: "demo@flexiwell.com",
  shipping: {
    firstName: "Jane",
    lastName: "Doe",
    address1: "123 Wellness Ave",
    address2: "",
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    country: "US",
  },
  shippingMethodId: "standard",
  sameAsShipping: true,
  billing: {
    firstName: "Jane",
    lastName: "Doe",
    address1: "123 Wellness Ave",
    address2: "",
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    country: "US",
  },
  cardNumber: "4242 4242 4242 4242",
  cardExpiry: "12/28",
  cardCvv: "123",
  cardholderName: "Jane Doe",
  savePaymentMethod: false,
  agreeToTerms: true,
};

export default function ShopCheckoutPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const { items, clearCart, subtotal: cartSubtotal } = useCart();

  const [step, setStep] = useState<ShopCheckoutStep>(1);
  const [formData, setFormData] = useState<ShopCheckoutFormData>({
    ...INITIAL_SHOP_FORM,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Calculations
  const subtotal = cartSubtotal;
  const shippingCost = getShippingCostForCheckout(
    formData.shippingMethodId,
    subtotal
  );
  const estimatedTax = calculateEstimatedTax(
    subtotal - discountAmount,
    formData.shipping.state
  );
  const total = calculateTotal(
    subtotal,
    shippingCost,
    estimatedTax,
    discountAmount
  );
  const availableShippingMethods = useMemo(
    () => getShippingMethods(subtotal),
    [subtotal]
  );
  const selectedShippingMethod = availableShippingMethods.find(
    (m) => m.id === formData.shippingMethodId
  );

  // Form change handler supporting nested paths like "shipping.firstName"
  const handleFormChange = useCallback(
    (path: string, value: string | boolean) => {
      setFormData((prev) => {
        const next = { ...prev };
        const parts = path.split(".");
        if (parts.length === 2) {
          const [section, field] = parts;
          if (section === "shipping") {
            next.shipping = { ...next.shipping, [field]: value };
          } else if (section === "billing") {
            next.billing = { ...next.billing, [field]: value };
          }
        } else {
          (next as Record<string, unknown>)[path] = value;
        }
        return next;
      });
      // Clear error for this field
      setErrors((prev) => {
        if (!prev[path]) return prev;
        const next = { ...prev };
        delete next[path];
        return next;
      });
    },
    []
  );

  // Promo code handler
  const handleApplyPromo = useCallback(() => {
    const result = validatePromoCode(promoCode, subtotal);
    if (result.valid) {
      setPromoApplied(true);
      setPromoError(false);
      setDiscountAmount(result.discountAmount);
    } else {
      setPromoError(true);
    }
  }, [promoCode, subtotal]);

  // Step navigation
  const goToStep = useCallback(
    (targetStep: ShopCheckoutStep) => {
      // Validate current step before advancing
      if (targetStep > step) {
        const validationErrors = validateShopCheckoutForm(formData, step);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }
      setErrors({});
      setStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [step, formData]
  );

  // Processing complete -> navigate to success
  const handleProcessingComplete = useCallback(() => {
    // Build order details for the success page
    const orderNumber = `FW-${Date.now().toString(36).toUpperCase()}`;
    const orderDetails = {
      orderNumber,
      items: items.map((i) => ({
        name: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        price: i.product.price,
        image: i.product.image,
      })),
      subtotal,
      shipping: shippingCost,
      shippingMethod: selectedShippingMethod?.name ?? "Standard Shipping",
      estimatedTax,
      discount: discountAmount,
      total,
      email: formData.email,
      shippingAddress: formData.shipping,
      paymentMethod: `Card ending in ${formData.cardNumber
        .replace(/\s/g, "")
        .slice(-4)}`,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      estimatedDelivery: selectedShippingMethod?.estimatedDays ?? "5-7 business days",
    };

    // Store order in sessionStorage for the success page
    sessionStorage.setItem(
      "flexiwell-shop-order",
      JSON.stringify(orderDetails)
    );
    clearCart();
    router.push("/shop/success");
  }, [
    items,
    subtotal,
    shippingCost,
    selectedShippingMethod,
    estimatedTax,
    discountAmount,
    total,
    formData,
    clearCart,
    router,
  ]);

  // Dev mode: skip to any step with pre-filled data
  const isDev = process.env.NODE_ENV === "development";
  const handleDevSkip = useCallback(() => {
    setFormData({ ...DEV_FORM_DATA });
    setErrors({});
    setStep((prev) => Math.min(prev + 1, 5) as ShopCheckoutStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Redirect if cart is empty (except processing/done steps)
  if (items.length === 0 && step < 5) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Add items to your cart before checking out.
          </p>
          <button
            onClick={() => router.push("/shop")}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <ShopCheckoutStepIndicator currentStep={step} />

        {isDev && step < 5 && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleDevSkip}
              className="px-3 py-1 text-xs font-mono bg-yellow-100 text-yellow-800 border border-yellow-300 rounded hover:bg-yellow-200 transition-colors"
            >
              Skip Step (Dev)
            </button>
          </div>
        )}

        {step === 1 && (
          <GuestCheckoutStep
            email={formData.email}
            onEmailChange={(v) => handleFormChange("email", v)}
            onContinue={() => goToStep(2)}
            errors={errors}
          />
        )}

        {step === 2 && (
          <ShippingStep
            formData={formData}
            onFormChange={handleFormChange}
            availableShippingMethods={availableShippingMethods}
            formatCurrency={formatCurrency}
            onContinue={() => goToStep(3)}
            onBack={() => goToStep(1)}
            errors={errors}
            items={items}
            subtotal={subtotal}
            shippingCost={shippingCost}
            estimatedTax={estimatedTax}
            discountAmount={discountAmount}
            total={total}
          />
        )}

        {step === 3 && (
          <ShopPaymentStep
            formData={formData}
            onFormChange={handleFormChange}
            formatCurrency={formatCurrency}
            onContinue={() => goToStep(4)}
            onBack={() => goToStep(2)}
            errors={errors}
            items={items}
            subtotal={subtotal}
            shippingCost={shippingCost}
            estimatedTax={estimatedTax}
            discountAmount={discountAmount}
            total={total}
          />
        )}

        {step === 4 && (
          <ShopOrderReviewStep
            formData={formData}
            items={items}
            shippingMethod={selectedShippingMethod}
            subtotal={subtotal}
            shippingCost={shippingCost}
            estimatedTax={estimatedTax}
            discountAmount={discountAmount}
            total={total}
            formatCurrency={formatCurrency}
            promoCode={promoCode}
            promoApplied={promoApplied}
            onPromoChange={(v) => {
              setPromoCode(v);
              setPromoError(false);
            }}
            onApplyPromo={handleApplyPromo}
            promoError={promoError}
            onPlaceOrder={() => goToStep(5)}
            onBack={() => goToStep(3)}
          />
        )}

        {step === 5 && (
          <ProcessingStep onComplete={handleProcessingComplete} />
        )}
      </div>
    </div>
  );
}
