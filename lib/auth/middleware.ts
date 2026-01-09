import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
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

/**
 * Get authenticated user from cookie
 * Use this for routes that use cookie-based authentication
 */
export async function getAuthUserFromCookie(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  return verifyAccessToken(token);
}

/**
 * Require authentication from cookie
 * Returns user or error response
 */
export async function requireAuthFromCookie(): Promise<{
  user: JWTPayload | null;
  error: NextResponse | null;
}> {
  const user = await getAuthUserFromCookie();

  if (!user) {
    return {
      user: null,
      error: unauthorizedResponse("Authentication required"),
    };
  }

  return { user, error: null };
}

/**
 * Require specific roles from cookie-based auth
 */
export async function requireRoleFromCookie(
  allowedRoles: JWTPayload["role"][]
): Promise<{
  user: JWTPayload | null;
  error: NextResponse | null;
}> {
  const { user, error } = await requireAuthFromCookie();

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
