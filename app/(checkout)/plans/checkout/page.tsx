"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCurrency } from "@/hooks/useCurrency";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CheckoutStepIndicator } from "@/components/checkout/CheckoutStepIndicator";
import { OrderReviewStep } from "@/components/checkout/steps/OrderReviewStep";
import { PaymentStep } from "@/components/checkout/steps/PaymentStep";
import { ProcessingStep } from "@/components/checkout/steps/ProcessingStep";
import { planPackages } from "@/lib/checkout/planPackages";
import { AVAILABLE_ADD_ONS } from "@/lib/checkout/types";
import type { AddOn, CheckoutFormData } from "@/lib/checkout/types";

function validateForm(
  formData: CheckoutFormData
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!formData.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "Please enter a valid email";
  }

  if (!formData.phone.trim()) {
    errors.phone = "Phone number is required";
  }

  if (!formData.firstName.trim()) {
    errors.firstName = "First name is required";
  }

  if (!formData.lastName.trim()) {
    errors.lastName = "Last name is required";
  }

  if (!formData.address1.trim()) {
    errors.address1 = "Address is required";
  }

  if (!formData.city.trim()) {
    errors.city = "City is required";
  }

  if (!formData.state.trim()) {
    errors.state = "State is required";
  }

  if (!formData.zip.trim()) {
    errors.zip = "ZIP code is required";
  }

  if (!formData.country.trim()) {
    errors.country = "Country is required";
  }

  if (formData.paymentMethod === "credit-card") {
    const cardNumberClean = formData.cardNumber.replace(/\s/g, "");
    if (!cardNumberClean) {
      errors.cardNumber = "Card number is required";
    } else if (cardNumberClean.length < 13) {
      errors.cardNumber = "Please enter a valid card number";
    }

    if (!formData.cardExpiry.trim()) {
      errors.cardExpiry = "Expiry date is required";
    } else if (!/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
      errors.cardExpiry = "Use MM/YY format";
    }

    if (!formData.cardCvv.trim()) {
      errors.cardCvv = "CVV is required";
    } else if (formData.cardCvv.length < 3) {
      errors.cardCvv = "CVV must be 3-4 digits";
    }

    if (!formData.cardholderName.trim()) {
      errors.cardholderName = "Cardholder name is required";
    }
  }

  return errors;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  const selectedPlan = planPackages.find((p) => p.id === planId);

  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [addOns, setAddOns] = useState<AddOn[]>(
    AVAILABLE_ADD_ONS.map((a) => ({ ...a }))
  );
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    paymentMethod: "credit-card",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    cardholderName: "",
    savePaymentMethod: false,
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if no plan selected
  useEffect(() => {
    if (!planId || !selectedPlan) {
      router.push("/plans");
    }
  }, [planId, selectedPlan, router]);

  // Calculate totals
  const selectedAddOns = addOns.filter((a) => a.selected);
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const subtotal = (selectedPlan?.price || 0) + addOnsTotal;
  const total = subtotal - discountAmount;

  // Handlers
  const handleToggleAddOn = useCallback((id: string) => {
    setAddOns((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  }, []);

  const handleApplyCoupon = useCallback(() => {
    if (couponCode.toUpperCase() === "FLEX20") {
      const discount = Math.round(subtotal * 0.2 * 100) / 100;
      setDiscountAmount(discount);
      setCouponApplied(true);
    }
  }, [couponCode, subtotal]);

  // Recalculate discount when subtotal changes and coupon is applied
  useEffect(() => {
    if (couponApplied) {
      const discount = Math.round(subtotal * 0.2 * 100) / 100;
      setDiscountAmount(discount);
    }
  }, [subtotal, couponApplied]);

  const handleFormChange = useCallback(
    (field: keyof CheckoutFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        if (prev[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev;
      });
    },
    []
  );

  const handlePaymentComplete = useCallback(() => {
    // Skip validation for demo/portfolio flow — go straight to processing
    setCheckoutStep(3);
  }, []);

  const handleProcessingComplete = useCallback(() => {
    const orderNumber = `FW-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const params = new URLSearchParams({
      plan: planId!,
      orderNumber,
      amount: total.toString(),
      planName: selectedPlan!.name,
      classes: selectedPlan!.classes.toString(),
      duration: selectedPlan!.duration,
    });
    router.push(`/plans/success?${params.toString()}`);
  }, [planId, total, selectedPlan, router]);

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator (hidden during processing) */}
        {checkoutStep < 3 && (
          <CheckoutStepIndicator
            currentStep={checkoutStep === 1 ? 2 : 3}
          />
        )}

        {/* Step 1: Order Review */}
        {checkoutStep === 1 && (
          <OrderReviewStep
            plan={selectedPlan}
            addOns={addOns}
            onToggleAddOn={handleToggleAddOn}
            couponCode={couponCode}
            onCouponChange={setCouponCode}
            onApplyCoupon={handleApplyCoupon}
            couponApplied={couponApplied}
            discountAmount={discountAmount}
            total={total}
            formatCurrency={formatCurrency}
            onContinue={() => setCheckoutStep(2)}
            onBack={() => router.push("/plans")}
          />
        )}

        {/* Step 2: Payment */}
        {checkoutStep === 2 && (
          <PaymentStep
            plan={selectedPlan}
            addOns={addOns}
            discountAmount={discountAmount}
            total={total}
            formData={formData}
            onFormChange={handleFormChange}
            formatCurrency={formatCurrency}
            onComplete={handlePaymentComplete}
            onBack={() => setCheckoutStep(1)}
            errors={errors}
          />
        )}

        {/* Step 3: Processing */}
        {checkoutStep === 3 && (
          <ProcessingStep onComplete={handleProcessingComplete} />
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
