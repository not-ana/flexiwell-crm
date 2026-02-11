"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Toggle } from "@/components/ui/Toggle";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalTitle } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { useLocale } from "@/hooks/useLocale";
import { showToast } from "./shared";

// ============================================================================
// Types
// ============================================================================

interface Teacher {
  id: string;
  name: string;
  email: string;
  initials: string;
}

interface Room {
  id: string;
  name: string;
  capacity: number;
  establishmentId: string;
  amenities: string[];
  isActive: boolean;
}

interface RoomForm {
  name: string;
  capacity: number;
  amenities: string;
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

const EMPTY_ROOM_FORM: RoomForm = {
  name: "",
  capacity: 10,
  amenities: "",
};

const MIN_CAPACITY = 2;

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
  manageRooms: { "pt-BR": "Gerenciar Salas", "en-US": "Manage Rooms" },
  done: { "pt-BR": "Concluído", "en-US": "Done" },
  teachers: { "pt-BR": "Professores:", "en-US": "Teachers:" },
  rooms: { "pt-BR": "Salas:", "en-US": "Rooms:" },
  noTeachersAssigned: { "pt-BR": "Nenhum professor atribuído", "en-US": "No teachers assigned" },
  noRooms: { "pt-BR": "Nenhuma sala", "en-US": "No rooms" },
  selectTeachers: { "pt-BR": "Selecione professores para este estabelecimento:", "en-US": "Select teachers for this establishment:" },
  name: { "pt-BR": "Nome", "en-US": "Name" },
  location: { "pt-BR": "Localização", "en-US": "Location" },
  namePlaceholder: { "pt-BR": "ex: FlexiWell Centro", "en-US": "e.g., FlexiWell Downtown" },
  locationPlaceholder: { "pt-BR": "ex: Centro, São Paulo", "en-US": "e.g., Downtown, New York" },
  cancel: { "pt-BR": "Cancelar", "en-US": "Cancel" },
  addRoom: { "pt-BR": "Adicionar Sala", "en-US": "Add Room" },
  editRoom: { "pt-BR": "Editar Sala", "en-US": "Edit Room" },
  roomName: { "pt-BR": "Nome da Sala", "en-US": "Room Name" },
  roomNamePlaceholder: { "pt-BR": "ex: Estúdio A", "en-US": "e.g., Studio A" },
  capacity: { "pt-BR": "Capacidade", "en-US": "Capacity" },
  capacityHint: { "pt-BR": "Capacidade mínima: 2 (aluno + instrutor)", "en-US": "Minimum capacity: 2 (student + instructor)" },
  amenities: { "pt-BR": "Comodidades", "en-US": "Amenities" },
  amenitiesPlaceholder: { "pt-BR": "ex: Espelhos, Sistema de Som, Ar Condicionado", "en-US": "e.g., Mirrors, Sound System, Air Conditioning" },
  amenitiesHint: { "pt-BR": "Separe as comodidades com vírgulas", "en-US": "Separate amenities with commas" },
  people: { "pt-BR": "pessoas", "en-US": "people" },
  deleteRoom: { "pt-BR": "Excluir Sala?", "en-US": "Delete Room?" },
  deleteRoomConfirm: { "pt-BR": "Tem certeza que deseja excluir", "en-US": "Are you sure you want to delete" },
  deleteRoomWarning: { "pt-BR": "Esta ação não pode ser desfeita.", "en-US": "This action cannot be undone." },
  delete: { "pt-BR": "Excluir", "en-US": "Delete" },
  saving: { "pt-BR": "Salvando...", "en-US": "Saving..." },
  saveChanges: { "pt-BR": "Salvar Alterações", "en-US": "Save Changes" },
  inactive: { "pt-BR": "Inativo", "en-US": "Inactive" },
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

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const RoomIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
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

interface RoomItemProps {
  room: Room;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  t: (key: TranslationKey) => string;
}

function RoomItem({ room, onEdit, onToggle, onDelete, t }: RoomItemProps) {
  return (
    <div className={`flex items-start justify-between gap-4 p-3 rounded-lg ${!room.isActive ? "bg-gray-100" : "bg-white border border-gray-200"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h5 className={`text-sm font-medium ${room.isActive ? "text-gray-900" : "text-gray-500"}`}>
            {room.name}
          </h5>
          {!room.isActive && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded">
              {t("inactive")}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {t("capacity")}: {room.capacity} {t("people")}
        </p>
        {room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {room.amenities.map((amenity, idx) => (
              <span key={idx} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {amenity}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
          title="Edit room"
        >
          <EditIcon />
        </button>
        <Toggle enabled={room.isActive} onChange={onToggle} />
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete room"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

interface RoomManagementPanelProps {
  establishmentId: string;
  rooms: Room[];
  onAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  onToggleRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  t: (key: TranslationKey) => string;
}

function RoomManagementPanel({
  establishmentId,
  rooms,
  onAddRoom,
  onEditRoom,
  onToggleRoom,
  onDeleteRoom,
  t,
}: RoomManagementPanelProps) {
  const establishmentRooms = rooms.filter(r => r.establishmentId === establishmentId);

  return (
    <div className="p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">{t("rooms")}</h4>
        <Button
          variant="secondary"
          size="sm"
          onClick={onAddRoom}
        >
          + {t("addRoom")}
        </Button>
      </div>
      {establishmentRooms.length > 0 ? (
        <div className="space-y-2">
          {establishmentRooms.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              onEdit={() => onEditRoom(room)}
              onToggle={() => onToggleRoom(room)}
              onDelete={() => onDeleteRoom(room)}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white border-2 border-dashed border-gray-200 rounded-lg">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <RoomIcon />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-3">{t("noRooms")}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddRoom}
          >
            {t("addRoom")}
          </Button>
        </div>
      )}
    </div>
  );
}

interface EstablishmentCardProps {
  establishment: Establishment;
  editingSection: "teachers" | "rooms" | null;
  allTeachers: Teacher[];
  rooms: Room[];
  onToggleSection: (section: "teachers" | "rooms" | null) => void;
  onToggleTeacher: (teacherId: string) => void;
  onAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  onToggleRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  t: (key: TranslationKey) => string;
}

function EstablishmentCard({
  establishment,
  editingSection,
  allTeachers,
  rooms,
  onToggleSection,
  onToggleTeacher,
  onAddRoom,
  onEditRoom,
  onToggleRoom,
  onDeleteRoom,
  t,
}: EstablishmentCardProps) {
  const establishmentRooms = rooms.filter(r => r.establishmentId === establishment.id);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{establishment.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{establishment.location}</p>

            {/* Info Row */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>{establishment.assignedTeachers.length} {establishment.assignedTeachers.length === 1 ? 'teacher' : 'teachers'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span>{establishmentRooms.length} {establishmentRooms.length === 1 ? 'room' : 'rooms'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSection(editingSection === "teachers" ? null : "teachers")}
              className={`inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                editingSection === "teachers"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {editingSection === "teachers" ? t("done") : t("manageTeachers")}
            </button>
            <button
              onClick={() => onToggleSection(editingSection === "rooms" ? null : "rooms")}
              className={`inline-flex items-center justify-center px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                editingSection === "rooms"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {editingSection === "rooms" ? t("done") : t("manageRooms")}
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Assignment Panel */}
      {editingSection === "teachers" && (
        <div className="border-t border-gray-100">
          <TeacherAssignmentPanel
            establishment={establishment}
            allTeachers={allTeachers}
            onToggleTeacher={onToggleTeacher}
            t={t}
          />
        </div>
      )}

      {/* Room Management Panel */}
      {editingSection === "rooms" && (
        <div className="border-t border-gray-100">
          <RoomManagementPanel
            establishmentId={establishment.id}
            rooms={rooms}
            onAddRoom={onAddRoom}
            onEditRoom={onEditRoom}
            onToggleRoom={onToggleRoom}
            onDeleteRoom={onDeleteRoom}
            t={t}
          />
        </div>
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

interface RoomFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  form: RoomForm;
  saving: boolean;
  onFormChange: (form: RoomForm) => void;
  onSubmit: () => void;
  onClose: () => void;
  t: (key: TranslationKey) => string;
}

function RoomFormModal({
  isOpen,
  isEditing,
  form,
  saving,
  onFormChange,
  onSubmit,
  onClose,
  t,
}: RoomFormModalProps) {
  const handleCapacityChange = (value: string) => {
    const numValue = parseInt(value.replace(/\D/g, "")) || 0;
    onFormChange({ ...form, capacity: numValue });
  };

  const handleCapacityBlur = () => {
    if (form.capacity < MIN_CAPACITY) {
      onFormChange({ ...form, capacity: MIN_CAPACITY });
    }
  };

  const isValid = form.name && form.capacity >= MIN_CAPACITY;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader onClose={onClose}>
        <ModalTitle>{isEditing ? t("editRoom") : t("addRoom")}</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-4">
        <FormField
          label={t("roomName")}
          value={form.name}
          onChange={(e) => onFormChange({ ...form, name: e.target.value })}
          placeholder={t("roomNamePlaceholder")}
        />
        <FormField
          label={t("capacity")}
          value={form.capacity.toString()}
          onChange={(e) => handleCapacityChange(e.target.value)}
          onBlur={handleCapacityBlur}
          hint={t("capacityHint")}
        />
        <FormField
          label={t("amenities")}
          value={form.amenities}
          onChange={(e) => onFormChange({ ...form, amenities: e.target.value })}
          placeholder={t("amenitiesPlaceholder")}
          hint={t("amenitiesHint")}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button onClick={onSubmit} disabled={!isValid || saving}>
          {saving ? t("saving") : isEditing ? t("saveChanges") : t("addRoom")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

interface DeleteRoomModalProps {
  room: Room | null;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: TranslationKey) => string;
}

function DeleteRoomModal({ room, onClose, onConfirm, t }: DeleteRoomModalProps) {
  if (!room) return null;

  return (
    <Modal isOpen={!!room} onClose={onClose} size="sm">
      <ModalBody className="text-center pt-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("deleteRoom")}</h3>
        <p className="text-sm text-gray-600">
          {t("deleteRoomConfirm")} <span className="font-medium">{room.name}</span>? {t("deleteRoomWarning")}
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} className="flex-1">
          {t("cancel")}
        </Button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          {t("delete")}
        </button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EstablishmentsSettings() {
  const [establishments, setEstablishments] = useState<Establishment[]>(INITIAL_ESTABLISHMENTS);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editingSection, setEditingSection] = useState<{ establishmentId: string; section: "teachers" | "rooms" } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [currentEstablishmentId, setCurrentEstablishmentId] = useState<string>("");
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState<RoomForm>(EMPTY_ROOM_FORM);
  const [saving, setSaving] = useState(false);

  const { t } = useEstablishmentTranslations();

  // Load rooms from API
  useEffect(() => {
    async function loadRooms() {
      try {
        const res = await fetch("/api/rooms");
        if (res.ok) {
          const data = await res.json();
          const loadedRooms = data.rooms?.map((r: { _id: { toString: () => string }; name: string; capacity: number; establishmentId: string; equipment?: string[]; isActive: boolean }) => ({
            id: r._id?.toString() || "",
            name: r.name,
            capacity: r.capacity,
            establishmentId: r.establishmentId,
            amenities: r.equipment || [],
            isActive: r.isActive,
          })) || [];
          setRooms(loadedRooms);
        }
      } catch (error) {
        console.error("Failed to load rooms:", error);
      }
    }
    loadRooms();
  }, []);

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

  const handleToggleSection = (establishmentId: string, section: "teachers" | "rooms" | null) => {
    if (section === null) {
      setEditingSection(null);
    } else {
      setEditingSection({ establishmentId, section });
    }
  };

  const handleOpenAddRoom = (establishmentId: string) => {
    setCurrentEstablishmentId(establishmentId);
    setRoomForm(EMPTY_ROOM_FORM);
    setEditingRoom(null);
    setShowRoomModal(true);
  };

  const handleOpenEditRoom = (room: Room) => {
    setCurrentEstablishmentId(room.establishmentId);
    setRoomForm({
      name: room.name,
      capacity: room.capacity,
      amenities: room.amenities.join(", "),
    });
    setEditingRoom(room);
    setShowRoomModal(true);
  };

  const handleSubmitRoom = async () => {
    if (!roomForm.name) return;

    setSaving(true);
    try {
      const amenitiesArray = roomForm.amenities.split(",").map((a) => a.trim()).filter((a) => a);

      if (editingRoom) {
        // Update existing room
        const res = await fetch(`/api/rooms/${editingRoom.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: roomForm.name,
            establishmentId: currentEstablishmentId,
            capacity: roomForm.capacity,
            equipment: amenitiesArray,
          }),
        });

        if (res.ok) {
          setRooms((prev) =>
            prev.map((r) =>
              r.id === editingRoom.id
                ? { ...r, name: roomForm.name, capacity: roomForm.capacity, amenities: amenitiesArray }
                : r
            )
          );
          showToast("Room updated successfully");
          setShowRoomModal(false);
        } else {
          showToast("Failed to update room", "error");
        }
      } else {
        // Create new room
        const res = await fetch("/api/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: roomForm.name,
            establishmentId: currentEstablishmentId,
            capacity: roomForm.capacity,
            equipment: amenitiesArray,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const newRoom: Room = {
            id: data.room._id?.toString() || "",
            name: data.room.name,
            capacity: data.room.capacity,
            establishmentId: data.room.establishmentId,
            amenities: data.room.equipment || [],
            isActive: data.room.isActive,
          };
          setRooms((prev) => [...prev, newRoom]);
          showToast("Room created successfully");
          setShowRoomModal(false);
        } else {
          showToast("Failed to create room", "error");
        }
      }
    } catch (error) {
      console.error("Save room error:", error);
      showToast("Failed to save room", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRoom = async (room: Room) => {
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: room.isActive ? "deactivate" : "activate" }),
      });

      if (res.ok) {
        setRooms((prev) =>
          prev.map((r) => (r.id === room.id ? { ...r, isActive: !r.isActive } : r))
        );
        showToast(`Room ${room.isActive ? "deactivated" : "activated"}`);
      } else {
        showToast("Failed to update room", "error");
      }
    } catch (error) {
      console.error("Toggle room error:", error);
      showToast("Failed to update room", "error");
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;

    try {
      const res = await fetch(`/api/rooms/${roomToDelete.id}`, { method: "DELETE" });

      if (res.ok) {
        setRooms((prev) => prev.filter((r) => r.id !== roomToDelete.id));
        showToast("Room deleted");
      } else {
        showToast("Failed to delete room", "error");
      }
    } catch (error) {
      console.error("Delete room error:", error);
      showToast("Failed to delete room", "error");
    } finally {
      setRoomToDelete(null);
    }
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
            editingSection={
              editingSection?.establishmentId === establishment.id ? editingSection.section : null
            }
            allTeachers={ALL_TEACHERS}
            rooms={rooms}
            onToggleSection={(section) => handleToggleSection(establishment.id, section)}
            onToggleTeacher={(teacherId) => toggleTeacherAssignment(establishment.id, teacherId)}
            onAddRoom={() => handleOpenAddRoom(establishment.id)}
            onEditRoom={handleOpenEditRoom}
            onToggleRoom={handleToggleRoom}
            onDeleteRoom={setRoomToDelete}
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

      {/* Room Form Modal */}
      <RoomFormModal
        isOpen={showRoomModal}
        isEditing={!!editingRoom}
        form={roomForm}
        saving={saving}
        onFormChange={setRoomForm}
        onSubmit={handleSubmitRoom}
        onClose={() => setShowRoomModal(false)}
        t={t}
      />

      {/* Delete Room Modal */}
      <DeleteRoomModal
        room={roomToDelete}
        onClose={() => setRoomToDelete(null)}
        onConfirm={handleDeleteRoom}
        t={t}
      />
    </div>
  );
}
