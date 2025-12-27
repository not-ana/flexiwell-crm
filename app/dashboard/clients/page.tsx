"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import {
  PlusIcon,
  SearchIcon,
  FilterIcon,
  MailIcon,
  PhoneIcon,
} from "@/components/icons";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "pending";
  joinDate: string;
  lastActivity: string;
  avatar?: string;
  initials: string;
  classes: number;
}

// Mock data
const mockClients: Client[] = [
  {
    id: "1",
    name: "Olivia Rhye",
    email: "olivia@email.com",
    phone: "+1 (555) 123-4567",
    status: "active",
    joinDate: "Jan 4, 2025",
    lastActivity: "2 hours ago",
    initials: "OR",
    classes: 12,
  },
  {
    id: "2",
    name: "Phoenix Baker",
    email: "phoenix@email.com",
    phone: "+1 (555) 234-5678",
    status: "active",
    joinDate: "Jan 2, 2025",
    lastActivity: "1 day ago",
    initials: "PB",
    classes: 8,
  },
  {
    id: "3",
    name: "Lana Steiner",
    email: "lana@email.com",
    phone: "+1 (555) 345-6789",
    status: "pending",
    joinDate: "Jan 6, 2025",
    lastActivity: "3 days ago",
    initials: "LS",
    classes: 0,
  },
  {
    id: "4",
    name: "Demi Wilkinson",
    email: "demi@email.com",
    phone: "+1 (555) 456-7890",
    status: "active",
    joinDate: "Dec 28, 2024",
    lastActivity: "5 hours ago",
    initials: "DW",
    classes: 15,
  },
  {
    id: "5",
    name: "Candice Wu",
    email: "candice@email.com",
    phone: "+1 (555) 567-8901",
    status: "inactive",
    joinDate: "Dec 15, 2024",
    lastActivity: "2 weeks ago",
    initials: "CW",
    classes: 3,
  },
  {
    id: "6",
    name: "Natali Craig",
    email: "natali@email.com",
    phone: "+1 (555) 678-9012",
    status: "active",
    joinDate: "Jan 8, 2025",
    lastActivity: "Just now",
    initials: "NC",
    classes: 6,
  },
  {
    id: "7",
    name: "Drew Cano",
    email: "drew@email.com",
    phone: "+1 (555) 789-0123",
    status: "active",
    joinDate: "Jan 1, 2025",
    lastActivity: "4 hours ago",
    initials: "DC",
    classes: 10,
  },
  {
    id: "8",
    name: "Orlando Diggs",
    email: "orlando@email.com",
    phone: "+1 (555) 890-1234",
    status: "pending",
    joinDate: "Jan 10, 2025",
    lastActivity: "1 hour ago",
    initials: "OD",
    classes: 0,
  },
];

function Avatar({ name, initials, avatar }: { name: string; initials: string; avatar?: string }) {
  const colors = ["bg-primary-500", "bg-pink-500", "bg-blue-500", "bg-green-500", "bg-orange-500"];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return avatar ? (
    <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
  ) : (
    <div className={`w-10 h-10 ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-medium text-sm`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: Client["status"] }) {
  const styles = {
    active: "bg-green-50 text-green-700 border-green-200",
    inactive: "bg-gray-50 text-gray-600 border-gray-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };

  const labels = {
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients] = useState<Client[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Client["status"]>("all");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedClients(newSelected);
  };

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    inactive: clients.filter((c) => c.status === "inactive").length,
    pending: clients.filter((c) => c.status === "pending").length,
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-1">
              Manage your client base and track their activity.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/clients/import">
              <Button variant="secondary">Import clients</Button>
            </Link>
            <Link href="/dashboard/clients/add">
              <Button leftIcon={<PlusIcon className="w-4 h-4" />}>Add client</Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Total clients</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">{stats.active}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-semibold text-gray-600 mt-1">{stats.inactive}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-semibold text-yellow-600 mt-1">{stats.pending}</p>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white border border-gray-200 rounded-xl">
          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex gap-1">
              {(["all", "active", "inactive", "pending"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    statusFilter === status
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {status === "all" ? "All clients" : status.charAt(0).toUpperCase() + status.slice(1)}
                  {status === "all" && ` (${stats.total})`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                  showFilters ? "text-primary-700 border-primary-300 bg-primary-50" : "text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <FilterIcon className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedClients.has(client.id)}
                        onChange={() => toggleSelect(client.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={client.name} initials={client.initials} avatar={client.avatar} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client.name}</p>
                          <p className="text-xs text-gray-500">Joined {client.joinDate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={client.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MailIcon className="w-3.5 h-3.5" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <PhoneIcon className="w-3.5 h-3.5" />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {client.classes} classes
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {client.lastActivity}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredClients.length}</span> of{" "}
              <span className="font-medium">{clients.length}</span> clients
            </p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
