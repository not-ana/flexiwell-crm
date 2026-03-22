/**
 * Cloudflare Turnstile CAPTCHA verification
 * https://developers.cloudflare.com/turnstile/
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  success: boolean;
  error?: string;
}

/**
 * Verify a Turnstile token server-side.
 * Returns success: true if TURNSTILE_SECRET_KEY is not configured (dev mode).
 */
export async function verifyTurnstileToken(token: string | null): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Skip in development if not configured
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("TURNSTILE_SECRET_KEY not configured in production");
      return { success: false, error: "CAPTCHA not configured" };
    }
    return { success: true };
  }

  if (!token) {
    return { success: false, error: "CAPTCHA verification required" };
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: "CAPTCHA verification failed. Please try again." };
    }

    return { success: true };
  } catch {
    console.error("Turnstile verification error");
    return { success: false, error: "CAPTCHA verification failed" };
  }
}