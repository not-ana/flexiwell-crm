"use client";

import { useState, useEffect, useCallback } from "react";
import { SearchIcon } from "@/components/icons";

// Toast notification helper
function showToast(message: string, type: "success" | "error" = "success") {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 transition-opacity ${
    type === "success" ? "bg-green-600" : "bg-red-600"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

type PaymentStatus = "paid" | "pending" | "overdue" | "failed" | "refunded";
type PaymentFilter = "all" | PaymentStatus;

interface Payment {
  _id: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  type: "subscription" | "drop-in" | "package";
  planDetails?: {
    type: string;
    classes: number;
    period: string;
  };
  status: "pending" | "completed" | "failed" | "refunded";
  // pix: Hidden for US market - re-enable for Brazil
  paymentMethod: "credit_card" | "bank_transfer" | "cash";
  transactionId?: string;
  invoiceUrl?: string;
  createdAt: string;
  paidAt?: string;
}

interface DisplayPayment extends Omit<Payment, "status"> {
  status: PaymentStatus;
  clientInitials: string;
  clientEmail: string;
  dueDate: string;
  paidDate?: string;
  daysOverdue?: number;
  planName: string;
}

interface ApiStats {
  pending: { count: number; total: number };
  completed: { count: number; total: number };
  failed: { count: number; total: number };
  refunded: { count: number; total: number };
}

const statusConfig: Record<PaymentStatus, { bg: string; text: string; dot: string; label: string }> = {
  paid: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Paid" },
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Pending" },
  overdue: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Overdue" },
  failed: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500", label: "Failed" },
  refunded: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Refunded" },
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

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function transformPayment(payment: Payment): DisplayPayment {
  const createdAt = new Date(payment.createdAt);
  const now = new Date();

  // Due date is 30 days from creation for subscriptions, 7 days for others
  const daysToAdd = payment.type === "subscription" ? 30 : 7;
  const dueDate = new Date(createdAt);
  dueDate.setDate(dueDate.getDate() + daysToAdd);

  // Calculate overdue status
  let displayStatus: PaymentStatus;
  let daysOverdue: number | undefined;

  if (payment.status === "completed") {
    displayStatus = "paid";
  } else if (payment.status === "refunded") {
    displayStatus = "refunded";
  } else if (payment.status === "failed") {
    displayStatus = "failed";
  } else if (payment.status === "pending" && dueDate < now) {
    displayStatus = "overdue";
    daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    displayStatus = "pending";
  }

  const planName = payment.planDetails
    ? `${payment.planDetails.period} - ${payment.planDetails.classes} classes`
    : payment.type.charAt(0).toUpperCase() + payment.type.slice(1);

  return {
    ...payment,
    status: displayStatus,
    clientInitials: getInitials(payment.clientName),
    clientEmail: `${payment.clientName.toLowerCase().replace(/\s+/g, ".")}@email.com`,
    dueDate: formatDate(dueDate.toISOString()),
    paidDate: payment.paidAt ? formatDate(payment.paidAt) : undefined,
    daysOverdue,
    planName,
  };
}

type PeriodFilter = "this_month" | "last_month" | "this_quarter" | "this_year";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<DisplayPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStats, setApiStats] = useState<ApiStats | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("this_month");
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<DisplayPayment | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [markPaidTarget, setMarkPaidTarget] = useState<DisplayPayment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [recordPaymentForm, setRecordPaymentForm] = useState({
    clientName: "",
    amount: "",
    // pix: Hidden for US market - re-enable for Brazil
    paymentMethod: "cash" as "cash" | "bank_transfer" | "credit_card",
    reference: "",
    notes: "",
    type: "subscription" as "subscription" | "drop-in" | "package",
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date range based on period filter
      const now = new Date();
      let dateFrom: Date;

      switch (periodFilter) {
        case "last_month":
          dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case "this_quarter":
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
          dateFrom = new Date(now.getFullYear(), quarterMonth, 1);
          break;
        case "this_year":
          dateFrom = new Date(now.getFullYear(), 0, 1);
          break;
        default: // this_month
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const params = new URLSearchParams({
        dateFrom: dateFrom.toISOString(),
        limit: "100",
      });

      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const response = await fetch(`/api/payments?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const data = await response.json();

      // Transform payments to display format
      const transformedPayments = data.payments.map(transformPayment);
      setPayments(transformedPayments);
      setApiStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [periodFilter, searchQuery]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Filter payments client-side for status
  const filteredPayments = payments.filter((payment) => {
    if (statusFilter === "all") return true;
    return payment.status === statusFilter;
  });

  // Calculate display stats from transformed payments
  const stats = {
    totalRevenue: payments.filter(p => p.status === "paid").reduce((acc, p) => acc + p.amount, 0),
    pendingAmount: payments.filter(p => p.status === "pending").reduce((acc, p) => acc + p.amount, 0),
    overdueAmount: payments.filter(p => p.status === "overdue").reduce((acc, p) => acc + p.amount, 0),
    failedAmount: payments.filter(p => p.status === "failed").reduce((acc, p) => acc + p.amount, 0),
    paidCount: payments.filter(p => p.status === "paid").length,
    pendingCount: payments.filter(p => p.status === "pending").length,
    overdueCount: payments.filter(p => p.status === "overdue").length,
    failedCount: payments.filter(p => p.status === "failed").length,
  };

  const toggleSelectAll = () => {
    if (selectedPayments.length === filteredPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(filteredPayments.map(p => p._id));
    }
  };

  const toggleSelectPayment = (id: string) => {
    setSelectedPayments(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSendReminder = (payment: DisplayPayment) => {
    setReminderTarget(payment);
    setShowReminderModal(true);
  };

  const handleMarkPaid = (payment: DisplayPayment) => {
    setMarkPaidTarget(payment);
    setShowMarkPaidModal(true);
  };

  const handleRecordPayment = async () => {
    if (!recordPaymentForm.clientName || !recordPaymentForm.amount) return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: `client-${Date.now()}`,
          clientName: recordPaymentForm.clientName,
          amount: parseFloat(recordPaymentForm.amount),
          currency: "USD",
          type: recordPaymentForm.type,
          paymentMethod: recordPaymentForm.paymentMethod,
          transactionId: recordPaymentForm.reference || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record payment");
      }

      setShowRecordPaymentModal(false);
      setRecordPaymentForm({
        clientName: "",
        amount: "",
        paymentMethod: "cash",
        reference: "",
        notes: "",
        type: "subscription",
      });

      // Refresh payments list
      fetchPayments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmMarkPaid = async () => {
    if (!markPaidTarget) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/payments/${markPaidTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_paid",
          transactionId: recordPaymentForm.reference || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark payment as paid");
      }

      setShowMarkPaidModal(false);
      setMarkPaidTarget(null);
      setRecordPaymentForm(prev => ({ ...prev, reference: "" }));

      // Refresh payments list
      fetchPayments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark as paid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryPayment = async (payment: DisplayPayment) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/payments/${payment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry" }),
      });

      if (!response.ok) {
        throw new Error("Failed to retry payment");
      }

      fetchPayments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to retry payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkReminder = async () => {
    const unpaidSelected = selectedPayments
      .map(id => payments.find(p => p._id === id))
      .filter(p => p && (p.status === "pending" || p.status === "overdue"));

    if (unpaidSelected.length === 0) {
      showToast("No pending or overdue payments selected", "error");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/payments/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIds: unpaidSelected.map(p => p?._id),
          type: "reminder",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(`Reminders sent to ${result.results.sent} clients`);
        setSelectedPayments([]);
      } else {
        showToast(result.error || "Failed to send reminders", "error");
      }
    } catch (error) {
      console.error("Bulk reminder error:", error);
      showToast("Failed to send reminders", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // State for more options dropdown
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handleSendReminderVia = async (channel: "email" | "whatsapp") => {
    if (!reminderTarget) return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/payments/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIds: [reminderTarget._id],
          type: "reminder",
          channel,
        }),
      });

      const result = await response.json();

      if (response.ok && result.results.sent > 0) {
        showToast(`Reminder sent via ${channel === "email" ? "Email" : "WhatsApp"} to ${reminderTarget.clientName}!`);
        setShowReminderModal(false);
        setReminderTarget(null);
      } else {
        showToast(result.error || `Failed to send ${channel} reminder`, "error");
      }
    } catch (error) {
      console.error(`${channel} reminder error:`, error);
      showToast(`Failed to send ${channel} reminder`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewInvoice = (payment: DisplayPayment) => {
    if (payment.invoiceUrl) {
      window.open(payment.invoiceUrl, "_blank");
    } else {
      showToast("Invoice not available", "error");
    }
  };

  const handleRefundPayment = async (payment: DisplayPayment) => {
    if (!confirm(`Are you sure you want to refund ${formatCurrency(payment.amount, payment.currency)} to ${payment.clientName}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/payments/${payment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refund" }),
      });

      if (!response.ok) {
        throw new Error("Failed to refund payment");
      }

      showToast(`Payment refunded successfully`);
      fetchPayments();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to refund payment", "error");
    } finally {
      setActionLoading(false);
      setOpenDropdownId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <svg className="w-12 h-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading payments</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchPayments}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Track payments and send reminders to clients
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Period Filter */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
          </select>
          {selectedPayments.length > 0 && (
            <button
              onClick={handleBulkReminder}
              className="hidden lg:flex px-4 py-2.5 text-primary-600 font-medium border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Reminders ({selectedPayments.length})
            </button>
          )}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden lg:inline">Export</span>
          </button>
          <button
            onClick={() => setShowRecordPaymentModal(true)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden lg:inline">Record Payment</span>
            <span className="lg:hidden">Record</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500">Collected</p>
              <p className="text-base sm:text-xl font-bold text-green-600 truncate">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-400">{stats.paidCount} payments</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500">Pending</p>
              <p className="text-base sm:text-xl font-bold text-yellow-600 truncate">{formatCurrency(stats.pendingAmount)}</p>
              <p className="text-xs text-gray-400">{stats.pendingCount} payments</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500">Overdue</p>
              <p className="text-base sm:text-xl font-bold text-red-600 truncate">{formatCurrency(stats.overdueAmount)}</p>
              <p className="text-xs text-gray-400">{stats.overdueCount} payments</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-gray-500">Failed</p>
              <p className="text-base sm:text-xl font-bold text-gray-600 truncate">{formatCurrency(stats.failedAmount)}</p>
              <p className="text-xs text-gray-400">{stats.failedCount} payments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-6 bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client name or transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg overflow-x-auto">
          {(["all", "pending", "overdue", "paid", "failed"] as PaymentFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {status === "all" ? "All" : statusConfig[status as PaymentStatus].label}
              {status === "overdue" && stats.overdueCount > 0 && (
                <span className="ml-1 sm:ml-1.5 px-1 sm:px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                  {stats.overdueCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table/Cards */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden divide-y divide-gray-100">
          {filteredPayments.length === 0 ? (
            <div className="py-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-base font-medium text-gray-900 mb-1">No payments found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or filter</p>
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <div
                key={payment._id}
                className={`px-4 py-4 ${selectedPayments.includes(payment._id) ? "bg-primary-50" : ""}`}
              >
                {/* Row 1: Checkbox + Avatar + Name + Status */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment._id)}
                      onChange={() => toggleSelectPayment(payment._id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      aria-label={`Select payment for ${payment.clientName}`}
                    />
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary-700">{payment.clientInitials}</span>
                    </div>
                  </label>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{payment.clientName}</p>
                    <p className="text-sm text-gray-500">{payment.planName}</p>
                  </div>
                  <StatusBadge status={payment.status} daysOverdue={payment.daysOverdue} />
                </div>

                {/* Row 2: Amount + Due Date - aligned with name */}
                <div className="mt-3 pl-[4.25rem] grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                    <p className="text-lg font-bold text-primary-600">{formatCurrency(payment.amount, payment.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Due Date</p>
                    <p className="text-base font-semibold text-gray-900">{payment.dueDate}</p>
                    {payment.paidDate && (
                      <p className="text-xs text-green-600 mt-0.5">Paid {payment.paidDate}</p>
                    )}
                  </div>
                </div>

                {/* Row 3: Action buttons - aligned with name */}
                {(payment.status === "pending" || payment.status === "overdue") && (
                  <div className="mt-3 ml-[4.25rem] flex gap-2">
                    <button
                      onClick={() => handleMarkPaid(payment)}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                      aria-label={`Mark payment as paid for ${payment.clientName}`}
                    >
                      Mark Paid
                    </button>
                    <button
                      onClick={() => handleSendReminder(payment)}
                      className="flex-1 py-2.5 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                      aria-label={`Send reminder to ${payment.clientName}`}
                    >
                      Reminder
                    </button>
                  </div>
                )}
                {payment.status === "failed" && (
                  <button
                    onClick={() => handleRetryPayment(payment)}
                    disabled={actionLoading}
                    className="mt-3 ml-[4.25rem] w-[calc(100%-4.25rem)] py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    aria-label={`Retry payment for ${payment.clientName}`}
                  >
                    Retry Payment
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <table className="w-full hidden lg:table">
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
                Method
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No payments found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter</p>
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr
                  key={payment._id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedPayments.includes(payment._id) ? "bg-primary-50" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment._id)}
                      onChange={() => toggleSelectPayment(payment._id)}
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
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount, payment.currency)}</p>
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
                    <p className="text-sm text-gray-600 capitalize">{payment.paymentMethod.replace("_", " ")}</p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(payment.status === "pending" || payment.status === "overdue") && (
                        <>
                          <button
                            onClick={() => handleMarkPaid(payment)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleSendReminder(payment)}
                            className="px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                          >
                            Reminder
                          </button>
                        </>
                      )}
                      {payment.status === "failed" && (
                        <button
                          onClick={() => handleRetryPayment(payment)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          Retry
                        </button>
                      )}
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === payment._id ? null : payment._id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                          </svg>
                        </button>
                        {openDropdownId === payment._id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={() => handleViewInvoice(payment)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              View Invoice
                            </button>
                            {payment.status === "paid" && (
                              <button
                                onClick={() => handleRefundPayment(payment)}
                                disabled={actionLoading}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Refund
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                navigator.clipboard.writeText(payment.transactionId || payment._id);
                                showToast("Transaction ID copied!");
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy Transaction ID
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reminder Modal */}
      {showReminderModal && reminderTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Send Payment Reminder</h2>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs sm:text-sm font-semibold text-primary-700">{reminderTarget.clientInitials}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{reminderTarget.clientName}</p>
                  <p className="text-sm text-gray-500 truncate">{reminderTarget.clientEmail}</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium text-gray-900 text-right">{reminderTarget.planName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Amount Due</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(reminderTarget.amount, reminderTarget.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-gray-500">Due Date</span>
                  <span className={`font-medium text-right ${reminderTarget.status === "overdue" ? "text-red-600" : "text-gray-900"}`}>
                    {reminderTarget.dueDate}
                    {reminderTarget.daysOverdue && ` (${reminderTarget.daysOverdue}d overdue)`}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Send reminder via:</p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    onClick={() => handleSendReminderVia("email")}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{actionLoading ? "Sending..." : "Email"}</span>
                  </button>
                  <button
                    onClick={() => handleSendReminderVia("whatsapp")}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">{actionLoading ? "Sending..." : "WhatsApp"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowReminderModal(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setActionLoading(true);
                  try {
                    const response = await fetch("/api/payments/reminders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        paymentIds: [reminderTarget._id],
                        type: "reminder",
                      }),
                    });

                    const result = await response.json();

                    if (response.ok && result.results.sent > 0) {
                      showToast(`Reminder sent to ${reminderTarget.clientName}!`);
                      setShowReminderModal(false);
                    } else {
                      showToast(result.error || "Failed to send reminder", "error");
                    }
                  } catch (error) {
                    console.error("Send reminder error:", error);
                    showToast("Failed to send reminder", "error");
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  "Send Reminder"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Export Payment Report</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Period Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Period</label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                  className="w-full px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_quarter">This Quarter</option>
                  <option value="this_year">This Year</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Payment Status</label>
                <div className="space-y-2">
                  {(["all", "paid", "pending", "overdue", "failed"] as PaymentFilter[]).map((status) => (
                    <label key={status} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="exportStatus"
                        checked={statusFilter === status}
                        onChange={() => setStatusFilter(status)}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {status === "all" ? "All Payments" : statusConfig[status as PaymentStatus].label}
                        {status !== "all" && (
                          <span className="text-gray-400 ml-1">
                            ({status === "paid" ? stats.paidCount : status === "pending" ? stats.pendingCount : status === "overdue" ? stats.overdueCount : stats.failedCount})
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Export Format</label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button className="px-2 sm:px-4 py-2.5 sm:py-3 border-2 border-primary-500 bg-primary-50 rounded-xl text-center">
                    <svg className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-0.5 sm:mb-1 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-primary-700">PDF</span>
                  </button>
                  <button className="px-2 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-center hover:border-gray-300">
                    <svg className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-0.5 sm:mb-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Excel</span>
                  </button>
                  <button className="px-2 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-center hover:border-gray-300">
                    <svg className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-0.5 sm:mb-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium text-gray-700">CSV</span>
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{filteredPayments.length} payments</span> will be exported
                  {statusFilter !== "all" && ` (${statusConfig[statusFilter as PaymentStatus].label} only)`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Total: {formatCurrency(filteredPayments.reduce((acc, p) => acc + p.amount, 0))}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    // Build query params
                    const params = new URLSearchParams();
                    params.set("format", "csv");
                    if (statusFilter !== "all") {
                      params.set("status", statusFilter);
                    }

                    // Download CSV
                    const response = await fetch(`/api/admin/payments/export?${params.toString()}`);
                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `payments-${new Date().toISOString().split("T")[0]}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      a.remove();
                      setShowExportModal(false);
                    } else {
                      alert("Failed to export payments");
                    }
                  } catch (error) {
                    console.error("Export error:", error);
                    alert("Failed to export payments");
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Record Payment</h2>
                <button
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Name</label>
                <input
                  type="text"
                  value={recordPaymentForm.clientName}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, clientName: e.target.value })}
                  placeholder="Enter client name..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={recordPaymentForm.amount}
                    onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Type</label>
                <select
                  value={recordPaymentForm.type}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, type: e.target.value as "subscription" | "drop-in" | "package" })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="subscription">Subscription</option>
                  <option value="drop-in">Drop-in</option>
                  <option value="package">Package</option>
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {/* pix: Hidden for US market - re-enable for Brazil */}
                  {(["cash", "bank_transfer", "credit_card"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setRecordPaymentForm({ ...recordPaymentForm, paymentMethod: method })}
                      className={`px-3 py-2 border-2 rounded-lg text-xs font-medium transition-colors ${
                        recordPaymentForm.paymentMethod === method
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {method === "credit_card" ? "Card" : method === "bank_transfer" ? "Transfer" : "Cash"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference/Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference / Transaction ID</label>
                <input
                  type="text"
                  value={recordPaymentForm.reference}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, reference: e.target.value })}
                  placeholder="Optional - receipt number, check number, etc."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={recordPaymentForm.notes}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowRecordPaymentModal(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={!recordPaymentForm.clientName || !recordPaymentForm.amount || actionLoading}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Record Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {showMarkPaidModal && markPaidTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Mark as Paid</h2>
                <button
                  onClick={() => {
                    setShowMarkPaidModal(false);
                    setMarkPaidTarget(null);
                  }}
                  className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Client Info */}
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs sm:text-sm font-semibold text-primary-700">{markPaidTarget.clientInitials}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{markPaidTarget.clientName}</p>
                  <p className="text-sm text-gray-500 truncate">{markPaidTarget.planName}</p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(markPaidTarget.amount, markPaidTarget.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Due Date</span>
                  <span className="font-medium text-gray-900">{markPaidTarget.dueDate}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">How was it paid?</label>
                <div className="grid grid-cols-3 gap-2">
                  {/* pix: Hidden for US market - re-enable for Brazil */}
                  {(["cash", "bank_transfer", "credit_card"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setRecordPaymentForm({ ...recordPaymentForm, paymentMethod: method })}
                      className={`px-3 py-2 border-2 rounded-lg text-xs font-medium transition-colors ${
                        recordPaymentForm.paymentMethod === method
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {method === "credit_card" ? "Card" : method === "bank_transfer" ? "Transfer" : "Cash"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference (optional)</label>
                <input
                  type="text"
                  value={recordPaymentForm.reference}
                  onChange={(e) => setRecordPaymentForm({ ...recordPaymentForm, reference: e.target.value })}
                  placeholder="Receipt number, check number, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowMarkPaidModal(false);
                  setMarkPaidTarget(null);
                }}
                className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMarkPaid}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
