import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock jsonwebtoken with default export
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn((payload, secret, options) => {
      return `mock-token-${JSON.stringify(payload)}`;
    }),
    verify: vi.fn((token, secret) => {
      if (token.includes("invalid")) throw new Error("Invalid token");
      if (token.includes("expired")) throw { name: "TokenExpiredError" };
      return { userId: "123", email: "test@test.com", role: "admin", name: "Test User" };
    }),
  },
}));

// Import after mocking
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/auth/jwt";

describe("JWT Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateAccessToken", () => {
    it("should generate an access token with user data", () => {
      const user = {
        userId: "123",
        email: "test@test.com",
        role: "admin" as const,
        name: "Test User",
      };

      const token = generateAccessToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a refresh token with user id", () => {
      const token = generateRefreshToken("123");

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });
  });

  describe("verifyAccessToken", () => {
    it("should return payload for valid token", () => {
      const result = verifyAccessToken("valid-token");

      expect(result).toBeDefined();
      expect(result?.userId).toBe("123");
      expect(result?.email).toBe("test@test.com");
    });

    it("should return null for invalid token", () => {
      const result = verifyAccessToken("invalid-token");

      expect(result).toBeNull();
    });

    it("should return null for expired token", () => {
      const result = verifyAccessToken("expired-token");

      expect(result).toBeNull();
    });
  });

  describe("verifyRefreshToken", () => {
    it("should return payload for valid refresh token", () => {
      const result = verifyRefreshToken("valid-refresh-token");

      expect(result).toBeDefined();
    });

    it("should return null for invalid refresh token", () => {
      const result = verifyRefreshToken("invalid-token");

      expect(result).toBeNull();
    });
  });
});
