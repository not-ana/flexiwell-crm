"use client";

import { useState } from "react";
import { CreditCard, Lock, ChevronDown, ChevronUp } from "lucide-react";
import Button from "@/components/ui/Button";
import { ShopOrderSummary } from "@/components/shop/ShopOrderSummary";
import { TrustBadges } from "@/components/checkout/TrustBadges";
import type { CartItem, ShopCheckoutFormData } from "@/lib/shop/types";
import {
  COUNTRIES,
  US_STATES,
  inputClasses,
  errorInputClasses,
  labelClasses,
} from "@/lib/shop/constants";

interface ShopPaymentStepProps {
  formData: ShopCheckoutFormData;
  onFormChange: (path: string, value: string | boolean) => void;
  formatCurrency: (amount: number) => string;
  onContinue: () => void;
  onBack: () => void;
  errors: Record<string, string>;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  estimatedTax: number;
  discountAmount: number;
  total: number;
}

function getCardBrand(number: string): string | null {
  const cleaned = number.replace(/\s/g, "");
  if (cleaned.startsWith("4")) return "VISA";
  if (cleaned.startsWith("5")) return "MC";
  if (cleaned.startsWith("3")) return "AMEX";
  return null;
}

function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 16);
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(" ") : cleaned;
}

function formatExpiry(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 4);
  if (cleaned.length >= 3)
    return cleaned.slice(0, 2) + "/" + cleaned.slice(2);
  return cleaned;
}

export function ShopPaymentStep({
  formData,
  onFormChange,
  formatCurrency,
  onContinue,
  onBack,
  errors,
  items,
  subtotal,
  shippingCost,
  estimatedTax,
  discountAmount,
  total,
}: ShopPaymentStepProps) {
  const [mobileOrderExpanded, setMobileOrderExpanded] = useState(false);
  const cardBrand = getCardBrand(formData.cardNumber);
  const b = formData.billing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue();
  };

  const renderError = (field: string) => {
    if (!errors[field]) return null;
    return <p className="mt-1 text-xs text-red-600">{errors[field]}</p>;
  };

  const getInputClass = (field: string) =>
    errors[field] ? errorInputClasses : inputClasses;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="lg:grid lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          {/* Mobile order summary */}
          <div className="lg:hidden mb-6">
            <button
              type="button"
              onClick={() => setMobileOrderExpanded(!mobileOrderExpanded)}
              className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  Order Summary
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(total)}
                </span>
                {mobileOrderExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
            {mobileOrderExpanded && (
              <div className="mt-2">
                <ShopOrderSummary
                  items={items}
                  subtotal={subtotal}
                  shippingCost={shippingCost}
                  estimatedTax={estimatedTax}
                  discountAmount={discountAmount}
                  total={total}
                  formatCurrency={formatCurrency}
                  compact
                />
              </div>
            )}
          </div>

          {/* Billing Address */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Billing Address
            </h2>
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={formData.sameAsShipping}
                onChange={(e) =>
                  onFormChange("sameAsShipping", e.target.checked)
                }
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Same as shipping address
              </span>
            </label>
            {!formData.sameAsShipping && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bill-firstName" className={labelClasses}>
                      First Name
                    </label>
                    <input
                      id="bill-firstName"
                      type="text"
                      value={b.firstName}
                      onChange={(e) =>
                        onFormChange("billing.firstName", e.target.value)
                      }
                      placeholder="John"
                      className={getInputClass("billing.firstName")}
                    />
                    {renderError("billing.firstName")}
                  </div>
                  <div>
                    <label htmlFor="bill-lastName" className={labelClasses}>
                      Last Name
                    </label>
                    <input
                      id="bill-lastName"
                      type="text"
                      value={b.lastName}
                      onChange={(e) =>
                        onFormChange("billing.lastName", e.target.value)
                      }
                      placeholder="Doe"
                      className={getInputClass("billing.lastName")}
                    />
                    {renderError("billing.lastName")}
                  </div>
                </div>
                <div>
                  <label htmlFor="bill-address1" className={labelClasses}>
                    Address Line 1
                  </label>
                  <input
                    id="bill-address1"
                    type="text"
                    value={b.address1}
                    onChange={(e) =>
                      onFormChange("billing.address1", e.target.value)
                    }
                    placeholder="123 Main St"
                    className={getInputClass("billing.address1")}
                  />
                  {renderError("billing.address1")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="bill-city" className={labelClasses}>
                      City
                    </label>
                    <input
                      id="bill-city"
                      type="text"
                      value={b.city}
                      onChange={(e) =>
                        onFormChange("billing.city", e.target.value)
                      }
                      placeholder="New York"
                      className={getInputClass("billing.city")}
                    />
                    {renderError("billing.city")}
                  </div>
                  <div>
                    <label htmlFor="bill-state" className={labelClasses}>
                      State
                    </label>
                    <select
                      id="bill-state"
                      value={b.state}
                      onChange={(e) =>
                        onFormChange("billing.state", e.target.value)
                      }
                      className={getInputClass("billing.state")}
                    >
                      <option value="">Select</option>
                      {US_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    {renderError("billing.state")}
                  </div>
                  <div>
                    <label htmlFor="bill-zip" className={labelClasses}>
                      ZIP Code
                    </label>
                    <input
                      id="bill-zip"
                      type="text"
                      inputMode="numeric"
                      value={b.zip}
                      onChange={(e) =>
                        onFormChange("billing.zip", e.target.value)
                      }
                      placeholder="10001"
                      className={getInputClass("billing.zip")}
                    />
                    {renderError("billing.zip")}
                  </div>
                </div>
                <div>
                  <label htmlFor="bill-country" className={labelClasses}>
                    Country
                  </label>
                  <select
                    id="bill-country"
                    value={b.country}
                    onChange={(e) =>
                      onFormChange("billing.country", e.target.value)
                    }
                    className={inputClasses}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Payment
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="shop-cardNumber" className={labelClasses}>
                  Card Number
                </label>
                <div className="relative">
                  <input
                    id="shop-cardNumber"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={formData.cardNumber}
                    onChange={(e) =>
                      onFormChange(
                        "cardNumber",
                        formatCardNumber(e.target.value)
                      )
                    }
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className={getInputClass("cardNumber")}
                  />
                  {cardBrand && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                          cardBrand === "VISA"
                            ? "bg-blue-600"
                            : cardBrand === "MC"
                            ? "bg-red-500"
                            : "bg-blue-400"
                        }`}
                      >
                        {cardBrand}
                      </span>
                    </div>
                  )}
                </div>
                {renderError("cardNumber")}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="shop-cardExpiry" className={labelClasses}>
                    Expiry Date
                  </label>
                  <input
                    id="shop-cardExpiry"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={formData.cardExpiry}
                    onChange={(e) =>
                      onFormChange(
                        "cardExpiry",
                        formatExpiry(e.target.value)
                      )
                    }
                    placeholder="MM/YY"
                    maxLength={5}
                    className={getInputClass("cardExpiry")}
                  />
                  {renderError("cardExpiry")}
                </div>
                <div>
                  <label htmlFor="shop-cardCvv" className={labelClasses}>
                    CVV
                  </label>
                  <input
                    id="shop-cardCvv"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={formData.cardCvv}
                    onChange={(e) =>
                      onFormChange(
                        "cardCvv",
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    placeholder="123"
                    maxLength={4}
                    className={getInputClass("cardCvv")}
                  />
                  {renderError("cardCvv")}
                </div>
              </div>
              <div>
                <label
                  htmlFor="shop-cardholderName"
                  className={labelClasses}
                >
                  Cardholder Name
                </label>
                <input
                  id="shop-cardholderName"
                  type="text"
                  autoComplete="cc-name"
                  value={formData.cardholderName}
                  onChange={(e) =>
                    onFormChange("cardholderName", e.target.value)
                  }
                  placeholder="John Doe"
                  className={getInputClass("cardholderName")}
                />
                {renderError("cardholderName")}
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) =>
                  onFormChange("agreeToTerms", e.target.checked)
                }
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">
                I agree to the{" "}
                <span className="text-primary-600 hover:underline cursor-pointer">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-primary-600 hover:underline cursor-pointer">
                  Privacy Policy
                </span>
              </span>
            </label>
            {renderError("agreeToTerms")}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            leftIcon={<Lock className="w-5 h-5" />}
          >
            Review Order — {formatCurrency(total)}
          </Button>

          <div className="mt-4 mb-6">
            <TrustBadges variant="horizontal" showPaymentBrands />
          </div>

          <div className="text-center mb-8 lg:mb-0">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to Shipping
            </button>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <TrustBadges showHelpBanner variant="horizontal" />
            <ShopOrderSummary
              items={items}
              subtotal={subtotal}
              shippingCost={shippingCost}
              estimatedTax={estimatedTax}
              discountAmount={discountAmount}
              total={total}
              formatCurrency={formatCurrency}
              showGuaranteeBadge
            />
          </div>
        </div>
      </div>
    </form>
  );
}
