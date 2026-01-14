import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { generateTokenPair, getRefreshTokenExpiry, type JWTPayload } from "./jwt";
import { getDatabase } from "@/lib/db/mongodb";
import type { User, RefreshToken } from "@/lib/db/schemas";

// Fail fast if secret is not configured
function getOAuthStateSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required for OAuth");
  }
  return secret;
}

// Types
export type OAuthProvider = "google";

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: OAuthProvider;
}

interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
}

interface OAuthStatePayload {
  provider: OAuthProvider;
  mode: "login" | "signup" | "link";
  userId?: string;
  userRole?: string;
}

// Google OAuth endpoints
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getGoogleRedirectUri(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/social/google/callback`;
}

// State management for CSRF protection
export function generateOAuthState(
  provider: OAuthProvider,
  mode: "login" | "signup" | "link" = "login",
  userId?: string,
  userRole?: string
): string {
  const payload: OAuthStatePayload = { provider, mode, userId, userRole };
  return jwt.sign(payload, getOAuthStateSecret(), { expiresIn: "10m" });
}

export function validateOAuthState(state: string): OAuthStatePayload | null {
  try {
    return jwt.verify(state, getOAuthStateSecret()) as OAuthStatePayload;
  } catch {
    return null;
  }
}

// Google OAuth
export function getGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
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
      redirect_uri: getGoogleRedirectUri(),
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

// User lookup - only finds existing users, does NOT create accounts
export async function findOAuthUser(userInfo: OAuthUserInfo): Promise<User> {
  const db = await getDatabase();
  const usersCollection = db.collection<User>("users");

  const user = await usersCollection.findOne({ email: userInfo.email.toLowerCase() });

  if (!user) {
    throw new Error("NO_ACCOUNT_FOUND");
  }

  // Update user with OAuth data (avatar, name)
  const updates: Partial<User> = { updatedAt: new Date() };

  if (userInfo.avatar) {
    updates.avatar = userInfo.avatar;
    user.avatar = userInfo.avatar;
  }

  // Update name only if user doesn't have one or it's just the email prefix
  const emailPrefix = user.email.split("@")[0];
  if (userInfo.name && (!user.name || user.name === emailPrefix)) {
    updates.name = userInfo.name;
    user.name = userInfo.name;
  }

  await usersCollection.updateOne({ _id: user._id }, { $set: updates });

  return user;
}

// Generate tokens and update login timestamp
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

  const payload: JWTPayload = {
    userId,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const tokens = generateTokenPair(payload);

  // Replace old refresh tokens with new one
  const refreshTokensCollection = db.collection<RefreshToken>("refresh_tokens");
  await refreshTokensCollection.deleteMany({ userId });
  await refreshTokensCollection.insertOne({
    userId,
    token: tokens.refreshToken,
    expiresAt: getRefreshTokenExpiry(),
    createdAt: new Date(),
  });

  // Update last login
  await db.collection("users").updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }
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

// Link/unlink social accounts - consider removing for MVP
export async function linkSocialAccount(
  userId: string,
  userInfo: OAuthUserInfo
): Promise<{ success: boolean; error?: string }> {
  const db = await getDatabase();
  const usersCollection = db.collection<User>("users");

  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  // Check if provider is already linked to another user
  const existingLink = await usersCollection.findOne({
    "linkedAccounts.provider": userInfo.provider,
    "linkedAccounts.providerId": userInfo.id,
    _id: { $ne: new ObjectId(userId) },
  });

  if (existingLink) {
    return { success: false, error: "This Google account is already linked to another user" };
  }

  if (user.linkedAccounts?.some((acc) => acc.provider === userInfo.provider)) {
    return { success: false, error: "You already have a Google account linked" };
  }

  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $push: {
        linkedAccounts: {
          provider: userInfo.provider,
          providerId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.avatar,
          linkedAt: new Date(),
        },
      },
      $set: { updatedAt: new Date() },
    }
  );

  return { success: true };
}

export async function unlinkSocialAccount(
  userId: string,
  provider: OAuthProvider
): Promise<{ success: boolean; error?: string }> {
  const db = await getDatabase();
  const usersCollection = db.collection<User>("users");

  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  if (!user.linkedAccounts?.some((acc) => acc.provider === provider)) {
    return { success: false, error: "No linked account found for this provider" };
  }

  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $pull: { linkedAccounts: { provider } },
      $set: { updatedAt: new Date() },
    }
  );

  return { success: true };
}

// Backwards compatibility alias - remove after updating consumers
export const findOrCreateOAuthUser = async (
  userInfo: OAuthUserInfo,
  _mode: "login" | "signup"
): Promise<{ user: User; isNew: boolean }> => {
  const user = await findOAuthUser(userInfo);
  return { user, isNew: false };
};
