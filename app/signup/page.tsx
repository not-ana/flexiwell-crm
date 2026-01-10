"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { GoogleIcon, CloseIcon } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "client" | "admin" | "teacher";

function SignUpContent() {
  const { register, socialLogin, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"email" | "details">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("client");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeValid, setInviteCodeValid] = useState<boolean | null>(null);
  const [inviteCompanyName, setInviteCompanyName] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check for error in URL params (e.g., from OAuth callback)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setError("");
    setStep("details");
  };

  const validateInviteCode = async (code: string) => {
    if (!code || code.length < 4) {
      setInviteCodeValid(null);
      setInviteCompanyName("");
      return;
    }

    setIsValidatingCode(true);
    try {
      const response = await fetch("/api/company/verify-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await response.json();

      if (data.valid) {
        setInviteCodeValid(true);
        setInviteCompanyName(data.company?.name || "");
        setError("");
      } else {
        setInviteCodeValid(false);
        setInviteCompanyName("");
        setError(data.error || "Invalid invite code");
      }
    } catch {
      setInviteCodeValid(false);
      setInviteCompanyName("");
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Clients need a valid invite code
    if (userRole === "client" && !inviteCodeValid) {
      setError("Please enter a valid invite code");
      return;
    }

    setIsLoading(true);

    const result = await register({
      email,
      password,
      name,
      role: userRole,
      phone: phone || undefined,
      inviteCode: userRole === "client" ? inviteCode : undefined,
    });

    if (!result.success) {
      setError(result.error || "Failed to create account");
      setIsLoading(false);
    }
    // If successful, the AuthContext will handle redirect
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-600 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="relative pt-6 pb-4 px-6">
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

          {/* Close button */}
          <Link
            href="/"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <CloseIcon className="w-6 h-6" />
          </Link>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">
              {step === "email" ? "Create an account" : "Complete your profile"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {step === "email"
                ? "Start your free 30-day trial. Cancel anytime."
                : "Just a few more details to get you started."}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="px-6 pb-6">
            <div className="space-y-4">
              {/* Email */}
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* Get started button */}
              <Button type="submit" fullWidth size="lg">
                Get started
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-500">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Social buttons */}
              <Button
                type="button"
                variant="secondary"
                fullWidth
                size="lg"
                leftIcon={<GoogleIcon className="w-5 h-5" />}
                onClick={() => socialLogin("google", "signup")}
              >
                Sign up with Google
              </Button>
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-gray-600 mt-8">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                Log in
              </Link>
            </p>
          </form>
        )}

        {/* Step 2: Details */}
        {step === "details" && (
          <form onSubmit={handleSubmit} className="px-6 pb-6">
            <div className="space-y-4">
              {/* Back button */}
              <button
                type="button"
                onClick={() => setStep("email")}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {/* Email display */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Email: <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>

              {/* User Role Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Client */}
                  <button
                    type="button"
                    onClick={() => setUserRole("client")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      userRole === "client"
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        userRole === "client"
                          ? "bg-primary-100 text-primary-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className={`text-xs font-medium ${userRole === "client" ? "text-primary-700" : "text-gray-700"}`}>
                      Client
                    </span>
                  </button>

                  {/* Admin */}
                  <button
                    type="button"
                    onClick={() => setUserRole("admin")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      userRole === "admin"
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        userRole === "admin"
                          ? "bg-primary-100 text-primary-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className={`text-xs font-medium ${userRole === "admin" ? "text-primary-700" : "text-gray-700"}`}>
                      Owner
                    </span>
                  </button>

                  {/* Teacher */}
                  <button
                    type="button"
                    onClick={() => setUserRole("teacher")}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      userRole === "teacher"
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        userRole === "teacher"
                          ? "bg-primary-100 text-primary-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className={`text-xs font-medium ${userRole === "teacher" ? "text-primary-700" : "text-gray-700"}`}>
                      Staff
                    </span>
                  </button>
                </div>
              </div>

              {/* Invite Code - Only for clients */}
              {userRole === "client" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invite code *
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Ex: FW-ABC123"
                      value={inviteCode}
                      onChange={(e) => {
                        const code = e.target.value.toUpperCase();
                        setInviteCode(code);
                        validateInviteCode(code);
                      }}
                      className={`uppercase ${
                        inviteCodeValid === true
                          ? "border-green-500 focus:border-green-500"
                          : inviteCodeValid === false
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                    />
                    {isValidatingCode && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="animate-spin w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                        </svg>
                      </div>
                    )}
                    {!isValidatingCode && inviteCodeValid === true && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {!isValidatingCode && inviteCodeValid === false && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {inviteCodeValid === true && inviteCompanyName && (
                    <p className="mt-1 text-sm text-green-600">
                      You will be linked to: <span className="font-medium">{inviteCompanyName}</span>
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Ask for the invite code from your studio or gym
                  </p>
                </div>
              )}

              {/* Name */}
              <Input
                label="Full name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              {/* Phone (optional) */}
              <Input
                label="Phone (optional)"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              {/* Password */}
              <Input
                label="Password"
                type="password"
                placeholder="Create a password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* Confirm Password */}
              <Input
                label="Confirm password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {/* Terms */}
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="text-primary-700 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary-700 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>

              {/* Create account button */}
              <Button type="submit" fullWidth size="lg" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </Button>
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                Log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
