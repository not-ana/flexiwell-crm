// ClassPass API Client
// Partner API for US fitness marketplace

import {
  ClassPassCredentials,
  ClassPassReservation,
  ClassPassReservationUpdate,
  ClassPassScheduleCreate,
  ClassPassScheduleUpdate,
  ClassPassScheduleResponse,
  ClassPassApiError,
} from "./types";
import { getClassPassCredentials } from "@/lib/integrations/credentials";

const CLASSPASS_API_BASE = "https://partners.classpass.com/v1";

class ClassPassClient {
  private credentials: ClassPassCredentials | null = null;

  private async getCredentials(): Promise<ClassPassCredentials> {
    if (!this.credentials) {
      const creds = await getClassPassCredentials();
      if (!creds) {
        throw new Error("ClassPass credentials not configured");
      }
      this.credentials = creds;
    }
    return this.credentials;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const creds = await this.getCredentials();

    const response = await fetch(`${CLASSPASS_API_BASE}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        "X-Venue-Id": creds.venueId,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error: ClassPassApiError = await response.json().catch(() => ({
        error: {
          code: "UNKNOWN",
          message: `HTTP ${response.status}: ${response.statusText}`,
        },
      }));
      throw new ClassPassApiException(
        error.error.code,
        error.error.message,
        response.status
      );
    }

    return response.json();
  }

  // ============================================
  // Reservation Management
  // ============================================

  /**
   * Get reservation details
   */
  async getReservation(reservationId: string): Promise<ClassPassReservation> {
    return this.request<ClassPassReservation>(
      "GET",
      `/reservations/${reservationId}`
    );
  }

  /**
   * Confirm a reservation
   */
  async confirmReservation(reservationId: string): Promise<void> {
    await this.request<void>(
      "PATCH",
      `/reservations/${reservationId}`,
      { state: "confirmed" } as ClassPassReservationUpdate
    );
  }

  /**
   * Decline/cancel a reservation
   */
  async declineReservation(reservationId: string, reason: string): Promise<void> {
    await this.request<void>(
      "PATCH",
      `/reservations/${reservationId}`,
      { state: "cancelled", reason } as ClassPassReservationUpdate
    );
  }

  /**
   * Check in a reservation
   */
  async checkInReservation(reservationId: string): Promise<void> {
    await this.request<void>(
      "POST",
      `/reservations/${reservationId}/checkin`
    );
  }

  /**
   * Mark reservation as no-show
   */
  async reportNoShow(reservationId: string): Promise<void> {
    await this.request<void>(
      "POST",
      `/reservations/${reservationId}/no-show`
    );
  }

  // ============================================
  // Schedule (Class) Management
  // ============================================

  /**
   * Create a new schedule (class) on ClassPass
   */
  async createSchedule(data: ClassPassScheduleCreate): Promise<ClassPassScheduleResponse> {
    return this.request<ClassPassScheduleResponse>(
      "POST",
      "/schedules",
      data
    );
  }

  /**
   * Update an existing schedule on ClassPass
   */
  async updateSchedule(
    scheduleId: string,
    data: ClassPassScheduleUpdate
  ): Promise<ClassPassScheduleResponse> {
    return this.request<ClassPassScheduleResponse>(
      "PUT",
      `/schedules/${scheduleId}`,
      data
    );
  }

  /**
   * Cancel a schedule on ClassPass
   */
  async cancelSchedule(scheduleId: string): Promise<void> {
    await this.request("DELETE", `/schedules/${scheduleId}`);
  }

  /**
   * Get schedule details from ClassPass
   */
  async getSchedule(scheduleId: string): Promise<ClassPassScheduleResponse> {
    return this.request<ClassPassScheduleResponse>(
      "GET",
      `/schedules/${scheduleId}`
    );
  }

  /**
   * Update available spots for a schedule
   */
  async updateAvailability(
    scheduleId: string,
    openSpots: number
  ): Promise<void> {
    await this.updateSchedule(scheduleId, { openSpots });
  }

  // ============================================
  // Health Check
  // ============================================

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getCredentials();
      return true;
    } catch {
      return false;
    }
  }
}

// Custom exception for ClassPass API errors
export class ClassPassApiException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ClassPassApiException";
  }

  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  isForbidden(): boolean {
    return this.statusCode === 403;
  }

  isConflict(): boolean {
    return this.statusCode === 409;
  }

  isBadRequest(): boolean {
    return this.statusCode === 400;
  }
}

// Singleton instance
export const classpassClient = new ClassPassClient();
