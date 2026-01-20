import { z, ZodSchema, ZodError } from "zod";
import { NextResponse } from "next/server";

export interface ValidationResult<T> {
  success: true;
  data: T;
}

export interface ValidationError {
  success: false;
  error: {
    message: string;
    details: Record<string, string[]>;
  };
}

export type ValidationResponse<T> = ValidationResult<T> | ValidationError;

/**
 * Validates data against a Zod schema
 * Returns a typed result with either validated data or error details
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResponse<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string[]> = {};

      for (const issue of error.errors) {
        const path = issue.path.join(".") || "_root";
        if (!details[path]) {
          details[path] = [];
        }
        details[path].push(issue.message);
      }

      return {
        success: false,
        error: {
          message: "Validation failed",
          details,
        },
      };
    }
    throw error;
  }
}

/**
 * Safe parse that returns undefined instead of throwing
 */
export function safeParse<T>(
  schema: ZodSchema<T>,
  data: unknown
): T | undefined {
  const result = schema.safeParse(data);
  return result.success ? result.data : undefined;
}

/**
 * Creates a NextResponse with validation error
 */
export function validationErrorResponse(
  error: ValidationError["error"]
): NextResponse {
  return NextResponse.json(
    {
      error: error.message,
      details: error.details,
    },
    { status: 400 }
  );
}

/**
 * Middleware function to validate request body
 * Returns validated data or a NextResponse with error
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { response: NextResponse }> {
  try {
    const body = await request.json();
    const result = validate(schema, body);

    if (!result.success) {
      return { response: validationErrorResponse(result.error) };
    }

    return { data: result.data };
  } catch {
    return {
      response: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validates query parameters from URL
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): ValidationResponse<T> {
  const params: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    const existing = params[key];
    if (existing !== undefined) {
      // Multiple values for same key
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        params[key] = [existing, value];
      }
    } else {
      params[key] = value;
    }
  });

  return validate(schema, params);
}

/**
 * Helper to extract validated query params or return error response
 */
export function parseQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { data: T } | { response: NextResponse } {
  const result = validateQueryParams(searchParams, schema);

  if (!result.success) {
    return { response: validationErrorResponse(result.error) };
  }

  return { data: result.data };
}

/**
 * Type guard to check if result has data
 */
export function hasData<T>(
  result: { data: T } | { response: NextResponse }
): result is { data: T } {
  return "data" in result;
}

/**
 * Type guard to check if result has response
 */
export function hasResponse<T>(
  result: { data: T } | { response: NextResponse }
): result is { response: NextResponse } {
  return "response" in result;
}
