"use client";

import { useState, useRef } from "react";
import { SearchIcon, FilterIcon, ChevronIcon, UploadIcon } from "@/components/icons";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  initials: string;
  avatar?: string;
  plan: string;
  classesRemaining: number;
  classesTotal: number;
  instructor: string;
  status: "active" | "paused" | "expired" | "pending";
  joinedDate: string;
  lastActivity: string;
  revenue: number;
}

interface Unit {
  id: string;
  name: string;
  address: string;
  clients: Client[];
  totalRevenue: number;
}

// Mock data - clients grouped by unit for multi-unit management
const mockUnits: Unit[] = [
  {
    id: "1",
    name: "FlexiWell Downtown",
    address: "123 Main Street - Downtown",
    totalRevenue: 15800,
    clients: [
      {
        id: "1",
        name: "Olivia Rhye",
        email: "olivia@email.com",
        phone: "(555) 123-4567",
        initials: "OR",
        plan: "Monthly - 8 classes",
        classesRemaining: 5,
        classesTotal: 8,
        instructor: "Sarah Johnson",
        status: "active",
        joinedDate: "Jan 2024",
        lastActivity: "Today",
        revenue: 299,
      },
      {
        id: "2",
        name: "Phoenix Baker",
        email: "phoenix@email.com",
        phone: "(555) 234-5678",
        initials: "PB",
        plan: "Quarterly - 24 classes",
        classesRemaining: 18,
        classesTotal: 24,
        instructor: "Sarah Johnson",
        status: "active",
        joinedDate: "Nov 2023",
        lastActivity: "Yesterday",
        revenue: 799,
      },
      {
        id: "3",
        name: "Lana Steiner",
        email: "lana@email.com",
        phone: "(555) 345-6789",
        initials: "LS",
        plan: "Monthly - 8 classes",
        classesRemaining: 0,
        classesTotal: 8,
        instructor: "John Smith",
        status: "expired",
        joinedDate: "Dec 2023",
        lastActivity: "15 days ago",
        revenue: 299,
      },
      {
        id: "4",
        name: "Demi Wilkinson",
        email: "demi@email.com",
        phone: "(555) 456-7890",
        initials: "DW",
        plan: "Monthly - 12 classes",
        classesRemaining: 12,
        classesTotal: 12,
        instructor: "Sarah Johnson",
        status: "paused",
        joinedDate: "Feb 2024",
        lastActivity: "7 days ago",
        revenue: 399,
      },
      {
        id: "10",
        name: "Emma Wilson",
        email: "emma.wilson@email.com",
        phone: "(555) 567-8901",
        initials: "EW",
        plan: "Awaiting approval",
        classesRemaining: 0,
        classesTotal: 0,
        instructor: "-",
        status: "pending",
        joinedDate: "Today",
        lastActivity: "Today",
        revenue: 0,
      },
    ],
  },
  {
    id: "2",
    name: "FlexiWell Midtown",
    address: "456 Park Avenue - Midtown",
    totalRevenue: 23500,
    clients: [
      {
        id: "5",
        name: "Candice Wu",
        email: "candice@email.com",
        phone: "(555) 678-9012",
        initials: "CW",
        plan: "Semi-annual - 48 classes",
        classesRemaining: 32,
        classesTotal: 48,
        instructor: "Michael Chen",
        status: "active",
        joinedDate: "Sep 2023",
        lastActivity: "Today",
        revenue: 1499,
      },
      {
        id: "6",
        name: "Natali Craig",
        email: "natali@email.com",
        phone: "(555) 789-0123",
        initials: "NC",
        plan: "Monthly - 8 classes",
        classesRemaining: 3,
        classesTotal: 8,
        instructor: "Michael Chen",
        status: "active",
        joinedDate: "Jan 2024",
        lastActivity: "2 days ago",
        revenue: 299,
      },
      {
        id: "7",
        name: "Orlando Diggs",
        email: "orlando@email.com",
        phone: "(555) 890-1234",
        initials: "OD",
        plan: "Annual - 96 classes",
        classesRemaining: 80,
        classesTotal: 96,
        instructor: "Emily Davis",
        status: "active",
        joinedDate: "Oct 2023",
        lastActivity: "Yesterday",
        revenue: 2499,
      },
    ],
  },
  {
    id: "3",
    name: "FlexiWell Uptown",
    address: "789 Broadway - Uptown",
    totalRevenue: 18200,
    clients: [
      {
        id: "8",
        name: "Drew Cano",
        email: "drew@email.com",
        phone: "(555) 901-2345",
        initials: "DC",
        plan: "Quarterly - 24 classes",
        classesRemaining: 20,
        classesTotal: 24,
        instructor: "Rachel Green",
        status: "active",
        joinedDate: "Dec 2023",
        lastActivity: "Today",
        revenue: 799,
      },
      {
        id: "9",
        name: "Kate Morrison",
        email: "kate@email.com",
        phone: "(555) 012-3456",
        initials: "KM",
        plan: "Monthly - 12 classes",
        classesRemaining: 8,
        classesTotal: 12,
        instructor: "Rachel Green",
        status: "active",
        joinedDate: "Jan 2024",
        lastActivity: "3 days ago",
        revenue: 399,
      },
    ],
  },
];

const statusStyles = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Active" },
  paused: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Paused" },
  expired: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Expired" },
  pending: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Pending" },
};

function StatusBadge({ status }: { status: Client["status"] }) {
  const style = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function ClientRow({ client, onApprove, onReject }: { client: Client; onApprove?: () => void; onReject?: () => void }) {
  const progressPercent = client.classesTotal > 0 ? (client.classesRemaining / client.classesTotal) * 100 : 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
            {client.avatar ? (
              <img src={client.avatar} alt={client.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-primary-700">{client.initials}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{client.name}</p>
            <p className="text-sm text-gray-500">{client.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={client.status} />
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-900">{client.plan}</p>
        {client.classesTotal > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  progressPercent > 50 ? "bg-green-500" : progressPercent > 20 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{client.classesRemaining}/{client.classesTotal}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-900">{client.instructor}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-500">{client.lastActivity}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-900">{formatCurrency(client.revenue)}</p>
      </td>
      <td className="px-4 py-3">
        {client.status === "pending" ? (
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
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
}

function ClientCard({ client, onApprove, onReject }: { client: Client; onApprove?: () => void; onReject?: () => void }) {
  const progressPercent = client.classesTotal > 0 ? (client.classesRemaining / client.classesTotal) * 100 : 0;

  return (
    <div className="p-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
            {client.avatar ? (
              <img src={client.avatar} alt={client.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-primary-700">{client.initials}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{client.name}</p>
            <p className="text-xs text-gray-500">{client.email}</p>
          </div>
        </div>
        <StatusBadge status={client.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <p className="text-gray-500 text-xs">Plan</p>
          <p className="font-medium text-gray-900 truncate">{client.plan}</p>
          {client.classesTotal > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    progressPercent > 50 ? "bg-green-500" : progressPercent > 20 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{client.classesRemaining}/{client.classesTotal}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-gray-500 text-xs">Instructor</p>
          <p className="font-medium text-gray-900">{client.instructor}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Last Activity</p>
          <p className="font-medium text-gray-900">{client.lastActivity}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Revenue</p>
          <p className="font-medium text-green-600">{formatCurrency(client.revenue)}</p>
        </div>
      </div>

      {client.status === "pending" ? (
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
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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

function UnitSection({ unit, isExpanded, onToggle }: { unit: Unit; isExpanded: boolean; onToggle: () => void }) {
  const activeCount = unit.clients.filter((c) => c.status === "active").length;
  const pendingCount = unit.clients.filter((c) => c.status === "pending").length;

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
              key={client.id}
              client={client}
              onApprove={() => console.log("Approve", client.id)}
              onReject={() => console.log("Reject", client.id)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unit.clients.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onApprove={() => console.log("Approve", client.id)}
                  onReject={() => console.log("Reject", client.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Plan options for clients
const planOptions = [
  { id: "monthly-8", name: "Monthly - 8 classes", price: 299 },
  { id: "monthly-12", name: "Monthly - 12 classes", price: 399 },
  { id: "quarterly-24", name: "Quarterly - 24 classes", price: 799 },
  { id: "semiannual-48", name: "Semi-annual - 48 classes", price: 1499 },
  { id: "annual-96", name: "Annual - 96 classes", price: 2499 },
];

// Add Client Modal Component (Single Entry Only - Import button handles bulk)
function AddClientModal({
  isOpen,
  onClose,
  units,
}: {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    plan: planOptions[0].id,
    unit: units[0]?.id || "",
    notes: "",
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      alert("Please fill in name and email");
      return;
    }
    const selectedPlan = planOptions.find((p) => p.id === formData.plan);
    const selectedUnit = units.find((u) => u.id === formData.unit);
    alert(
      `Client added successfully!\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nPlan: ${selectedPlan?.name}\nLocation: ${selectedUnit?.name}\n\nA welcome email will be sent to the client.`
    );
    setFormData({
      name: "",
      email: "",
      phone: "",
      plan: planOptions[0].id,
      unit: units[0]?.id || "",
      notes: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
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

        {/* Content */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Any notes about this client..."
            />
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
                  A welcome email will be sent to the client with instructions to set up their account
                  and view their class schedule.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="w-full sm:w-auto px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
}

// Import Modal Component
function ImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
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

  const handleImport = () => {
    if (!file) return;
    setImporting(true);
    // Simulate import process
    setTimeout(() => {
      setImporting(false);
      setImportResult({ success: 45, failed: 2 });
    }, 2000);
  };

  const resetModal = () => {
    setFile(null);
    setImportResult(null);
    onClose();
  };

  const downloadTemplate = () => {
    // CSV template content with headers and sample data
    const csvContent = `Name,Email,Phone,Plan,Location,Instructor
John Smith,john.smith@email.com,(555) 123-4567,Monthly - 8 classes,FlexiWell Downtown,Sarah Johnson
Jane Doe,jane.doe@email.com,(555) 234-5678,Quarterly - 24 classes,FlexiWell Midtown,Michael Chen
Michael Johnson,michael.j@email.com,(555) 345-6789,Monthly - 12 classes,FlexiWell Uptown,Rachel Green
Sarah Williams,sarah.w@email.com,(555) 456-7890,Semi-annual - 48 classes,FlexiWell Downtown,Sarah Johnson
Robert Brown,robert.b@email.com,(555) 567-8901,Annual - 96 classes,FlexiWell Midtown,Michael Chen`;

    // Create blob and download
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
              {/* File Upload Area */}
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
                    <button
                      onClick={() => setFile(null)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
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

              {/* Template Download */}
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
                  <button
                    onClick={downloadTemplate}
                    className="text-sm text-primary-600 font-medium hover:text-primary-700"
                  >
                    Download
                  </button>
                </div>
              </div>

              {/* Expected Columns Info */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Expected columns:</p>
                <div className="flex flex-wrap gap-2">
                  {["Name", "Email", "Phone", "Plan", "Location", "Instructor"].map((col) => (
                    <span key={col} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Import Results */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Complete!</h3>
              <div className="flex items-center justify-center gap-6 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                  <p className="text-sm text-gray-500">Imported</p>
                </div>
                {importResult.failed > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                    <p className="text-sm text-gray-500">Failed</p>
                  </div>
                )}
              </div>
              {importResult.failed > 0 && (
                <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
                  Download error report
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white">
          <button
            onClick={resetModal}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {importResult ? "Close" : "Cancel"}
          </button>
          {!importResult && (
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                  </svg>
                  Importing...
                </>
              ) : (
                "Import Clients"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Client["status"]>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [expandedUnits, setExpandedUnits] = useState<string[]>(mockUnits.map((u) => u.id));
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  // Filter clients
  const filteredUnits = mockUnits
    .filter((unit) => unitFilter === "all" || unit.id === unitFilter)
    .map((unit) => ({
      ...unit,
      clients: unit.clients.filter((client) => {
        const matchesSearch =
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.instructor.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || client.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    }))
    .filter((unit) => unit.clients.length > 0);

  const totalClients = mockUnits.reduce((acc, unit) => acc + unit.clients.length, 0);
  const activeClients = mockUnits.reduce(
    (acc, unit) => acc + unit.clients.filter((c) => c.status === "active").length,
    0
  );
  const pendingClients = mockUnits.reduce(
    (acc, unit) => acc + unit.clients.filter((c) => c.status === "pending").length,
    0
  );
  const totalRevenue = mockUnits.reduce((acc, unit) => acc + unit.totalRevenue, 0);

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
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{totalClients}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Active Clients</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{activeClients}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Pending</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg sm:text-2xl font-bold text-blue-600">{pendingClients}</p>
            {pendingClients > 0 && (
              <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full animate-pulse">
                Action
              </span>
            )}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600">Locations</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{mockUnits.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 col-span-2 sm:col-span-1">
          <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6 bg-white rounded-xl p-3 sm:p-4">
        {/* Search */}
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

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Unit Filter */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="flex-1 sm:flex-none min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All locations</option>
            {mockUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
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

          {/* Expand/Collapse All */}
          <button
            onClick={() =>
              setExpandedUnits(expandedUnits.length === mockUnits.length ? [] : mockUnits.map((u) => u.id))
            }
            className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <span className="hidden lg:inline">{expandedUnits.length === mockUnits.length ? "Collapse all" : "Expand all"}</span>
            <span className="lg:hidden">{expandedUnits.length === mockUnits.length ? "Collapse" : "Expand"}</span>
          </button>
        </div>
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
            <h3 className="text-lg font-medium text-gray-900 mb-1">No clients found</h3>
            <p className="text-gray-500">Try adjusting your search filters</p>
          </div>
        )}
      </div>

      {/* Import Modal */}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        units={mockUnits}
      />
    </div>
  );
}
