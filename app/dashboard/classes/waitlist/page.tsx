"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface WaitlistClass {
  id: string;
  title: string;
  type: string;
  instructorName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  currentEnrollment: number;
  maxCapacity: number;
}

interface WaitlistEntry {
  id: string;
  classId: string;
  className: string;
  position: number;
  totalInQueue?: number;
  status: "waiting" | "notified" | "confirmed" | "expired";
  notifiedAt?: string;
  notificationExpiresAt?: string;
  createdAt: string;
}

interface JoinSuccess {
  className: string;
  position: number;
  totalInQueue: number;
}

// Countdown timer hook for notified entries
function useCountdown(expiresAt: string | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "warning" | "critical">("normal");

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        setUrgency("critical");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);

      if (minutes < 5) setUrgency("critical");
      else if (minutes < 15) setUrgency("warning");
      else setUrgency("normal");
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return { timeLeft, urgency };
}

function CountdownBadge({ expiresAt }: { expiresAt?: string }) {
  const { timeLeft, urgency } = useCountdown(expiresAt);

  if (!expiresAt || !timeLeft) return null;

  const colors = {
    normal: "bg-blue-100 text-blue-700",
    warning: "bg-yellow-100 text-yellow-700",
    critical: "bg-red-100 text-red-700 animate-pulse",
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${colors[urgency]}`}>
      {timeLeft}
    </span>
  );
}

function WaitlistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [fullClasses, setFullClasses] = useState<WaitlistClass[]>([]);
  const [myWaitlist, setMyWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<JoinSuccess | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [classesRes, waitlistRes] = await Promise.all([
        fetch("/api/classes?status=scheduled"),
        fetch("/api/waitlist?clientId=me"),
      ]);

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        const full = classesData.classes.filter(
          (c: WaitlistClass) => c.currentEnrollment >= c.maxCapacity
        );
        setFullClasses(full);
      }

      if (waitlistRes.ok) {
        const waitlistData = await waitlistRes.json();
        setMyWaitlist(waitlistData.entries || []);
        if (waitlistData.waitlistByClass) {
          setWaitlistCounts(waitlistData.waitlistByClass);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const joinWaitlist = async (classToJoin: WaitlistClass) => {
    setJoining(classToJoin.id);
    setError(null);
    setJoinSuccess(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: classToJoin.id,
          className: classToJoin.title,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setJoinSuccess({
          className: classToJoin.title,
          position: data.entry.position,
          totalInQueue: data.entry.totalInQueue || data.entry.position,
        });
        await fetchData();
        // Auto-dismiss after 4 seconds
        setTimeout(() => setJoinSuccess(null), 4000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to join waitlist. Please try again.");
      }
    } catch (err) {
      console.error("Error joining waitlist:", err);
      setError("Connection error. Please check your internet and try again.");
    } finally {
      setJoining(null);
    }
  };

  const leaveWaitlist = async (entryId: string) => {
    try {
      const res = await fetch(`/api/waitlist/${entryId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Error leaving waitlist:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const isOnWaitlist = (classIdToCheck: string) => {
    return myWaitlist.some((w) => w.classId === classIdToCheck);
  };

  const getQueueCount = (clsId: string) => waitlistCounts[clsId] || 0;

  const getStatusBadge = (status: WaitlistEntry["status"]) => {
    const styles = {
      waiting: "bg-yellow-100 text-yellow-700",
      notified: "bg-green-100 text-green-700",
      confirmed: "bg-green-100 text-green-700",
      expired: "bg-gray-100 text-gray-500",
    };
    const labels = {
      waiting: "In queue",
      notified: "Spot available!",
      confirmed: "Confirmed",
      expired: "Expired",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Sort notified entries first (they need urgent action)
  const sortedWaitlist = [...myWaitlist].sort((a, b) => {
    if (a.status === "notified" && b.status !== "notified") return -1;
    if (b.status === "notified" && a.status !== "notified") return 1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header - Dream Outcome Framing */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Never Miss Your Favorite Class</h1>
        <p className="text-gray-600 mt-1">
          Be first in line when a spot opens. One tap to join, instant WhatsApp alert when it&apos;s your turn.
        </p>
      </div>

      {/* How It Works - ABOVE the list (reduce anxiety before CTA) */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-100">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-gray-900">How it works — 3 simple steps</p>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto text-sm font-bold">1</div>
                <p className="text-gray-700 mt-1 font-medium text-xs">Join with 1 tap</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto text-sm font-bold">2</div>
                <p className="text-gray-700 mt-1 font-medium text-xs">Get instant WhatsApp alert</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto text-sm font-bold">3</div>
                <p className="text-gray-700 mt-1 font-medium text-xs">Confirm &amp; your spot is secured</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Celebration Toast */}
      {joinSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-in slide-in-from-top">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900">You&apos;re in!</p>
              <p className="text-sm text-green-700 mt-0.5">
                Position <span className="font-bold">#{joinSuccess.position}</span> of {joinSuccess.totalInQueue} for <span className="font-medium">{joinSuccess.className}</span>.
                We&apos;ll notify you on WhatsApp the moment a spot opens.
              </p>
            </div>
            <button onClick={() => setJoinSuccess(null)} className="text-green-400 hover:text-green-600 p-1 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* My Waitlist Entries - Notified first with countdown */}
      {sortedWaitlist.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Your Queues
          </h2>
          <div className="space-y-2">
            {sortedWaitlist.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-xl border p-4 transition-all ${
                  entry.status === "notified"
                    ? "border-green-300 bg-green-50 shadow-md shadow-green-100"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900">{entry.className}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm text-gray-500">
                        Position #{entry.position}
                        {entry.totalInQueue ? ` of ${entry.totalInQueue}` : ""}
                      </span>
                      {getStatusBadge(entry.status)}
                      {entry.status === "notified" && (
                        <CountdownBadge expiresAt={entry.notificationExpiresAt} />
                      )}
                    </div>
                    {entry.status === "notified" && (
                      <p className="text-xs text-green-700 mt-1.5 font-medium">
                        A spot just opened up — confirm now before it goes to the next person!
                      </p>
                    )}
                  </div>
                  {entry.status === "notified" ? (
                    <button
                      onClick={() => router.push(`/dashboard/classes/book?confirm=${entry.id}`)}
                      className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-lg shadow-green-200 shrink-0"
                    >
                      Confirm Spot
                    </button>
                  ) : confirmLeave === entry.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { leaveWaitlist(entry.id); setConfirmLeave(null); }}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700"
                      >
                        Leave
                      </button>
                      <button
                        onClick={() => setConfirmLeave(null)}
                        className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmLeave(entry.id)}
                      className="text-gray-400 hover:text-red-500 p-2 shrink-0"
                      title="Leave queue"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Classes - With social proof */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Full Classes
        </h2>
        {fullClasses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <svg className="w-12 h-12 mx-auto text-green-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 font-medium">All classes have availability!</p>
            <button
              onClick={() => router.push("/dashboard/classes/book")}
              className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View available classes →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {fullClasses.map((cls) => {
              const queueCount = getQueueCount(cls.id);
              const isHighDemand = queueCount >= 3;

              return (
                <div
                  key={cls.id}
                  className={`bg-white rounded-xl border p-4 ${
                    classId === cls.id ? "border-primary-500 ring-2 ring-primary-100" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900">{cls.title}</h3>
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                          Full
                        </span>
                        {isHighDemand && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-2 1-3 .5 1.5 1 2 2 3a3 3 0 01-.38 1.62z" />
                            </svg>
                            High demand
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {cls.instructorName} · {formatDate(cls.scheduledDate)} · {cls.startTime}
                      </p>
                      {/* Social proof - people in queue */}
                      {queueCount > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {queueCount} {queueCount === 1 ? "person" : "people"} waiting
                        </p>
                      )}
                    </div>
                    {isOnWaitlist(cls.id) ? (
                      <span className="px-4 py-2 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium border border-primary-200 shrink-0">
                        In queue
                      </span>
                    ) : (
                      <button
                        onClick={() => joinWaitlist(cls)}
                        disabled={joining === cls.id}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 shrink-0"
                      >
                        {joining === cls.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Joining...
                          </span>
                        ) : (
                          "Join Queue"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WaitlistContent />
    </Suspense>
  );
}