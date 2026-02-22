"use client";

import { useState } from "react";
import { MapPin, Truck, ChevronDown, ChevronUp, CreditCard, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { ShippingMethodSelector } from "@/components/shop/ShippingMethodSelector";
import { ShopOrderSummary } from "@/components/shop/ShopOrderSummary";
import { TrustBadges } from "@/components/checkout/TrustBadges";
import type { CartItem, ShopCheckoutFormData, ShippingMethod } from "@/lib/shop/types";
import { COUNTRIES, US_STATES, inputClasses, errorInputClasses, labelClasses } from "@/lib/shop/constants";

interface ShippingStepProps {
  formData: ShopCheckoutFormData;
  onFormChange: (path: string, value: string | boolean) => void;
  availableShippingMethods: ShippingMethod[];
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

export function ShippingStep({
  formData,
  onFormChange,
  availableShippingMethods,
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
}: ShippingStepProps) {
  const [mobileOrderExpanded, setMobileOrderExpanded] = useState(false);
  const s = formData.shipping;

  const renderError = (field: string) => {
    if (!errors[field]) return null;
    return <p className="mt-1 text-xs text-red-600">{errors[field]}</p>;
  };

  const getInputClass = (field: string) =>
    errors[field] ? errorInputClasses : inputClasses;

  return (
    <div className="lg:grid lg:grid-cols-5 lg:gap-8">
      <div className="lg:col-span-3">
        {/* Mobile order summary accordion */}
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

        {/* Shipping Address */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Shipping Address
            </h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ship-firstName" className={labelClasses}>
                  First Name
                </label>
                <input
                  id="ship-firstName"
                  type="text"
                  autoComplete="given-name"
                  value={s.firstName}
                  onChange={(e) =>
                    onFormChange("shipping.firstName", e.target.value)
                  }
                  placeholder="John"
                  className={getInputClass("shipping.firstName")}
                />
                {renderError("shipping.firstName")}
              </div>
              <div>
                <label htmlFor="ship-lastName" className={labelClasses}>
                  Last Name
                </label>
                <input
                  id="ship-lastName"
                  type="text"
                  autoComplete="family-name"
                  value={s.lastName}
                  onChange={(e) =>
                    onFormChange("shipping.lastName", e.target.value)
                  }
                  placeholder="Doe"
                  className={getInputClass("shipping.lastName")}
                />
                {renderError("shipping.lastName")}
              </div>
            </div>
            <div>
              <label htmlFor="ship-address1" className={labelClasses}>
                Address Line 1
              </label>
              <input
                id="ship-address1"
                type="text"
                autoComplete="address-line1"
                value={s.address1}
                onChange={(e) =>
                  onFormChange("shipping.address1", e.target.value)
                }
                placeholder="123 Main St"
                className={getInputClass("shipping.address1")}
              />
              {renderError("shipping.address1")}
            </div>
            <div>
              <label htmlFor="ship-address2" className={labelClasses}>
                Address Line 2{" "}
                <span className="text-gray-400 font-normal">Optional</span>
              </label>
              <input
                id="ship-address2"
                type="text"
                autoComplete="address-line2"
                value={s.address2}
                onChange={(e) =>
                  onFormChange("shipping.address2", e.target.value)
                }
                placeholder="Apt, suite, unit, etc."
                className={inputClasses}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="ship-city" className={labelClasses}>
                  City
                </label>
                <input
                  id="ship-city"
                  type="text"
                  autoComplete="address-level2"
                  value={s.city}
                  onChange={(e) =>
                    onFormChange("shipping.city", e.target.value)
                  }
                  placeholder="New York"
                  className={getInputClass("shipping.city")}
                />
                {renderError("shipping.city")}
              </div>
              <div>
                <label htmlFor="ship-state" className={labelClasses}>
                  State
                </label>
                <select
                  id="ship-state"
                  autoComplete="address-level1"
                  value={s.state}
                  onChange={(e) =>
                    onFormChange("shipping.state", e.target.value)
                  }
                  className={getInputClass("shipping.state")}
                >
                  <option value="">Select</option>
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                {renderError("shipping.state")}
              </div>
              <div>
                <label htmlFor="ship-zip" className={labelClasses}>
                  ZIP Code
                </label>
                <input
                  id="ship-zip"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={s.zip}
                  onChange={(e) =>
                    onFormChange("shipping.zip", e.target.value)
                  }
                  placeholder="10001"
                  className={getInputClass("shipping.zip")}
                />
                {renderError("shipping.zip")}
              </div>
            </div>
            <div>
              <label htmlFor="ship-country" className={labelClasses}>
                Country
              </label>
              <select
                id="ship-country"
                autoComplete="country"
                value={s.country}
                onChange={(e) =>
                  onFormChange("shipping.country", e.target.value)
                }
                className={getInputClass("shipping.country")}
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {renderError("shipping.country")}
            </div>
          </div>
        </div>

        {/* Shipping Method */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Truck className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Shipping Method
            </h2>
          </div>
          <ShippingMethodSelector
            methods={availableShippingMethods}
            selectedId={formData.shippingMethodId}
            onSelect={(id) => onFormChange("shippingMethodId", id)}
            formatCurrency={formatCurrency}
          />
          {renderError("shippingMethodId")}
        </div>

        <Button
          variant="primary"
          size="xl"
          fullWidth
          rightIcon={<ArrowRight className="w-5 h-5" />}
          onClick={onContinue}
        >
          Continue to Payment
        </Button>

        <div className="text-center mt-4 mb-8 lg:mb-0">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to Cart
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
  );
}
