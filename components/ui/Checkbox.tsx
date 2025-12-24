"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = "", disabled, ...props }, ref) => {
    return (
      <label
        className={`inline-flex items-start gap-2 cursor-pointer ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        } ${className}`}
      >
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div className="w-4 h-4 border border-gray-300 rounded bg-white transition-colors peer-checked:bg-primary-600 peer-checked:border-primary-600 peer-focus:ring-4 peer-focus:ring-primary-100 peer-disabled:bg-gray-100 peer-disabled:border-gray-300">
            <svg
              className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M13.3 4.3L6 11.6L2.7 8.3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <svg
            className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M13.3 4.3L6 11.6L2.7 8.3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-gray-700">{label}</span>
            )}
            {description && (
              <span className="text-sm text-gray-600">{description}</span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
