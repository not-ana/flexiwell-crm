import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
} from "@/lib/auth/jwt";
import type { JWTPayload } from "@/lib/auth/jwt";

const testPayload: JWTPayload = {
  userId: "user123",
  email: "test@example.com",
  role: "admin",
  name: "Test User",
  establishmentId: "est123",
};

// ---------------------------------------------------------------------------
// Password Hashing
// ---------------------------------------------------------------------------
describe("password hashing", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("MyStr0ng!Pass");
    expect(hash).not.toBe("MyStr0ng!Pass");
    expect(await verifyPassword("MyStr0ng!Pass", hash)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("MyStr0ng!Pass");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Access Tokens
// ---------------------------------------------------------------------------
describe("access tokens", () => {
  it("generates and verifies an access token", () => {
    const token = generateAccessToken(testPayload);
    const decoded = verifyAccessToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe("user123");
    expect(decoded!.email).toBe("test@example.com");
    expect(decoded!.role).toBe("admin");
  });

  it("returns null for invalid token", () => {
    expect(verifyAccessToken("invalid.token.here")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(verifyAccessToken("")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Refresh Tokens
// ---------------------------------------------------------------------------
describe("refresh tokens", () => {
  it("generates and verifies a refresh token", () => {
    const token = generateRefreshToken("user123");
    const decoded = verifyRefreshToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe("user123");
  });

  it("returns null for invalid token", () => {
    expect(verifyRefreshToken("bad")).toBeNull();
  });

  it("access token cannot be used as refresh token", () => {
    const accessToken = generateAccessToken(testPayload);
    expect(verifyRefreshToken(accessToken)).toBeNull();
  });

  it("refresh token cannot be used as access token", () => {
    const refreshToken = generateRefreshToken("user123");
    expect(verifyAccessToken(refreshToken)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Token Pairs
// ---------------------------------------------------------------------------
describe("generateTokenPair", () => {
  it("generates both tokens", () => {
    const { accessToken, refreshToken } = generateTokenPair(testPayload);
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(verifyAccessToken(accessToken)).not.toBeNull();
    expect(verifyRefreshToken(refreshToken)).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// extractTokenFromHeader
// ---------------------------------------------------------------------------
describe("extractTokenFromHeader", () => {
  it("extracts Bearer token", () => {
    expect(extractTokenFromHeader("Bearer abc123")).toBe("abc123");
  });

  it("returns null for non-Bearer header", () => {
    expect(extractTokenFromHeader("Basic abc123")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(extractTokenFromHeader(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractTokenFromHeader("")).toBeNull();
  });
});
