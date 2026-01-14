// TotalPass API Client
// API for Brazilian corporate wellness marketplace

import {
  TotalPassCredentials,
  TotalPassValidateRequest,
  TotalPassValidateResponse,
  TotalPassBookingUpdateRequest,
  TotalPassClassCreate,
  TotalPassClassUpdate,
  TotalPassClassResponse,
  TotalPassApiError,
  TotalPassAttendanceReport,
} from "./types";
import { getTotalPassCredentials } from "@/lib/integrations/credentials";

const TOTALPASS_API_BASE = "https://api.totalpass.com.br/partners/v1";

class TotalPassClient {
  private credentials: TotalPassCredentials | null = null;

  private async getCredentials(): Promise<TotalPassCredentials> {
    if (!this.credentials) {
      const creds = await getTotalPassCredentials();
      if (!creds) {
        throw new Error("TotalPass credentials not configured");
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

    const response = await fetch(`${TOTALPASS_API_BASE}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${creds.apiKey}`,
        "X-Partner-Id": creds.partnerId,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error: TotalPassApiError = await response.json().catch(() => ({
        error: {
          code: "UNKNOWN",
          message: `HTTP ${response.status}: ${response.statusText}`,
        },
      }));
      throw new TotalPassApiException(
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
    data: TotalPassValidateRequest
  ): Promise<TotalPassValidateResponse> {
    return this.request<TotalPassValidateResponse>(
      "POST",
      "/access/validate",
      data
    );
  }

  // ============================================
  // Booking API - Manage Reservations
  // ============================================

  /**
   * Update booking status (accept or reject)
   */
  async updateBookingStatus(
    bookingId: string,
    data: TotalPassBookingUpdateRequest
  ): Promise<void> {
    await this.request("PATCH", `/bookings/${bookingId}`, data);
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
  async reportAttendance(report: TotalPassAttendanceReport): Promise<void> {
    await this.request("POST", `/attendance`, report);
  }

  // ============================================
  // Class Sync API - Push Classes to TotalPass
  // ============================================

  /**
   * Create a new class on TotalPass
   */
  async createClass(data: TotalPassClassCreate): Promise<TotalPassClassResponse> {
    return this.request<TotalPassClassResponse>(
      "POST",
      "/classes",
      data
    );
  }

  /**
   * Update an existing class on TotalPass
   */
  async updateClass(
    totalpassClassId: string,
    data: TotalPassClassUpdate
  ): Promise<TotalPassClassResponse> {
    return this.request<TotalPassClassResponse>(
      "PUT",
      `/classes/${totalpassClassId}`,
      data
    );
  }

  /**
   * Cancel/delete a class on TotalPass
   */
  async cancelClass(totalpassClassId: string): Promise<void> {
    await this.request("DELETE", `/classes/${totalpassClassId}`);
  }

  /**
   * Get class details from TotalPass
   */
  async getClass(totalpassClassId: string): Promise<TotalPassClassResponse> {
    return this.request<TotalPassClassResponse>(
      "GET",
      `/classes/${totalpassClassId}`
    );
  }

  /**
   * Update available spots for a class
   */
  async updateAvailableSpots(
    totalpassClassId: string,
    availableSpots: number
  ): Promise<void> {
    await this.updateClass(totalpassClassId, { availableSpots });
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

// Custom exception for TotalPass API errors
export class TotalPassApiException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "TotalPassApiException";
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
export const totalpassClient = new TotalPassClient();
