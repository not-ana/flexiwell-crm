"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError("Invalid reset link. Please request a new password reset.");
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();

        if (data.valid) {
          setTokenValid(true);
          setMaskedEmail(data.email);
        } else {
          setError(data.error || "Invalid or expired reset link.");
        }
      } catch {
        setError("Failed to validate reset link.");
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-600 flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white rounded-xl shadow-xl p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
          <p className="text-center text-gray-600 mt-4">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!tokenValid && !success) {
    return (
      <div className="min-h-screen bg-gray-600 flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white rounded-xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/flexiwell-logo.svg"
              alt="Flexiwell"
              width={87}
              height={19}
              priority
            />
          </div>

          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Link expired
          </h1>
          <p className="text-gray-600 text-center mb-6">
            {error || "This password reset link is invalid or has expired."}
          </p>

          <Link href="/forgot-password">
            <Button className="w-full">Request new reset link</Button>
          </Link>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600 hover:text-gray-900"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-600 flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white rounded-xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/flexiwell-logo.svg"
              alt="Flexiwell"
              width={87}
              height={19}
              priority
            />
          </div>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Password reset successful
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Your password has been changed successfully. You can now log in with your new password.
          </p>

          <Button className="w-full" onClick={() => router.push("/login")}>
            Continue to login
          </Button>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-gray-600 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="pt-6 pb-4 px-6">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <Image
              src="/flexiwell-logo.svg"
              alt="Flexiwell"
              width={87}
              height={19}
              priority
            />
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">
              Set new password
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {maskedEmail && `Reset password for ${maskedEmail}`}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="New password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 -mt-2">
              Must be at least 8 characters
            </p>

            <Input
              label="Confirm password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isLoading || !password || !confirmPassword}
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600 hover:text-gray-900"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to login
          </Link>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-600 flex items-center justify-center p-4">
          <div className="w-full max-w-[440px] bg-white rounded-xl shadow-xl p-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
