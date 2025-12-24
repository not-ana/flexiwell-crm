"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Input } from "@/components/ui";
import { GoogleIcon, CloseIcon, FacebookIcon, AppleIcon } from "@/components/icons";

export default function SignUpPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email });
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
              Create an account
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Start your free 30-day trial. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="space-y-4">
            {/* Email */}
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <div className="space-y-3">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                size="lg"
                leftIcon={<GoogleIcon className="w-5 h-5" />}
              >
                Sign up with Google
              </Button>

              <Button
                type="button"
                variant="secondary"
                fullWidth
                size="lg"
                leftIcon={<FacebookIcon className="w-5 h-5" />}
              >
                Sign up with Facebook
              </Button>

              <Button
                type="button"
                variant="secondary"
                fullWidth
                size="lg"
                leftIcon={<AppleIcon className="w-5 h-5" />}
              >
                Sign up with Apple
              </Button>
            </div>
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-gray-600 mt-8">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-primary-700 hover:text-primary-800"
            >
              Log in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
