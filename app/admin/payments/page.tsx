"use client";

import { useState } from "react";
import { SearchIcon, FilterIcon, ChevronIcon } from "@/components/icons";

type PaymentStatus = "paid" | "pending" | "overdue" | "failed";
type PaymentFilter = "all" | PaymentStatus;

interface ClientPayment {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientInitials: string;
  planName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  paymentMethod?: string;
  daysOverdue?: number;
  unit: string;
}

// Mock data - payments for the current billing cycle
const mockPayments: ClientPayment[] = [
  // Paid
  {
    id: "p1",
    clientId: "1",
    clientName: "Olivia Rhye",
    clientEmail: "olivia@email.com",
    clientInitials: "OR",
    planName: "Monthly - 8 classes",
    amount: 129,
    dueDate: "Dec 15, 2024",
    paidDate: "Dec 14, 2024",
    status: "paid",
    paymentMethod: "Visa •••• 4242",
    unit: "FlexiWell Downtown",
  },
  {
    id: "p2",
    clientId: "5",
    clientName: "Candice Wu",
    clientEmail: "candice@email.com",
    clientInitials: "CW",
    planName: "Semi-annual - 48 classes",
    amount: 599,
    dueDate: "Dec 10, 2024",
    paidDate: "Dec 10, 2024",
    status: "paid",
    paymentMethod: "Mastercard •••• 5555",
    unit: "FlexiWell Midtown",
  },
  {
    id: "p3",
    clientId: "7",
    clientName: "Orlando Diggs",
    clientEmail: "orlando@email.com",
    clientInitials: "OD",
    planName: "Annual - 96 classes",
    amount: 999,
    dueDate: "Dec 1, 2024",
    paidDate: "Nov 30, 2024",
    status: "paid",
    paymentMethod: "Visa •••• 1234",
    unit: "FlexiWell Midtown",
  },
  // Pending (due soon)
  {
    id: "p4",
    clientId: "2",
    clientName: "Phoenix Baker",
    clientEmail: "phoenix@email.com",
    clientInitials: "PB",
    planName: "Quarterly - 24 classes",
    amount: 329,
    dueDate: "Dec 28, 2024",
    status: "pending",
    unit: "FlexiWell Downtown",
  },
  {
    id: "p5",
    clientId: "6",
    clientName: "Natali Craig",
    clientEmail: "natali@email.com",
    clientInitials: "NC",
    planName: "Monthly - 8 classes",
    amount: 129,
    dueDate: "Dec 30, 2024",
    status: "pending",
    unit: "FlexiWell Midtown",
  },
  {
    id: "p6",
    clientId: "9",
    clientName: "Kate Morrison",
    clientEmail: "kate@email.com",
    clientInitials: "KM",
    planName: "Monthly - 12 classes",
    amount: 199,
    dueDate: "Jan 2, 2025",
    status: "pending",
    unit: "FlexiWell Uptown",
  },
  // Overdue
  {
    id: "p7",
    clientId: "3",
    clientName: "Lana Steiner",
    clientEmail: "lana@email.com",
    clientInitials: "LS",
    planName: "Monthly - 8 classes",
    amount: 129,
    dueDate: "Dec 15, 2024",
    status: "overdue",
    daysOverdue: 12,
    unit: "FlexiWell Downtown",
  },
  {
    id: "p8",
    clientId: "11",
    clientName: "Marcus Johnson",
    clientEmail: "marcus@email.com",
    clientInitials: "MJ",
    planName: "Monthly - 12 classes",
    amount: 199,
    dueDate: "Dec 20, 2024",
    status: "overdue",
    daysOverdue: 7,
    unit: "FlexiWell Uptown",
  },
  {
    id: "p9",
    clientId: "12",
    clientName: "Sophie Turner",
    clientEmail: "sophie@email.com",
    clientInitials: "ST",
    planName: "Quarterly - 24 classes",
    amount: 329,
    dueDate: "Dec 18, 2024",
    status: "overdue",
    daysOverdue: 9,
    unit: "FlexiWell Downtown",
  },
  // Failed
  {
    id: "p10",
    clientId: "4",
    clientName: "Demi Wilkinson",
    clientEmail: "demi@email.com",
    clientInitials: "DW",
    planName: "Monthly - 12 classes",
    amount: 199,
    dueDate: "Dec 22, 2024",
    status: "failed",
    paymentMethod: "Visa •••• 9999",
    unit: "FlexiWell Downtown",
  },
];

const statusConfig: Record<PaymentStatus, { bg: string; text: string; dot: string; label: string }> = {
  paid: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Paid" },
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Pending" },
  overdue: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Overdue" },
  failed: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500", label: "Failed" },
};

function StatusBadge({ status, daysOverdue }: { status: PaymentStatus; daysOverdue?: number }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
      {status === "overdue" && daysOverdue && (
        <span className="ml-1">({daysOverdue}d)</span>
      )}
    </span>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>("all");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<ClientPayment | null>(null);

  // Filter payments
  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch =
      payment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.planName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    totalRevenue: mockPayments.filter(p => p.status === "paid").reduce((acc, p) => acc + p.amount, 0),
    pendingAmount: mockPayments.filter(p => p.status === "pending").reduce((acc, p) => acc + p.amount, 0),
    overdueAmount: mockPayments.filter(p => p.status === "overdue").reduce((acc, p) => acc + p.amount, 0),
    failedAmount: mockPayments.filter(p => p.status === "failed").reduce((acc, p) => acc + p.amount, 0),
    paidCount: mockPayments.filter(p => p.status === "paid").length,
    pendingCount: mockPayments.filter(p => p.status === "pending").length,
    overdueCount: mockPayments.filter(p => p.status === "overdue").length,
    failedCount: mockPayments.filter(p => p.status === "failed").length,
  };

  const toggleSelectAll = () => {
    if (selectedPayments.length === filteredPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(filteredPayments.map(p => p.id));
    }
  };

  const toggleSelectPayment = (id: string) => {
    setSelectedPayments(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSendReminder = (payment: ClientPayment) => {
    setReminderTarget(payment);
    setShowReminderModal(true);
  };

  const handleBulkReminder = () => {
    const unpaidSelected = selectedPayments
      .map(id => mockPayments.find(p => p.id === id))
      .filter(p => p && (p.status === "pending" || p.status === "overdue"));

    if (unpaidSelected.length > 0) {
      alert(`Sending reminders to ${unpaidSelected.length} clients...`);
      // TODO: Implement bulk reminder API call
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">
            Track payments and send reminders to clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedPayments.length > 0 && (
            <button
              onClick={handleBulkReminder}
              className="px-4 py-2.5 text-primary-600 font-medium border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Reminders ({selectedPayments.length})
            </button>
          )}
          <button className="px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Collected</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-400">{stats.paidCount} payments</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount)}</p>
              <p className="text-xs text-gray-400">{stats.pendingCount} payments</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(stats.overdueAmount)}</p>
              <p className="text-xs text-gray-400">{stats.overdueCount} payments</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-xl font-bold text-gray-600">{formatCurrency(stats.failedAmount)}</p>
              <p className="text-xs text-gray-400">{stats.failedCount} payments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-center gap-4 mb-6 bg-white rounded-xl border border-gray-200 px-4 py-3">
        {/* Search */}
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client name, email, or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
          {(["all", "pending", "overdue", "paid", "failed"] as PaymentFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === status
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {status === "all" ? "All" : statusConfig[status as PaymentStatus].label}
              {status === "overdue" && stats.overdueCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                  {stats.overdueCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedPayments.length === filteredPayments.length && filteredPayments.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPayments.map((payment) => (
              <tr
                key={payment.id}
                className={`hover:bg-gray-50 transition-colors ${
                  selectedPayments.includes(payment.id) ? "bg-primary-50" : ""
                }`}
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedPayments.includes(payment.id)}
                    onChange={() => toggleSelectPayment(payment.id)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary-700">{payment.clientInitials}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payment.clientName}</p>
                      <p className="text-sm text-gray-500">{payment.clientEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-900">{payment.planName}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-600">{payment.dueDate}</p>
                  {payment.paidDate && (
                    <p className="text-xs text-green-600">Paid {payment.paidDate}</p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={payment.status} daysOverdue={payment.daysOverdue} />
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-600">{payment.unit}</p>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {(payment.status === "pending" || payment.status === "overdue") && (
                      <button
                        onClick={() => handleSendReminder(payment)}
                        className="px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        Send Reminder
                      </button>
                    )}
                    {payment.status === "failed" && (
                      <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        Retry
                      </button>
                    )}
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPayments.length === 0 && (
          <div className="py-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No payments found</h3>
            <p className="text-gray-500">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* Reminder Modal */}
      {showReminderModal && reminderTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Send Payment Reminder</h2>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">{reminderTarget.clientInitials}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{reminderTarget.clientName}</p>
                  <p className="text-sm text-gray-500">{reminderTarget.clientEmail}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium text-gray-900">{reminderTarget.planName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Amount Due</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(reminderTarget.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Due Date</span>
                  <span className={`font-medium ${reminderTarget.status === "overdue" ? "text-red-600" : "text-gray-900"}`}>
                    {reminderTarget.dueDate}
                    {reminderTarget.daysOverdue && ` (${reminderTarget.daysOverdue} days overdue)`}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Send reminder via:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Email</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors">
                    <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowReminderModal(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Reminder sent to ${reminderTarget.clientName}!`);
                  setShowReminderModal(false);
                }}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
              >
                Send Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
