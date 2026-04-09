"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, storeTokens } from "@/lib/api/client";

// Persistent banner shown across the entire /admin shell whenever an
// operator is impersonating a studio. The Exit button mints a clean operator
// JWT and bounces back to /operator. There is no other way to exit — that's
// intentional, the banner is the seatbelt.
export function ImpersonationBanner() {
  const { user } = useAuth();
  const [exiting, setExiting] = useState(false);

  if (!user?.impersonating) return null;

  async function exit() {
    setExiting(true);
    const res = await api.delete<{ tokens: { accessToken: string; refreshToken: string } }>(
      "/api/operator/impersonate"
    );
    if (res.error || !res.data) {
      setExiting(false);
      alert(`Could not exit: ${res.error?.error ?? "unknown error"}`);
      return;
    }
    storeTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
    window.location.href = "/operator";
  }

  return (
    <div className="sticky top-0 z-50 bg-purple-600 text-white text-sm">
      <div className="max-w-full px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
          <span className="truncate">
            Acting as <strong>{user.impersonatingName ?? "studio"}</strong>
            <span className="opacity-75 hidden sm:inline"> · all changes you make are real</span>
          </span>
        </div>
        <button
          onClick={exit}
          disabled={exiting}
          className="px-3 py-1 rounded bg-white/15 hover:bg-white/25 transition-colors font-medium flex-shrink-0 disabled:opacity-50"
        >
          {exiting ? "Exiting…" : "Exit"}
        </button>
      </div>
    </div>
  );
}
