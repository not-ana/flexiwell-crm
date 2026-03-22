"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import AuthLayout from "@/components/auth/AuthLayout";
import TurnstileWidget from "@/components/auth/TurnstileWidget";

function ForgotPasswordSide() {
  return (
    <div className="max-w-md">
      <h1 className="text-4xl font-bold mb-3 leading-tight">No worries.</h1>
      <p className="text-lg text-primary-200 mb-8">
        We&apos;ll get you back into your dashboard in no time.
      </p>
      <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-5">
        <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div>
          <p className="font-semibold text-sm mb-1">Your data is safe</p>
          <p className="text-sm text-primary-200">
            Your studio data, client records, and settings are all securely stored and waiting for you.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }
      setSent(true);
    } catch (err) {
      // Always show success to prevent email enumeration
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout side={<ForgotPasswordSide />}>
      <div>
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-sm text-gray-500 mb-6">
              If an account exists for <span className="font-medium text-gray-700">{email}</span>, we sent password reset instructions.
            </p>
            <Link href="/login">
              <Button variant="secondary" fullWidth size="lg">
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset your password</h1>
            <p className="text-sm text-gray-500 mb-8">
              Enter the email associated with your account and we&apos;ll send a reset link.
            </p>

            {error && (
              <div className="mb-5 p-3 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-sm text-error-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="you@studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <TurnstileWidget onVerify={setTurnstileToken} />

              <Button type="submit" fullWidth size="lg" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Remember your password?{" "}
              <Link href="/login" className="font-semibold text-primary-700 hover:text-primary-800 transition-colors">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
