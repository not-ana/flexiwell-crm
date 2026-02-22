import type { CartItem, ShopCheckoutFormData } from "./types";
import { STATE_TAX_RATES } from "./constants";
import { getShippingCost } from "./shippingMethods";

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
}

export function calculateEstimatedTax(
  subtotal: number,
  state: string
): number {
  const rate = STATE_TAX_RATES[state] ?? 0;
  return Math.round(subtotal * rate * 100) / 100;
}

interface PromoResult {
  valid: boolean;
  discountAmount: number;
  label: string;
}

export function validatePromoCode(
  code: string,
  subtotal: number
): PromoResult {
  const upper = code.toUpperCase().trim();

  if (upper === "FLEX20") {
    return {
      valid: true,
      discountAmount: Math.round(subtotal * 0.2 * 100) / 100,
      label: "FLEX20 — 20% off",
    };
  }

  if (upper === "WELCOME10") {
    return {
      valid: true,
      discountAmount: Math.min(10, subtotal),
      label: "WELCOME10 — $10 off",
    };
  }

  return { valid: false, discountAmount: 0, label: "" };
}

export function calculateTotal(
  subtotal: number,
  shippingCost: number,
  estimatedTax: number,
  discountAmount: number
): number {
  return Math.max(
    0,
    Math.round((subtotal - discountAmount + shippingCost + estimatedTax) * 100) /
      100
  );
}

export function validateShopCheckoutForm(
  formData: ShopCheckoutFormData,
  step: number
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 1) {
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "Enter a valid email";
  }

  if (step === 2) {
    const s = formData.shipping;
    if (!s.firstName.trim()) errors["shipping.firstName"] = "Required";
    if (!s.lastName.trim()) errors["shipping.lastName"] = "Required";
    if (!s.address1.trim()) errors["shipping.address1"] = "Required";
    if (!s.city.trim()) errors["shipping.city"] = "Required";
    if (!s.state) errors["shipping.state"] = "Required";
    if (!s.zip.trim()) errors["shipping.zip"] = "Required";
    else if (!/^\d{5}(-\d{4})?$/.test(s.zip.trim()))
      errors["shipping.zip"] = "Enter a valid ZIP code";
    if (!s.country) errors["shipping.country"] = "Required";
    if (!formData.shippingMethodId)
      errors.shippingMethodId = "Select a shipping method";
  }

  if (step === 3) {
    if (!formData.sameAsShipping) {
      const b = formData.billing;
      if (!b.firstName.trim()) errors["billing.firstName"] = "Required";
      if (!b.lastName.trim()) errors["billing.lastName"] = "Required";
      if (!b.address1.trim()) errors["billing.address1"] = "Required";
      if (!b.city.trim()) errors["billing.city"] = "Required";
      if (!b.state) errors["billing.state"] = "Required";
      if (!b.zip.trim()) errors["billing.zip"] = "Required";
    }

    const cardNum = formData.cardNumber.replace(/\s/g, "");
    if (!cardNum) errors.cardNumber = "Card number is required";
    else if (cardNum.length < 13 || cardNum.length > 19)
      errors.cardNumber = "Enter a valid card number";

    if (!formData.cardExpiry) errors.cardExpiry = "Required";
    else if (!/^\d{2}\/\d{2}$/.test(formData.cardExpiry))
      errors.cardExpiry = "Use MM/YY format";

    if (!formData.cardCvv) errors.cardCvv = "Required";
    else if (formData.cardCvv.length < 3)
      errors.cardCvv = "Enter a valid CVV";

    if (!formData.cardholderName.trim())
      errors.cardholderName = "Cardholder name is required";

    if (!formData.agreeToTerms)
      errors.agreeToTerms = "You must agree to continue";
  }

  return errors;
}

export function getShippingCostForCheckout(
  methodId: string,
  subtotal: number
): number {
  return getShippingCost(methodId, subtotal);
}
