"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
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

const clientStatusStyles: Record<Client["status"], { bg: string; text: string; dot: string; label: string }> = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Active" },
  inactive: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400", label: "Inactive" },
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Pending" },
};

function StatusBadge({ status }: { status: Client["status"] }) {
  const style = clientStatusStyles[status];
  return <Badge style={style} />;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Client["status"]>("all");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Fetch clients from API
  const fetchClients = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/clients?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // Format clients for display
        const formattedClients: Client[] = data.clients.map((c: {
          _id?: { toString(): string };
          name: string;
          email: string;
          phone?: string;
          status: "active" | "inactive" | "pending";
          avatar?: string;
          plan?: { usedClasses?: number };
          createdAt?: string | Date;
          updatedAt?: string | Date;
        }) => ({
          id: c._id?.toString() || "",
          name: c.name,
          email: c.email,
          phone: c.phone || "",
          status: c.status,
          avatar: c.avatar,
          initials: c.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
          classes: c.plan?.usedClasses || 0,
          joinDate: c.createdAt
            ? new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "N/A",
          lastActivity: c.updatedAt
            ? formatLastActivity(new Date(c.updatedAt))
            : "N/A",
        }));
        setClients(formattedClients);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Helper to format last activity
  function formatLastActivity(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  }

  const filteredClients = clients;

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

  // Show loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
