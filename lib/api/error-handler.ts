/**
 * Centralized API error handling utilities
 * Eliminates duplicate try-catch patterns across 100+ API routes
 */

import { NextResponse } from "next/server";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * Standard API error response format
 */
export class ApiErrorResponse extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number = 500, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiErrorResponse";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Wraps an API route handler with standardized error handling
 *
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await fetchData();
 *   return NextResponse.json(data);
 * });
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}

/**
 * Handle different types of errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  // Handle custom ApiErrorResponse
  if (error instanceof ApiErrorResponse) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.status }
    );
  }

  // Handle standard Error
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
}

/**
 * Convenience error creators
 */
export const ApiErrors = {
  badRequest: (message: string = "Bad request", details?: unknown) =>
    new ApiErrorResponse(message, 400, "BAD_REQUEST", details),

  unauthorized: (message: string = "Unauthorized") =>
    new ApiErrorResponse(message, 401, "UNAUTHORIZED"),

  forbidden: (message: string = "Forbidden") =>
    new ApiErrorResponse(message, 403, "FORBIDDEN"),

  notFound: (message: string = "Resource not found") =>
    new ApiErrorResponse(message, 404, "NOT_FOUND"),

  conflict: (message: string = "Resource conflict", details?: unknown) =>
    new ApiErrorResponse(message, 409, "CONFLICT", details),

  internal: (message: string = "Internal server error", details?: unknown) =>
    new ApiErrorResponse(message, 500, "INTERNAL_ERROR", details),
};

/**
 * Validate required fields in request body
 * @throws ApiErrorResponse if validation fails
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    throw ApiErrors.badRequest(
      `Missing required fields: ${missingFields.join(", ")}`,
      { missingFields }
    );
  }
}
