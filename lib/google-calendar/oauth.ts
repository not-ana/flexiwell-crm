// Google Calendar OAuth2 Service
// Handles authorization flow for client calendar sync

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { GoogleTokenResponse, ClientCalendarTokens, OAuthState } from "./types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

// Get Google OAuth credentials from environment
function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google-calendar/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar OAuth credentials not configured");
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Generate OAuth authorization URL for a client
 */
export function generateAuthUrl(clientId: string, redirectPath: string = "/dashboard/settings"): string {
  const config = getOAuthConfig();

  // Create state for CSRF protection
  const state: OAuthState = {
    clientId,
    redirectPath,
    timestamp: Date.now(),
  };
  const stateEncoded = Buffer.from(JSON.stringify(state)).toString("base64url");

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    access_type: "offline", // Required for refresh token
    prompt: "consent", // Force consent to always get refresh token
    state: stateEncoded,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Parse and validate OAuth state
 */
export function parseOAuthState(state: string): OAuthState | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as OAuthState;

    // Validate timestamp (state valid for 10 minutes)
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
      console.error("OAuth state expired");
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("Failed to parse OAuth state:", error);
    return null;
  }
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const config = getOAuthConfig();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to exchange code: ${error.error_description || error.error}`);
  }

  return response.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const config = getOAuthConfig();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to refresh token: ${error.error_description || error.error}`);
  }

  return response.json();
}

/**
 * Store OAuth tokens for a client
 */
export async function storeClientTokens(
  clientId: string,
  tokens: GoogleTokenResponse,
  calendarEmail: string
): Promise<void> {
  const db = await getDatabase();

  const calendarData: ClientCalendarTokens = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || "", // May not be present on refresh
    tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    calendarEmail,
    syncEnabled: true,
    connectedAt: new Date(),
  };

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    {
      $set: {
        "integrations.googleCalendar": calendarData,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Get valid access token for a client
 * Automatically refreshes if expired
 */
export async function getClientAccessToken(clientId: string): Promise<string | null> {
  const db = await getDatabase();

  const client = await db.collection("clients").findOne({
    _id: new ObjectId(clientId),
  });

  if (!client?.integrations?.googleCalendar) {
    return null;
  }

  const calendar = client.integrations.googleCalendar;

  // Check if token is expired (with 5-minute buffer)
  const now = new Date();
  const expiresAt = new Date(calendar.tokenExpiresAt);
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (now.getTime() + bufferMs >= expiresAt.getTime()) {
    // Token expired or expiring soon, refresh it
    try {
      const newTokens = await refreshAccessToken(calendar.refreshToken);

      // Update stored tokens
      await db.collection("clients").updateOne(
        { _id: new ObjectId(clientId) },
        {
          $set: {
            "integrations.googleCalendar.accessToken": newTokens.access_token,
            "integrations.googleCalendar.tokenExpiresAt": new Date(
              Date.now() + newTokens.expires_in * 1000
            ),
            updatedAt: new Date(),
          },
        }
      );

      return newTokens.access_token;
    } catch (error) {
      console.error("Failed to refresh Google Calendar token:", error);

      // Mark calendar as disconnected on refresh failure
      await db.collection("clients").updateOne(
        { _id: new ObjectId(clientId) },
        {
          $set: {
            "integrations.googleCalendar.syncEnabled": false,
            updatedAt: new Date(),
          },
        }
      );

      return null;
    }
  }

  return calendar.accessToken;
}

/**
 * Disconnect Google Calendar for a client
 */
export async function disconnectClientCalendar(clientId: string): Promise<void> {
  const db = await getDatabase();

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    {
      $unset: {
        "integrations.googleCalendar": "",
      },
      $set: {
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Check if a client has Google Calendar connected
 */
export async function isCalendarConnected(clientId: string): Promise<boolean> {
  const db = await getDatabase();

  const client = await db.collection("clients").findOne({
    _id: new ObjectId(clientId),
  });

  return !!(
    client?.integrations?.googleCalendar?.syncEnabled &&
    client?.integrations?.googleCalendar?.refreshToken
  );
}

/**
 * Toggle calendar sync for a client
 */
export async function toggleCalendarSync(clientId: string, enabled: boolean): Promise<void> {
  const db = await getDatabase();

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    {
      $set: {
        "integrations.googleCalendar.syncEnabled": enabled,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Get user info from Google (to get email)
 */
export async function getGoogleUserEmail(accessToken: string): Promise<string> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get user info from Google");
  }

  const data = await response.json();
  return data.email;
}
