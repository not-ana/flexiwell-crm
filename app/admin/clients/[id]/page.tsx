"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { useCurrency } from "@/hooks/useCurrency";
import { StatCard } from "@/components/ui/StatCard";

type Tab = "overview" | "bookings" | "payments" | "health";

interface ClientProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: string;
  lifecycleStage?: string;
  plan: {
    type: string;
    totalClasses: number;
    usedClasses: number;
    remainingClasses: number;
    startDate: string;
    endDate: string;
    price: number;
  };
  preferences?: {
    preferredClassTypes?: string[];
    preferredInstructors?: string[];
    notifications?: Record<string, boolean>;
  };
  currentStreak?: number;
  longestStreak?: number;
  healthScore?: { overall: number; breakdown?: Record<string, number> };
  totalLifetimeRevenue?: number;
  dateOfBirth?: string;
  gender?: string;
  height?: string;
  weight?: string;
  emergencyContact?: { name: string; phone: string; relationship: string };
  medicalFlags?: Record<string, boolean>;
  goals?: string[];
  physicalRestrictions?: string[];
  createdAt: string;
  updatedAt: string;
}

interface Booking {
  _id: string;
  className: string;
  instructorName: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  source?: string;
}

interface Payment {
  _id: string;
  amount: number;
  type: string;
  status: string;
  paymentMethod?: string;
  planDetails?: { type: string; classes: number; period: string };
  createdAt: string;
}

interface ProfileStats {
  totalBookings: number;
  completedBookings: number;
  noShowBookings: number;
  cancelledBookings: number;
  attendanceRate: number;
  totalSpent: number;
  upcomingCount: number;
  nextClass: Booking | null;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  pending: "bg-amber-100 text-amber-700",
  paused: "bg-blue-100 text-blue-700",
};

const bookingStatusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  confirmed: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-gray-100 text-gray-600",
  "no-show": "bg-red-100 text-red-700",
};

const planLabels: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
  "drop-in": "Drop-in",
  trial: "Trial",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  const [client, setClient] = useState<ClientProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await api.get<{
          client: ClientProfile;
          bookings: Booking[];
          payments: Payment[];
          stats: ProfileStats;
        }>(`/api/clients/${id}/profile`);
        if (res.data) {
          setClient(res.data.client);
          setBookings(res.data.bookings);
          setPayments(res.data.payments);
          setStats(res.data.stats);
        }
      } catch {
        console.error("Failed to load client profile");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="h-full overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!client || !stats) {
    return (
      <div className="h-full overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 text-center py-20">
          <p className="text-gray-500">Client not found.</p>
          <Link href="/admin/clients" className="text-primary-600 text-sm mt-2 inline-block">
            Back to clients
          </Link>
        </div>
      </div>
    );
  }

  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const planUsage = client.plan.totalClasses > 0
    ? Math.round((client.plan.usedClasses / client.plan.totalClasses) * 100)
    : 0;

  const memberSince = new Date(client.createdAt);
  const monthsActive = Math.max(1, Math.round((Date.now() - memberSince.getTime()) / (30.44 * 86400000)));

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "bookings", label: `Bookings (${bookings.length})` },
    { id: "payments", label: `Payments (${payments.length})` },
    { id: "health", label: "Health Assessment" },
  ];

  const pastBookings = bookings.filter((b) => ["completed", "no-show", "cancelled"].includes(b.status));
  const upcomingBookings = bookings.filter((b) => ["confirmed", "pending"].includes(b.status));

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Back + Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/clients")}
            className="text-sm text-gray-500 hover:text-gray-700 mb-3 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Clients
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary-700">{initials}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">{client.name}</h1>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[client.status] || statusColors.inactive}`}>
                    {client.status}
                  </span>
                  {client.lifecycleStage && client.lifecycleStage !== "active" && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {client.lifecycleStage.replace("_", " ")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{client.email}</span>
                  {client.phone && (
                    <>
                      <span className="w-px h-3 bg-gray-300" />
                      <span>{client.phone}</span>
                    </>
                  )}
                  <span className="w-px h-3 bg-gray-300" />
                  <span>Member since {formatDate(client.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`mailto:${client.email}`}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Message
              </Link>
              <button
                onClick={() => router.push(`/admin/clients?edit=${id}`)}
                className="px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <StatCard
            label="Attendance"
            value={`${stats.attendanceRate}%`}
            accent={stats.attendanceRate >= 85 ? "emerald" : stats.attendanceRate >= 60 ? "orange" : "red"}
            subtitle={`${stats.completedBookings} of ${stats.completedBookings + stats.noShowBookings + stats.cancelledBookings} classes`}
          />
          <StatCard
            label="Plan"
            value={planLabels[client.plan.type] || client.plan.type}
            subtitle={`${client.plan.remainingClasses} of ${client.plan.totalClasses} classes left`}
          />
          <StatCard
            label="Total Spent"
            value={formatCurrency(stats.totalSpent)}
            subtitle={`~${formatCurrency(Math.round(stats.totalSpent / monthsActive))}/month`}
          />
          <StatCard
            label="Streak"
            value={client.currentStreak ? `${client.currentStreak} weeks` : "0"}
            accent={client.currentStreak && client.currentStreak >= 4 ? "emerald" : "default"}
            subtitle={client.longestStreak ? `Best: ${client.longestStreak} weeks` : undefined}
          />
          <StatCard
            label="Upcoming"
            value={stats.upcomingCount}
            subtitle={stats.nextClass ? `Next: ${stats.nextClass.className}` : "No upcoming classes"}
            muted={stats.upcomingCount === 0}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Plan Details */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Current Plan</h3>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {planLabels[client.plan.type] || client.plan.type} — {formatCurrency(client.plan.price)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(client.plan.startDate)} → {formatDate(client.plan.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-gray-900">{client.plan.remainingClasses}</p>
                    <p className="text-xs text-gray-500">classes left</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${planUsage >= 80 ? "bg-red-500" : planUsage >= 50 ? "bg-amber-500" : "bg-green-500"}`}
                    style={{ width: `${planUsage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{planUsage}% used</p>
              </div>

              {/* Upcoming Classes */}
              {upcomingBookings.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Classes</h3>
                  <div className="space-y-2">
                    {upcomingBookings.slice(0, 5).map((b) => (
                      <div key={b._id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50">
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary-600">{b.startTime}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{b.className}</p>
                          <p className="text-xs text-gray-500">{b.instructorName} · {formatDate(b.scheduledDate)}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${bookingStatusColors[b.status] || "bg-gray-100 text-gray-600"}`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent History */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent History</h3>
                {pastBookings.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No past bookings yet.</p>
                ) : (
                  <div className="space-y-1">
                    {pastBookings.slice(0, 10).map((b) => (
                      <div key={b._id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          b.status === "completed" ? "bg-green-500" : b.status === "cancelled" ? "bg-gray-400" : "bg-red-500"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{b.className}</p>
                          <p className="text-xs text-gray-500">{b.instructorName}</p>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(b.scheduledDate)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${bookingStatusColors[b.status] || "bg-gray-100 text-gray-600"}`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Details</h3>
                <dl className="space-y-3">
                  {client.phone && (
                    <div>
                      <dt className="text-xs text-gray-500">Phone</dt>
                      <dd className="text-sm text-gray-900">{client.phone}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{client.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Member Since</dt>
                    <dd className="text-sm text-gray-900">{formatDate(client.createdAt)} ({monthsActive} months)</dd>
                  </div>
                  {client.preferences?.preferredClassTypes && client.preferences.preferredClassTypes.length > 0 && (
                    <div>
                      <dt className="text-xs text-gray-500">Preferred Classes</dt>
                      <dd className="flex flex-wrap gap-1 mt-1">
                        {client.preferences.preferredClassTypes.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">{t}</span>
                        ))}
                      </dd>
                    </div>
                  )}
                  {client.preferences?.notifications && (
                    <div>
                      <dt className="text-xs text-gray-500">Notifications</dt>
                      <dd className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(client.preferences.notifications)
                          .filter(([, v]) => v)
                          .map(([k]) => (
                            <span key={k} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">{k}</span>
                          ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* No-show Alert */}
              {stats.noShowBookings > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-red-800">No-shows: {stats.noShowBookings}</p>
                  <p className="text-xs text-red-600 mt-1">
                    {stats.noShowBookings} missed classes out of {stats.completedBookings + stats.noShowBookings} total
                  </p>
                </div>
              )}

              {/* Recent Payments */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Payments</h3>
                  {payments.length > 3 && (
                    <button onClick={() => setActiveTab("payments")} className="text-xs text-primary-600 font-medium">
                      View all
                    </button>
                  )}
                </div>
                {payments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">No payments yet.</p>
                ) : (
                  <div className="space-y-2">
                    {payments.slice(0, 3).map((p) => (
                      <div key={p._id} className="flex items-center justify-between py-1.5">
                        <div>
                          <p className="text-sm text-gray-900">{formatCurrency(p.amount)}</p>
                          <p className="text-xs text-gray-500">{formatDate(p.createdAt)}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          p.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Class</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Instructor</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Time</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.className}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{b.instructorName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(b.scheduledDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{b.startTime} - {b.endTime}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${bookingStatusColors[b.status] || "bg-gray-100 text-gray-600"}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">No bookings yet.</div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Plan</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Method</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {p.planDetails ? `${planLabels[p.planDetails.type] || p.planDetails.type} · ${p.planDetails.classes} classes` : p.type}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.paymentMethod?.replace("_", " ") || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        p.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">No payments yet.</div>
            )}
          </div>
        )}

        {activeTab === "health" && (
          <div className="max-w-2xl">
            {client.goals || client.physicalRestrictions || client.medicalFlags ? (
              <div className="space-y-6">
                {/* Basic Info */}
                {(client.dateOfBirth || client.gender || client.height || client.weight) && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Physical Profile</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {client.dateOfBirth && (
                        <div>
                          <p className="text-xs text-gray-500">Date of Birth</p>
                          <p className="text-sm text-gray-900">{formatDate(client.dateOfBirth)}</p>
                        </div>
                      )}
                      {client.gender && (
                        <div>
                          <p className="text-xs text-gray-500">Gender</p>
                          <p className="text-sm text-gray-900 capitalize">{client.gender}</p>
                        </div>
                      )}
                      {client.height && (
                        <div>
                          <p className="text-xs text-gray-500">Height</p>
                          <p className="text-sm text-gray-900">{client.height}</p>
                        </div>
                      )}
                      {client.weight && (
                        <div>
                          <p className="text-xs text-gray-500">Weight</p>
                          <p className="text-sm text-gray-900">{client.weight}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Emergency Contact */}
                {client.emergencyContact && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Emergency Contact</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm text-gray-900">{client.emergencyContact.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm text-gray-900">{client.emergencyContact.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Relationship</p>
                        <p className="text-sm text-gray-900">{client.emergencyContact.relationship}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Goals */}
                {client.goals && client.goals.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Goals</h3>
                    <div className="flex flex-wrap gap-2">
                      {client.goals.map((g) => (
                        <span key={g} className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full">{g}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medical Flags */}
                {client.medicalFlags && Object.entries(client.medicalFlags).some(([, v]) => v) && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-red-800 mb-3">Medical Conditions</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(client.medicalFlags)
                        .filter(([, v]) => v)
                        .map(([k]) => (
                          <span key={k} className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                            {k.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Physical Restrictions */}
                {client.physicalRestrictions && client.physicalRestrictions.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-amber-800 mb-3">Physical Restrictions</h3>
                    <div className="flex flex-wrap gap-2">
                      {client.physicalRestrictions.map((r) => (
                        <span key={r} className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">No health assessment</h3>
                <p className="text-sm text-gray-500">Send an intake form to collect health information.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
