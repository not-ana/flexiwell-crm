// TotalPass Webhook Signature Verification
// Uses HMAC-SHA256 for webhook authentication

import crypto from "crypto";
import { getTotalPassCredentials } from "@/lib/integrations/credentials";

/**
 * Verify TotalPass webhook signature using HMAC-SHA256
 * The signature is sent in the X-TotalPass-Signature header
 *
 * @param requestBody - Raw request body (string or Buffer)
 * @param signature - Value from X-TotalPass-Signature header
 * @returns true if signature is valid, false otherwise
 */
export async function verifyTotalPassSignature(
  requestBody: string | Buffer,
  signature: string
): Promise<boolean> {
  try {
    const credentials = await getTotalPassCredentials();
    if (!credentials?.webhookSecret) {
      console.error("TotalPass webhook secret not configured");
      return false;
    }

    return verifySignatureWithSecret(
      requestBody,
      signature,
      credentials.webhookSecret
    );
  } catch (error) {
    console.error("Error verifying TotalPass signature:", error);
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

  // Create HMAC-SHA256 digest
  const hmac = crypto.createHmac("sha256", secret);
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
  const hmac = crypto.createHmac("sha256", secret);
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
      error: "Missing X-TotalPass-Signature header",
    };
  }

  const isValid = await verifyTotalPassSignature(rawBody, signatureHeader);
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
