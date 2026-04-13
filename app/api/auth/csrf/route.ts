import { NextResponse } from "next/server";
import { generateCsrfToken, CSRF_COOKIE_NAME } from "@/lib/security";

// GET /api/auth/csrf — issue a CSRF token as a cookie + response body
export async function GET() {
  const token = generateCsrfToken();

  const response = NextResponse.json({ csrfToken: token });

  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // JS must read this to send in header
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  return response;
}
