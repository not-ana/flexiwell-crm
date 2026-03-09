"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

// -- Icons --
function CheckCircleIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircleIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

// -- Countdown --
function useCountdown(expiresAt: string | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("0:00"); setExpired(true); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return { timeLeft, expired };
}

type PageState = "loading" | "ready" | "confirming" | "confirmed" | "declined" | "expired" | "error";

interface EntryData {
  id: string;
  clientName: string;
  className: string;
  position: number;
  expiresAt?: string;
  status: string;
}

function ConfirmContent() {
  const searchParams = useSearchParams();
  const entryId = searchParams.get("id");

  const [state, setState] = useState<PageState>("loading");
  const [entry, setEntry] = useState<EntryData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Load entry data
  useEffect(() => {
    if (!entryId) {
      setState("error");
      setErrorMsg("Invalid confirmation link.");
      return;
    }

    async function loadEntry() {
      try {
        const res = await fetch(`/api/waitlist/${entryId}`);
        if (!res.ok) {
          setState("error");
          setErrorMsg("This waitlist entry was not found.");
          return;
        }
        const data = await res.json();
        const e = data.entry;

        setEntry({
          id: e._id || entryId,
          clientName: e.clientName,
          className: e.className,
          position: e.position,
          expiresAt: e.notificationExpiresAt,
          status: e.status,
        });

        if (e.status === "confirmed") setState("confirmed");
        else if (e.status === "expired") setState("expired");
        else if (e.status === "declined") setState("declined");
        else if (e.status === "notified") setState("ready");
        else {
          setState("error");
          setErrorMsg("This entry is not ready for confirmation.");
        }
      } catch {
        setState("error");
        setErrorMsg("Could not load confirmation details.");
      }
    }

    loadEntry();
  }, [entryId]);

  const { timeLeft, expired: countdownExpired } = useCountdown(entry?.expiresAt);

  // Auto-transition to expired if countdown hits 0
  useEffect(() => {
    if (countdownExpired && state === "ready") {
      setState("expired");
    }
  }, [countdownExpired, state]);

  const handleConfirm = async () => {
    if (!entryId) return;
    setState("confirming");
    try {
      const res = await fetch(`/api/waitlist/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          classId: "from-waitlist",
          className: entry?.className || "",
          classDate: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setState("confirmed");
      } else {
        const data = await res.json();
        setState("error");
        setErrorMsg(data.error || "Failed to confirm. Please try again.");
      }
    } catch {
      setState("error");
      setErrorMsg("Network error. Please check your connection.");
    }
  };

  const handleDecline = async () => {
    if (!entryId) return;
    try {
      await fetch(`/api/waitlist/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline", reason: "Declined from confirmation page" }),
      });
      setState("declined");
    } catch {
      // silently fail decline
    }
  };

  // -- Render states --
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900">flexiwell</h2>
        </div>

        <div className="rounded-2xl bg-white ring-1 ring-gray-200 shadow-lg overflow-hidden">
          {/* Loading */}
          {state === "loading" && (
            <div className="p-8 flex flex-col items-center">
              <div className="animate-spin rounded-full size-10 border-2 border-gray-200 border-t-primary-600 mb-4" />
              <p className="text-sm text-gray-600">Loading your spot...</p>
            </div>
          )}

          {/* Ready to confirm */}
          {state === "ready" && entry && (
            <div className="p-8">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="size-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircleIcon className="size-7 text-emerald-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">A spot opened up!</h1>
                <p className="text-sm text-gray-600 mt-2">
                  Hey {entry.clientName}, a spot just became available in <span className="font-semibold">{entry.className}</span>.
                </p>
              </div>

              {/* Countdown */}
              {timeLeft && (
                <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-amber-50 ring-1 ring-inset ring-amber-600/20">
                  <ClockIcon className="size-5 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-900 tabular-nums">{timeLeft}</span>
                  <span className="text-sm text-amber-700">remaining to confirm</span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleConfirm}
                  className="w-full px-4 py-3 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 shadow-xs transition-colors"
                >
                  Confirm my spot
                </button>
                <button
                  onClick={handleDecline}
                  className="w-full px-4 py-3 text-sm font-semibold text-gray-700 bg-white rounded-lg ring-1 ring-gray-300 shadow-xs hover:bg-gray-50 transition-colors"
                >
                  I can't make it
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                If you don't confirm in time, the spot will go to the next person in line.
              </p>
            </div>
          )}

          {/* Confirming */}
          {state === "confirming" && (
            <div className="p-8 flex flex-col items-center">
              <div className="animate-spin rounded-full size-10 border-2 border-gray-200 border-t-primary-600 mb-4" />
              <p className="text-sm font-semibold text-gray-900">Confirming your spot...</p>
              <p className="text-sm text-gray-600 mt-1">Just a moment.</p>
            </div>
          )}

          {/* Confirmed */}
          {state === "confirmed" && entry && (
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="size-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircleIcon className="size-7 text-emerald-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">You're in!</h1>
                <p className="text-sm text-gray-600 mt-2">
                  Your spot in <span className="font-semibold">{entry.className}</span> is confirmed. See you there!
                </p>
              </div>
            </div>
          )}

          {/* Declined */}
          {state === "declined" && (
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="size-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <XCircleIcon className="size-7 text-gray-500" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">No worries</h1>
                <p className="text-sm text-gray-600 mt-2">
                  We've passed the spot to the next person. Hope to see you next time!
                </p>
              </div>
            </div>
          )}

          {/* Expired */}
          {state === "expired" && (
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="size-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                  <ClockIcon className="size-7 text-amber-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Time's up</h1>
                <p className="text-sm text-gray-600 mt-2">
                  The confirmation window has expired. The spot has been offered to the next person in line.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="size-14 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                  <AlertIcon className="size-7 text-red-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
                <p className="text-sm text-gray-600 mt-2">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Powered by FlexiWell
        </p>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full size-8 border-2 border-gray-200 border-t-primary-600" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
