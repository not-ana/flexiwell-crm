import { NextRequest, NextResponse } from "next/server";
import { generateOAuthState, getGoogleAuthUrl } from "@/lib/auth/social-oauth";
import { verifyAccessToken } from "@/lib/auth/jwt";

// GET /api/auth/social/google/authorize - Redirect to Google OAuth
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const modeParam = searchParams.get("mode");

    // Determine mode: login, signup, or link
    let mode: "login" | "signup" | "link" = "login";
    let userId: string | undefined;
    let userRole: string = "client";

    if (modeParam === "signup") {
      mode = "signup";
    } else if (modeParam === "link") {
      // For linking, verify the user is authenticated
      const authHeader = request.headers.get("authorization");
      const cookieToken = request.cookies.get("flexiwell_access_token")?.value;
      const token = authHeader?.replace("Bearer ", "") || cookieToken;

      if (!token) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent("You must be logged in to link accounts")}`
        );
      }

      const payload = verifyAccessToken(token);
      if (!payload) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=${encodeURIComponent("Invalid session. Please log in again.")}`
        );
      }

      mode = "link";
      userId = payload.userId;
      userRole = payload.role;
    }

    const state = generateOAuthState("google", mode, userId, userRole);
    const authUrl = getGoogleAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Google OAuth:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to initiate Google login";
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
