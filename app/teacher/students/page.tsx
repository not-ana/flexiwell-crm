"use client";

import { useState } from "react";
import { SearchIcon, FilterIcon, ChevronIcon } from "@/components/icons";

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  initials: string;
  avatar?: string;
  plan: string;
  classesRemaining: number;
  classesTotal: number;
  nextClass?: string;
  status: "active" | "paused" | "expired";
  joinedDate: string;
}

interface Unit {
  id: string;
  name: string;
  address: string;
  students: Student[];
}

// Mock data - students grouped by unit
const mockUnits: Unit[] = [
  {
    id: "1",
    name: "FlexiWell Centro",
    address: "Rua das Flores, 123 - Centro",
    students: [
      {
        id: "1",
        name: "Olivia Rhye",
        email: "olivia@email.com",
        phone: "(11) 99999-1234",
        initials: "OR",
        plan: "Mensal - 8 aulas",
        classesRemaining: 5,
        classesTotal: 8,
        nextClass: "Hoje, 14:00 - Pilates",
        status: "active",
        joinedDate: "Jan 2024",
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
        nextClass: "Amanhã, 10:00 - Yoga",
        status: "active",
        joinedDate: "Nov 2023",
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
        status: "expired",
        joinedDate: "Dez 2023",
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
        status: "paused",
        joinedDate: "Fev 2024",
      },
    ],
  },
  {
    id: "2",
    name: "FlexiWell Jardins",
    address: "Av. Paulista, 456 - Jardins",
    students: [
      {
        id: "5",
        name: "Candice Wu",
        email: "candice@email.com",
        phone: "(11) 99999-7890",
        initials: "CW",
        plan: "Semestral - 48 aulas",
        classesRemaining: 32,
        classesTotal: 48,
        nextClass: "Hoje, 16:00 - Funcional",
        status: "active",
        joinedDate: "Set 2023",
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
        nextClass: "Qui, 09:00 - Pilates",
        status: "active",
        joinedDate: "Jan 2024",
      },
    ],
  },
  {
    id: "3",
    name: "FlexiWell Moema",
    address: "Rua Normandia, 789 - Moema",
    students: [
      {
        id: "7",
        name: "Drew Cano",
        email: "drew@email.com",
        phone: "(11) 99999-6789",
        initials: "DC",
        plan: "Trimestral - 24 aulas",
        classesRemaining: 20,
        classesTotal: 24,
        nextClass: "Sex, 11:00 - Yoga",
        status: "active",
        joinedDate: "Dez 2023",
      },
    ],
  },
];

const statusStyles = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Ativo" },
  paused: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Pausado" },
  expired: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Expirado" },
};

function StatusBadge({ status }: { status: Student["status"] }) {
  const style = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function StudentCard({ student }: { student: Student }) {
  const progressPercent = (student.classesRemaining / student.classesTotal) * 100;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 flex items-center justify-center flex-shrink-0">
          {student.avatar ? (
            <img src={student.avatar} alt={student.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-primary-700">{student.initials}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
            <StatusBadge status={student.status} />
          </div>
          <p className="text-sm text-gray-500 truncate">{student.email}</p>
        </div>
      </div>

      {/* Plan & Classes */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{student.plan}</span>
          <span className="font-medium text-gray-900">
            {student.classesRemaining}/{student.classesTotal} aulas
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              progressPercent > 50 ? "bg-green-500" : progressPercent > 20 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Next class */}
        {student.nextClass && (
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-gray-600">Próxima aula:</span>
            <span className="font-medium text-primary-600">{student.nextClass}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
        <button className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          Ver perfil
        </button>
        <button className="flex-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
          Enviar mensagem
        </button>
      </div>
    </div>
  );
}

function UnitSection({ unit, isExpanded, onToggle }: { unit: Unit; isExpanded: boolean; onToggle: () => void }) {
  const activeCount = unit.students.filter((s) => s.status === "active").length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Unit Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <h2 className="font-semibold text-gray-900">{unit.name}</h2>
          <p className="text-sm text-gray-500">{unit.address}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{unit.students.length} alunos</p>
            <p className="text-xs text-gray-500">{activeCount} ativos</p>
          </div>
          <ChevronIcon
            className="w-5 h-5 text-gray-400 transition-transform"
            direction={isExpanded ? "up" : "down"}
          />
        </div>
      </button>

      {/* Students Grid */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unit.students.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherStudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Student["status"]>("all");
  const [expandedUnits, setExpandedUnits] = useState<string[]>(mockUnits.map((u) => u.id));

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  // Filter students
  const filteredUnits = mockUnits.map((unit) => ({
    ...unit,
    students: unit.students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
  })).filter((unit) => unit.students.length > 0);

  const totalStudents = mockUnits.reduce((acc, unit) => acc + unit.students.length, 0);
  const activeStudents = mockUnits.reduce(
    (acc, unit) => acc + unit.students.filter((s) => s.status === "active").length,
    0
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meus Alunos</h1>
        <p className="text-gray-600 mt-1">
          Gerencie seus alunos em todas as unidades que você atende
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total de Alunos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalStudents}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Alunos Ativos</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeStudents}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Unidades</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockUnits.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Aulas Hoje</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">4</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 bg-white rounded-xl px-4 py-3">
        {/* Search */}
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar aluno por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
          />
        </div>

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
          </select>
        </div>

        {/* Expand/Collapse All */}
        <button
          onClick={() =>
            setExpandedUnits(expandedUnits.length === mockUnits.length ? [] : mockUnits.map((u) => u.id))
          }
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum aluno encontrado</h3>
            <p className="text-gray-500">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}
