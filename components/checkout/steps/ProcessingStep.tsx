"use client";

import { useEffect, useState, useMemo } from "react";
import { CreditCard, Lock } from "lucide-react";

interface ProcessingStepProps {
  onComplete: () => void;
}

export function ProcessingStep({ onComplete }: ProcessingStepProps) {
  const [progress, setProgress] = useState(0);

  const statusMessage = useMemo(() => {
    if (progress < 30) return "Verifying payment details...";
    if (progress < 60) return "Processing payment...";
    if (progress < 90) return "Confirming your order...";
    return "Almost done!";
  }, [progress]);

  useEffect(() => {
    const duration = 2500;
    const intervalMs = 30;
    const increment = (intervalMs / duration) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(onComplete, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          {/* Spinner with icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          {/* Progressive status message */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {statusMessage}
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-gray-500 mb-6">
            This may take a few seconds
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
            <div
              className="h-2 bg-primary-600 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          {/* Security note */}
          <div className="flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs text-gray-400">
              Your payment is encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
