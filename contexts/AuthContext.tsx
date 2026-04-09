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

interface ExtendedAuthUser extends AuthUser {
  primaryRole?: AuthUser["role"];
  availableRoles?: AuthUser["role"][];
}

interface AuthContextType {
  user: ExtendedAuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string }>;
  socialLogin: (provider: SocialProvider, mode?: "login" | "signup") => void;
  logout: () => Promise<void>;
  updateUser: (user: ExtendedAuthUser) => void;
  switchRole: (role: AuthUser["role"]) => Promise<{ success: boolean; error?: string }>;
  canSwitchRoles: boolean;
  availableRoles: AuthUser["role"][];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/pricing", "/auth/callback"];

// Role-based route prefixes
const roleRoutes: Record<string, string[]> = {
  admin: ["/admin", "/operator"],
  teacher: ["/teacher"],
};

// Default landing path for a user. Operators land on /operator unless
// they're currently impersonating a studio (then they belong in /admin).
function defaultPathFor(user: { role: string; isOperator?: boolean; impersonating?: boolean }): string {
  if (user.isOperator && !user.impersonating) return "/operator";
  if (user.role === "admin") return "/admin";
  return "/teacher";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedAuthUser | null>(null);
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

    // Role-based access check - redirect if user tries to access wrong dashboard
    if (user) {
      const allowedPrefixes = roleRoutes[user.role] || [];
      const isAllowedRoute = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));
      const isAccessingProtectedRoute = Object.values(roleRoutes)
        .flat()
        .some((prefix) => pathname.startsWith(prefix));

      if (isAccessingProtectedRoute && !isAllowedRoute) {
        router.push(defaultPathFor(user));
        return;
      }

      // Operators (not currently impersonating) belong in /operator. If they
      // land on /admin or its subpages, bounce them out — there's nothing
      // useful for them there until they pick a studio.
      if (user.isOperator && !user.impersonating && pathname.startsWith("/admin")) {
        router.push("/operator");
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        const response = await authApi.login(credentials);

        if (response.error) {
          return { success: false, error: response.error.error };
        }

        if (response.data) {
          const { user, tokens } = response.data;
          storeTokens(tokens.accessToken, tokens.refreshToken);
          setUser(user);

          // Redirect based on role (operators land on /operator)
          router.push(defaultPathFor(user));

          return { success: true };
        }

        return { success: false, error: "Unknown error occurred" };
      } catch (error) {
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

          // Redirect based on role (operators land on /operator)
          router.push(defaultPathFor(user));

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

  const updateUser = useCallback((updatedUser: ExtendedAuthUser) => {
    setUser(updatedUser);
  }, []);

  // Switch role - works in both dev and production for users with multiple roles
  const switchRole = useCallback(async (role: AuthUser["role"]): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const availableRoles = user.availableRoles || [user.role];

    // Check if user has access to this role
    if (!availableRoles.includes(role)) {
      // In dev mode, allow switching for testing
      if (process.env.NODE_ENV === "development") {
        const updatedUser = { ...user, role };
        setUser(updatedUser);
        const redirectPath = role === "admin" ? "/admin" : "/teacher";
        router.push(redirectPath);
        return { success: true };
      }
      return { success: false, error: "You do not have access to this role" };
    }

    try {
      // Call API to switch role and get new tokens
      const { accessToken } = getStoredTokens();
      const response = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to switch role" };
      }

      // Store new tokens
      storeTokens(data.tokens.accessToken, data.tokens.refreshToken);

      // Update user state with new role
      setUser(data.user);

      // Navigate to appropriate dashboard
      const redirectPath = role === "admin" ? "/admin" : "/teacher";
      router.push(redirectPath);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to switch role",
      };
    }
  }, [user, router]);

  const socialLogin = useCallback((provider: SocialProvider, mode: "login" | "signup" = "login") => {
    // Redirect to OAuth authorization endpoint
    window.location.href = `/api/auth/social/${provider}/authorize?mode=${mode}`;
  }, []);

  // Compute available roles
  const availableRoles = user?.availableRoles || (user ? [user.role] : []);
  const canSwitchRoles = availableRoles.length > 1;

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
        switchRole,
        canSwitchRoles,
        availableRoles,
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
        const defaultRoute = user.role === "admin" ? "/admin" : "/teacher";
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
