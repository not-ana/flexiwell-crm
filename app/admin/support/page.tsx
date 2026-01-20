"use client";

import { useEffect } from "react";

export default function SupportPage() {
  useEffect(() => {
    // Open Crisp chat when page loads
    if (typeof window !== "undefined" && window.$crisp) {
      window.$crisp.push(["do", "chat:open"]);
    }
  }, []);

  const openCrispChat = () => {
    if (typeof window !== "undefined" && window.$crisp) {
      window.$crisp.push(["do", "chat:open"]);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">FlexiWell Support</h1>
          <p className="text-gray-600 mt-2">
            Need help? Our support team is here to assist you.
          </p>
        </div>

        <button
          onClick={openCrispChat}
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Open Chat
        </button>

        <p className="text-sm text-gray-500">
          Or email us at{" "}
          <a
            href="mailto:support@flexiwell.net"
            className="text-primary hover:underline"
          >
            support@flexiwell.net
          </a>
        </p>
      </div>
    </div>
  );
}
