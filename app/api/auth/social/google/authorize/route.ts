import { NextRequest, NextResponse } from "next/server";
import { generateOAuthState, getGoogleAuthUrl } from "@/lib/auth/social-oauth";

// GET /api/auth/social/google/authorize - Redirect to Google OAuth
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode") === "signup" ? "signup" : "login";

    const state = generateOAuthState("google", mode);
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
