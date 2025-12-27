"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Input, Checkbox } from "@/components/ui";
import { GoogleIcon, CloseIcon } from "@/components/icons";

type UserRole = "client" | "admin" | "teacher";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("client");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Replace with real authentication
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Redirect based on user role
    switch (userRole) {
      case "admin":
        router.push("/admin");
        break;
      case "teacher":
        router.push("/teacher");
        break;
      default:
        router.push("/dashboard");
    }
  };

  const roleLabels: Record<UserRole, string> = {
    client: "Client",
    admin: "Admin",
    teacher: "Teacher",
  };

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
          <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">
              Log in to your account
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back! Please enter your details.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="space-y-5">
            {/* User Role Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
              <div className="grid grid-cols-3 gap-3">
                {/* Client */}
                <button
                  type="button"
                  onClick={() => setUserRole("client")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    userRole === "client"
                      ? "border-primary-600 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    userRole === "client" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className={`text-sm font-medium ${userRole === "client" ? "text-primary-700" : "text-gray-700"}`}>
                    Client
                  </span>
                  <span className="text-xs text-gray-500 text-center">Book & track</span>
                </button>

                {/* Admin */}
                <button
                  type="button"
                  onClick={() => setUserRole("admin")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    userRole === "admin"
                      ? "border-primary-600 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    userRole === "admin" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className={`text-sm font-medium ${userRole === "admin" ? "text-primary-700" : "text-gray-700"}`}>
                    Admin
                  </span>
                  <span className="text-xs text-gray-500 text-center">Manage all</span>
                </button>

                {/* Teacher */}
                <button
                  type="button"
                  onClick={() => setUserRole("teacher")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    userRole === "teacher"
                      ? "border-primary-600 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    userRole === "teacher" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className={`text-sm font-medium ${userRole === "teacher" ? "text-primary-700" : "text-gray-700"}`}>
                    Teacher
                  </span>
                  <span className="text-xs text-gray-500 text-center">My classes</span>
                </button>
              </div>
            </div>

            {/* Email */}
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password */}
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <Checkbox
                label="Remember for 30 days"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <a
                href="/forgot-password"
                className="text-sm font-semibold text-primary-700 hover:text-primary-800"
              >
                Forgot password
              </a>
            </div>

            {/* Sign in button */}
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
                `Sign in as ${roleLabels[userRole]}`
              )}
            </Button>

            {/* Google button */}
            <Button
              type="button"
              variant="secondary"
              fullWidth
              size="lg"
              leftIcon={<GoogleIcon className="w-5 h-5" />}
            >
              Sign in with Google
            </Button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-600 mt-8">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-semibold text-primary-700 hover:text-primary-800"
            >
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
