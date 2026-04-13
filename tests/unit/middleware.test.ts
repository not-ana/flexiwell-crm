import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  verifyAccessToken,
  extractTokenFromHeader,
} from "@/lib/auth/jwt";
import type { JWTPayload } from "@/lib/auth/jwt";
import { hasRole } from "@/lib/auth/middleware";

describe("middleware route protection logic", () => {
  const adminPayload: JWTPayload = {
    userId: "admin1",
    email: "admin@test.com",
    role: "admin",
    name: "Admin",
  };

  const teacherPayload: JWTPayload = {
    userId: "teacher1",
    email: "teacher@test.com",
    role: "teacher",
    name: "Teacher",
  };

  it("generates valid tokens that middleware can verify", () => {
    const token = generateAccessToken(adminPayload);
    const decoded = verifyAccessToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.role).toBe("admin");
  });

  it("admin has access to admin routes", () => {
    expect(hasRole(adminPayload, ["admin"])).toBe(true);
  });

  it("teacher does NOT have access to admin-only routes", () => {
    expect(hasRole(teacherPayload, ["admin"])).toBe(false);
  });

  it("teacher has access to teacher routes", () => {
    expect(hasRole(teacherPayload, ["admin", "teacher"])).toBe(true);
  });

  it("null user has no role access", () => {
    expect(hasRole(null, ["admin"])).toBe(false);
  });

  it("expired tokens return null", () => {
    const token = jwt.sign(
      { ...adminPayload },
      process.env.JWT_SECRET!,
      { expiresIn: "0s" }
    );
    expect(verifyAccessToken(token)).toBeNull();
  });

  it("token from wrong secret returns null", () => {
    const token = jwt.sign(adminPayload, "wrong-secret", { expiresIn: "15m" });
    expect(verifyAccessToken(token)).toBeNull();
  });

  it("extractTokenFromHeader works with Bearer prefix", () => {
    const token = generateAccessToken(adminPayload);
    expect(extractTokenFromHeader(`Bearer ${token}`)).toBe(token);
  });
});
