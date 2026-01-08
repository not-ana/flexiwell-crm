// Wellhub API Client
// Documentation: https://developers.gympass.com

import {
  WellhubCredentials,
  WellhubValidateRequest,
  WellhubValidateResponse,
  WellhubBookingUpdateRequest,
  WellhubClassCreate,
  WellhubClassUpdate,
  WellhubClassResponse,
  WellhubApiError,
  WellhubAttendanceReport,
} from "./types";
import { getWellhubCredentials } from "@/lib/integrations/credentials";

const WELLHUB_API_BASE = "https://api.partners.gympass.com";

class WellhubClient {
  private credentials: WellhubCredentials | null = null;

  private async getCredentials(): Promise<WellhubCredentials> {
    if (!this.credentials) {
      const creds = await getWellhubCredentials();
      if (!creds) {
        throw new Error("Wellhub credentials not configured");
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

    const response = await fetch(`${WELLHUB_API_BASE}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${creds.bearerToken}`,
        "X-Gym-Id": creds.gymId,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error: WellhubApiError = await response.json().catch(() => ({
        error: {
          code: "UNKNOWN",
          message: `HTTP ${response.status}: ${response.statusText}`,
        },
      }));
      throw new WellhubApiException(
        error.error.code,
        error.error.message,
        response.status
      );
    }

    return response.json();
  }

  // ============================================
  // Access Control API - Check-in Validation
  // ============================================

  /**
   * Validate a member check-in
   * This generates a payment transaction for the studio
   */
  async validateCheckin(
    data: WellhubValidateRequest
  ): Promise<WellhubValidateResponse> {
    return this.request<WellhubValidateResponse>(
      "POST",
      "/access/v1/validate",
      data
    );
  }

  // ============================================
  // Booking API - Manage Reservations
  // ============================================

  /**
   * Update booking status (accept or reject)
   * IMPORTANT: Must respond within 15 minutes of receiving webhook
   */
  async updateBookingStatus(
    bookingId: string,
    data: WellhubBookingUpdateRequest
  ): Promise<void> {
    await this.request("PATCH", `/booking/v1/bookings/${bookingId}`, data);
  }

  /**
   * Accept a booking request
   */
  async acceptBooking(bookingId: string): Promise<void> {
    await this.updateBookingStatus(bookingId, { status: "accepted" });
  }

  /**
   * Reject a booking request
   */
  async rejectBooking(bookingId: string, reason: string): Promise<void> {
    await this.updateBookingStatus(bookingId, { status: "rejected", reason });
  }

  /**
   * Report attendance for a booking
   */
  async reportAttendance(report: WellhubAttendanceReport): Promise<void> {
    await this.request("POST", `/booking/v1/attendance`, report);
  }

  // ============================================
  // Class Sync API - Push Classes to Wellhub
  // ============================================

  /**
   * Create a new class on Wellhub
   * This makes the class visible on the Wellhub app
   */
  async createClass(data: WellhubClassCreate): Promise<WellhubClassResponse> {
    return this.request<WellhubClassResponse>(
      "POST",
      "/booking/v1/classes",
      data
    );
  }

  /**
   * Update an existing class on Wellhub
   */
  async updateClass(
    wellhubClassId: string,
    data: WellhubClassUpdate
  ): Promise<WellhubClassResponse> {
    return this.request<WellhubClassResponse>(
      "PUT",
      `/booking/v1/classes/${wellhubClassId}`,
      data
    );
  }

  /**
   * Cancel/delete a class on Wellhub
   */
  async cancelClass(wellhubClassId: string): Promise<void> {
    await this.request("DELETE", `/booking/v1/classes/${wellhubClassId}`);
  }

  /**
   * Get class details from Wellhub
   */
  async getClass(wellhubClassId: string): Promise<WellhubClassResponse> {
    return this.request<WellhubClassResponse>(
      "GET",
      `/booking/v1/classes/${wellhubClassId}`
    );
  }

  /**
   * Update available spots for a class
   */
  async updateAvailableSpots(
    wellhubClassId: string,
    availableSpots: number
  ): Promise<void> {
    await this.updateClass(wellhubClassId, { available_spots: availableSpots });
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

// Custom exception for Wellhub API errors
export class WellhubApiException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "WellhubApiException";
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
export const wellhubClient = new WellhubClient();
