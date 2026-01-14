// TotalPass Integration Types (Brazil Market)

// Credentials stored in database
export interface TotalPassCredentials {
  apiKey: string;
  partnerId: string;
  webhookSecret: string;
}

// Member Validation API Types
export interface TotalPassValidateRequest {
  cardNumber: string; // TotalPass card number
  studioId?: string;
}

export interface TotalPassValidateResponse {
  valid: boolean;
  member: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    plan: string;
    expiresAt: string;
  };
  checkInId: string;
  validatedAt: string;
}

// Booking API Types
export type TotalPassBookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "completed";

export interface TotalPassBookingRequest {
  bookingId: string;
  member: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  class: {
    id: string;
    name: string;
    datetime: string; // ISO 8601
    instructor?: string;
  };
  createdAt: string;
}

export interface TotalPassBookingUpdateRequest {
  status: "accepted" | "rejected";
  reason?: string; // Required if rejected
}

// Webhook Types
export interface TotalPassBookingWebhook {
  event: "booking.created" | "booking.cancelled";
  data: TotalPassBookingRequest;
  timestamp: string;
}

export interface TotalPassCheckinWebhook {
  event: "checkin";
  data: {
    member: {
      id: string;
      cardNumber: string;
      name: string;
    };
    checkinId: string;
    checkedInAt: string;
  };
  timestamp: string;
}

export interface TotalPassCancellationWebhook {
  event: "booking.cancelled";
  data: {
    bookingId: string;
    member: {
      id: string;
    };
    cancelledAt: string;
    reason?: string;
  };
  timestamp: string;
}

// Class Sync Types (CRM -> TotalPass)
export interface TotalPassClassCreate {
  externalId: string; // Our class ID
  name: string;
  description?: string;
  instructor: string;
  datetime: string; // ISO 8601
  duration: number; // minutes
  capacity: number;
  availableSpots: number;
  category: string; // yoga, pilates, etc.
  location?: string;
}

export interface TotalPassClassUpdate {
  name?: string;
  description?: string;
  instructor?: string;
  datetime?: string;
  duration?: number;
  capacity?: number;
  availableSpots?: number;
  status?: "active" | "cancelled";
}

export interface TotalPassClassResponse {
  id: string; // TotalPass class ID
  externalId: string; // Our class ID
  name: string;
  status: "active" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

// Webhook Event Union Type
export type TotalPassWebhookEvent =
  | TotalPassBookingWebhook
  | TotalPassCheckinWebhook
  | TotalPassCancellationWebhook;

// API Error Response
export interface TotalPassApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Attendance Report Types
export interface TotalPassAttendanceReport {
  bookingId: string;
  memberId: string;
  attended: boolean;
  attendedAt?: string;
  noShowReason?: string;
}

// Client extension for TotalPass members
export interface TotalPassClientData {
  totalpassId?: string; // Member ID from TotalPass
  totalpassCardNumber?: string; // Card number
  isTotalPassMember: boolean;
  totalpassPlan?: string;
  totalpassJoinedAt?: Date;
}

// Booking extension for TotalPass bookings
export interface TotalPassBookingData {
  totalpassBookingId?: string;
  isTotalPassBooking: boolean;
  totalpassStatus?: TotalPassBookingStatus;
  totalpassCheckedIn?: boolean;
  totalpassCheckedInAt?: Date;
}

// Class extension for TotalPass sync
export interface TotalPassClassData {
  totalpassClassId?: string;
  totalpassSyncEnabled: boolean;
  totalpassLastSyncAt?: Date;
  totalpassSyncStatus?: "synced" | "pending" | "failed";
  totalpassSyncError?: string;
}
