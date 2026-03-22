"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { GoogleIcon, CloseIcon } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { foundingMemberOffer } from "@/lib/config/pricing";
import TurnstileWidget from "@/components/auth/TurnstileWidget";

type UserRole = "client" | "admin" | "teacher";

const roleOptions: { value: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "client",
    label: "Client",
    desc: "Book classes",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    value: "admin",
    label: "Owner",
    desc: "Manage studio",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    value: "teacher",
    label: "Staff",
    desc: "Teach classes",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

function SignupSide() {
  const spotsRemaining = foundingMemberOffer.totalSpots - foundingMemberOffer.spotsClaimed;

  return (
    <div className="max-w-md">
      {/* Scarcity badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full mb-8">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <span className="text-sm font-medium">
          Only {spotsRemaining} Founding Member spots left
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl font-bold mb-3 leading-tight">
        {foundingMemberOffer.painPoints.headline}
      </h1>
      <p className="text-lg text-primary-200 mb-8">
        {foundingMemberOffer.painPoints.subheadline}
      </p>

      {/* Price card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl font-bold">${foundingMemberOffer.foundingPrice}</span>
          <span className="text-primary-200">/month</span>
          <span className="text-primary-300 line-through text-lg">${foundingMemberOffer.regularPrice}/mo</span>
        </div>
        <p className="text-sm text-primary-200">
          Locked for {foundingMemberOffer.lockedMonths} months. Competitors charge {foundingMemberOffer.competitorAnchoring.mindbody.range}.
        </p>
      </div>

      {/* Value stacking */}
      <div className="space-y-2.5 mb-8">
        <p className="text-xs font-semibold text-primary-300 uppercase tracking-wider mb-3">
          Included free for Founding Members:
        </p>
        {foundingMemberOffer.bonuses.map((bonus) => (
          <div key={bonus.name} className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">
              {bonus.name}{" "}
              <span className="text-primary-300 line-through">(${bonus.value.toLocaleString()} value)</span>
            </span>
          </div>
        ))}
        <div className="pt-3 border-t border-white/15">
          <p className="text-sm font-semibold text-green-400">
            Total included value: ${foundingMemberOffer.totalBonusValue.toLocaleString()} FREE
          </p>
        </div>
      </div>

      {/* Guarantee */}
      <div className="flex items-start gap-3 bg-green-500/15 rounded-xl p-4 mb-6">
        <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div>
          <p className="font-semibold text-sm">{foundingMemberOffer.guarantee.days}-Day No-Show Guarantee</p>
          <p className="text-sm text-primary-200">{foundingMemberOffer.guarantee.promise}</p>
        </div>
      </div>

      {/* Social proof */}
      <div className="flex items-center gap-4">
        <div className="flex -space-x-2">
          {["SR", "MJ", "KL", "DP"].map((initials) => (
            <div key={initials} className="w-8 h-8 rounded-full bg-primary-400 border-2 border-primary-700 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
          ))}
        </div>
        <div className="text-sm">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-primary-200">
            {foundingMemberOffer.socialProof.rating}/5 from {foundingMemberOffer.socialProof.reviewCount}+ reviews
          </span>
        </div>
      </div>
    </div>
  );
}

function MobileBanner() {
  const spotsRemaining = foundingMemberOffer.totalSpots - foundingMemberOffer.spotsClaimed;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-primary-700">
          Studios lose <span className="font-semibold">$3,500/mo</span> to no-shows. We fix that.
        </p>
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-medium">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        Only {spotsRemaining} spots left
      </div>
    </div>
  );
}

function SignUpContent() {
  const { register, socialLogin, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"email" | "details">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("admin");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeValid, setInviteCodeValid] = useState<boolean | null>(null);
  const [inviteCompanyName, setInviteCompanyName] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteDebounceTimer, setInviteDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) setError(urlError);
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
      turnstileToken,
    });

    if (!result.success) {
      setError(result.error || "Failed to create account");
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <AuthLayout side={<SignupSide />} mobileBanner={<MobileBanner />}>
      <div>
        {/* Close button */}
        <Link
          href="/"
          className="absolute top-4 right-4 lg:top-6 lg:right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <CloseIcon className="w-5 h-5" />
        </Link>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          <div className="h-1 flex-1 rounded-full bg-primary-600 transition-all duration-300" />
          <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step === "details" ? "bg-primary-600" : "bg-gray-200"}`} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {step === "email" ? "Start your free trial" : "Complete your profile"}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {step === "email"
            ? "30-day free trial. No credit card required."
            : `Step 2 of 2 ${email ? `for ${email}` : ""}`}
        </p>

        {error && (
          <div className="mb-5 p-3 bg-error-50 border border-error-200 rounded-lg animate-[fadeIn_0.2s_ease-out]">
            <p className="text-sm text-error-600">{error}</p>
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" fullWidth size="lg">
              Start My Free Trial
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

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

            <p className="text-center text-sm text-gray-500 pt-4">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary-700 hover:text-primary-800 transition-colors">
                Log in
              </Link>
            </p>
          </form>
        )}

        {/* Step 2: Details */}
        {step === "details" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Back button */}
            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors -mt-2 mb-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setUserRole(role.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                      userRole === role.value
                        ? "border-primary-600 bg-primary-50 shadow-sm shadow-primary-100"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      userRole === role.value
                        ? "bg-primary-100 text-primary-600"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {role.icon}
                    </div>
                    <span className={`text-xs font-medium ${userRole === role.value ? "text-primary-700" : "text-gray-700"}`}>
                      {role.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{role.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Invite Code — clients only */}
            {userRole === "client" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Invite code *</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Ex: FW-ABC123"
                    value={inviteCode}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase();
                      setInviteCode(code);
                      if (inviteDebounceTimer) clearTimeout(inviteDebounceTimer);
                      setInviteDebounceTimer(setTimeout(() => validateInviteCode(code), 500));
                    }}
                    className={`uppercase ${
                      inviteCodeValid === true ? "border-success-500 focus:border-success-500" :
                      inviteCodeValid === false ? "border-error-500 focus:border-error-500" : ""
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
                      <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {!isValidatingCode && inviteCodeValid === false && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
                {inviteCodeValid && inviteCompanyName && (
                  <p className="mt-1 text-sm text-success-600">
                    You&apos;ll be linked to: <span className="font-medium">{inviteCompanyName}</span>
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">Ask for the invite code from your studio or gym</p>
              </div>
            )}

            <Input
              label="Full name"
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="mt-2">
                <PasswordStrength password={password} />
              </div>
            </div>

            <Input
              label="Confirm password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <TurnstileWidget onVerify={setTurnstileToken} />

            <p className="text-xs text-gray-400">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-primary-700 hover:underline">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-primary-700 hover:underline">Privacy Policy</Link>.
            </p>

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

            <p className="text-center text-sm text-gray-500 pt-2">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary-700 hover:text-primary-800 transition-colors">
                Log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
