import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractTokenFromHeader } from "@/lib/auth/jwt";

// Routes that require authentication
const PROTECTED_ROUTES = ["/admin", "/dashboard", "/teacher"];

// API routes that require authentication (all except public ones)
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-invite",
  "/api/auth/accept-invite",
  "/api/auth/social/google/authorize",
  "/api/auth/social/google/callback",
  "/api/public",
  "/api/stripe/webhook",
  "/api/webhook",
  "/api/webhooks",
  "/api/bot",
  "/api/company/verify-access",
  "/api/company/check-authorization",
  "/api/health-assessments/token",
];

// Role-based route access
const ROLE_ROUTES: Record<string, string[]> = {
  "/admin": ["admin"],
  "/api/admin": ["admin"],
  "/teacher": ["admin", "teacher"],
  "/api/teacher": ["admin", "teacher"],
  "/dashboard": ["admin", "teacher", "client"],
  "/api/dashboard": ["admin", "teacher", "client"],
};

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function getAllowedRoles(pathname: string): string[] | null {
  for (const [prefix, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      return roles;
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public API routes — no auth needed
  if (isApiRoute(pathname) && isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if route needs protection
  const needsAuth = isProtectedRoute(pathname) || (isApiRoute(pathname) && !isPublicApiRoute(pathname));

  if (!needsAuth) {
    return NextResponse.next();
  }

  // Extract token from cookie or Authorization header
  const cookieToken = request.cookies.get("auth_token")?.value;
  const headerToken = extractTokenFromHeader(
    request.headers.get("authorization")
  );
  const token = cookieToken || headerToken;

  if (!token) {
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    // Redirect to login for page routes
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const user = verifyAccessToken(token);

  if (!user) {
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  const allowedRoles = getAllowedRoles(pathname);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    // Redirect to appropriate dashboard based on role
    const dashboardUrl = new URL(
      user.role === "admin" ? "/admin" : "/teacher",
      request.url
    );
    return NextResponse.redirect(dashboardUrl);
  }

  // Add user info to headers for downstream use
  const response = NextResponse.next();
  response.headers.set("x-user-id", user.userId);
  response.headers.set("x-user-role", user.role);
  response.headers.set("x-user-email", user.email);

  return response;
}

export const config = {
  runtime: "nodejs",
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};