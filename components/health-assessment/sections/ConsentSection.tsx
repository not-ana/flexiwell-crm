"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface ConsentSectionProps {
  agreedToTerms: boolean;
  agreedToLiabilityWaiver: boolean;
  liabilityWaiverText: string;
  termsText: string;
  onTermsChange: (value: boolean) => void;
  onWaiverChange: (value: boolean) => void;
  errors?: {
    terms?: string;
    waiver?: string;
  };
}

export function ConsentSection({
  agreedToTerms,
  agreedToLiabilityWaiver,
  liabilityWaiverText,
  termsText,
  onTermsChange,
  onWaiverChange,
  errors = {},
}: ConsentSectionProps) {
  const [showWaiverText, setShowWaiverText] = useState(false);
  const [showTermsText, setShowTermsText] = useState(false);

  return (
    <div className="space-y-6">
      {/* Liability Waiver */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="waiver"
            checked={agreedToLiabilityWaiver}
            onChange={(e) => onWaiverChange(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div className="flex-1">
            <label htmlFor="waiver" className="text-sm font-medium text-gray-700 cursor-pointer">
              I acknowledge the Liability Waiver <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowWaiverText(!showWaiverText)}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-1"
            >
              {showWaiverText ? (
                <>
                  <ChevronUpIcon className="w-4 h-4" />
                  Hide waiver text
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-4 h-4" />
                  Read liability waiver
                </>
              )}
            </button>
          </div>
        </div>

        {showWaiverText && (
          <div className="ml-7 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {liabilityWaiverText}
          </div>
        )}

        {errors.waiver && (
          <p className="text-sm text-red-600 ml-7">{errors.waiver}</p>
        )}
      </div>

      {/* Terms of Service */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div className="flex-1">
            <label htmlFor="terms" className="text-sm font-medium text-gray-700 cursor-pointer">
              I have read and agree to the Terms of Service <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowTermsText(!showTermsText)}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-1"
            >
              {showTermsText ? (
                <>
                  <ChevronUpIcon className="w-4 h-4" />
                  Hide terms
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-4 h-4" />
                  Read terms of service
                </>
              )}
            </button>
          </div>
        </div>

        {showTermsText && (
          <div className="ml-7 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {termsText}
          </div>
        )}

        {errors.terms && (
          <p className="text-sm text-red-600 ml-7">{errors.terms}</p>
        )}
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          By submitting this form, you confirm that all information provided is accurate and complete to the best of your knowledge.
        </p>
      </div>
    </div>
  );
}
