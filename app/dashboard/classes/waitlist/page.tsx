"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

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

// -- Icons (outline, stroke-2, Untitled UI) --
function ChevronLeftIcon() {
  return (
    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg className="size-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function CheckCircleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function FireIcon() {
  return (
    <svg className="size-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-2 1-3 .5 1.5 1 2 2 3a3 3 0 01-.38 1.62z" />
    </svg>
  );
}

// -- Countdown Hook --
function useCountdown(expiresAt: string | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "warning" | "critical">("normal");

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); setUrgency("critical"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
      if (m < 5) setUrgency("critical");
      else if (m < 15) setUrgency("warning");
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
    normal: "bg-blue-50 text-blue-700 ring-blue-700/10",
    warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
    critical: "bg-red-50 text-red-700 ring-red-600/10 animate-pulse",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums ring-1 ring-inset ${colors[urgency]}`}>
      {timeLeft}
    </span>
  );
}

// -- Status Badge --
const waitlistStatusStyles: Record<WaitlistEntry["status"], { bg: string; text: string; dot: string; label: string }> = {
  waiting: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "In queue" },
  notified: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Spot available!" },
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Confirmed" },
  expired: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400", label: "Expired" },
};

function StatusBadge({ status }: { status: WaitlistEntry["status"] }) {
  const style = waitlistStatusStyles[status];
  return <Badge style={style} />;
}

// -- Main Content --
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
        setFullClasses(classesData.classes.filter(
          (c: WaitlistClass) => c.currentEnrollment >= c.maxCapacity
        ));
      }

      if (waitlistRes.ok) {
        const waitlistData = await waitlistRes.json();
        setMyWaitlist(waitlistData.entries || []);
        if (waitlistData.waitlistByClass) setWaitlistCounts(waitlistData.waitlistByClass);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const joinWaitlist = async (classToJoin: WaitlistClass) => {
    setJoining(classToJoin.id);
    setError(null);
    setJoinSuccess(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: classToJoin.id, className: classToJoin.title }),
      });

      if (res.ok) {
        const data = await res.json();
        setJoinSuccess({
          className: classToJoin.title,
          position: data.entry.position,
          totalInQueue: data.entry.totalInQueue || data.entry.position,
        });
        await fetchData();
        setTimeout(() => setJoinSuccess(null), 4000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to join waitlist. Please try again.");
      }
    } catch {
      setError("Connection error. Please check your internet and try again.");
    } finally {
      setJoining(null);
    }
  };

  const leaveWaitlist = async (entryId: string) => {
    try {
      const res = await fetch(`/api/waitlist/${entryId}`, { method: "DELETE" });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error("Error leaving waitlist:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const isOnWaitlist = (classIdToCheck: string) => myWaitlist.some((w) => w.classId === classIdToCheck);
  const getQueueCount = (clsId: string) => waitlistCounts[clsId] || 0;

  const sortedWaitlist = [...myWaitlist].sort((a, b) => {
    if (a.status === "notified" && b.status !== "notified") return -1;
    if (b.status === "notified" && a.status !== "notified") return 1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full size-8 border-2 border-gray-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back + Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeftIcon />
          Back
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Never Miss Your Favorite Class</h1>
        <p className="text-sm text-gray-600 mt-1">
          Be first in line when a spot opens. One tap to join, instant text alert when it's your turn.
        </p>
      </div>

      {/* How It Works — Untitled UI featured section */}
      <div className="mb-6 p-4 rounded-xl bg-primary-50 ring-1 ring-inset ring-primary-600/10">
        <div className="flex gap-3">
          <div className="size-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
            <ZapIcon />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">How it works</p>
            <div className="mt-3 grid grid-cols-3 gap-4">
              {[
                { step: "1", text: "Join with 1 tap" },
                { step: "2", text: "Get an instant text alert" },
                { step: "3", text: "Confirm & spot is yours" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="size-8 rounded-lg bg-white text-primary-700 font-semibold text-sm flex items-center justify-center mx-auto shadow-xs ring-1 ring-gray-200">
                    {item.step}
                  </div>
                  <p className="text-xs font-medium text-gray-700 mt-2">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {joinSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 ring-1 ring-inset ring-emerald-600/20">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircleIcon className="size-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-900">You're in!</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Position <span className="font-semibold">#{joinSuccess.position}</span> of {joinSuccess.totalInQueue} for{" "}
                <span className="font-medium">{joinSuccess.className}</span>.
                We'll text you the moment a spot opens.
              </p>
            </div>
            <button onClick={() => setJoinSuccess(null)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0">
              <XIcon />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 ring-1 ring-inset ring-red-600/10 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 p-1 shrink-0">
            <XIcon />
          </button>
        </div>
      )}

      {/* Your Queues */}
      {sortedWaitlist.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Your queues</h2>
          <div className="space-y-3">
            {sortedWaitlist.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-xl ring-1 ring-inset p-4 transition-all ${
                  entry.status === "notified"
                    ? "bg-emerald-50/50 ring-emerald-200 shadow-sm"
                    : "bg-white ring-gray-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{entry.className}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-sm text-gray-600">
                        Position #{entry.position}
                        {entry.totalInQueue ? ` of ${entry.totalInQueue}` : ""}
                      </span>
                      <StatusBadge status={entry.status} />
                      {entry.status === "notified" && (
                        <CountdownBadge expiresAt={entry.notificationExpiresAt} />
                      )}
                    </div>
                    {entry.status === "notified" && (
                      <p className="text-xs text-emerald-700 font-medium mt-2">
                        A spot just opened up — confirm now before it goes to the next person!
                      </p>
                    )}
                  </div>

                  {entry.status === "notified" ? (
                    <button
                      onClick={() => router.push(`/dashboard/classes/book?confirm=${entry.id}`)}
                      className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-xs shrink-0"
                    >
                      Confirm Spot
                    </button>
                  ) : confirmLeave === entry.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { leaveWaitlist(entry.id); setConfirmLeave(null); }}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 shadow-xs"
                      >
                        Leave
                      </button>
                      <button
                        onClick={() => setConfirmLeave(null)}
                        className="px-3 py-2 bg-white text-gray-700 rounded-lg text-xs font-semibold ring-1 ring-gray-300 shadow-xs hover:bg-gray-50"
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
                      <XIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Classes */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Full classes</h2>
        {fullClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-gray-50 ring-1 ring-inset ring-gray-200">
            <div className="size-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircleIcon className="size-6 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">All classes have availability!</p>
            <button
              onClick={() => router.push("/dashboard/classes/book")}
              className="mt-3 text-sm font-semibold text-primary-700 hover:text-primary-800"
            >
              View available classes &rarr;
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {fullClasses.map((cls) => {
              const queueCount = getQueueCount(cls.id);
              const isHighDemand = queueCount >= 3;

              return (
                <div
                  key={cls.id}
                  className={`rounded-xl ring-1 ring-inset p-4 bg-white ${
                    classId === cls.id ? "ring-primary-300 shadow-sm" : "ring-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900">{cls.title}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10">
                          Full
                        </span>
                        {isHighDemand && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            <FireIcon />
                            High demand
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {cls.instructorName} &middot; {formatDate(cls.scheduledDate)} &middot; {cls.startTime}
                      </p>
                      {queueCount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {queueCount} {queueCount === 1 ? "person" : "people"} waiting
                        </p>
                      )}
                    </div>

                    {isOnWaitlist(cls.id) ? (
                      <span className="inline-flex items-center px-4 py-2 text-sm font-semibold text-primary-700 bg-primary-50 rounded-lg ring-1 ring-inset ring-primary-600/20 shrink-0">
                        In queue
                      </span>
                    ) : (
                      <button
                        onClick={() => joinWaitlist(cls)}
                        disabled={joining === cls.id}
                        className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0"
                      >
                        {joining === cls.id ? (
                          <span className="flex items-center gap-2">
                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

export default function WaitlistPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full size-8 border-2 border-gray-200 border-t-primary-600" />
        </div>
      }
    >
      <WaitlistContent />
    </Suspense>
  );
}
