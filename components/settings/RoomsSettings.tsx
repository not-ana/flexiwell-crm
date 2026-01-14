"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { showToast } from "./shared";

interface Room {
  id: string;
  name: string;
  capacity: number;
  establishmentId: string;
  amenities: string[];
  isActive: boolean;
}

export function RoomsSettings() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [establishments, setEstablishments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState({ name: "", capacity: 10, establishmentId: "", amenities: "" });
  const [saving, setSaving] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // Load rooms and establishments from API
  useEffect(() => {
    async function loadData() {
      try {
        const [roomsRes, establishmentsRes] = await Promise.all([
          fetch("/api/rooms"),
          fetch("/api/establishments"),
        ]);

        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          setRooms(roomsData.rooms?.map((r: { _id: { toString: () => string }; name: string; capacity: number; establishmentId: string; equipment?: string[]; isActive: boolean }) => ({
            id: r._id?.toString() || "",
            name: r.name,
            capacity: r.capacity,
            establishmentId: r.establishmentId,
            amenities: r.equipment || [],
            isActive: r.isActive,
          })) || []);
        }

        if (establishmentsRes.ok) {
          const establishmentsData = await establishmentsRes.json();
          const estList = establishmentsData.establishments?.map((e: { _id: { toString: () => string }; name: string }) => ({
            id: e._id?.toString() || "",
            name: e.name,
          })) || [];
          setEstablishments(estList);
          if (estList.length > 0 && !newRoom.establishmentId) {
            setNewRoom(prev => ({ ...prev, establishmentId: estList[0].id }));
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getEstablishmentName = (id: string) => establishments.find(e => e.id === id)?.name || "Unknown";

  const handleAddRoom = async () => {
    if (!newRoom.name || !newRoom.establishmentId) return;
    setSaving(true);
    try {
      const amenitiesArray = newRoom.amenities.split(",").map(a => a.trim()).filter(a => a);
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoom.name,
          establishmentId: newRoom.establishmentId,
          capacity: newRoom.capacity,
          equipment: amenitiesArray,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRooms([...rooms, {
          id: data.room._id?.toString() || "",
          name: data.room.name,
          capacity: data.room.capacity,
          establishmentId: data.room.establishmentId,
          amenities: data.room.equipment || [],
          isActive: data.room.isActive,
        }]);
        setNewRoom({ name: "", capacity: 10, establishmentId: establishments[0]?.id || "", amenities: "" });
        setShowAddModal(false);
        showToast("Room created successfully");
      } else {
        showToast("Failed to create room", "error");
      }
    } catch (error) {
      console.error("Create room error:", error);
      showToast("Failed to create room", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: room.isActive ? "deactivate" : "activate" }),
      });

      if (res.ok) {
        setRooms(prev => prev.map(r =>
          r.id === roomId ? { ...r, isActive: !r.isActive } : r
        ));
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
        setRooms(prev => prev.filter(room => room.id !== roomToDelete.id));
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

  const handleStartEdit = (room: Room) => {
    setEditingRoom(room);
    setNewRoom({
      name: room.name,
      capacity: room.capacity,
      establishmentId: room.establishmentId,
      amenities: room.amenities.join(", "),
    });
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom || !newRoom.name || !newRoom.establishmentId) return;
    setSaving(true);
    try {
      const amenitiesArray = newRoom.amenities.split(",").map(a => a.trim()).filter(a => a);
      const res = await fetch(`/api/rooms/${editingRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoom.name,
          establishmentId: newRoom.establishmentId,
          capacity: newRoom.capacity,
          equipment: amenitiesArray,
        }),
      });

      if (res.ok) {
        setRooms(prev => prev.map(r =>
          r.id === editingRoom.id
            ? { ...r, name: newRoom.name, capacity: newRoom.capacity, establishmentId: newRoom.establishmentId, amenities: amenitiesArray }
            : r
        ));
        setEditingRoom(null);
        setNewRoom({ name: "", capacity: 10, establishmentId: establishments[0]?.id || "", amenities: "" });
        showToast("Room updated successfully");
      } else {
        showToast("Failed to update room", "error");
      }
    } catch (error) {
      console.error("Update room error:", error);
      showToast("Failed to update room", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingRoom(null);
    setNewRoom({ name: "", capacity: 10, establishmentId: establishments[0]?.id || "", amenities: "" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Group rooms by establishment
  const roomsByEstablishment = establishments.map(est => ({
    ...est,
    rooms: rooms.filter(room => room.establishmentId === est.id)
  })).filter(est => est.rooms.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Rooms</h2>
          <p className="text-sm text-gray-600 mt-1">Manage rooms and spaces across your establishments.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Room</Button>
      </div>

      {/* Rooms grouped by establishment */}
      <div className="space-y-6">
        {roomsByEstablishment.map((establishment) => (
          <div key={establishment.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Establishment Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">{establishment.name}</h3>
                <p className="text-sm text-gray-500">{establishment.rooms.length} room{establishment.rooms.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {/* Rooms List */}
            <div className="divide-y divide-gray-100">
              {establishment.rooms.map((room) => (
                <div key={room.id} className={`p-4 sm:p-6 ${!room.isActive ? "bg-gray-50" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${room.isActive ? "text-gray-900" : "text-gray-500"}`}>{room.name}</h4>
                          {!room.isActive && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">Inactive</span>
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
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(room)}
                        className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit room"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(room.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          room.isActive ? "bg-primary-600" : "bg-gray-300"
                        }`}
                        title={room.isActive ? "Active - Click to deactivate" : "Inactive - Click to activate"}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            room.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => setRoomToDelete(room)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete room"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {roomsByEstablishment.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No rooms yet</h3>
            <p className="text-gray-500 mb-4">Add your first room to get started.</p>
            <Button onClick={() => setShowAddModal(true)}>Add Room</Button>
          </div>
        )}
      </div>

      {/* Add/Edit Room Modal */}
      {(showAddModal || editingRoom) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{editingRoom ? "Edit Room" : "Add Room"}</h3>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                <input
                  type="text"
                  placeholder="e.g., Studio A"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Establishment</label>
                <select
                  value={newRoom.establishmentId}
                  onChange={(e) => setNewRoom({ ...newRoom, establishmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>{est.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newRoom.capacity}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    const numValue = parseInt(value) || 0;
                    setNewRoom({ ...newRoom, capacity: numValue });
                  }}
                  onBlur={() => {
                    if (newRoom.capacity < 2) {
                      setNewRoom({ ...newRoom, capacity: 2 });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum capacity: 2 (student + instructor)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
                <input
                  type="text"
                  placeholder="e.g., Mirrors, Sound System, Air Conditioning"
                  value={newRoom.amenities}
                  onChange={(e) => setNewRoom({ ...newRoom, amenities: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">Separate amenities with commas</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingRoom ? handleUpdateRoom : handleAddRoom}
                disabled={!newRoom.name || newRoom.capacity < 2 || saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingRoom ? "Save Changes" : "Add Room"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {roomToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Room?</h3>
              <p className="text-sm text-gray-600 text-center">
                Are you sure you want to delete <span className="font-medium">{roomToDelete.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setRoomToDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
