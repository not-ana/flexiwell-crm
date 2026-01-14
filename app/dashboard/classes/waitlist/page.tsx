"use client";

import { useState, useEffect, Suspense } from "react";
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
  status: "waiting" | "notified" | "confirmed" | "expired";
  createdAt: string;
}

function WaitlistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [fullClasses, setFullClasses] = useState<WaitlistClass[]>([]);
  const [myWaitlist, setMyWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinWaitlist = async (classToJoin: WaitlistClass) => {
    setJoining(classToJoin.id);
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
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to join waitlist");
      }
    } catch (error) {
      console.error("Error joining waitlist:", error);
      alert("Failed to join waitlist");
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
    } catch (error) {
      console.error("Error leaving waitlist:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const isOnWaitlist = (classIdToCheck: string) => {
    return myWaitlist.some((w) => w.classId === classIdToCheck);
  };

  const getStatusBadge = (status: WaitlistEntry["status"]) => {
    const styles = {
      waiting: "bg-yellow-100 text-yellow-700",
      notified: "bg-blue-100 text-blue-700",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
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
        <h1 className="text-2xl font-bold text-gray-900">Waitlist</h1>
        <p className="text-gray-600 mt-1">
          Classes full? Join the queue and we'll notify you when a spot opens.
        </p>
      </div>

      {/* My Waitlist Entries */}
      {myWaitlist.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Your Queues
          </h2>
          <div className="space-y-2">
            {myWaitlist.map((entry) => (
              <div
                key={entry.id}
                className={`bg-white rounded-xl border p-4 ${
                  entry.status === "notified"
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{entry.className}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500">
                        Position #{entry.position}
                      </span>
                      {getStatusBadge(entry.status)}
                    </div>
                  </div>
                  {entry.status === "notified" ? (
                    <button
                      onClick={() => router.push(`/dashboard/classes/book?confirm=${entry.id}`)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                    >
                      Confirm Spot
                    </button>
                  ) : (
                    <button
                      onClick={() => leaveWaitlist(entry.id)}
                      className="text-gray-400 hover:text-red-500 p-2"
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

      {/* Full Classes */}
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
              View available classes
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {fullClasses.map((cls) => (
              <div
                key={cls.id}
                className={`bg-white rounded-xl border p-4 ${
                  classId === cls.id ? "border-primary-500 ring-2 ring-primary-100" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{cls.title}</h3>
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                        Lotada
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {cls.instructorName} · {formatDate(cls.scheduledDate)} · {cls.startTime}
                    </p>
                  </div>
                  {isOnWaitlist(cls.id) ? (
                    <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                      Na fila
                    </span>
                  ) : (
                    <button
                      onClick={() => joinWaitlist(cls)}
                      disabled={joining === cls.id}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
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
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">How does it work?</p>
            <p className="mt-1 text-blue-700">
              When a spot opens, you'll receive a WhatsApp notification.
              You have 30 minutes to confirm before the spot goes to the next person.
            </p>
          </div>
        </div>
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
