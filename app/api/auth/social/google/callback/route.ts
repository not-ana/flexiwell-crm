import { NextRequest, NextResponse } from "next/server";
import {
  validateOAuthState,
  exchangeGoogleCode,
  getGoogleUserInfo,
  findOAuthUser,
  createOAuthUser,
  generateOAuthResponse,
  linkSocialAccount,
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

    // Handle linking mode
    if (stateData.mode === "link" && stateData.userId) {
      const result = await linkSocialAccount(stateData.userId, userInfo);

      // Determine the correct settings URL based on user role
      const settingsPath = stateData.userRole === "admin"
        ? "/admin/settings"
        : stateData.userRole === "teacher"
          ? "/teacher/settings"
          : "/dashboard/settings";

      if (!result.success) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}${settingsPath}?tab=account&error=${encodeURIComponent(result.error || "Failed to link account")}`
        );
      }

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}${settingsPath}?tab=account&success=${encodeURIComponent("Google account linked successfully")}`
      );
    }

    // Handle login vs signup mode
    console.log("[Google OAuth] Mode:", stateData.mode, "Email:", userInfo.email);
    let user;
    if (stateData.mode === "signup") {
      // Create new account or return existing one
      console.log("[Google OAuth] Creating new user via signup mode");
      user = await createOAuthUser(userInfo);
    } else {
      // Login mode - only find existing users
      console.log("[Google OAuth] Login mode - finding existing user");
      user = await findOAuthUser(userInfo);
    }

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

    // Handle error when user already has an account (during signup)
    if (error instanceof Error && error.message === "ACCOUNT_EXISTS") {
      const errorMessage = "An account with this email already exists. Please log in instead.";
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent(errorMessage)}`
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to complete Google login";
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent(errorMessage)}`
    );
  }
}
