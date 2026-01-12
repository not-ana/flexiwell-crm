// Business Constants
export const CANCELLATION_HOURS_BEFORE = 12;
export const WAITLIST_NOTIFICATION_HOURS = 2;
export const BRAZIL_COUNTRY_CODE = "55";

// Token Keys
export const TOKEN_KEY = "flexiwell_access_token";
export const REFRESH_TOKEN_KEY = "flexiwell_refresh_token";

// Pagination Defaults
export const DEFAULT_PAGE_SIZE = 50;
export const DEFAULT_PAGE = 1;

// Date Formats
export const DATE_FORMAT_BR = "pt-BR";

// Status Types
export const CLIENT_STATUSES = ["active", "inactive", "pending", "paused", "expired"] as const;
export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed", "no-show"] as const;
export const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"] as const;
export const CLASS_STATUSES = ["scheduled", "cancelled", "completed"] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type ClassStatus = (typeof CLASS_STATUSES)[number];
