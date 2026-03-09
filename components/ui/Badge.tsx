import { memo } from "react";

export interface BadgeStyle {
  bg: string;
  text: string;
  dot?: string;
  label: string;
}

interface BadgeProps {
  style: BadgeStyle;
  children?: React.ReactNode;
}

/**
 * Standardized badge component used across the platform.
 * Renders a pill with optional colored dot + label.
 */
export const Badge = memo(function Badge({ style, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      )}
      {children ?? style.label}
    </span>
  );
});