"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalTitle } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { useLocale } from "@/hooks/useLocale";
import { RoomsSettings } from "./RoomsSettings";

// ============================================================================
// Types
// ============================================================================

interface Teacher {
  id: string;
  name: string;
  email: string;
  initials: string;
}

interface Establishment {
  id: string;
  name: string;
  location: string;
  assignedTeachers: string[];
}

interface NewEstablishment {
  name: string;
  location: string;
}

// ============================================================================
// Constants
// ============================================================================

const INITIAL_ESTABLISHMENTS: Establishment[] = [
  { id: "1", name: "FlexiWell Downtown", location: "Downtown, New York", assignedTeachers: ["1", "2"] },
  { id: "2", name: "FlexiWell Midtown", location: "Midtown, New York", assignedTeachers: ["1", "3"] },
  { id: "3", name: "FlexiWell Uptown", location: "Uptown, New York", assignedTeachers: ["2"] },
];

const ALL_TEACHERS: Teacher[] = [
  { id: "1", name: "Sarah Johnson", email: "sarah@flexiwell.com", initials: "SJ" },
  { id: "2", name: "Michael Chen", email: "michael@flexiwell.com", initials: "MC" },
  { id: "3", name: "Emily Davis", email: "emily@flexiwell.com", initials: "ED" },
  { id: "4", name: "James Wilson", email: "james@flexiwell.com", initials: "JW" },
];

const EMPTY_ESTABLISHMENT: NewEstablishment = { name: "", location: "" };

// ============================================================================
// Translations
// ============================================================================

const TRANSLATIONS = {
  title: { "pt-BR": "Estabelecimentos", "en-US": "Establishments" },
  description: {
    "pt-BR": "Gerencie suas localizações e atribua professores a cada estabelecimento.",
    "en-US": "Manage your locations and assign teachers to each establishment.",
  },
  addEstablishment: { "pt-BR": "Adicionar Estabelecimento", "en-US": "Add Establishment" },
  manageTeachers: { "pt-BR": "Gerenciar Professores", "en-US": "Manage Teachers" },
  done: { "pt-BR": "Concluído", "en-US": "Done" },
  teachers: { "pt-BR": "Professores:", "en-US": "Teachers:" },
  noTeachersAssigned: { "pt-BR": "Nenhum professor atribuído", "en-US": "No teachers assigned" },
  selectTeachers: { "pt-BR": "Selecione professores para este estabelecimento:", "en-US": "Select teachers for this establishment:" },
  name: { "pt-BR": "Nome", "en-US": "Name" },
  location: { "pt-BR": "Localização", "en-US": "Location" },
  namePlaceholder: { "pt-BR": "ex: FlexiWell Centro", "en-US": "e.g., FlexiWell Downtown" },
  locationPlaceholder: { "pt-BR": "ex: Centro, São Paulo", "en-US": "e.g., Downtown, New York" },
  cancel: { "pt-BR": "Cancelar", "en-US": "Cancel" },
} as const;

type TranslationKey = keyof typeof TRANSLATIONS;

// ============================================================================
// Hook: useEstablishmentTranslations
// ============================================================================

function useEstablishmentTranslations() {
  const { isBrazil } = useLocale();
  const lang = isBrazil ? "pt-BR" : "en-US";

  const t = (key: TranslationKey): string => {
    const translation = TRANSLATIONS[key];
    if (typeof translation === "object" && lang in translation) {
      return translation[lang as keyof typeof translation];
    }
    return key;
  };

  return { t, isBrazil };
}

// ============================================================================
// Icons
// ============================================================================

const CheckIcon = () => (
  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

// ============================================================================
// Sub-components
// ============================================================================

interface TeacherAvatarProps {
  teacher: Teacher;
  size?: "sm" | "md";
}

function TeacherAvatar({ teacher, size = "sm" }: TeacherAvatarProps) {
  const sizeClasses = size === "sm" ? "w-7 h-7 text-xs" : "w-10 h-10 text-sm";
  return (
    <div
      className={`${sizeClasses} rounded-full bg-green-100 border-2 border-white flex items-center justify-center`}
      title={teacher.name}
    >
      <span className="font-medium text-green-700">{teacher.initials}</span>
    </div>
  );
}

interface TeacherPreviewProps {
  teacherIds: string[];
  allTeachers: Teacher[];
  t: (key: TranslationKey) => string;
}

function TeacherPreview({ teacherIds, allTeachers, t }: TeacherPreviewProps) {
  const getTeacherById = (id: string) => allTeachers.find((teacher) => teacher.id === id);

  if (teacherIds.length === 0) {
    return <span className="text-xs text-gray-400 italic">{t("noTeachersAssigned")}</span>;
  }

  return (
    <div className="flex -space-x-2">
      {teacherIds.slice(0, 4).map((teacherId) => {
        const teacher = getTeacherById(teacherId);
        if (!teacher) return null;
        return <TeacherAvatar key={teacherId} teacher={teacher} />;
      })}
      {teacherIds.length > 4 && (
        <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600">+{teacherIds.length - 4}</span>
        </div>
      )}
    </div>
  );
}

interface TeacherSelectorProps {
  teacher: Teacher;
  isAssigned: boolean;
  onToggle: () => void;
}

function TeacherSelector({ teacher, isAssigned, onToggle }: TeacherSelectorProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
        isAssigned ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isAssigned ? "bg-green-100" : "bg-gray-100"
        }`}
      >
        <span className={`text-sm font-medium ${isAssigned ? "text-green-700" : "text-gray-600"}`}>
          {teacher.initials}
        </span>
      </div>
      <div className="flex-1 text-left">
        <p className={`text-sm font-medium ${isAssigned ? "text-green-700" : "text-gray-900"}`}>
          {teacher.name}
        </p>
        <p className="text-xs text-gray-500">{teacher.email}</p>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          isAssigned ? "border-green-500 bg-green-500" : "border-gray-300"
        }`}
      >
        {isAssigned && <CheckIcon />}
      </div>
    </button>
  );
}

interface TeacherAssignmentPanelProps {
  establishment: Establishment;
  allTeachers: Teacher[];
  onToggleTeacher: (teacherId: string) => void;
  t: (key: TranslationKey) => string;
}

function TeacherAssignmentPanel({
  establishment,
  allTeachers,
  onToggleTeacher,
  t,
}: TeacherAssignmentPanelProps) {
  return (
    <div className="p-6 bg-gray-50">
      <p className="text-sm font-medium text-gray-700 mb-3">{t("selectTeachers")}</p>
      <div className="grid grid-cols-2 gap-3">
        {allTeachers.map((teacher) => (
          <TeacherSelector
            key={teacher.id}
            teacher={teacher}
            isAssigned={establishment.assignedTeachers.includes(teacher.id)}
            onToggle={() => onToggleTeacher(teacher.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface EstablishmentCardProps {
  establishment: Establishment;
  isEditing: boolean;
  allTeachers: Teacher[];
  onToggleEdit: () => void;
  onToggleTeacher: (teacherId: string) => void;
  t: (key: TranslationKey) => string;
}

function EstablishmentCard({
  establishment,
  isEditing,
  allTeachers,
  onToggleEdit,
  onToggleTeacher,
  t,
}: EstablishmentCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{establishment.name}</h3>
            <p className="text-sm text-gray-500">{establishment.location}</p>
          </div>
          <button
            onClick={onToggleEdit}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {isEditing ? t("done") : t("manageTeachers")}
          </button>
        </div>

        {/* Teachers Preview */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">{t("teachers")}</span>
          <TeacherPreview
            teacherIds={establishment.assignedTeachers}
            allTeachers={allTeachers}
            t={t}
          />
        </div>
      </div>

      {/* Teacher Assignment Panel */}
      {isEditing && (
        <TeacherAssignmentPanel
          establishment={establishment}
          allTeachers={allTeachers}
          onToggleTeacher={onToggleTeacher}
          t={t}
        />
      )}
    </div>
  );
}

interface AddEstablishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (establishment: NewEstablishment) => void;
  t: (key: TranslationKey) => string;
}

function AddEstablishmentModal({ isOpen, onClose, onAdd, t }: AddEstablishmentModalProps) {
  const [form, setForm] = useState<NewEstablishment>(EMPTY_ESTABLISHMENT);

  const handleSubmit = () => {
    if (!form.name || !form.location) return;
    onAdd(form);
    setForm(EMPTY_ESTABLISHMENT);
    onClose();
  };

  const handleClose = () => {
    setForm(EMPTY_ESTABLISHMENT);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <ModalHeader onClose={handleClose}>
        <ModalTitle>{t("addEstablishment")}</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-4">
        <FormField
          label={t("name")}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t("namePlaceholder")}
          required
        />
        <FormField
          label={t("location")}
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder={t("locationPlaceholder")}
          required
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} className="flex-1">
          {t("cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!form.name || !form.location}
          className="flex-1"
        >
          {t("addEstablishment")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EstablishmentsSettings() {
  const [establishments, setEstablishments] = useState<Establishment[]>(INITIAL_ESTABLISHMENTS);
  const [editingEstablishment, setEditingEstablishment] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { t } = useEstablishmentTranslations();

  const toggleTeacherAssignment = (establishmentId: string, teacherId: string) => {
    setEstablishments((prev) =>
      prev.map((est) => {
        if (est.id !== establishmentId) return est;
        const isAssigned = est.assignedTeachers.includes(teacherId);
        return {
          ...est,
          assignedTeachers: isAssigned
            ? est.assignedTeachers.filter((id) => id !== teacherId)
            : [...est.assignedTeachers, teacherId],
        };
      })
    );
  };

  const handleAddEstablishment = (newEst: NewEstablishment) => {
    const newId = String(establishments.length + 1);
    setEstablishments([...establishments, { id: newId, ...newEst, assignedTeachers: [] }]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-600 mt-1">{t("description")}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>{t("addEstablishment")}</Button>
      </div>

      {/* Establishments List */}
      <div className="space-y-4">
        {establishments.map((establishment) => (
          <EstablishmentCard
            key={establishment.id}
            establishment={establishment}
            isEditing={editingEstablishment === establishment.id}
            allTeachers={ALL_TEACHERS}
            onToggleEdit={() =>
              setEditingEstablishment(
                editingEstablishment === establishment.id ? null : establishment.id
              )
            }
            onToggleTeacher={(teacherId) => toggleTeacherAssignment(establishment.id, teacherId)}
            t={t}
          />
        ))}
      </div>

      {/* Add Establishment Modal */}
      <AddEstablishmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddEstablishment}
        t={t}
      />

      {/* Rooms Section */}
      <div className="pt-6 border-t border-gray-200">
        <RoomsSettings />
      </div>
    </div>
  );
}
