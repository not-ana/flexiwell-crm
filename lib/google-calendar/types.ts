// Google Calendar Integration Types

// OAuth2 Token response from Google
export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number; // seconds until expiration
  refresh_token?: string; // Only present on first authorization
  scope: string;
  token_type: string;
}

// Client-stored calendar tokens
export interface ClientCalendarTokens {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  calendarEmail: string;
  syncEnabled: boolean;
  connectedAt: Date;
  lastSyncAt?: Date;
}

// Google Calendar Event structure
export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string; // ISO 8601
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: "email" | "popup";
      minutes: number;
    }>;
  };
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
  colorId?: string;
  status?: "confirmed" | "tentative" | "cancelled";
}

// Event creation response from Google
export interface GoogleEventResponse {
  id: string;
  htmlLink: string;
  status: string;
  created: string;
  updated: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

// Calendar sync action types
export type CalendarSyncAction = "create" | "update" | "delete";

// Sync result
export interface CalendarSyncResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

// OAuth state for security
export interface OAuthState {
  clientId: string;
  redirectPath: string;
  timestamp: number;
}

// Calendar API Error
export interface GoogleCalendarError {
  error: {
    code: number;
    message: string;
    errors?: Array<{
      domain: string;
      reason: string;
      message: string;
    }>;
  };
}

// FlexiWell event data for creating calendar events
export interface BookingEventData {
  bookingId: string;
  className: string;
  classDescription?: string;
  instructorName: string;
  scheduledDate: Date;
  startTime: string; // "14:30"
  endTime: string; // "15:30"
  location?: string;
  studioName?: string;
  studioAddress?: string;
}
