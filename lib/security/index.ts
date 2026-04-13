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

// ---------------------------------------------------------------------------
// Account Lockout — lock by user email after repeated failed login attempts
// ---------------------------------------------------------------------------

const LOCKOUT_THRESHOLD = 5; // Lock after 5 failed attempts
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface LockoutEntry {
  failedAttempts: number;
  lockedUntil: number | null;
  lastFailedAt: number;
}

const lockoutStore = new Map<string, LockoutEntry>();

// Clean up expired lockouts periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of lockoutStore.entries()) {
      if (v.lockedUntil && v.lockedUntil < now) lockoutStore.delete(k);
    }
  }, 5 * 60 * 1000);
}

export interface LockoutResult {
  locked: boolean;
  remainingAttempts: number;
  lockedUntilMs?: number;
}

/**
 * Check if an account is locked out.
 * Call with the user's email (lowercase).
 */
export function checkAccountLockout(email: string): LockoutResult {
  const entry = lockoutStore.get(email);
  if (!entry) {
    return { locked: false, remainingAttempts: LOCKOUT_THRESHOLD };
  }

  // If locked and still within lockout window
  if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntilMs: entry.lockedUntil,
    };
  }

  // Lockout expired — reset
  if (entry.lockedUntil && entry.lockedUntil <= Date.now()) {
    lockoutStore.delete(email);
    return { locked: false, remainingAttempts: LOCKOUT_THRESHOLD };
  }

  return {
    locked: false,
    remainingAttempts: Math.max(0, LOCKOUT_THRESHOLD - entry.failedAttempts),
  };
}

/**
 * Record a failed login attempt. Returns lockout result after recording.
 */
export function recordFailedLogin(email: string): LockoutResult {
  const entry = lockoutStore.get(email) || {
    failedAttempts: 0,
    lockedUntil: null,
    lastFailedAt: 0,
  };

  entry.failedAttempts++;
  entry.lastFailedAt = Date.now();

  if (entry.failedAttempts >= LOCKOUT_THRESHOLD) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }

  lockoutStore.set(email, entry);

  return checkAccountLockout(email);
}

/**
 * Clear lockout on successful login.
 */
export function clearLockout(email: string): void {
  lockoutStore.delete(email);
}

// ---------------------------------------------------------------------------
// Audit Logging — log security-relevant events
// ---------------------------------------------------------------------------

export type AuditEventType =
  | "login_success"
  | "login_failed"
  | "login_locked"
  | "logout"
  | "register"
  | "password_reset_request"
  | "password_reset_complete"
  | "password_change"
  | "token_refresh"
  | "token_reuse_detected"
  | "role_change"
  | "account_deactivated"
  | "account_activated"
  | "csrf_violation"
  | "rate_limit_hit";

export interface AuditEvent {
  type: AuditEventType;
  userId?: string;
  email?: string;
  ip: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Log a security audit event. Writes to console in structured JSON
 * and optionally to the database if a db handle is provided.
 */
export async function logAuditEvent(
  event: Omit<AuditEvent, "timestamp">,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db?: { collection: (name: string) => { insertOne: (doc: any) => Promise<any> } }
): Promise<void> {
  const fullEvent: AuditEvent = { ...event, timestamp: new Date() };

  // Always log to structured console output
  console.log(JSON.stringify({ audit: fullEvent }));

  // Persist to database if available
  if (db) {
    try {
      await db.collection("audit_logs").insertOne(fullEvent);
    } catch (err) {
      console.error("Failed to persist audit event:", err);
    }
  }
}

// ---------------------------------------------------------------------------
// CSRF Protection — double-submit cookie pattern
// ---------------------------------------------------------------------------

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a CSRF token and return it. The caller should set it as a cookie.
 */
export function generateCsrfToken(): string {
  return generateSecureToken(32);
}

/**
 * Validate CSRF by comparing the cookie value to the header value.
 * Returns true if valid.
 */
export function validateCsrfToken(request: Request): boolean {
  // Skip for non-mutation methods
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  let cookieToken: string | undefined;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key === CSRF_COOKIE_NAME) {
      cookieToken = val;
      break;
    }
  }
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Constant-time comparison
  if (cookieToken.length !== headerToken.length) return false;
  let mismatch = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    mismatch |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  return mismatch === 0;
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };

