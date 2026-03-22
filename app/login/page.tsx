"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Checkbox } from "@/components/ui";
import { GoogleIcon } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import TurnstileWidget from "@/components/auth/TurnstileWidget";

function LoginSide() {
  return (
    <div className="max-w-md">
      <h1 className="text-4xl font-bold mb-3 leading-tight">Welcome back.</h1>
      <p className="text-lg text-primary-200 mb-10">
        Your studio is recovering revenue while you were away.
      </p>

      {/* Value highlights */}
      <div className="space-y-5 mb-10">
        {[
          {
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ),
            title: "Recover $2,300+/mo",
            desc: "Smart waitlist + SMS reminders fill empty spots automatically",
          },
          {
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            ),
            title: "35% fewer no-shows",
            desc: "Automated reminders reduce no-shows backed by research",
          },
          {
            icon: (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            ),
            title: "10+ hours saved weekly",
            desc: "Online scheduling and auto-fill replace manual admin work",
          },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {item.icon}
              </svg>
            </div>
            <div>
              <h3 className="font-semibold mb-0.5">{item.title}</h3>
              <p className="text-sm text-primary-200">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Testimonial */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
        <div className="flex gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <p className="text-sm text-primary-100 leading-relaxed mb-3">
          &ldquo;We went from 18% no-shows to under 6% in the first month. FlexiWell paid for itself on day one.&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-xs font-bold">
            SR
          </div>
          <div>
            <p className="text-sm font-medium">Sarah R.</p>
            <p className="text-xs text-primary-300">Body Balance Pilates, Austin TX</p>
          </div>
        </div>
      </div>

      {/* Guarantee */}
      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/15">
        <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span className="text-sm text-primary-200">
          60-day money-back guarantee — zero risk to try
        </span>
      </div>
    </div>
  );
}

function MobileBanner() {
  return (
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
  );
}

function LoginContent() {
  const { login, socialLogin, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) setError(urlError);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await login({ email, password, turnstileToken });
    if (!result.success) {
      setError(result.error || "Failed to login");
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
    <AuthLayout side={<LoginSide />} mobileBanner={<MobileBanner />}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-8">Welcome back to your dashboard.</p>

        {error && (
          <div className="mb-6 p-3 bg-error-50 border border-error-200 rounded-lg animate-[fadeIn_0.2s_ease-out]">
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

          <div>
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="flex items-center justify-between mt-2">
              <Checkbox
                label="Remember me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
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

          <TurnstileWidget onVerify={setTurnstileToken} />

          {/* Divider */}
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
            onClick={() => socialLogin("google", "login")}
          >
            Sign in with Google
          </Button>

          <p className="text-center text-sm text-gray-500 pt-2">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary-700 hover:text-primary-800 transition-colors">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
