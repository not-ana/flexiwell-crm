"use client";

import { forwardRef } from "react";

// ============================================================================
// Types
// ============================================================================

interface ToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  description?: string;
  id?: string;
}

// ============================================================================
// Toggle Component
// ============================================================================

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ enabled, onChange, disabled = false, size = "md", label, description, id }, ref) => {
    // Size configurations
    const sizeConfig = {
      sm: {
        track: "h-5 w-9",
        thumb: "h-3 w-3",
        translate: enabled ? "translate-x-5" : "translate-x-1",
      },
      md: {
        track: "h-6 w-11",
        thumb: "h-4 w-4",
        translate: enabled ? "translate-x-6" : "translate-x-1",
      },
      lg: {
        track: "h-7 w-14",
        thumb: "h-5 w-5",
        translate: enabled ? "translate-x-8" : "translate-x-1",
      },
    };

    const config = sizeConfig[size];

    const handleClick = () => {
      if (!disabled) {
        onChange(!enabled);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    const toggle = (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex items-center rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${config.track}
          ${enabled ? "bg-primary-600" : "bg-gray-200"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span
          className={`
            inline-block rounded-full bg-white shadow-sm transition-transform
            ${config.thumb}
            ${config.translate}
          `}
        />
      </button>
    );

    // If there's a label or description, wrap in a flex container
    if (label || description) {
      return (
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {label && (
              <label
                htmlFor={id}
                className={`block text-sm font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={`text-sm ${disabled ? "text-gray-300" : "text-gray-500"}`}>
                {description}
              </p>
            )}
          </div>
          {toggle}
        </div>
      );
    }

    return toggle;
  }
);

Toggle.displayName = "Toggle";

// ============================================================================
// ToggleSetting Component (for settings pages)
// ============================================================================

interface ToggleSettingProps extends Omit<ToggleProps, "label" | "description"> {
  title: string;
  description?: string;
}

export function ToggleSetting({ title, description, ...toggleProps }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="pr-4">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <Toggle {...toggleProps} />
    </div>
  );
}

export default Toggle;
