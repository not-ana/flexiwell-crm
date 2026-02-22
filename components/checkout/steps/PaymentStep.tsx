"use client";

import { useState } from "react";
import {
  Mail,
  MapPin,
  CreditCard,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { OrderSummaryCard } from "@/components/checkout/OrderSummaryCard";
import { TrustBadges } from "@/components/checkout/TrustBadges";
import type { PlanPackage, AddOn, CheckoutFormData } from "@/lib/checkout/types";

interface PaymentStepProps {
  plan: PlanPackage;
  addOns: AddOn[];
  discountAmount: number;
  total: number;
  formData: CheckoutFormData;
  onFormChange: (field: keyof CheckoutFormData, value: string | boolean) => void;
  formatCurrency: (amount: number) => string;
  onComplete: () => void;
  onBack: () => void;
  errors: Record<string, string>;
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
  if (cleaned.length >= 3) {
    return cleaned.slice(0, 2) + "/" + cleaned.slice(2);
  }
  return cleaned;
}

const inputClasses =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-colors";

const errorInputClasses =
  "w-full px-3 py-2.5 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm transition-colors";

const labelClasses = "block text-sm font-medium text-gray-700 mb-1.5";

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "PT", label: "Portugal" },
  { value: "ES", label: "Spain" },
  { value: "MX", label: "Mexico" },
  { value: "BR", label: "Brazil" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

export function PaymentStep({
  plan,
  addOns,
  discountAmount,
  total,
  formData,
  onFormChange,
  formatCurrency,
  onComplete,
  onBack,
  errors,
}: PaymentStepProps) {
  const [mobileOrderExpanded, setMobileOrderExpanded] = useState(false);

  const cardBrand = getCardBrand(formData.cardNumber);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete();
  };

  const renderFieldError = (field: string) => {
    if (!errors[field]) return null;
    return (
      <p className="mt-1 text-xs text-red-600">{errors[field]}</p>
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="lg:grid lg:grid-cols-5 lg:gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-3">
          {/* Mobile Order Summary Accordion */}
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
                <OrderSummaryCard
                  plan={plan}
                  addOns={addOns}
                  discountAmount={discountAmount}
                  compact
                  formatCurrency={formatCurrency}
                />
              </div>
            )}
          </div>

          {/* Section 1: Contact Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <Mail className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Contact Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-email" className={labelClasses}>Email</label>
                <input
                  id="checkout-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => onFormChange("email", e.target.value)}
                  placeholder="you@example.com"
                  className={errors.email ? errorInputClasses : inputClasses}
                />
                {renderFieldError("email")}
              </div>
              <div>
                <label htmlFor="checkout-phone" className={labelClasses}>Phone</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => onFormChange("phone", e.target.value)}
                  placeholder="(555) 000-0000"
                  className={errors.phone ? errorInputClasses : inputClasses}
                />
                {renderFieldError("phone")}
              </div>
            </div>
          </div>

          {/* Section 2: Billing Address */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Billing Address
              </h2>
            </div>

            <div className="space-y-4">
              {/* First + Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkout-firstName" className={labelClasses}>First Name</label>
                  <input
                    id="checkout-firstName"
                    type="text"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={(e) => onFormChange("firstName", e.target.value)}
                    placeholder="John"
                    className={errors.firstName ? errorInputClasses : inputClasses}
                  />
                  {renderFieldError("firstName")}
                </div>
                <div>
                  <label htmlFor="checkout-lastName" className={labelClasses}>Last Name</label>
                  <input
                    id="checkout-lastName"
                    type="text"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={(e) => onFormChange("lastName", e.target.value)}
                    placeholder="Doe"
                    className={errors.lastName ? errorInputClasses : inputClasses}
                  />
                  {renderFieldError("lastName")}
                </div>
              </div>

              {/* Address Line 1 */}
              <div>
                <label htmlFor="checkout-address1" className={labelClasses}>Address Line 1</label>
                <input
                  id="checkout-address1"
                  type="text"
                  autoComplete="address-line1"
                  value={formData.address1}
                  onChange={(e) => onFormChange("address1", e.target.value)}
                  placeholder="123 Main St"
                  className={errors.address1 ? errorInputClasses : inputClasses}
                />
                {renderFieldError("address1")}
              </div>

              {/* Address Line 2 */}
              <div>
                <label htmlFor="checkout-address2" className={labelClasses}>
                  Address Line 2{" "}
                  <span className="text-gray-400 font-normal">Optional</span>
                </label>
                <input
                  id="checkout-address2"
                  type="text"
                  autoComplete="address-line2"
                  value={formData.address2}
                  onChange={(e) => onFormChange("address2", e.target.value)}
                  placeholder="Apt, suite, unit, etc."
                  className={inputClasses}
                />
              </div>

              {/* City + State + ZIP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="checkout-city" className={labelClasses}>City</label>
                  <input
                    id="checkout-city"
                    type="text"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={(e) => onFormChange("city", e.target.value)}
                    placeholder="New York"
                    className={errors.city ? errorInputClasses : inputClasses}
                  />
                  {renderFieldError("city")}
                </div>
                <div>
                  <label htmlFor="checkout-state" className={labelClasses}>State</label>
                  <select
                    id="checkout-state"
                    autoComplete="address-level1"
                    value={formData.state}
                    onChange={(e) => onFormChange("state", e.target.value)}
                    className={errors.state ? errorInputClasses : inputClasses}
                  >
                    <option value="">Select</option>
                    {US_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  {renderFieldError("state")}
                </div>
                <div>
                  <label htmlFor="checkout-zip" className={labelClasses}>ZIP Code</label>
                  <input
                    id="checkout-zip"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={formData.zip}
                    onChange={(e) => onFormChange("zip", e.target.value)}
                    placeholder="10001"
                    className={errors.zip ? errorInputClasses : inputClasses}
                  />
                  {renderFieldError("zip")}
                </div>
              </div>

              {/* Country */}
              <div>
                <label htmlFor="checkout-country" className={labelClasses}>Country</label>
                <select
                  id="checkout-country"
                  autoComplete="country"
                  value={formData.country}
                  onChange={(e) => onFormChange("country", e.target.value)}
                  className={errors.country ? errorInputClasses : inputClasses}
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {renderFieldError("country")}
              </div>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-5 h-5 text-primary-600" />
              <h2 className="text-base font-semibold text-gray-900">
                Payment Method
              </h2>
            </div>

            {/* Credit Card Fields */}
            <div className="space-y-4">
              {/* Card Number */}
              <div>
                <label htmlFor="checkout-cardNumber" className={labelClasses}>Card Number</label>
                <div className="relative">
                  <input
                    id="checkout-cardNumber"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={formData.cardNumber}
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value);
                      onFormChange("cardNumber", formatted);
                    }}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className={
                      errors.cardNumber ? errorInputClasses : inputClasses
                    }
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
                {renderFieldError("cardNumber")}
              </div>

              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkout-cardExpiry" className={labelClasses}>Expiry Date</label>
                  <input
                    id="checkout-cardExpiry"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={formData.cardExpiry}
                    onChange={(e) => {
                      const formatted = formatExpiry(e.target.value);
                      onFormChange("cardExpiry", formatted);
                    }}
                    placeholder="MM/YY"
                    maxLength={5}
                    className={
                      errors.cardExpiry ? errorInputClasses : inputClasses
                    }
                  />
                  {renderFieldError("cardExpiry")}
                </div>
                <div>
                  <label htmlFor="checkout-cardCvv" className={labelClasses}>CVV</label>
                  <input
                    id="checkout-cardCvv"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={formData.cardCvv}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      onFormChange("cardCvv", val);
                    }}
                    placeholder="123"
                    maxLength={4}
                    className={
                      errors.cardCvv ? errorInputClasses : inputClasses
                    }
                  />
                  {renderFieldError("cardCvv")}
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label htmlFor="checkout-cardholderName" className={labelClasses}>Cardholder Name</label>
                <input
                  id="checkout-cardholderName"
                  type="text"
                  autoComplete="cc-name"
                  value={formData.cardholderName}
                  onChange={(e) =>
                    onFormChange("cardholderName", e.target.value)
                  }
                  placeholder="John Doe"
                  className={
                    errors.cardholderName ? errorInputClasses : inputClasses
                  }
                />
                {renderFieldError("cardholderName")}
              </div>
            </div>

            {/* Save Payment Method */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <label htmlFor="checkout-savePayment" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="checkout-savePayment"
                  type="checkbox"
                  checked={formData.savePaymentMethod}
                  onChange={(e) =>
                    onFormChange("savePaymentMethod", e.target.checked)
                  }
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">
                  Save payment method for future purchases
                </span>
              </label>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mb-6">
            <label htmlFor="checkout-agreeToTerms" className="flex items-start gap-3 cursor-pointer">
              <input
                id="checkout-agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) =>
                  onFormChange("agreeToTerms", e.target.checked)
                }
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">
                I agree to the{" "}
                <span className="text-primary-600 hover:underline cursor-pointer">Terms of Service</span>
                {" "}and{" "}
                <span className="text-primary-600 hover:underline cursor-pointer">Privacy Policy</span>
              </span>
            </label>
          </div>

          {/* Complete Purchase CTA */}
          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            leftIcon={<Lock className="w-5 h-5" />}
          >
            Complete Purchase — {formatCurrency(total)}
          </Button>

          {/* Trust Badges (below CTA) */}
          <div className="mt-4 mb-6">
            <TrustBadges variant="horizontal" showPaymentBrands />
          </div>

          {/* Back link */}
          <div className="text-center mb-8 lg:mb-0">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to Review
            </button>
          </div>
        </div>

        {/* Right Column - Sticky Order Summary (Desktop only) */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            {/* Need Help Banner */}
            <TrustBadges showHelpBanner variant="horizontal" />

            <OrderSummaryCard
              plan={plan}
              addOns={addOns}
              discountAmount={discountAmount}
              showGuaranteeBadge
              showSupportLink={false}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
