import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractTokenFromHeader, JWTPayload } from "./jwt";

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Verify the authentication token from the request
 * Returns the user payload if valid, null otherwise
 */
export function getAuthUser(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get("authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  return verifyAccessToken(token);
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Check if the user has one of the allowed roles
 */
export function hasRole(
  user: JWTPayload | null,
  allowedRoles: JWTPayload["role"][]
): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Middleware helper to require authentication
 * Use this in API routes to ensure the request is authenticated
 */
export function requireAuth(request: NextRequest): {
  user: JWTPayload | null;
  error: NextResponse | null;
} {
  const user = getAuthUser(request);

  if (!user) {
    return {
      user: null,
      error: unauthorizedResponse("Authentication required"),
    };
  }

  return { user, error: null };
}

/**
 * Middleware helper to require specific roles
 * Use this in API routes to ensure the request has the correct role
 */
export function requireRole(
  request: NextRequest,
  allowedRoles: JWTPayload["role"][]
): {
  user: JWTPayload | null;
  error: NextResponse | null;
} {
  const { user, error } = requireAuth(request);

  if (error) {
    return { user: null, error };
  }

  if (!hasRole(user, allowedRoles)) {
    return {
      user: null,
      error: forbiddenResponse("Insufficient permissions"),
    };
  }

  return { user, error: null };
}
