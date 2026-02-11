"use client";

import { useState, useRef, useMemo, useEffect, memo } from "react";
import { SearchIcon, FilterIcon, ChevronIcon, UploadIcon } from "@/components/icons";
import { useClients } from "@/hooks/useData";
import { LoadingSpinner, LoadingTable } from "@/components/ui/LoadingSpinner";
import { ErrorMessage, EmptyState } from "@/components/ui/ErrorMessage";
import type { Client } from "@/lib/api/client";
import { formatCurrency, getInitials } from "@/lib/utils/formatters";

type ClientStatus = "active" | "paused" | "expired" | "pending";

interface Unit {
  id: string;
  name: string;
  address: string;
  clients: Client[];
  totalRevenue: number;
}

const statusStyles = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Active" },
  paused: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Paused" },
  expired: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Expired" },
  pending: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Pending" },
};

const StatusBadge = memo(function StatusBadge({ status }: { status: ClientStatus }) {
  const style = statusStyles[status] || statusStyles.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
});

const ClientRow = memo(function ClientRow({ client, onApprove, onReject, onEdit, onDelete }: {
  client: Client;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const status = (client.status as ClientStatus) || "active";
  const classesRemaining = client.classesRemaining || 0;
  const classesTotal = client.classesTotal || 0;
  const progressPercent = classesTotal > 0 ? (classesRemaining / classesTotal) * 100 : 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary-700">{getInitials(client.name)}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{client.name}</p>
            <p className="text-sm text-gray-500">{client.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={status} />
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-900">{typeof client.plan === "string" ? client.plan : (client.plan?.type || "No plan")}</p>
        {classesTotal > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  progressPercent > 50 ? "bg-green-500" : progressPercent > 20 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{classesRemaining}/{classesTotal}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-900">{client.instructor || "—"}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-500">{client.lastActivity || "—"}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-900">{formatCurrency(client.revenue || 0)}</p>
      </td>
      <td className="px-4 py-3">
        {status === "pending" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onApprove}
              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={onReject}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reject
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
});

function ClientCard({ client, onApprove, onReject, onEdit, onDelete }: {
  client: Client;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const status = (client.status as ClientStatus) || "active";
  const classesRemaining = client.classesRemaining || 0;
  const classesTotal = client.classesTotal || 0;
  const progressPercent = classesTotal > 0 ? (classesRemaining / classesTotal) * 100 : 0;

  return (
    <div className="p-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary-700">{getInitials(client.name)}</span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{client.name}</p>
            <p className="text-xs text-gray-500">{client.email}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <p className="text-gray-500 text-xs">Plan</p>
          <p className="font-medium text-gray-900 truncate">{typeof client.plan === "string" ? client.plan : (client.plan?.type || "No plan")}</p>
          {classesTotal > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    progressPercent > 50 ? "bg-green-500" : progressPercent > 20 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{classesRemaining}/{classesTotal}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-gray-500 text-xs">Instructor</p>
          <p className="font-medium text-gray-900">{client.instructor || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Last Activity</p>
          <p className="font-medium text-gray-900">{client.lastActivity || "—"}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Revenue</p>
          <p className="font-medium text-green-600">{formatCurrency(client.revenue || 0)}</p>
        </div>
      </div>

      {status === "pending" ? (
        <div className="flex items-center gap-2">
          <button
            onClick={onApprove}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reject
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-1">
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

const UnitSection = memo(function UnitSection({ unit, isExpanded, onToggle, onApprove, onReject, onEdit, onDelete }: {
  unit: Unit;
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}) {
  const activeCount = unit.clients.filter((c) => c.status === "active").length;
  const pendingCount = unit.clients.filter((c) => c.status === "pending").length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Unit Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{unit.name}</h2>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex-shrink-0">
                {pendingCount} pending
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{unit.address}</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-medium text-gray-900">{unit.clients.length} clients</p>
            <p className="text-xs text-gray-500">{activeCount} active</p>
          </div>
          <div className="text-right">
            <p className="text-xs lg:text-sm font-medium text-green-600">{formatCurrency(unit.totalRevenue)}</p>
            <p className="text-xs text-gray-500 hidden lg:block">total revenue</p>
            <p className="text-xs text-gray-500 lg:hidden">{unit.clients.length} clients</p>
          </div>
          <ChevronIcon
            className="w-5 h-5 text-gray-400 transition-transform flex-shrink-0"
            direction={isExpanded ? "up" : "down"}
          />
        </div>
      </button>

      {/* Clients - Mobile Card View */}
      {isExpanded && (
        <div className="border-t border-gray-100 lg:hidden">
          {unit.clients.map((client) => (
            <ClientCard
              key={client._id}
              client={client}
              onApprove={() => onApprove(client._id)}
              onReject={() => onReject(client._id)}
              onEdit={() => onEdit(client)}
              onDelete={() => onDelete(client)}
            />
          ))}
        </div>
      )}

      {/* Clients - Desktop Table View */}
      {isExpanded && (
        <div className="border-t border-gray-100 hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unit.clients.map((client) => (
                <ClientRow
                  key={client._id}
                  client={client}
                  onApprove={() => onApprove(client._id)}
                  onReject={() => onReject(client._id)}
                  onEdit={() => onEdit(client)}
                  onDelete={() => onDelete(client)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

// Plan options for clients
const planOptions = [
  { id: "monthly-8", name: "Monthly - 8 classes", price: 299 },
  { id: "monthly-12", name: "Monthly - 12 classes", price: 399 },
  { id: "quarterly-24", name: "Quarterly - 24 classes", price: 799 },
  { id: "semiannual-48", name: "Semi-annual - 48 classes", price: 1499 },
  { id: "annual-96", name: "Annual - 96 classes", price: 2499 },
];

// Add Client Modal Component
function AddClientModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Client>) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    plan: planOptions[0].id,
    unit: "FlexiWell Downtown",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in name and email");
      return;
    }
    const selectedPlan = planOptions.find((p) => p.id === formData.plan);
    await onSubmit({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      plan: selectedPlan?.name,
      unit: formData.unit,
      status: "active",
    });
    setFormData({
      name: "",
      email: "",
      phone: "",
      plan: planOptions[0].id,
      unit: "FlexiWell Downtown",
      notes: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Add Client</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter client's full name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan *</label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {planOptions.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Welcome Email</p>
                <p className="text-sm text-blue-700 mt-1">
                  A welcome email will be sent to the client with instructions to set up their account.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <LoadingSpinner size="sm" className="text-white" /> : null}
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
}

// Import Modal Component
function ImportModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors?: { row: number; email: string; error: string }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseCSV = (content: string): Record<string, string>[] => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const data: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      // Map CSV columns to expected API fields
      const mappedRow: Record<string, string> = {
        name: row.name || "",
        email: row.email || "",
        phone: row.phone || "",
        planType: row.plan?.includes("quarterly") ? "quarterly" : row.plan?.includes("annual") ? "annual" : "monthly",
      };

      data.push(mappedRow);
    }

    return data;
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);

    try {
      // Read and parse CSV file
      const content = await file.text();
      const clientsData = parseCSV(content);

      if (clientsData.length === 0) {
        setImportResult({ success: 0, failed: 0, errors: [{ row: 0, email: "", error: "No valid data found in CSV file" }] });
        setImporting(false);
        return;
      }

      // Send to API
      const response = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientsData }),
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult({
          success: result.results.success,
          failed: result.results.failed,
          errors: result.results.errors,
        });
        if (result.results.success > 0 && onSuccess) {
          onSuccess();
        }
      } else {
        setImportResult({ success: 0, failed: clientsData.length, errors: [{ row: 0, email: "", error: result.error || "Import failed" }] });
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportResult({ success: 0, failed: 0, errors: [{ row: 0, email: "", error: "Failed to process import" }] });
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setImportResult(null);
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = `Name,Email,Phone,Plan,Location,Instructor
John Smith,john.smith@email.com,(555) 123-4567,Monthly - 8 classes,FlexiWell Downtown,Sarah Johnson
Jane Doe,jane.doe@email.com,(555) 234-5678,Quarterly - 24 classes,FlexiWell Midtown,Michael Chen`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "client_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Import Clients</h2>
            <button onClick={resetModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {!importResult ? (
            <>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive ? "border-primary-500 bg-primary-50" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <polyline points="16 13 12 17 8 13" />
                        <line x1="12" y1="17" x2="12" y2="11" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => setFile(null)} className="p-1 text-gray-400 hover:text-red-500">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <UploadIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary-600 font-medium hover:text-primary-700"
                      >
                        Click to upload
                      </button>
                      {" "}or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">CSV or Excel file (max 10MB)</p>
                  </>
                )}
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Download template</p>
                      <p className="text-xs text-gray-500">Use our template for best results</p>
                    </div>
                  </div>
                  <button onClick={downloadTemplate} className="text-sm text-primary-600 font-medium hover:text-primary-700">
                    Download
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-4">
              <div className="text-center">
                <div className={`w-16 h-16 ${importResult.success > 0 ? "bg-green-100" : "bg-red-100"} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {importResult.success > 0 ? (
                    <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {importResult.success > 0 ? "Import Complete!" : "Import Failed"}
                </h3>
                <div className="flex items-center justify-center gap-6 mb-4">
                  {importResult.success > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                      <p className="text-sm text-gray-500">Imported</p>
                    </div>
                  )}
                  {importResult.failed > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                      <p className="text-sm text-gray-500">Failed</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Show errors if any */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4 max-h-32 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700 mb-2">Errors:</p>
                  <div className="space-y-1">
                    {importResult.errors.slice(0, 5).map((err, idx) => (
                      <p key={idx} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        {err.row > 0 ? `Row ${err.row}` : ""}{err.email ? ` (${err.email})` : ""}: {err.error}
                      </p>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className="text-xs text-gray-500">...and {importResult.errors.length - 5} more errors</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white">
          <button onClick={resetModal} className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
            {importResult ? "Close" : "Cancel"}
          </button>
          {!importResult && (
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 flex items-center justify-center gap-2"
            >
              {importing ? <LoadingSpinner size="sm" className="text-white" /> : null}
              {importing ? "Importing..." : "Import Clients"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all");
  const [expandedUnits, setExpandedUnits] = useState<string[]>(["default"]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Fetch clients from API
  const { clients, isLoading, error, refetch, createClient, updateClient, deleteClient } = useClients({
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  // Group clients by unit for display
  const units = useMemo(() => {
    if (!clients || clients.length === 0) {
      return [];
    }

    // Group clients by unit
    const unitMap = new Map<string, Client[]>();
    clients.forEach((client) => {
      const unitName = client.unit || "FlexiWell Default";
      if (!unitMap.has(unitName)) {
        unitMap.set(unitName, []);
      }
      unitMap.get(unitName)!.push(client);
    });

    // Convert to array format
    return Array.from(unitMap.entries()).map(([name, clientList], index) => ({
      id: `unit-${index}`,
      name,
      address: `Location ${index + 1}`,
      clients: clientList,
      totalRevenue: clientList.reduce((sum, c) => sum + (c.revenue || 0), 0),
    }));
  }, [clients]);

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const handleAddClient = async (data: Partial<Client>) => {
    setIsSubmitting(true);
    try {
      const result = await createClient(data);
      if (!result.success) {
        alert(result.error || "Failed to add client");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    const result = await updateClient(id, { status: "active" });
    if (!result.success) {
      alert(result.error || "Failed to approve client");
    }
  };

  const handleReject = async (id: string) => {
    if (confirm("Are you sure you want to reject this client?")) {
      const result = await deleteClient(id);
      if (!result.success) {
        alert(result.error || "Failed to reject client");
      }
    }
  };

  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
  };

  const handleUpdateClient = async (data: Partial<Client>) => {
    if (!editingClient) return;
    setIsSubmitting(true);
    try {
      const result = await updateClient(editingClient._id, data);
      if (!result.success) {
        alert(result.error || "Failed to update client");
      } else {
        setEditingClient(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    const result = await deleteClient(clientToDelete._id);
    if (!result.success) {
      alert(result.error || "Failed to delete client");
    }
    setClientToDelete(null);
  };

  // Calculate stats
  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter((c) => c.status === "active").length || 0;
  const pendingClients = clients?.filter((c) => c.status === "pending").length || 0;
  const totalRevenue = clients?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0;

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <ErrorMessage message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-600 mt-1 hidden lg:block">
            Manage all clients across all locations
          </p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="p-2 lg:px-4 lg:py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <UploadIcon className="w-5 h-5" />
            <span className="hidden lg:inline">Import</span>
          </button>
          <button
            onClick={() => setShowAddClientModal(true)}
            className="px-3 py-2 lg:px-4 lg:py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden lg:inline">Add</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Total Clients</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{isLoading ? "—" : totalClients}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Active Clients</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{isLoading ? "—" : activeClients}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Pending</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg sm:text-2xl font-bold text-blue-600">{isLoading ? "—" : pendingClients}</p>
            {pendingClients > 0 && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full animate-pulse">
                Action
              </span>
            )}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Locations</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{isLoading ? "—" : units.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 col-span-2 sm:col-span-1">
          <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{isLoading ? "—" : formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6 bg-white rounded-xl p-3 sm:p-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 sm:bg-transparent border border-gray-200 sm:border-0 rounded-lg sm:rounded-none focus:outline-none focus:ring-2 sm:focus:ring-0 focus:ring-primary-500 text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 flex-1 sm:flex-none min-w-0">
            <FilterIcon className="w-5 h-5 text-gray-400 hidden lg:block flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <button
            onClick={() =>
              setExpandedUnits(expandedUnits.length === units.length ? [] : units.map((u) => u.id))
            }
            className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <span className="hidden lg:inline">{expandedUnits.length === units.length ? "Collapse all" : "Expand all"}</span>
            <span className="lg:hidden">{expandedUnits.length === units.length ? "Collapse" : "Expand"}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingTable rows={5} />
      ) : units.length > 0 ? (
        <div className="space-y-4">
          {units.map((unit) => (
            <UnitSection
              key={unit.id}
              unit={unit}
              isExpanded={expandedUnits.includes(unit.id)}
              onToggle={() => toggleUnit(unit.id)}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No clients found"
          description={searchQuery || statusFilter !== "all" ? "Try adjusting your search filters" : "Add your first client to get started"}
          icon={
            <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          action={!searchQuery && statusFilter === "all" ? { label: "Add Client", onClick: () => setShowAddClientModal(true) } : undefined}
        />
      )}

      {/* Modals */}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onSuccess={refetch} />
      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onSubmit={handleAddClient}
        isSubmitting={isSubmitting}
      />
      <EditClientModal
        client={editingClient}
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        onSubmit={handleUpdateClient}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Client
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Are you sure you want to delete <span className="font-medium text-gray-900">{clientToDelete.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setClientToDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Edit Client Modal Component
function EditClientModal({
  client,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Client>) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    plan: "",
    status: "active" as ClientStatus,
  });

  const prevIsOpenRef = useRef(isOpen);

  // Update form when modal opens
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current && client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        plan: typeof client.plan === 'string' ? client.plan : (client.plan?.type || ""),
        status: (client.status as ClientStatus) || "active",
      });
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, client]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in name and email");
      return;
    }
    await onSubmit({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      plan: formData.plan,
      status: formData.status,
    });
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Edit Client</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">No plan</option>
              {planOptions.map((plan) => (
                <option key={plan.id} value={plan.name}>
                  {plan.name} - ${plan.price}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ClientStatus })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <LoadingSpinner size="sm" className="text-white" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
