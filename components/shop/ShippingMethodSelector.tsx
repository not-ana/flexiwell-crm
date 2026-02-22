"use client";

import { Truck } from "lucide-react";
import type { ShippingMethod } from "@/lib/shop/types";

interface ShippingMethodSelectorProps {
  methods: ShippingMethod[];
  selectedId: string;
  onSelect: (methodId: string) => void;
  formatCurrency: (amount: number) => string;
}

export function ShippingMethodSelector({
  methods,
  selectedId,
  onSelect,
  formatCurrency,
}: ShippingMethodSelectorProps) {
  return (
    <div className="space-y-3">
      {methods.map((method) => {
        const isSelected = method.id === selectedId;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
              isSelected
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Radio circle */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? "border-primary-600" : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                )}
              </div>

              <Truck className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-primary-600" : "text-gray-400"}`} />

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${isSelected ? "text-primary-900" : "text-gray-900"}`}>
                    {method.name}
                  </p>
                  <p className={`text-sm font-semibold ${
                    method.isFree || method.price === 0
                      ? "text-green-600"
                      : isSelected
                      ? "text-primary-900"
                      : "text-gray-900"
                  }`}>
                    {method.price === 0 ? "FREE" : formatCurrency(method.price)}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{method.estimatedDays}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
