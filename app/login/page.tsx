"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Input, Checkbox } from "@/components/ui";
import { GoogleIcon, CloseIcon } from "@/components/icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password, rememberMe });
  };

  return (
    <div className="min-h-screen bg-gray-600 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white rounded-xl shadow-xl">
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
            <Button type="submit" fullWidth size="lg">
              Sign in
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
