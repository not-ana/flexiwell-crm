// Wellhub Webhook Signature Verification
// Uses HMAC-SHA1 as specified in Wellhub documentation
// IMPORTANT: Always use timing-safe comparison to prevent timing attacks

import crypto from "crypto";
import { getWellhubCredentials } from "@/lib/integrations/credentials";

/**
 * Verify Wellhub webhook signature using HMAC-SHA1
 * The signature is sent in the X-Gympass-Signature header
 *
 * @param requestBody - Raw request body (string or Buffer)
 * @param signature - Value from X-Gympass-Signature header
 * @returns true if signature is valid, false otherwise
 */
export async function verifyWellhubSignature(
  requestBody: string | Buffer,
  signature: string
): Promise<boolean> {
  try {
    const credentials = await getWellhubCredentials();
    if (!credentials?.webhookSecret) {
      console.error("Wellhub webhook secret not configured");
      return false;
    }

    return verifySignatureWithSecret(
      requestBody,
      signature,
      credentials.webhookSecret
    );
  } catch (error) {
    console.error("Error verifying Wellhub signature:", error);
    return false;
  }
}

/**
 * Verify signature with a specific secret (useful for testing)
 */
export function verifySignatureWithSecret(
  requestBody: string | Buffer,
  signature: string,
  secret: string
): boolean {
  // Convert body to string if Buffer
  const bodyString =
    typeof requestBody === "string" ? requestBody : requestBody.toString("utf8");

  // Create HMAC-SHA1 digest
  const hmac = crypto.createHmac("sha1", secret);
  const digest = hmac.update(bodyString).digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, "utf8");
  const digestBuffer = Buffer.from(digest, "utf8");

  // Buffers must be same length for timingSafeEqual
  if (signatureBuffer.length !== digestBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, digestBuffer);
}

/**
 * Generate a signature for testing purposes
 */
export function generateSignature(body: string, secret: string): string {
  const hmac = crypto.createHmac("sha1", secret);
  return hmac.update(body).digest("hex");
}

/**
 * Middleware-style signature verification for Next.js API routes
 * Returns an object with verification status and parsed body
 */
export async function verifyAndParseWebhook<T>(
  rawBody: string,
  signatureHeader: string | null
): Promise<{ valid: boolean; data: T | null; error?: string }> {
  if (!signatureHeader) {
    return {
      valid: false,
      data: null,
      error: "Missing X-Gympass-Signature header",
    };
  }

  const isValid = await verifyWellhubSignature(rawBody, signatureHeader);
  if (!isValid) {
    return {
      valid: false,
      data: null,
      error: "Invalid webhook signature",
    };
  }

  try {
    const data = JSON.parse(rawBody) as T;
    return { valid: true, data };
  } catch {
    return {
      valid: false,
      data: null,
      error: "Invalid JSON body",
    };
  }
}
