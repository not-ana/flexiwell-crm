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
  waitlistPosition?: number;
}

interface WaitlistEntry {
  id: string;
  classId: string;
  className: string;
  position: number;
  status: "waiting" | "notified" | "confirmed" | "expired";
  createdAt: string;
  estimatedWait?: string;
}

function WaitlistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [fullClasses, setFullClasses] = useState<WaitlistClass[]>([]);
  const [myWaitlist, setMyWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    preferredDays: [] as string[],
    preferredTimes: [] as string[],
    preferredInstructors: [] as string[],
    isUrgent: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, waitlistRes] = await Promise.all([
        fetch("/api/classes?status=scheduled"),
        fetch("/api/waitlist"),
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

  const joinWaitlist = async (classIdToJoin: string) => {
    setJoining(classIdToJoin);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: classIdToJoin,
          ...preferences,
        }),
      });

      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao entrar na lista de espera");
      }
    } catch (error) {
      console.error("Error joining waitlist:", error);
      alert("Erro ao entrar na lista de espera");
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
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const isOnWaitlist = (classIdToCheck: string) => {
    return myWaitlist.some((w) => w.classId === classIdToCheck);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Lista de Espera</h1>
        <p className="text-gray-600 mt-1">
          Entre na lista de espera para aulas lotadas e seja notificado quando uma vaga abrir.
        </p>
      </div>

      {myWaitlist.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Minhas Listas de Espera</h2>
          <div className="space-y-3">
            {myWaitlist.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{entry.className}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>
                      Posicao: <strong className="text-primary-600">#{entry.position}</strong>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      entry.status === "notified"
                        ? "bg-green-100 text-green-700"
                        : entry.status === "waiting"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {entry.status === "notified" ? "Notificado" :
                       entry.status === "waiting" ? "Aguardando" :
                       entry.status === "confirmed" ? "Confirmado" : "Expirado"}
                    </span>
                    {entry.estimatedWait && (
                      <span>Espera estimada: {entry.estimatedWait}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => leaveWaitlist(entry.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Sair da lista
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 mb-8">
        <h3 className="font-medium text-gray-900 mb-3">Suas Preferencias</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Dias preferidos</label>
            <div className="flex flex-wrap gap-2">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((day, idx) => (
                <button
                  key={day}
                  onClick={() => {
                    const dayValue = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][idx];
                    setPreferences((prev) => ({
                      ...prev,
                      preferredDays: prev.preferredDays.includes(dayValue)
                        ? prev.preferredDays.filter((d) => d !== dayValue)
                        : [...prev.preferredDays, dayValue],
                    }));
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    preferences.preferredDays.includes(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][idx])
                      ? "bg-primary-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Horarios preferidos</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Manha", value: "morning" },
                { label: "Tarde", value: "afternoon" },
                { label: "Noite", value: "evening" },
              ].map((time) => (
                <button
                  key={time.value}
                  onClick={() => {
                    setPreferences((prev) => ({
                      ...prev,
                      preferredTimes: prev.preferredTimes.includes(time.value)
                        ? prev.preferredTimes.filter((t) => t !== time.value)
                        : [...prev.preferredTimes, time.value],
                    }));
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    preferences.preferredTimes.includes(time.value)
                      ? "bg-primary-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700"
                  }`}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            checked={preferences.isUrgent}
            onChange={(e) => setPreferences((prev) => ({ ...prev, isUrgent: e.target.checked }))}
            className="rounded border-gray-300 text-primary-600"
          />
          <span className="text-sm text-gray-700">
            Urgente - aumenta sua prioridade na lista
          </span>
        </label>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aulas Lotadas</h2>
        {fullClasses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600">
              Nenhuma aula lotada no momento. Todas as vagas estao disponiveis!
            </p>
            <button
              onClick={() => router.push("/dashboard/classes/book")}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver aulas disponiveis
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {fullClasses.map((cls) => (
              <div
                key={cls.id}
                className={`bg-white rounded-lg border p-4 ${
                  classId === cls.id ? "border-primary-500 ring-2 ring-primary-100" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{cls.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        cls.type === "yoga" ? "bg-green-100 text-green-700" :
                        cls.type === "pilates" ? "bg-purple-100 text-purple-700" :
                        cls.type === "stretching" ? "bg-orange-100 text-orange-700" :
                        cls.type === "meditation" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {cls.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      com {cls.instructorName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(cls.scheduledDate)} as {cls.startTime} - {cls.endTime}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-red-600 font-medium">
                        Lotada ({cls.currentEnrollment}/{cls.maxCapacity})
                      </span>
                    </div>
                  </div>
                  <div>
                    {isOnWaitlist(cls.id) ? (
                      <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                        Na lista de espera
                      </span>
                    ) : (
                      <button
                        onClick={() => joinWaitlist(cls.id)}
                        disabled={joining === cls.id}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                      >
                        {joining === cls.id ? "Entrando..." : "Entrar na lista"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
