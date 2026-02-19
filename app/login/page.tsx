"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button, Input, Checkbox } from "@/components/ui";
import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";

function LoginContent() {
  const { login, socialLogin, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login({ email, password });

    if (!result.success) {
      setError(result.error || "Failed to login");
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Value reinforcement (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Logo at top */}
        <div className="relative z-10">
          <Image
            src="/flexiwell-logo-white.svg"
            alt="FlexiWell"
            width={120}
            height={26}
            priority
          />
        </div>

        <div className="relative z-10 max-w-lg">
          {/* Welcome back messaging */}
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Welcome back.
          </h1>
          <p className="text-xl text-primary-100 mb-10">
            Your studio is recovering revenue while you were away.
          </p>

          {/* Value reminders */}
          <div className="space-y-6 mb-10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Recover $2,300+/mo</h3>
                <p className="text-sm text-primary-200">Smart waitlist + SMS reminders fill empty spots automatically</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">35% Fewer No-Shows</h3>
                <p className="text-sm text-primary-200">Automated reminders reduce no-shows backed by research</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">10+ Hours Saved Weekly</h3>
                <p className="text-sm text-primary-200">Online scheduling and auto-fill replace manual admin work</p>
              </div>
            </div>
          </div>

          {/* Risk reversal */}
          <div className="flex items-center gap-3 pt-6 border-t border-white/20">
            <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm text-primary-100">
              60-day money-back guarantee — zero risk to try
            </span>
          </div>
        </div>

        {/* Spacer for justify-between balance */}
        <div />
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12">
        {/* Mobile: logo + value banner (hidden on desktop where left panel shows) */}
        <div className="lg:hidden w-full max-w-[400px] mb-6 space-y-5">
          <Image
            src="/flexiwell-logo.svg"
            alt="FlexiWell"
            width={110}
            height={24}
            priority
          />
          <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-sm text-primary-700">
              Studios using FlexiWell recover <span className="font-semibold">$2,300+/mo</span> in lost revenue
            </p>
          </div>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Header */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-8">Welcome back to your dashboard.</p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between">
              <Checkbox
                label="Remember for 30 days"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            </div>

            <Button type="submit" fullWidth size="lg" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <Button
              type="button"
              variant="secondary"
              fullWidth
              size="lg"
              leftIcon={<GoogleIcon className="w-5 h-5" />}
              onClick={() => socialLogin("google", "login")}
            >
              Sign in with Google
            </Button>

            <p className="text-center text-sm text-gray-600 pt-3">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
