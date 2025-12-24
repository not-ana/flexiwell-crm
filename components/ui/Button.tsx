"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "link";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-4 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-100 disabled:bg-primary-200",
      secondary:
        "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-100 disabled:bg-white disabled:text-gray-300 disabled:border-gray-200",
      tertiary:
        "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-700 focus:ring-gray-100 disabled:text-gray-300",
      link: "bg-transparent text-primary-700 hover:text-primary-800 focus:ring-0 disabled:text-gray-300 p-0",
    };

    const sizes = {
      sm: "text-sm px-3.5 py-2 gap-1.5",
      md: "text-sm px-4 py-2.5 gap-1.5",
      lg: "text-base px-4.5 py-2.5 gap-2",
      xl: "text-base px-5 py-3 gap-2",
      "2xl": "text-lg px-7 py-4 gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${
          variant !== "link" ? sizes[size] : ""
        } ${fullWidth ? "w-full" : ""} ${className}`}
        disabled={disabled}
        {...props}
      >
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
