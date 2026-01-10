"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  authApi,
  storeTokens,
  clearTokens,
  getStoredTokens,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
} from "@/lib/api/client";

type SocialProvider = "google" | "facebook";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  socialLogin: (provider: SocialProvider, mode?: "login" | "signup") => void;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/pricing", "/bundle", "/auth/callback"];

// Role-based route prefixes
const roleRoutes: Record<string, string[]> = {
  admin: ["/admin"],
  teacher: ["/teacher"],
  client: ["/dashboard"],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { accessToken } = getStoredTokens();

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.me();

        if (response.data?.user) {
          setUser(response.data.user);
        } else {
          clearTokens();
        }
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle route protection
  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith("/(marketing)")
    );

    // If not authenticated and trying to access protected route
    if (!user && !isPublicRoute) {
      router.push("/login");
      return;
    }

    // Note: Role-based access check disabled to allow demo switching between dashboards
    // In production, you would enable this to restrict access based on user role
  }, [user, isLoading, pathname, router]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        console.log("[Auth] Attempting login with:", credentials.email);
        const response = await authApi.login(credentials);
        console.log("[Auth] Login response:", response);

        if (response.error) {
          console.log("[Auth] Login error:", response.error);
          return { success: false, error: response.error.error };
        }

        if (response.data) {
          const { user, tokens } = response.data;
          console.log("[Auth] Login successful, user:", user);
          storeTokens(tokens.accessToken, tokens.refreshToken);
          setUser(user);

          // Redirect based on role
          const redirectPath =
            user.role === "admin"
              ? "/admin"
              : user.role === "teacher"
              ? "/teacher"
              : "/dashboard";
          console.log("[Auth] Redirecting to:", redirectPath);
          router.push(redirectPath);

          return { success: true };
        }

        return { success: false, error: "Unknown error occurred" };
      } catch (error) {
        console.error("[Auth] Login exception:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Login failed",
        };
      }
    },
    [router]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        const response = await authApi.register(data);

        if (response.error) {
          return { success: false, error: response.error.error };
        }

        if (response.data) {
          const { user, tokens } = response.data;
          storeTokens(tokens.accessToken, tokens.refreshToken);
          setUser(user);

          // Redirect based on role
          const redirectPath =
            user.role === "admin"
              ? "/admin"
              : user.role === "teacher"
              ? "/teacher"
              : "/dashboard";
          router.push(redirectPath);

          return { success: true };
        }

        return { success: false, error: "Unknown error occurred" };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Registration failed",
        };
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      clearTokens();
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const updateUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser);
  }, []);

  const socialLogin = useCallback((provider: SocialProvider, mode: "login" | "signup" = "login") => {
    // Redirect to OAuth authorization endpoint
    window.location.href = `/api/auth/social/${provider}/authorize?mode=${mode}`;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        socialLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// HOC for protected pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: AuthUser["role"][]
) {
  return function ProtectedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/login");
      }

      if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
        const defaultRoute =
          user.role === "admin"
            ? "/admin"
            : user.role === "teacher"
            ? "/teacher"
            : "/dashboard";
        router.push(defaultRoute);
      }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return null;
    }

    return <Component {...props} />;
  };
}
