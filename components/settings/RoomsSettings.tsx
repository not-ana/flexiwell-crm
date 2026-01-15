"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui";
import { Toggle } from "@/components/ui/Toggle";
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalTitle } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { showToast } from "./shared";

// ============================================================================
// Types
// ============================================================================

interface Room {
  id: string;
  name: string;
  capacity: number;
  establishmentId: string;
  amenities: string[];
  isActive: boolean;
}

interface Establishment {
  id: string;
  name: string;
}

interface RoomForm {
  name: string;
  capacity: number;
  establishmentId: string;
  amenities: string;
}

// ============================================================================
// Icons
// ============================================================================

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
  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

// ============================================================================
// Constants
// ============================================================================

const EMPTY_ROOM_FORM: RoomForm = {
  name: "",
  capacity: 10,
  establishmentId: "",
  amenities: "",
};

const MIN_CAPACITY = 2;

// ============================================================================
// API Functions
// ============================================================================

async function fetchRoomsAndEstablishments() {
  const [roomsRes, establishmentsRes] = await Promise.all([
    fetch("/api/rooms"),
    fetch("/api/establishments"),
  ]);

  const rooms: Room[] = [];
  const establishments: Establishment[] = [];

  if (roomsRes.ok) {
    const data = await roomsRes.json();
    rooms.push(
      ...(data.rooms?.map((r: { _id: { toString: () => string }; name: string; capacity: number; establishmentId: string; equipment?: string[]; isActive: boolean }) => ({
        id: r._id?.toString() || "",
        name: r.name,
        capacity: r.capacity,
        establishmentId: r.establishmentId,
        amenities: r.equipment || [],
        isActive: r.isActive,
      })) || [])
    );
  }

  if (establishmentsRes.ok) {
    const data = await establishmentsRes.json();
    establishments.push(
      ...(data.establishments?.map((e: { _id: { toString: () => string }; name: string }) => ({
        id: e._id?.toString() || "",
        name: e.name,
      })) || [])
    );
  }

  return { rooms, establishments };
}

async function createRoom(form: RoomForm): Promise<Room | null> {
  const amenitiesArray = form.amenities.split(",").map((a) => a.trim()).filter((a) => a);
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: form.name,
      establishmentId: form.establishmentId,
      capacity: form.capacity,
      equipment: amenitiesArray,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    id: data.room._id?.toString() || "",
    name: data.room.name,
    capacity: data.room.capacity,
    establishmentId: data.room.establishmentId,
    amenities: data.room.equipment || [],
    isActive: data.room.isActive,
  };
}

async function updateRoom(id: string, form: RoomForm): Promise<boolean> {
  const amenitiesArray = form.amenities.split(",").map((a) => a.trim()).filter((a) => a);
  const res = await fetch(`/api/rooms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: form.name,
      establishmentId: form.establishmentId,
      capacity: form.capacity,
      equipment: amenitiesArray,
    }),
  });
  return res.ok;
}

async function toggleRoomActive(id: string, isActive: boolean): Promise<boolean> {
  const res = await fetch(`/api/rooms/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: isActive ? "deactivate" : "activate" }),
  });
  return res.ok;
}

async function deleteRoom(id: string): Promise<boolean> {
  const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
  return res.ok;
}

// ============================================================================
// Sub-components
// ============================================================================

interface RoomCardProps {
  room: Room;
  onEdit: (room: Room) => void;
  onToggle: (room: Room) => void;
  onDelete: (room: Room) => void;
}

function RoomCard({ room, onEdit, onToggle, onDelete }: RoomCardProps) {
  return (
    <div className={`p-4 sm:p-6 ${!room.isActive ? "bg-gray-50" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className={`font-medium ${room.isActive ? "text-gray-900" : "text-gray-500"}`}>
              {room.name}
            </h4>
            {!room.isActive && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Capacity: {room.capacity} people</p>
          {room.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {room.amenities.map((amenity, idx) => (
                <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(room)}
            className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
            title="Edit room"
          >
            <EditIcon />
          </button>
          <Toggle enabled={room.isActive} onChange={() => onToggle(room)} />
          <button
            onClick={() => onDelete(room)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete room"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

interface EstablishmentGroupProps {
  establishment: Establishment;
  rooms: Room[];
  onEdit: (room: Room) => void;
  onToggle: (room: Room) => void;
  onDelete: (room: Room) => void;
}

function EstablishmentGroup({ establishment, rooms, onEdit, onToggle, onDelete }: EstablishmentGroupProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{establishment.name}</h3>
        <p className="text-sm text-gray-500">
          {rooms.length} room{rooms.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Room Form Modal
// ============================================================================

interface RoomFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  form: RoomForm;
  establishments: Establishment[];
  saving: boolean;
  onFormChange: (form: RoomForm) => void;
  onSubmit: () => void;
  onClose: () => void;
}

function RoomFormModal({
  isOpen,
  isEditing,
  form,
  establishments,
  saving,
  onFormChange,
  onSubmit,
  onClose,
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
        <ModalTitle>{isEditing ? "Edit Room" : "Add Room"}</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-4">
        <FormField
          label="Room Name"
          value={form.name}
          onChange={(e) => onFormChange({ ...form, name: e.target.value })}
          placeholder="e.g., Studio A"
        />
        <FormField
          as="select"
          label="Establishment"
          value={form.establishmentId}
          onChange={(e) => onFormChange({ ...form, establishmentId: e.target.value })}
        >
          {establishments.map((est) => (
            <option key={est.id} value={est.id}>
              {est.name}
            </option>
          ))}
        </FormField>
        <FormField
          label="Capacity"
          value={form.capacity.toString()}
          onChange={(e) => handleCapacityChange(e.target.value)}
          onBlur={handleCapacityBlur}
          hint="Minimum capacity: 2 (student + instructor)"
        />
        <FormField
          label="Amenities"
          value={form.amenities}
          onChange={(e) => onFormChange({ ...form, amenities: e.target.value })}
          placeholder="e.g., Mirrors, Sound System, Air Conditioning"
          hint="Separate amenities with commas"
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!isValid || saving}>
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Room"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Delete Confirmation Modal
// ============================================================================

interface DeleteRoomModalProps {
  room: Room | null;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteRoomModal({ room, onClose, onConfirm }: DeleteRoomModalProps) {
  if (!room) return null;

  return (
    <Modal isOpen={!!room} onClose={onClose} size="sm">
      <ModalBody className="text-center pt-6">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Room?</h3>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <span className="font-medium">{room.name}</span>? This action cannot be undone.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyRoomsState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <RoomIcon />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No rooms yet</h3>
      <p className="text-gray-500 mb-4">Add your first room to get started.</p>
      <Button onClick={onAdd}>Add Room</Button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RoomsSettings() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(EMPTY_ROOM_FORM);

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchRoomsAndEstablishments();
        setRooms(data.rooms);
        setEstablishments(data.establishments);
        if (data.establishments.length > 0) {
          setForm((prev) => ({ ...prev, establishmentId: data.establishments[0].id }));
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Group rooms by establishment
  const roomsByEstablishment = establishments
    .map((est) => ({
      establishment: est,
      rooms: rooms.filter((room) => room.establishmentId === est.id),
    }))
    .filter((group) => group.rooms.length > 0);

  // Handlers
  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_ROOM_FORM, establishmentId: establishments[0]?.id || "" });
    setEditingRoom(null);
    setShowFormModal(false);
  }, [establishments]);

  const handleOpenAdd = () => {
    setForm({ ...EMPTY_ROOM_FORM, establishmentId: establishments[0]?.id || "" });
    setEditingRoom(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (room: Room) => {
    setForm({
      name: room.name,
      capacity: room.capacity,
      establishmentId: room.establishmentId,
      amenities: room.amenities.join(", "),
    });
    setEditingRoom(room);
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.establishmentId) return;

    setSaving(true);
    try {
      if (editingRoom) {
        const success = await updateRoom(editingRoom.id, form);
        if (success) {
          const amenitiesArray = form.amenities.split(",").map((a) => a.trim()).filter((a) => a);
          setRooms((prev) =>
            prev.map((r) =>
              r.id === editingRoom.id
                ? { ...r, name: form.name, capacity: form.capacity, establishmentId: form.establishmentId, amenities: amenitiesArray }
                : r
            )
          );
          showToast("Room updated successfully");
          resetForm();
        } else {
          showToast("Failed to update room", "error");
        }
      } else {
        const newRoom = await createRoom(form);
        if (newRoom) {
          setRooms((prev) => [...prev, newRoom]);
          showToast("Room created successfully");
          resetForm();
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

  const handleToggle = async (room: Room) => {
    try {
      const success = await toggleRoomActive(room.id, room.isActive);
      if (success) {
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

  const handleDelete = async () => {
    if (!roomToDelete) return;

    try {
      const success = await deleteRoom(roomToDelete.id);
      if (success) {
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Rooms</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage rooms and spaces across your establishments.
          </p>
        </div>
        <Button onClick={handleOpenAdd}>Add Room</Button>
      </div>

      {/* Rooms List */}
      <div className="space-y-6">
        {roomsByEstablishment.length > 0 ? (
          roomsByEstablishment.map(({ establishment, rooms }) => (
            <EstablishmentGroup
              key={establishment.id}
              establishment={establishment}
              rooms={rooms}
              onEdit={handleOpenEdit}
              onToggle={handleToggle}
              onDelete={setRoomToDelete}
            />
          ))
        ) : (
          <EmptyRoomsState onAdd={handleOpenAdd} />
        )}
      </div>

      {/* Modals */}
      <RoomFormModal
        isOpen={showFormModal}
        isEditing={!!editingRoom}
        form={form}
        establishments={establishments}
        saving={saving}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        onClose={resetForm}
      />
      <DeleteRoomModal
        room={roomToDelete}
        onClose={() => setRoomToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
