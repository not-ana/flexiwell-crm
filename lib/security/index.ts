// Security utilities for the application

/**
 * In-memory rate limiter
 * For production, use Redis or a distributed cache
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (e.g., IP address or user ID)
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry or expired, create new
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Increment and check
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: entry.count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

// Rate limit configs for different endpoints
export const RATE_LIMITS = {
  // Auth endpoints - stricter limits
  login: { windowMs: 15 * 60 * 1000, maxRequests: 20 }, // 20 per 15 min
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour
  passwordReset: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour

  // API endpoints - more lenient
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
  upload: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
} as const;

/**
 * Escape special regex characters to prevent ReDoS attacks
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sanitize search input for MongoDB regex queries
 */
export function sanitizeSearchInput(input: string): string {
  // Escape regex special chars and limit length
  const escaped = escapeRegex(input);
  return escaped.slice(0, 100); // Max 100 chars
}

/**
 * Validate password strength
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password.length > 128) {
    errors.push("Password must be at most 128 characters long");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Check for common weak passwords
  const commonPasswords = [
    "password", "123456", "12345678", "qwerty", "abc123",
    "password123", "admin123", "letmein", "welcome",
  ];
  if (commonPasswords.some((p) => password.toLowerCase().includes(p))) {
    errors.push("Password is too common. Please choose a stronger password");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

/**
 * CSRF token generation and validation
 */
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

export function generateCsrfToken(sessionId: string): string {
  const token = generateSecureToken(32);
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
  csrfTokens.set(sessionId, { token, expiresAt });
  return token;
}

export function validateCsrfToken(sessionId: string, token: string): boolean {
  const entry = csrfTokens.get(sessionId);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return entry.token === token;
}
