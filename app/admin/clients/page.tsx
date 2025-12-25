"use client";

import { useState } from "react";
import { SearchIcon, FilterIcon, ChevronIcon } from "@/components/icons";

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
    name: "FlexiWell Centro",
    address: "Rua das Flores, 123 - Centro",
    totalRevenue: 15800,
    clients: [
      {
        id: "1",
        name: "Olivia Rhye",
        email: "olivia@email.com",
        phone: "(11) 99999-1234",
        initials: "OR",
        plan: "Mensal - 8 aulas",
        classesRemaining: 5,
        classesTotal: 8,
        instructor: "Maria Santos",
        status: "active",
        joinedDate: "Jan 2024",
        lastActivity: "Hoje",
        revenue: 299,
      },
      {
        id: "2",
        name: "Phoenix Baker",
        email: "phoenix@email.com",
        phone: "(11) 99999-5678",
        initials: "PB",
        plan: "Trimestral - 24 aulas",
        classesRemaining: 18,
        classesTotal: 24,
        instructor: "Maria Santos",
        status: "active",
        joinedDate: "Nov 2023",
        lastActivity: "Ontem",
        revenue: 799,
      },
      {
        id: "3",
        name: "Lana Steiner",
        email: "lana@email.com",
        phone: "(11) 99999-9012",
        initials: "LS",
        plan: "Mensal - 8 aulas",
        classesRemaining: 0,
        classesTotal: 8,
        instructor: "João Silva",
        status: "expired",
        joinedDate: "Dez 2023",
        lastActivity: "15 dias atrás",
        revenue: 299,
      },
      {
        id: "4",
        name: "Demi Wilkinson",
        email: "demi@email.com",
        phone: "(11) 99999-3456",
        initials: "DW",
        plan: "Mensal - 12 aulas",
        classesRemaining: 12,
        classesTotal: 12,
        instructor: "Maria Santos",
        status: "paused",
        joinedDate: "Fev 2024",
        lastActivity: "7 dias atrás",
        revenue: 399,
      },
      {
        id: "10",
        name: "Ana Costa",
        email: "ana.costa@email.com",
        phone: "(11) 99999-8888",
        initials: "AC",
        plan: "Aguardando aprovação",
        classesRemaining: 0,
        classesTotal: 0,
        instructor: "-",
        status: "pending",
        joinedDate: "Hoje",
        lastActivity: "Hoje",
        revenue: 0,
      },
    ],
  },
  {
    id: "2",
    name: "FlexiWell Jardins",
    address: "Av. Paulista, 456 - Jardins",
    totalRevenue: 23500,
    clients: [
      {
        id: "5",
        name: "Candice Wu",
        email: "candice@email.com",
        phone: "(11) 99999-7890",
        initials: "CW",
        plan: "Semestral - 48 aulas",
        classesRemaining: 32,
        classesTotal: 48,
        instructor: "Carlos Mendes",
        status: "active",
        joinedDate: "Set 2023",
        lastActivity: "Hoje",
        revenue: 1499,
      },
      {
        id: "6",
        name: "Natali Craig",
        email: "natali@email.com",
        phone: "(11) 99999-2345",
        initials: "NC",
        plan: "Mensal - 8 aulas",
        classesRemaining: 3,
        classesTotal: 8,
        instructor: "Carlos Mendes",
        status: "active",
        joinedDate: "Jan 2024",
        lastActivity: "2 dias atrás",
        revenue: 299,
      },
      {
        id: "7",
        name: "Orlando Diggs",
        email: "orlando@email.com",
        phone: "(11) 99999-4321",
        initials: "OD",
        plan: "Anual - 96 aulas",
        classesRemaining: 80,
        classesTotal: 96,
        instructor: "Ana Paula",
        status: "active",
        joinedDate: "Out 2023",
        lastActivity: "Ontem",
        revenue: 2499,
      },
    ],
  },
  {
    id: "3",
    name: "FlexiWell Moema",
    address: "Rua Normandia, 789 - Moema",
    totalRevenue: 18200,
    clients: [
      {
        id: "8",
        name: "Drew Cano",
        email: "drew@email.com",
        phone: "(11) 99999-6789",
        initials: "DC",
        plan: "Trimestral - 24 aulas",
        classesRemaining: 20,
        classesTotal: 24,
        instructor: "Fernanda Lima",
        status: "active",
        joinedDate: "Dez 2023",
        lastActivity: "Hoje",
        revenue: 799,
      },
      {
        id: "9",
        name: "Kate Morrison",
        email: "kate@email.com",
        phone: "(11) 99999-1111",
        initials: "KM",
        plan: "Mensal - 12 aulas",
        classesRemaining: 8,
        classesTotal: 12,
        instructor: "Fernanda Lima",
        status: "active",
        joinedDate: "Jan 2024",
        lastActivity: "3 dias atrás",
        revenue: 399,
      },
    ],
  },
];

const statusStyles = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Ativo" },
  paused: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Pausado" },
  expired: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Expirado" },
  pending: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Pendente" },
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
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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
              Aprovar
            </button>
            <button
              onClick={onReject}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Rejeitar
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

function UnitSection({ unit, isExpanded, onToggle }: { unit: Unit; isExpanded: boolean; onToggle: () => void }) {
  const activeCount = unit.clients.filter((c) => c.status === "active").length;
  const pendingCount = unit.clients.filter((c) => c.status === "pending").length;

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
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">{unit.name}</h2>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{unit.address}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{unit.clients.length} clientes</p>
            <p className="text-xs text-gray-500">{activeCount} ativos</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-green-600">{formatCurrency(unit.totalRevenue)}</p>
            <p className="text-xs text-gray-500">receita total</p>
          </div>
          <ChevronIcon
            className="w-5 h-5 text-gray-400 transition-transform"
            direction={isExpanded ? "up" : "down"}
          />
        </div>
      </button>

      {/* Clients Table */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instrutor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Atividade
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receita
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
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

export default function AdminClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Client["status"]>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [expandedUnits, setExpandedUnits] = useState<string[]>(mockUnits.map((u) => u.id));

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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os clientes de todas as unidades
          </p>
        </div>
        <button className="px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Adicionar Cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total de Clientes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalClients}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Clientes Ativos</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeClients}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Pendentes</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-blue-600">{pendingClients}</p>
            {pendingClients > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full animate-pulse">
                Ação necessária
              </span>
            )}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Unidades</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockUnits.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Receita Total</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-center gap-4 mb-6 bg-white rounded-xl px-4 py-3">
        {/* Search */}
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente por nome, email ou instrutor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Unit Filter */}
        <select
          value={unitFilter}
          onChange={(e) => setUnitFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">Todas as unidades</option>
          {mockUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <FilterIcon className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="paused">Pausados</option>
            <option value="expired">Expirados</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>

        {/* Expand/Collapse All */}
        <button
          onClick={() =>
            setExpandedUnits(expandedUnits.length === mockUnits.length ? [] : mockUnits.map((u) => u.id))
          }
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          {expandedUnits.length === mockUnits.length ? "Recolher tudo" : "Expandir tudo"}
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
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum cliente encontrado</h3>
            <p className="text-gray-500">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}
