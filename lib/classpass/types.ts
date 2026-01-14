// ClassPass Integration Types (US Market)

// Credentials stored in database
export interface ClassPassCredentials {
  apiKey: string;
  venueId: string;
  webhookSecret: string;
}

// Reservation (Booking) Types
export type ClassPassReservationState =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface ClassPassUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface ClassPassSchedule {
  id: string;
  externalId?: string;
  name: string;
  startAt: string; // ISO 8601
  endAt: string;
  instructor?: string;
}

export interface ClassPassReservation {
  id: string;
  state: ClassPassReservationState;
  user: ClassPassUser;
  schedule: ClassPassSchedule;
  createdAt: string;
  updatedAt: string;
}

// Webhook Types
export interface ClassPassReservationWebhook {
  event: "reservation.created" | "reservation.cancelled";
  data: ClassPassReservation;
  timestamp: string;
}

export interface ClassPassCheckinWebhook {
  event: "reservation.checkin";
  data: {
    reservationId: string;
    user: ClassPassUser;
    schedule: ClassPassSchedule;
    checkedInAt: string;
  };
  timestamp: string;
}

export interface ClassPassNoShowWebhook {
  event: "reservation.no_show";
  data: {
    reservationId: string;
    user: ClassPassUser;
    schedule: ClassPassSchedule;
    markedAt: string;
  };
  timestamp: string;
}

// Webhook Event Union Type
export type ClassPassWebhookEvent =
  | ClassPassReservationWebhook
  | ClassPassCheckinWebhook
  | ClassPassNoShowWebhook;

// Schedule (Class) Sync Types
export interface ClassPassScheduleCreate {
  externalId: string; // Our class ID
  name: string;
  description?: string;
  instructor?: string;
  startAt: string; // ISO 8601
  endAt: string;
  totalSpots: number;
  openSpots: number;
  category: string;
  subcategory?: string;
  tags?: string[];
  location?: string;
}

export interface ClassPassScheduleUpdate {
  name?: string;
  description?: string;
  instructor?: string;
  startAt?: string;
  endAt?: string;
  totalSpots?: number;
  openSpots?: number;
  status?: "active" | "cancelled";
}

export interface ClassPassScheduleResponse {
  id: string; // ClassPass schedule ID
  externalId: string; // Our class ID
  name: string;
  status: "active" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

// API Error Response
export interface ClassPassApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Reservation Update Types
export interface ClassPassReservationUpdate {
  state: "confirmed" | "cancelled";
  reason?: string;
}

// Client extension for ClassPass members
export interface ClassPassClientData {
  classpassId?: string;
  isClassPassMember: boolean;
  classpassJoinedAt?: Date;
}

// Booking extension for ClassPass reservations
export interface ClassPassBookingData {
  classpassReservationId?: string;
  isClassPassBooking: boolean;
  classpassState?: ClassPassReservationState;
  classpassCheckedIn?: boolean;
  classpassCheckedInAt?: Date;
}

// Class extension for ClassPass sync
export interface ClassPassClassData {
  classpassScheduleId?: string;
  classpassSyncEnabled: boolean;
  classpassLastSyncAt?: Date;
  classpassSyncStatus?: "synced" | "pending" | "failed";
  classpassSyncError?: string;
}
