/**
 * Shared toast notification utility
 * Replaces duplicate implementations across pages
 */

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

const toastStyles: Record<ToastType, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-blue-600",
  warning: "bg-amber-600",
};

/**
 * Show a toast notification
 * @param message - Message to display
 * @param type - Toast type (success, error, info, warning)
 * @param duration - Duration in milliseconds (default: 3000)
 */
export function showToast(
  message: string,
  type: ToastType = "success",
  duration: number = 3000
): void {
  const toast = document.createElement("div");
  const bgColor = toastStyles[type] || toastStyles.success;

  toast.className = `fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white text-sm font-medium z-50 shadow-lg transition-opacity ${bgColor}`;
  toast.style.transform = "translateX(-50%)";
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Convenience methods for different toast types
 */
export const toast = {
  success: (message: string, duration?: number) => showToast(message, "success", duration),
  error: (message: string, duration?: number) => showToast(message, "error", duration),
  info: (message: string, duration?: number) => showToast(message, "info", duration),
  warning: (message: string, duration?: number) => showToast(message, "warning", duration),
};
