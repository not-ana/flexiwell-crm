// Social OAuth Configuration and Utilities
import { generateTokenPair, getRefreshTokenExpiry, type JWTPayload } from "./jwt";
import { getDatabase } from "@/lib/db/mongodb";
import type { User, RefreshToken } from "@/lib/db/schemas";
import jwt from "jsonwebtoken";

// OAuth Provider Types
export type OAuthProvider = "google";

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: OAuthProvider;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
}

// OAuth state payload
interface OAuthStatePayload {
  provider: OAuthProvider;
  mode: "login" | "signup" | "link";
  userId?: string; // For linking mode, store the user ID
  userRole?: string; // For linking mode, store the user role for redirect
}

const OAUTH_STATE_SECRET = process.env.JWT_SECRET || "oauth-state-fallback-secret";

/**
 * Generate a secure state parameter for OAuth flow using JWT
 * This works in serverless environments where in-memory state doesn't persist
 */
export function generateOAuthState(
  provider: OAuthProvider,
  mode: "login" | "signup" | "link" = "login",
  userId?: string,
  userRole?: string
): string {
  const payload: OAuthStatePayload = { provider, mode, userId, userRole };
  return jwt.sign(payload, OAUTH_STATE_SECRET, { expiresIn: "10m" });
}

/**
 * Validate a state parameter (JWT-based, works in serverless)
 */
export function validateOAuthState(state: string): { provider: OAuthProvider; mode: "login" | "signup" | "link"; userId?: string; userRole?: string } | null {
  try {
    const decoded = jwt.verify(state, OAUTH_STATE_SECRET) as OAuthStatePayload;
    return { provider: decoded.provider, mode: decoded.mode, userId: decoded.userId, userRole: decoded.userRole };
  } catch {
    return null;
  }
}

// ==================== GOOGLE ====================

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export function getGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/google/callback`;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<OAuthTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Google code: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresIn: data.expires_in,
  };
}

export async function getGoogleUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get Google user info");
  }

  const data = await response.json();
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatar: data.picture,
    provider: "google",
  };
}

// ==================== SHARED ====================

/**
 * Find existing user from OAuth info
 * IMPORTANT: This does NOT create new accounts. Users must have an existing account
 * (created through subscription purchase) to log in with social auth.
 */
export async function findOrCreateOAuthUser(
  userInfo: OAuthUserInfo,
  mode: "login" | "signup"
): Promise<{ user: User; isNew: boolean }> {
  const db = await getDatabase();
  const usersCollection = db.collection<User>("users");

  // Try to find existing user by email
  const user = await usersCollection.findOne({ email: userInfo.email.toLowerCase() });

  if (user) {
    // User exists - update with OAuth data (avatar, name from Google)
    const updates: Partial<User> = { updatedAt: new Date() };

    // Always update avatar from OAuth if provided (overwrite existing)
    if (userInfo.avatar) {
      updates.avatar = userInfo.avatar;
      user.avatar = userInfo.avatar;
    }

    // Update name from OAuth if user doesn't have one or it's just the email prefix
    if (userInfo.name && (!user.name || user.name === user.email.split("@")[0])) {
      updates.name = userInfo.name;
      user.name = userInfo.name;
    }

    // Always update to sync OAuth data
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: updates }
    );

    return { user, isNew: false };
  }

  // User doesn't exist - DO NOT create new account automatically
  // They need to purchase a subscription first which will create their account
  throw new Error("NO_ACCOUNT_FOUND");
}

/**
 * Generate auth response (tokens + user) for OAuth login
 */
export async function generateOAuthResponse(user: User): Promise<{
  user: {
    id: string;
    email: string;
    name: string;
    role: User["role"];
    avatar?: string;
    phone?: string;
    staffId?: string;
    clientId?: string;
  };
  tokens: { accessToken: string; refreshToken: string };
}> {
  const db = await getDatabase();
  const userId = user._id!.toString();

  // Generate tokens
  const payload: JWTPayload = {
    userId,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const tokens = generateTokenPair(payload);

  // Invalidate old refresh tokens
  await db.collection<RefreshToken>("refresh_tokens").deleteMany({ userId });

  // Store new refresh token
  const refreshTokenDoc: Omit<RefreshToken, "_id"> = {
    userId,
    token: tokens.refreshToken,
    expiresAt: getRefreshTokenExpiry(),
    createdAt: new Date(),
  };

  await db.collection<RefreshToken>("refresh_tokens").insertOne(refreshTokenDoc);

  // Update last login
  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: {
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  return {
    user: {
      id: userId,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      staffId: user.staffId,
      clientId: user.clientId,
    },
    tokens,
  };
}

/**
 * Link a social account to an existing user
 */
export async function linkSocialAccount(
  userId: string,
  userInfo: OAuthUserInfo
): Promise<{ success: boolean; error?: string }> {
  const db = await getDatabase();
  const usersCollection = db.collection<User>("users");
  const { ObjectId } = await import("mongodb");

  // Find the user
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  // Check if this provider account is already linked to another user
  const existingLink = await usersCollection.findOne({
    "linkedAccounts.provider": userInfo.provider,
    "linkedAccounts.providerId": userInfo.id,
  });

  if (existingLink && existingLink._id?.toString() !== userId) {
    return { success: false, error: "This Google account is already linked to another user" };
  }

  // Check if user already has this provider linked
  const alreadyLinked = user.linkedAccounts?.some(
    (acc) => acc.provider === userInfo.provider
  );

  if (alreadyLinked) {
    return { success: false, error: "You already have a Google account linked" };
  }

  // Add the linked account
  const linkedAccount = {
    provider: userInfo.provider,
    providerId: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    avatar: userInfo.avatar,
    linkedAt: new Date(),
  };

  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $push: { linkedAccounts: linkedAccount },
      $set: { updatedAt: new Date() },
    }
  );

  return { success: true };
}

/**
 * Unlink a social account from a user
 */
export async function unlinkSocialAccount(
  userId: string,
  provider: OAuthProvider
): Promise<{ success: boolean; error?: string }> {
  const db = await getDatabase();
  const usersCollection = db.collection<User>("users");
  const { ObjectId } = await import("mongodb");

  // Find the user
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  // Check if the account is linked
  const isLinked = user.linkedAccounts?.some((acc) => acc.provider === provider);
  if (!isLinked) {
    return { success: false, error: "No linked account found for this provider" };
  }

  // Remove the linked account
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $pull: { linkedAccounts: { provider } },
      $set: { updatedAt: new Date() },
    }
  );

  return { success: true };
}
