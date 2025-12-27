"use client";

import { useState } from "react";
import { SearchIcon, FilterIcon, ChevronIcon } from "@/components/icons";

type StaffRole = "admin" | "teacher" | "receptionist";
type StaffStatus = "active" | "invited" | "inactive";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  avatar?: string;
  initials: string;
  unit: string;
  joinDate: string;
  lastActive?: string;
  classesThisWeek?: number;
  rating?: number;
}

interface Unit {
  id: string;
  name: string;
  address: string;
  staff: StaffMember[];
}

// Mock data - staff grouped by unit
const mockUnits: Unit[] = [
  {
    id: "1",
    name: "FlexiWell Downtown",
    address: "123 Main Street - Downtown",
    staff: [
      {
        id: "1",
        name: "Sarah Johnson",
        email: "sarah@flexiwell.com",
        phone: "(555) 123-4567",
        role: "admin",
        status: "active",
        initials: "SJ",
        unit: "FlexiWell Downtown",
        joinDate: "Jan 2023",
        lastActive: "Just now",
        classesThisWeek: 0,
        rating: 4.9,
      },
      {
        id: "2",
        name: "Michael Chen",
        email: "michael@flexiwell.com",
        phone: "(555) 234-5678",
        role: "teacher",
        status: "active",
        initials: "MC",
        unit: "FlexiWell Downtown",
        joinDate: "Mar 2023",
        lastActive: "2 hours ago",
        classesThisWeek: 12,
        rating: 4.8,
      },
      {
        id: "3",
        name: "Emily Davis",
        email: "emily@flexiwell.com",
        phone: "(555) 345-6789",
        role: "teacher",
        status: "active",
        initials: "ED",
        unit: "FlexiWell Downtown",
        joinDate: "Jun 2023",
        lastActive: "1 day ago",
        classesThisWeek: 8,
        rating: 4.7,
      },
      {
        id: "4",
        name: "Robert Brown",
        email: "robert@flexiwell.com",
        phone: "(555) 456-7890",
        role: "receptionist",
        status: "active",
        initials: "RB",
        unit: "FlexiWell Downtown",
        joinDate: "Sep 2023",
        lastActive: "30 minutes ago",
      },
      {
        id: "5",
        name: "Jessica Taylor",
        email: "jessica@flexiwell.com",
        phone: "(555) 567-8901",
        role: "teacher",
        status: "invited",
        initials: "JT",
        unit: "FlexiWell Downtown",
        joinDate: "Dec 2024",
      },
    ],
  },
  {
    id: "2",
    name: "FlexiWell Westside",
    address: "456 Park Avenue - Westside",
    staff: [
      {
        id: "6",
        name: "Rachel Green",
        email: "rachel@flexiwell.com",
        phone: "(555) 678-9012",
        role: "admin",
        status: "active",
        initials: "RG",
        unit: "FlexiWell Westside",
        joinDate: "Feb 2023",
        lastActive: "1 hour ago",
        classesThisWeek: 0,
        rating: 4.9,
      },
      {
        id: "7",
        name: "James Wilson",
        email: "james@flexiwell.com",
        phone: "(555) 789-0123",
        role: "teacher",
        status: "active",
        initials: "JW",
        unit: "FlexiWell Westside",
        joinDate: "Apr 2023",
        lastActive: "3 hours ago",
        classesThisWeek: 10,
        rating: 4.6,
      },
      {
        id: "8",
        name: "Lisa Anderson",
        email: "lisa@flexiwell.com",
        phone: "(555) 890-1234",
        role: "teacher",
        status: "inactive",
        initials: "LA",
        unit: "FlexiWell Westside",
        joinDate: "May 2023",
        lastActive: "2 weeks ago",
        classesThisWeek: 0,
        rating: 4.5,
      },
    ],
  },
  {
    id: "3",
    name: "FlexiWell Eastside",
    address: "789 Oak Boulevard - Eastside",
    staff: [
      {
        id: "9",
        name: "Ricardo Alves",
        email: "ricardo@flexiwell.com",
        phone: "(555) 901-2345",
        role: "admin",
        status: "active",
        initials: "RA",
        unit: "FlexiWell Eastside",
        joinDate: "Jan 2024",
        lastActive: "5 hours ago",
      },
      {
        id: "10",
        name: "Camila Souza",
        email: "camila@flexiwell.com",
        phone: "(555) 012-3456",
        role: "teacher",
        status: "active",
        initials: "CS",
        unit: "FlexiWell Eastside",
        joinDate: "Feb 2024",
        lastActive: "Yesterday",
        classesThisWeek: 15,
        rating: 4.9,
      },
    ],
  },
];

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

function RoleBadge({ role }: { role: StaffRole }) {
  const style = roleStyles[role];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function StatusBadge({ status }: { status: StaffStatus }) {
  const style = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function StaffRow({ staff, onResendInvite, onEdit, onDeactivate }: {
  staff: StaffMember;
  onResendInvite?: () => void;
  onEdit?: () => void;
  onDeactivate?: () => void;
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
            {staff.avatar ? (
              <img src={staff.avatar} alt={staff.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-primary-700">{staff.initials}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{staff.name}</p>
            <p className="text-sm text-gray-500">{staff.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={staff.role} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={staff.status} />
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-900">{staff.phone}</p>
      </td>
      <td className="px-4 py-3">
        {staff.role === "teacher" && staff.classesThisWeek !== undefined ? (
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
          {staff.status === "invited" && (
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
          {staff.status !== "inactive" && (
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

function UnitSection({ unit, isExpanded, onToggle }: { unit: Unit; isExpanded: boolean; onToggle: () => void }) {
  const activeCount = unit.staff.filter((s) => s.status === "active").length;
  const teacherCount = unit.staff.filter((s) => s.role === "teacher").length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Unit Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <h2 className="font-semibold text-gray-900">{unit.name}</h2>
          <p className="text-sm text-gray-500">{unit.address}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{unit.staff.length} staff</p>
            <p className="text-xs text-gray-500">{activeCount} active</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-blue-600">{teacherCount} teachers</p>
            <p className="text-xs text-gray-500">this location</p>
          </div>
          <ChevronIcon
            className="w-5 h-5 text-gray-400 transition-transform"
            direction={isExpanded ? "up" : "down"}
          />
        </div>
      </button>

      {/* Staff Table */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unit.staff.map((staff) => (
                <StaffRow
                  key={staff.id}
                  staff={staff}
                  onResendInvite={() => {
                    alert(`Invite resent to ${staff.name} (${staff.email})`);
                  }}
                  onEdit={() => {
                    alert(`Edit ${staff.name}\n\nRole: ${staff.role}\nEmail: ${staff.email}\nPhone: ${staff.phone}\nUnit: ${staff.unit}`);
                  }}
                  onDeactivate={() => {
                    if (confirm(`Are you sure you want to deactivate ${staff.name}?`)) {
                      alert(`${staff.name} has been deactivated.`);
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminStaffPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | StaffRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StaffStatus>("all");
  const [expandedUnits, setExpandedUnits] = useState<string[]>(mockUnits.map((u) => u.id));

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  // Filter staff
  const filteredUnits = mockUnits
    .map((unit) => ({
      ...unit,
      staff: unit.staff.filter((staff) => {
        const matchesSearch =
          staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          staff.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || staff.role === roleFilter;
        const matchesStatus = statusFilter === "all" || staff.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      }),
    }))
    .filter((unit) => unit.staff.length > 0);

  const totalStaff = mockUnits.reduce((acc, unit) => acc + unit.staff.length, 0);
  const activeStaff = mockUnits.reduce(
    (acc, unit) => acc + unit.staff.filter((s) => s.status === "active").length,
    0
  );
  const teacherCount = mockUnits.reduce(
    (acc, unit) => acc + unit.staff.filter((s) => s.role === "teacher").length,
    0
  );
  const pendingInvites = mockUnits.reduce(
    (acc, unit) => acc + unit.staff.filter((s) => s.status === "invited").length,
    0
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-1">
            Manage employees across all locations
          </p>
        </div>
        <button
          onClick={() => {
            alert("Add Staff Member form coming soon!\n\nYou'll be able to:\n• Add new employees\n• Assign roles (Admin, Teacher, Receptionist)\n• Select location\n• Send invite email");
          }}
          className="px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Staff Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Staff</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalStaff}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Active Staff</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeStaff}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Teachers</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{teacherCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Pending Invites</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-yellow-600">{pendingInvites}</p>
            {pendingInvites > 0 && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                Awaiting
              </span>
            )}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Locations</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockUnits.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-center gap-4 mb-6 bg-white rounded-xl px-4 py-3">
        {/* Search */}
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="receptionist">Receptionist</option>
        </select>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <FilterIcon className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Expand/Collapse All */}
        <button
          onClick={() =>
            setExpandedUnits(expandedUnits.length === mockUnits.length ? [] : mockUnits.map((u) => u.id))
          }
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          {expandedUnits.length === mockUnits.length ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* Units List */}
      <div className="space-y-4">
        {filteredUnits.length > 0 ? (
          filteredUnits.map((unit) => (
            <UnitSection
              key={unit.id}
              unit={unit}
              isExpanded={expandedUnits.includes(unit.id)}
              onToggle={() => toggleUnit(unit.id)}
            />
          ))
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No staff found</h3>
            <p className="text-gray-500">Try adjusting your search filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
