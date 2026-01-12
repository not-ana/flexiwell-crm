// API Utilities - Generic response handling and error management

import type { ApiResponse, ApiError } from "@/lib/api/client";

export type OperationResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export function handleApiResponse<T, R>(
  response: ApiResponse<T>,
  extractor: (data: T) => R
): OperationResult<R> {
  if (response.error) {
    return { success: false, error: response.error.error };
  }
  if (response.data) {
    return { success: true, data: extractor(response.data) };
  }
  return { success: false, error: "Unknown error" };
}

export function createApiError(message: string, status = 500): ApiError {
  return { error: message, status };
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage = "Operation failed"
): Promise<OperationResult<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : errorMessage;
    return { success: false, error: message };
  }
}
