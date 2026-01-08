// Wellhub (Gympass) Integration Types

// Credentials stored in database
export interface WellhubCredentials {
  bearerToken: string;
  gymId: string;
  webhookSecret: string;
}

// Access Control API Types
export interface WellhubValidateRequest {
  gympass_id: string; // 13-digit Wellhub member ID
  custom_code?: string; // Optional, max 13 characters
}

export interface WellhubValidateResponse {
  metadata: {
    total: number;
    errors: number;
  };
  results: {
    user: {
      gympass_id: string;
    };
    gym: {
      Id: number;
      product: {
        Id: number;
        description: string;
      };
    };
    validated_at: string; // ISO 8601 timestamp
  };
}

// Booking API Types
export type WellhubBookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "completed";

export interface WellhubBookingRequest {
  booking_id: string;
  user: {
    unique_token: string; // Wellhub subscriber UUID
    email?: string;
    name?: string;
    phone?: string;
  };
  class: {
    id: string;
    name: string;
    start_time: string; // ISO 8601
    end_time: string; // ISO 8601
    instructor?: string;
  };
  created_at: string;
}

export interface WellhubBookingUpdateRequest {
  status: "accepted" | "rejected";
  reason?: string; // Required if rejected
}

// Check-in Webhook Types
export interface WellhubCheckinWebhook {
  event: "checkin";
  data: {
    user: {
      unique_token: string;
      gympass_id: string;
    };
    checkin_id: string;
    checked_in_at: string; // ISO 8601
    expires_at: string; // Check-in expiration
  };
}

// Booking Webhook Types
export interface WellhubBookingWebhook {
  event: "booking_created" | "booking_cancelled";
  data: WellhubBookingRequest;
}

// Cancellation Webhook Types
export interface WellhubCancellationWebhook {
  event: "booking_cancelled";
  data: {
    booking_id: string;
    user: {
      unique_token: string;
    };
    cancelled_at: string;
    reason?: string;
  };
}

// Class Sync Types (CRM -> Wellhub)
export interface WellhubClassCreate {
  external_id: string; // Our class ID
  name: string;
  description?: string;
  instructor_name?: string;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  max_capacity: number;
  available_spots: number;
  location?: string;
  category?: string; // yoga, pilates, etc.
}

export interface WellhubClassUpdate {
  name?: string;
  description?: string;
  instructor_name?: string;
  start_time?: string;
  end_time?: string;
  max_capacity?: number;
  available_spots?: number;
  status?: "active" | "cancelled";
}

export interface WellhubClassResponse {
  id: string; // Wellhub class ID
  external_id: string; // Our class ID
  name: string;
  status: "active" | "cancelled";
  created_at: string;
  updated_at: string;
}

// Webhook Event Union Type
export type WellhubWebhookEvent =
  | WellhubCheckinWebhook
  | WellhubBookingWebhook
  | WellhubCancellationWebhook;

// API Error Response
export interface WellhubApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Attendance Report Types
export interface WellhubAttendanceReport {
  booking_id: string;
  user_token: string;
  attended: boolean;
  attended_at?: string;
  no_show_reason?: string;
}

// Client extension for Wellhub members
export interface WellhubClientData {
  wellhubId?: string; // unique_token from Wellhub
  wellhubGympassId?: string; // 13-digit gympass_id
  isWellhubMember: boolean;
  wellhubPlan?: string; // Plan description from Wellhub
  wellhubJoinedAt?: Date;
}

// Booking extension for Wellhub bookings
export interface WellhubBookingData {
  wellhubBookingId?: string;
  isWellhubBooking: boolean;
  wellhubStatus?: WellhubBookingStatus;
  wellhubCheckedIn?: boolean;
  wellhubCheckedInAt?: Date;
}

// Class extension for Wellhub sync
export interface WellhubClassData {
  wellhubClassId?: string; // ID returned by Wellhub after sync
  wellhubSyncEnabled: boolean;
  wellhubLastSyncAt?: Date;
  wellhubSyncStatus?: "synced" | "pending" | "failed";
  wellhubSyncError?: string;
}
