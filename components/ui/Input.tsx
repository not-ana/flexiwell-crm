"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      className = "",
      type = "text",
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    const baseInputStyles =
      "w-full px-3.5 py-2.5 text-base text-gray-900 bg-white border rounded-lg shadow-sm transition-colors placeholder:text-gray-500 focus:outline-none focus:ring-4 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed";

    const borderStyles = error
      ? "border-error-300 focus:border-error-300 focus:ring-error-100"
      : "border-gray-300 focus:border-primary-300 focus:ring-primary-100";

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={`${baseInputStyles} ${borderStyles} ${
              leftIcon ? "pl-10" : ""
            } ${rightIcon || isPassword ? "pr-10" : ""}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
          {rightIcon && !isPassword && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              {rightIcon}
            </span>
          )}
        </div>
        {hint && !error && <p className="text-sm text-gray-600">{hint}</p>}
        {error && <p className="text-sm text-error-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
