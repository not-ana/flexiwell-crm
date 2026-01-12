// API Route Handler Utilities - Standardized error handling and responses

import { NextResponse } from "next/server";

export interface ApiSuccess<T> {
  data: T;
  status?: number;
}

export interface ApiErrorResponse {
  error: string;
  status: number;
}

type HandlerFunction<T> = () => Promise<T>;

export async function withApiHandler<T>(
  handler: HandlerFunction<T>,
  errorMessage = "An error occurred"
): Promise<NextResponse> {
  try {
    const data = await handler();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(`API Error: ${errorMessage}`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : errorMessage },
      { status: 500 }
    );
  }
}

export function jsonResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: string, status = 500): NextResponse {
  return NextResponse.json({ error }, { status });
}

export function notFoundResponse(resource = "Resource"): NextResponse {
  return errorResponse(`${resource} not found`, 404);
}

export function badRequestResponse(message: string): NextResponse {
  return errorResponse(message, 400);
}

export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return errorResponse(message, 403);
}
