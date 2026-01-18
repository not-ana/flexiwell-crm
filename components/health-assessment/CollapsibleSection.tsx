"use client";

import { useState, ReactNode } from "react";
import { ChevronDownIcon, CheckCircleIcon } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  isRequired?: boolean;
  isComplete?: boolean;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  description,
  isRequired = false,
  isComplete = false,
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
          ) : (
            <div
              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                isRequired ? "border-primary-500" : "border-gray-300"
              }`}
            />
          )}
          <div>
            <h3 className="font-medium text-gray-900">
              {title}
              {isRequired && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h3>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}
