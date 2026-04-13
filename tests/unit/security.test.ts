import { describe, it, expect, beforeEach } from "vitest";
import {
  validatePassword,
  escapeRegex,
  sanitizeSearchInput,
  generateSecureToken,
  checkAccountLockout,
  recordFailedLogin,
  clearLockout,
  validateCsrfToken,
  generateCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from "@/lib/security";

// ---------------------------------------------------------------------------
// Password Validation
// ---------------------------------------------------------------------------
describe("validatePassword", () => {
  it("accepts a strong password", () => {
    const result = validatePassword("MyStr0ng!Pass");
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects short passwords", () => {
    const result = validatePassword("Ab1!");
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("8 characters"))).toBe(true);
  });

  it("rejects passwords without uppercase", () => {
    const result = validatePassword("mystrongpass1!");
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("uppercase"))).toBe(true);
  });

  it("rejects passwords without lowercase", () => {
    const result = validatePassword("MYSTRONGPASS1!");
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("lowercase"))).toBe(true);
  });

  it("rejects passwords without numbers", () => {
    const result = validatePassword("MyStrongPass!");
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("number"))).toBe(true);
  });

  it("rejects passwords without special characters", () => {
    const result = validatePassword("MyStr0ngPass");
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("special"))).toBe(true);
  });

  it("rejects common passwords", () => {
    const result = validatePassword("Password123!");
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("common"))).toBe(true);
  });

  it("rejects passwords over 128 characters", () => {
    const long = "A".repeat(129) + "a1!";
    const result = validatePassword(long);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("128"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Input Sanitization
// ---------------------------------------------------------------------------
describe("escapeRegex", () => {
  it("escapes regex special characters", () => {
    expect(escapeRegex("hello.world")).toBe("hello\\.world");
    expect(escapeRegex("a+b*c?")).toBe("a\\+b\\*c\\?");
    expect(escapeRegex("(test)")).toBe("\\(test\\)");
  });
});

describe("sanitizeSearchInput", () => {
  it("escapes and truncates input", () => {
    const result = sanitizeSearchInput("hello.world");
    expect(result).toBe("hello\\.world");
  });

  it("truncates to 100 chars", () => {
    const long = "a".repeat(200);
    expect(sanitizeSearchInput(long).length).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Secure Token Generation
// ---------------------------------------------------------------------------
describe("generateSecureToken", () => {
  it("generates tokens of the requested length", () => {
    expect(generateSecureToken(16).length).toBe(16);
    expect(generateSecureToken(64).length).toBe(64);
  });

  it("generates unique tokens", () => {
    const a = generateSecureToken();
    const b = generateSecureToken();
    expect(a).not.toBe(b);
  });

  it("only contains alphanumeric characters", () => {
    const token = generateSecureToken(100);
    expect(token).toMatch(/^[A-Za-z0-9]+$/);
  });
});

// ---------------------------------------------------------------------------
// Account Lockout
// ---------------------------------------------------------------------------
describe("account lockout", () => {
  beforeEach(() => {
    clearLockout("test@example.com");
  });

  it("allows login when no failed attempts", () => {
    const result = checkAccountLockout("test@example.com");
    expect(result.locked).toBe(false);
    expect(result.remainingAttempts).toBe(5);
  });

  it("tracks failed attempts", () => {
    recordFailedLogin("test@example.com");
    recordFailedLogin("test@example.com");
    const result = checkAccountLockout("test@example.com");
    expect(result.locked).toBe(false);
    expect(result.remainingAttempts).toBe(3);
  });

  it("locks account after 5 failed attempts", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedLogin("test@example.com");
    }
    const result = checkAccountLockout("test@example.com");
    expect(result.locked).toBe(true);
    expect(result.remainingAttempts).toBe(0);
    expect(result.lockedUntilMs).toBeDefined();
  });

  it("clears lockout on successful login", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedLogin("test@example.com");
    }
    expect(checkAccountLockout("test@example.com").locked).toBe(true);

    clearLockout("test@example.com");
    expect(checkAccountLockout("test@example.com").locked).toBe(false);
    expect(checkAccountLockout("test@example.com").remainingAttempts).toBe(5);
  });

  it("isolates lockouts per email", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedLogin("locked@example.com");
    }
    expect(checkAccountLockout("locked@example.com").locked).toBe(true);
    expect(checkAccountLockout("other@example.com").locked).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CSRF Protection
// ---------------------------------------------------------------------------
describe("CSRF validation", () => {
  it("passes for GET requests without tokens", () => {
    const req = new Request("http://localhost/api/test", { method: "GET" });
    expect(validateCsrfToken(req)).toBe(true);
  });

  it("fails for POST without CSRF token", () => {
    const req = new Request("http://localhost/api/test", { method: "POST" });
    expect(validateCsrfToken(req)).toBe(false);
  });

  it("passes when cookie and header match", () => {
    const token = generateCsrfToken();
    const headers = new Headers();
    headers.set("cookie", `${CSRF_COOKIE_NAME}=${token}`);
    headers.set(CSRF_HEADER_NAME, token);
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers,
    });
    // Verify cookie header is actually set (some environments strip it)
    const cookieVal = req.headers.get("cookie");
    if (!cookieVal) {
      // happy-dom strips cookie header from Request — test the function directly
      // by creating a minimal request-like object
      const fakeReq = {
        method: "POST",
        headers: { get: (name: string) => name === "cookie" ? `${CSRF_COOKIE_NAME}=${token}` : name === CSRF_HEADER_NAME ? token : null },
      } as unknown as Request;
      expect(validateCsrfToken(fakeReq)).toBe(true);
    } else {
      expect(validateCsrfToken(req)).toBe(true);
    }
  });

  it("fails when cookie and header don't match", () => {
    const fakeReq = {
      method: "POST",
      headers: { get: (name: string) => name === "cookie" ? `${CSRF_COOKIE_NAME}=token-a` : name === CSRF_HEADER_NAME ? "token-b" : null },
    } as unknown as Request;
    expect(validateCsrfToken(fakeReq)).toBe(false);
  });

  it("fails when only cookie is present", () => {
    const token = generateCsrfToken();
    const fakeReq = {
      method: "POST",
      headers: { get: (name: string) => name === "cookie" ? `${CSRF_COOKIE_NAME}=${token}` : null },
    } as unknown as Request;
    expect(validateCsrfToken(fakeReq)).toBe(false);
  });
});
