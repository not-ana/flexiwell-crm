"use client";

import { Check } from "lucide-react";

interface CheckoutStepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

const steps = [
  { full: "Select Plan", short: "Plan" },
  { full: "Review Order", short: "Review" },
  { full: "Payment", short: "Pay" },
  { full: "Confirmation", short: "Done" },
];

export function CheckoutStepIndicator({ currentStep }: CheckoutStepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {steps.map((step, index) => {
          const stepNumber = (index + 1) as 1 | 2 | 3 | 4;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={step.full} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    isCompleted
                      ? "bg-primary-600 text-white"
                      : isCurrent
                      ? "border-2 border-primary-600 text-primary-600 bg-primary-50"
                      : "border-2 border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium whitespace-nowrap ${
                    isCompleted || isCurrent ? "text-primary-600" : "text-gray-400"
                  }`}
                >
                  <span className="sm:hidden">{step.short}</span>
                  <span className="hidden sm:inline">{step.full}</span>
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 sm:mx-3 ${
                    stepNumber < currentStep ? "bg-primary-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
