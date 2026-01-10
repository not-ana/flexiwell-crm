import { NextRequest, NextResponse } from "next/server";
import {
  validateOAuthState,
  exchangeGoogleCode,
  getGoogleUserInfo,
  findOrCreateOAuthUser,
  generateOAuthResponse,
} from "@/lib/auth/social-oauth";

// GET /api/auth/social/google/callback - Handle Google OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent("Google login was cancelled or failed")}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent("Invalid OAuth response")}`
      );
    }

    // Validate state (CSRF protection)
    const stateData = validateOAuthState(state);
    if (!stateData || stateData.provider !== "google") {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent("Invalid or expired OAuth state")}`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeGoogleCode(code);

    // Get user info from Google
    const userInfo = await getGoogleUserInfo(tokens.accessToken);

    // Find existing user (does NOT create new accounts)
    const { user } = await findOrCreateOAuthUser(userInfo, stateData.mode);

    // Generate auth response
    const authResponse = await generateOAuthResponse(user);

    // Redirect to a special page that will store tokens and redirect
    const redirectPath = user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/dashboard";

    // Create response with tokens in URL hash (for client-side handling)
    const callbackUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`);
    callbackUrl.searchParams.set("accessToken", authResponse.tokens.accessToken);
    callbackUrl.searchParams.set("refreshToken", authResponse.tokens.refreshToken);
    callbackUrl.searchParams.set("redirect", redirectPath);

    return NextResponse.redirect(callbackUrl.toString());
  } catch (error) {
    console.error("Error handling Google OAuth callback:", error);

    // Handle specific error for users without an account
    if (error instanceof Error && error.message === "NO_ACCOUNT_FOUND") {
      const errorMessage = "No account found with this email. Please create an account first.";
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signup?error=${encodeURIComponent(errorMessage)}`
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to complete Google login";
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
