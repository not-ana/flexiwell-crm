"use client";

import { useEffect } from "react";
import { AlertCircleIcon } from "@/components/icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-8 text-center shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircleIcon className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {error.message || "An unexpected error occurred"}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go home
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
