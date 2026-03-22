// Security utilities for the application

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Rate Limiting — Upstash Redis in production, in-memory fallback for dev
// ---------------------------------------------------------------------------

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// Build Upstash Redis client if credentials are present
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Cache Ratelimit instances keyed by "window:max" so we don't recreate them
const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(config: RateLimitConfig): Ratelimit {
  const key = `${config.windowMs}:${config.maxRequests}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    const windowSec = Math.ceil(config.windowMs / 1000);
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.fixedWindow(config.maxRequests, `${windowSec} s`),
      prefix: "rl",
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

// In-memory fallback (development / missing Redis config)
interface MemoryEntry { count: number; resetAt: number }
const memoryStore = new Map<string, MemoryEntry>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memoryStore.entries()) {
      if (v.resetAt < now) memoryStore.delete(k);
    }
  }, 5 * 60 * 1000);
}

function checkMemoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  entry.count++;
  memoryStore.set(key, entry);
  return {
    allowed: entry.count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Check rate limit for a given key (IP, user ID, etc.).
 * Uses Upstash Redis when configured, otherwise falls back to in-memory.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (redis) {
    const limiter = getUpstashLimiter(config);
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  }

  return checkMemoryRateLimit(key, config);
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
 * Generate a cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

