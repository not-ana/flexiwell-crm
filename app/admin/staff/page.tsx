"use client";

import { useState, useRef, useMemo } from "react";
import { SearchIcon, FilterIcon, ChevronIcon, UploadIcon } from "@/components/icons";
import { useStaff } from "@/hooks/useData";
import { LoadingSpinner, LoadingTable } from "@/components/ui/LoadingSpinner";
import { ErrorMessage, EmptyState } from "@/components/ui/ErrorMessage";
import type { Staff } from "@/lib/api/client";

type StaffRole = "admin" | "teacher" | "receptionist";
type StaffStatus = "active" | "invited" | "inactive";

interface Unit {
  id: string;
  name: string;
  address: string;
  staff: Staff[];
}

const roleStyles: Record<StaffRole, { bg: string; text: string; label: string }> = {
  admin: { bg: "bg-primary-50", text: "text-primary-700", label: "Admin" },
  teacher: { bg: "bg-blue-50", text: "text-blue-700", label: "Teacher" },
  receptionist: { bg: "bg-green-50", text: "text-green-700", label: "Receptionist" },
};

const statusStyles: Record<StaffStatus, { bg: string; text: string; dot: string; label: string }> = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Active" },
  invited: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Invited" },
  inactive: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400", label: "Inactive" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function RoleBadge({ role }: { role: StaffRole }) {
  const style = roleStyles[role] || roleStyles.teacher;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function StatusBadge({ status }: { status: StaffStatus }) {
  const style = statusStyles[status] || statusStyles.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function StaffRow({ staff, onResendInvite, onEdit, onDeactivate }: {
  staff: Staff;
  onResendInvite?: () => void;
  onEdit?: () => void;
  onDeactivate?: () => void;
}) {
  const role = (staff.role as StaffRole) || "teacher";
  const status = (staff.status as StaffStatus) || "active";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
            {staff.avatar ? (
              <img src={staff.avatar} alt={staff.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-primary-700">{getInitials(staff.name)}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{staff.name}</p>
            <p className="text-sm text-gray-500">{staff.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={role} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={status} />
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-900">{staff.phone || "—"}</p>
      </td>
      <td className="px-4 py-3">
        {role === "teacher" && staff.classesThisWeek !== undefined ? (
          <p className="text-sm font-medium text-gray-900">{staff.classesThisWeek} classes</p>
        ) : (
          <p className="text-sm text-gray-400">—</p>
        )}
      </td>
      <td className="px-4 py-3">
        {staff.rating ? (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-sm font-medium text-gray-900">{staff.rating}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-400">—</p>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-500">{staff.lastActive || "—"}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {status === "invited" && (
            <button
              onClick={onResendInvite}
              className="px-2.5 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              Resend
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {status !== "inactive" && (
            <button
              onClick={onDeactivate}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StaffCard({ staff, onResendInvite, onEdit, onDeactivate }: {
  staff: Staff;
  onResendInvite?: () => void;
  onEdit?: () => void;
  onDeactivate?: () => void;
}) {
  const role = (staff.role as StaffRole) || "teacher";
  const status = (staff.status as StaffStatus) || "active";

  return (
    <div className="p-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
            {staff.avatar ? (
              <img src={staff.avatar} alt={staff.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-primary-700">{getInitials(staff.name)}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{staff.name}</p>
            <p className="text-xs text-gray-500">{staff.email}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <p className="text-gray-500 text-xs">Role</p>
          <div className="mt-1"><RoleBadge role={role} /></div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Phone</p>
          <p className="font-medium text-gray-900">{staff.phone || "—"}</p>
        </div>
        {role === "teacher" && (
          <>
            <div>
              <p className="text-gray-500 text-xs">Classes This Week</p>
              <p className="font-medium text-gray-900">{staff.classesThisWeek ?? 0}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Rating</p>
              {staff.rating ? (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="font-medium text-gray-900">{staff.rating}</span>
                </div>
              ) : (
                <p className="text-gray-400">—</p>
              )}
            </div>
          </>
        )}
        <div className={role !== "teacher" ? "col-span-2" : ""}>
          <p className="text-gray-500 text-xs">Last Active</p>
          <p className="font-medium text-gray-900">{staff.lastActive || "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1">
        {status === "invited" && (
          <button
            onClick={onResendInvite}
            className="px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            Resend Invite
          </button>
        )}
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        {status !== "inactive" && (
          <button
            onClick={onDeactivate}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function UnitSection({ unit, isExpanded, onToggle, onResendInvite, onEdit, onDeactivate }: {
  unit: Unit;
  isExpanded: boolean;
  onToggle: () => void;
  onResendInvite: (id: string) => void;
  onEdit: (staff: Staff) => void;
  onDeactivate: (id: string) => void;
}) {
  const activeCount = unit.staff.filter((s) => s.status === "active").length;
  const teacherCount = unit.staff.filter((s) => s.role === "teacher").length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Unit Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="flex-1 text-left min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{unit.name}</h2>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{unit.address}</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-medium text-gray-900">{unit.staff.length} staff</p>
            <p className="text-xs text-gray-500">{activeCount} active</p>
          </div>
          <div className="text-right">
            <p className="text-xs lg:text-sm font-medium text-blue-600">{teacherCount} teachers</p>
            <p className="text-xs text-gray-500 hidden lg:block">this location</p>
            <p className="text-xs text-gray-500 lg:hidden">{unit.staff.length} staff</p>
          </div>
          <ChevronIcon
            className="w-5 h-5 text-gray-400 transition-transform flex-shrink-0"
            direction={isExpanded ? "up" : "down"}
          />
        </div>
      </button>

      {/* Staff - Mobile Card View */}
      {isExpanded && (
        <div className="border-t border-gray-100 lg:hidden">
          {unit.staff.map((staffMember) => (
            <StaffCard
              key={staffMember._id}
              staff={staffMember}
              onResendInvite={() => onResendInvite(staffMember._id)}
              onEdit={() => onEdit(staffMember)}
              onDeactivate={() => onDeactivate(staffMember._id)}
            />
          ))}
        </div>
      )}

      {/* Staff - Desktop Table View */}
      {isExpanded && (
        <div className="border-t border-gray-100 hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unit.staff.map((staffMember) => (
                <StaffRow
                  key={staffMember._id}
                  staff={staffMember}
                  onResendInvite={() => onResendInvite(staffMember._id)}
                  onEdit={() => onEdit(staffMember)}
                  onDeactivate={() => onDeactivate(staffMember._id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Add Staff Modal Component
function AddStaffModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  units,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Staff>) => Promise<void>;
  isSubmitting: boolean;
  units: Unit[];
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "teacher" as StaffRole,
    unit: units[0]?.name || "",
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in name and email");
      return;
    }
    await onSubmit({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      unit: formData.unit,
      status: "invited",
    });
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "teacher",
      unit: units[0]?.name || "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Add Staff Member</h2>
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
              placeholder="Enter full name"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="receptionist">Receptionist</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {units.length > 0 ? (
                  units.map((unit) => (
                    <option key={unit.id} value={unit.name}>
                      {unit.name}
                    </option>
                  ))
                ) : (
                  <option value="FlexiWell Default">FlexiWell Default</option>
                )}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Invitation Email</p>
                <p className="text-sm text-blue-700 mt-1">
                  An email invitation will be sent to the new staff member to set up their account and password.
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
            Add & Send Invite
          </button>
        </div>
      </div>
    </div>
  );
}

// Import Staff Modal Component
function ImportStaffModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) return;
    setImporting(true);
    // TODO: Implement actual import via API
    setTimeout(() => {
      setImporting(false);
      setImportResult({ success: 12, failed: 1 });
    }, 2000);
  };

  const resetModal = () => {
    setFile(null);
    setImportResult(null);
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = `Name,Email,Phone,Role,Location
John Smith,john.smith@email.com,(555) 123-4567,Teacher,FlexiWell Downtown
Jane Doe,jane.doe@email.com,(555) 234-5678,Admin,FlexiWell Midtown
Michael Johnson,michael.j@email.com,(555) 345-6789,Teacher,FlexiWell Uptown
Sarah Williams,sarah.w@email.com,(555) 456-7890,Receptionist,FlexiWell Downtown`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "staff_import_template.csv");
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
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Import Staff</h2>
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
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-colors ${
                  file ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-primary-500"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <>
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    <p className="text-gray-900 font-medium text-sm sm:text-base truncate">{file.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Click to change file</p>
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium text-sm sm:text-base">Click to upload CSV file</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">or drag and drop</p>
                  </>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <button onClick={downloadTemplate} className="text-primary-600 hover:text-primary-700 font-medium">
                  Download template
                </button>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">CSV format required</span>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Import Complete</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Successfully imported <span className="font-semibold text-green-600">{importResult.success}</span> staff members
                {importResult.failed > 0 && (
                  <>. <span className="font-semibold text-red-600">{importResult.failed}</span> failed.</>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={resetModal} className="w-full sm:w-auto px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors">
            {importResult ? "Close" : "Cancel"}
          </button>
          {!importResult && (
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full sm:w-auto px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {importing ? <LoadingSpinner size="sm" className="text-white" /> : null}
              {importing ? "Importing..." : "Import Staff"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminStaffPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | StaffRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StaffStatus>("all");
  const [expandedUnits, setExpandedUnits] = useState<string[]>(["default"]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch staff from API
  const { staff, total, isLoading, error, refetch, createStaff, updateStaff, deleteStaff } = useStaff({
    role: roleFilter !== "all" ? roleFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  // Filter staff by search query
  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    if (!searchQuery) return staff;
    const query = searchQuery.toLowerCase();
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
    );
  }, [staff, searchQuery]);

  // Group staff by unit
  const units = useMemo(() => {
    if (!filteredStaff || filteredStaff.length === 0) {
      return [];
    }

    const unitMap = new Map<string, Staff[]>();
    filteredStaff.forEach((staffMember) => {
      const unitName = staffMember.unit || "FlexiWell Default";
      if (!unitMap.has(unitName)) {
        unitMap.set(unitName, []);
      }
      unitMap.get(unitName)!.push(staffMember);
    });

    return Array.from(unitMap.entries()).map(([name, staffList], index) => ({
      id: `unit-${index}`,
      name,
      address: `Location ${index + 1}`,
      staff: staffList,
    }));
  }, [filteredStaff]);

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const handleAddStaff = async (data: Partial<Staff>) => {
    setIsSubmitting(true);
    try {
      const result = await createStaff(data);
      if (!result.success) {
        alert(result.error || "Failed to add staff member");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendInvite = async (id: string) => {
    // TODO: Implement resend invite API
    alert(`Invitation resent to staff member ${id}`);
  };

  const handleEdit = (staffMember: Staff) => {
    // TODO: Open edit modal
    alert(`Edit staff: ${staffMember.name}`);
  };

  const handleDeactivate = async (id: string) => {
    if (confirm("Are you sure you want to deactivate this staff member?")) {
      const result = await updateStaff(id, { status: "inactive" });
      if (!result.success) {
        alert(result.error || "Failed to deactivate staff member");
      }
    }
  };

  // Calculate stats
  const totalStaff = staff?.length || 0;
  const activeStaff = staff?.filter((s) => s.status === "active").length || 0;
  const teacherCount = staff?.filter((s) => s.role === "teacher").length || 0;
  const pendingInvites = staff?.filter((s) => s.status === "invited").length || 0;

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-sm text-gray-600 mt-1 hidden lg:block">
            Manage employees across all locations
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
            onClick={() => setShowAddStaffModal(true)}
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
          <p className="text-xs sm:text-sm text-gray-600">Total Staff</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{isLoading ? "—" : totalStaff}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Active Staff</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{isLoading ? "—" : activeStaff}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Teachers</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-600 mt-1">{isLoading ? "—" : teacherCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Pending Invites</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg sm:text-2xl font-bold text-yellow-600">{isLoading ? "—" : pendingInvites}</p>
            {pendingInvites > 0 && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                Awaiting
              </span>
            )}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 col-span-2 sm:col-span-1">
          <p className="text-xs sm:text-sm text-gray-600">Locations</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{isLoading ? "—" : units.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6 bg-white rounded-xl p-3 sm:p-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 sm:bg-transparent border border-gray-200 sm:border-0 rounded-lg sm:rounded-none focus:outline-none focus:ring-2 sm:focus:ring-0 focus:ring-primary-500 text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className="flex-1 sm:flex-none min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="receptionist">Receptionist</option>
          </select>

          <div className="flex items-center gap-2 flex-1 sm:flex-none min-w-0">
            <FilterIcon className="w-5 h-5 text-gray-400 hidden lg:block flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="inactive">Inactive</option>
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
              onResendInvite={handleResendInvite}
              onEdit={handleEdit}
              onDeactivate={handleDeactivate}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No staff found"
          description={searchQuery || roleFilter !== "all" || statusFilter !== "all" ? "Try adjusting your search filters" : "Add your first staff member to get started"}
          icon={
            <svg className="w-12 h-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          action={!searchQuery && roleFilter === "all" && statusFilter === "all" ? { label: "Add Staff", onClick: () => setShowAddStaffModal(true) } : undefined}
        />
      )}

      {/* Modals */}
      <AddStaffModal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
        onSubmit={handleAddStaff}
        isSubmitting={isSubmitting}
        units={units}
      />
      <ImportStaffModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
}
