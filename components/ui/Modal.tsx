"use client";

import { useEffect, useRef, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";

// ============================================================================
// Types
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

interface ModalHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

// ============================================================================
// Modal Root Component
// ============================================================================

export function Modal({
  isOpen,
  onClose,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Size classes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };

  // Handle ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Track if modal was just opened
  const wasOpen = useRef(false);

  // Focus management - only on initial open
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      // Store current active element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus modal only on initial open
      modalRef.current?.focus();

      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }

    wasOpen.current = isOpen;

    return () => {
      if (!isOpen) {
        document.body.style.overflow = "";

        // Restore focus
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      }
    };
  }, [isOpen]);

  // Handle ESC key - separate effect to avoid re-focusing
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Use portal for proper stacking context
  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} mx-4 overflow-hidden focus:outline-none`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// Modal Header
// ============================================================================

export function ModalHeader({
  children,
  onClose,
  showCloseButton = true,
}: ModalHeaderProps) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-gray-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">{children}</div>
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Modal Body
// ============================================================================

export function ModalBody({ children, className = "" }: ModalBodyProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// Modal Footer
// ============================================================================

export function ModalFooter({ children, className = "" }: ModalFooterProps) {
  return (
    <div className={`px-6 pb-6 flex gap-3 justify-end ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// Modal Title & Description (Helper Components)
// ============================================================================

export function ModalTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-gray-900">
      {children}
    </h3>
  );
}

export function ModalDescription({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-gray-600 mt-1">
      {children}
    </p>
  );
}
