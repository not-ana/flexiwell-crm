// Google Calendar OAuth Callback
// GET /api/oauth/google-calendar/callback - Handle OAuth redirect

import { NextRequest, NextResponse } from "next/server";
import {
  parseOAuthState,
  exchangeCodeForTokens,
  storeClientTokens,
  getGoogleUserEmail,
} from "@/lib/google-calendar/oauth";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Handle OAuth errors
  if (error) {
    console.error("Google OAuth error:", error);
    const errorDesc = searchParams.get("error_description") || "Authorization failed";
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?calendar_error=${encodeURIComponent(errorDesc)}`
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?calendar_error=${encodeURIComponent("Missing authorization code")}`
    );
  }

  // Parse and validate state
  const stateData = parseOAuthState(state);
  if (!stateData) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?calendar_error=${encodeURIComponent("Invalid or expired authorization state")}`
    );
  }

  try {
    // Verify client exists
    const db = await getDatabase();
    const client = await db.collection("clients").findOne({
      _id: new ObjectId(stateData.clientId),
    });

    if (!client) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings?calendar_error=${encodeURIComponent("Client not found")}`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user email from Google
    const calendarEmail = await getGoogleUserEmail(tokens.access_token);

    // Store tokens for client
    await storeClientTokens(stateData.clientId, tokens, calendarEmail);

    // Log activity
    await db.collection("activities").insertOne({
      type: "system",
      action: "google_calendar_connected",
      description: `Google Calendar connected for ${client.name}`,
      entityId: stateData.clientId,
      entityType: "client",
      metadata: {
        calendarEmail,
      },
      createdAt: new Date(),
    });

    // Redirect back to settings with success
    const redirectUrl = `${baseUrl}${stateData.redirectPath}?calendar_connected=true`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Google Calendar callback error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to connect calendar";
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?calendar_error=${encodeURIComponent(errorMessage)}`
    );
  }
}
