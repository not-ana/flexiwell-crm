"use client";

import { useState } from "react";
import { GoogleIcon } from "../icons";

export type AccountRole = "client" | "admin" | "teacher";
export type AddAccountStep = "role" | "credentials";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (email: string, password: string, role: AccountRole) => Promise<void>;
}

export function AddAccountModal({ isOpen, onClose, onAddAccount }: AddAccountModalProps) {
  const [step, setStep] = useState<AddAccountStep>("role");
  const [role, setRole] = useState<AccountRole>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = () => {
    setStep("role");
    setRole("client");
    setEmail("");
    setPassword("");
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (step === "role") {
      setStep("credentials");
    } else {
      setIsLoading(true);
      try {
        await onAddAccount(email, password, role);
        handleReset();
      } catch (error) {
        console.error("Failed to add account:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {step === "role" ? "Add account" : "Sign in"}
            </h3>
            <button
              onClick={handleReset}
              className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {step === "role"
              ? "Select the type of account you want to add."
              : `Sign in to your ${role} account.`}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {step === "role" ? (
            <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
              {/* Client */}
              <button
                type="button"
                onClick={() => setRole("client")}
                className={`w-full flex sm:flex-col items-center gap-3 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  role === "client"
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  role === "client" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                }`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className={`text-sm font-medium ${role === "client" ? "text-primary-700" : "text-gray-700"}`}>
                  Client
                </span>
              </button>

              {/* Admin */}
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`w-full flex sm:flex-col items-center gap-3 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  role === "admin"
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  role === "admin" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                }`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className={`text-sm font-medium ${role === "admin" ? "text-primary-700" : "text-gray-700"}`}>
                  Admin
                </span>
              </button>

              {/* Teacher */}
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`w-full flex sm:flex-col items-center gap-3 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  role === "teacher"
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  role === "teacher" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"
                }`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className={`text-sm font-medium ${role === "teacher" ? "text-primary-700" : "text-gray-700"}`}>
                  Teacher
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <a
                href={`/api/auth/social/google?mode=login`}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <GoogleIcon className="w-5 h-5" />
                <span className="text-sm font-medium text-gray-700">Sign in with Google</span>
              </a>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          {step === "credentials" && (
            <button
              onClick={() => setStep("role")}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleReset}
            className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={step === "credentials" && (!email || !password)}
            className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                </svg>
                Signing in...
              </span>
            ) : step === "role" ? (
              "Continue"
            ) : (
              "Sign in"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
