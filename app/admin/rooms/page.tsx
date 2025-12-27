"use client";

import { useState } from "react";
import { SearchIcon, PlusIcon, ChevronIcon } from "@/components/icons";

interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  status: "active" | "maintenance" | "inactive";
  color: string;
}

interface Unit {
  id: string;
  name: string;
  address: string;
  rooms: Room[];
}

// Mock data - rooms grouped by unit
const mockUnits: Unit[] = [
  {
    id: "1",
    name: "FlexiWell Centro",
    address: "123 Main Street - Downtown",
    rooms: [
      {
        id: "1",
        name: "Room 1",
        capacity: 8,
        equipment: ["Reformer (8)", "Mat", "Mirror Wall"],
        status: "active",
        color: "bg-purple-500",
      },
      {
        id: "2",
        name: "Room 2",
        capacity: 10,
        equipment: ["Yoga Mats (10)", "Blocks", "Straps", "Sound System"],
        status: "active",
        color: "bg-green-500",
      },
      {
        id: "3",
        name: "Room 3",
        capacity: 12,
        equipment: ["Functional Equipment", "TRX", "Kettlebells", "Dumbbells"],
        status: "active",
        color: "bg-blue-500",
      },
      {
        id: "4",
        name: "Studio A",
        capacity: 6,
        equipment: ["Cadillac (2)", "Chair (4)", "Barrel"],
        status: "maintenance",
        color: "bg-orange-500",
      },
    ],
  },
  {
    id: "2",
    name: "FlexiWell Jardins",
    address: "456 Park Avenue - Jardins",
    rooms: [
      {
        id: "5",
        name: "Room 1",
        capacity: 6,
        equipment: ["Reformer (6)", "Mat", "Mirror Wall"],
        status: "active",
        color: "bg-purple-500",
      },
      {
        id: "6",
        name: "Room 2",
        capacity: 8,
        equipment: ["Yoga Mats (8)", "Bolsters", "Blankets"],
        status: "active",
        color: "bg-green-500",
      },
      {
        id: "7",
        name: "Studio B",
        capacity: 4,
        equipment: ["Reformer (4)", "Tower"],
        status: "inactive",
        color: "bg-red-500",
      },
    ],
  },
  {
    id: "3",
    name: "FlexiWell Moema",
    address: "789 Oak Boulevard - Moema",
    rooms: [
      {
        id: "8",
        name: "Main Studio",
        capacity: 10,
        equipment: ["Reformer (10)", "Mat Area", "Sound System"],
        status: "active",
        color: "bg-purple-500",
      },
      {
        id: "9",
        name: "Yoga Room",
        capacity: 15,
        equipment: ["Yoga Mats (15)", "Props", "Aerial Silks (6)"],
        status: "active",
        color: "bg-green-500",
      },
    ],
  },
];

const statusStyles = {
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Active" },
  maintenance: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Maintenance" },
  inactive: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500", label: "Inactive" },
};

const roomColors = [
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-orange-500", label: "Orange" },
  { value: "bg-red-500", label: "Red" },
  { value: "bg-pink-500", label: "Pink" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-teal-500", label: "Teal" },
];

function StatusBadge({ status }: { status: Room["status"] }) {
  const style = statusStyles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function RoomCard({
  room,
  onEdit,
  onDelete,
}: {
  room: Room;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Color indicator */}
        <div className={`w-3 h-12 rounded-full ${room.color}`} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{room.name}</h3>
            <StatusBadge status={room.status} />
          </div>
          <p className="text-sm text-gray-500">Capacity: {room.capacity} people</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(room)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit room"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(room)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete room"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Equipment */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2">Equipment:</p>
        <div className="flex flex-wrap gap-1">
          {room.equipment.map((item) => (
            <span
              key={item}
              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function UnitSection({
  unit,
  isExpanded,
  onToggle,
  onEditRoom,
  onDeleteRoom,
  onAddRoom,
}: {
  unit: Unit;
  isExpanded: boolean;
  onToggle: () => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  onAddRoom: (unitId: string) => void;
}) {
  const activeRooms = unit.rooms.filter((r) => r.status === "active").length;
  const totalCapacity = unit.rooms.reduce((acc, r) => acc + r.capacity, 0);

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
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{unit.rooms.length} rooms</p>
            <p className="text-xs text-gray-500">{activeRooms} active • {totalCapacity} total capacity</p>
          </div>
          <ChevronIcon
            className="w-5 h-5 text-gray-400 transition-transform"
            direction={isExpanded ? "up" : "down"}
          />
        </div>
      </button>

      {/* Rooms Grid */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">Manage rooms for this location</p>
            <button
              onClick={() => onAddRoom(unit.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Room
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unit.rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onEdit={onEditRoom}
                onDelete={onDeleteRoom}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Room Modal (Add/Edit)
function RoomModal({
  room,
  unitId,
  unitName,
  isOpen,
  onClose,
  onSave,
}: {
  room: Room | null;
  unitId: string;
  unitName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: Partial<Room> & { unitId: string }) => void;
}) {
  const [formData, setFormData] = useState({
    name: room?.name || "",
    capacity: room?.capacity?.toString() || "8",
    equipment: room?.equipment?.join(", ") || "",
    status: room?.status || "active" as Room["status"],
    color: room?.color || "bg-purple-500",
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Please enter a room name");
      return;
    }

    const equipmentArray = formData.equipment
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    onSave({
      id: room?.id,
      unitId,
      name: formData.name,
      capacity: parseInt(formData.capacity) || 8,
      equipment: equipmentArray,
      status: formData.status,
      color: formData.color,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {room ? "Edit Room" : "Add New Room"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">{unitName}</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Room 1, Studio A, Yoga Room"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
            <textarea
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              placeholder="Reformer (8), Mat, Mirror Wall (separate with commas)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">Separate items with commas</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Room["status"] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Calendar Color</label>
            <div className="flex flex-wrap gap-2">
              {roomColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full ${color.value} ${
                    formData.color === color.value
                      ? "ring-2 ring-offset-2 ring-gray-400"
                      : ""
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            {room ? "Save Changes" : "Add Room"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRoomsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUnits, setExpandedUnits] = useState<string[]>(mockUnits.map((u) => u.id));
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [showRoomModal, setShowRoomModal] = useState(false);

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const handleAddRoom = (unitId: string) => {
    setSelectedRoom(null);
    setSelectedUnitId(unitId);
    setShowRoomModal(true);
  };

  const handleEditRoom = (room: Room) => {
    // Find which unit this room belongs to
    const unit = mockUnits.find((u) => u.rooms.some((r) => r.id === room.id));
    setSelectedRoom(room);
    setSelectedUnitId(unit?.id || "");
    setShowRoomModal(true);
  };

  const handleDeleteRoom = (room: Room) => {
    if (confirm(`Are you sure you want to delete "${room.name}"?\n\nThis action cannot be undone.`)) {
      // In production: await api.deleteRoom(room.id);
      console.log("Deleting room:", room);
      alert(`Room "${room.name}" has been deleted.`);
    }
  };

  const handleSaveRoom = (roomData: Partial<Room> & { unitId: string }) => {
    // In production: await api.saveRoom(roomData);
    console.log("Saving room:", roomData);
    alert(
      roomData.id
        ? `Room "${roomData.name}" updated successfully!`
        : `Room "${roomData.name}" added successfully!`
    );
  };

  // Filter units based on search
  const filteredUnits = mockUnits
    .map((unit) => ({
      ...unit,
      rooms: unit.rooms.filter(
        (room) =>
          room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.equipment.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter(
      (unit) =>
        unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.rooms.length > 0
    );

  const totalRooms = mockUnits.reduce((acc, unit) => acc + unit.rooms.length, 0);
  const activeRooms = mockUnits.reduce(
    (acc, unit) => acc + unit.rooms.filter((r) => r.status === "active").length,
    0
  );
  const totalCapacity = mockUnits.reduce(
    (acc, unit) => acc + unit.rooms.reduce((a, r) => a + r.capacity, 0),
    0
  );

  const selectedUnit = mockUnits.find((u) => u.id === selectedUnitId);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-600 mt-1">Manage rooms and equipment across all locations</p>
        </div>
        <button
          onClick={() => {
            if (mockUnits.length > 0) {
              handleAddRoom(mockUnits[0].id);
            } else {
              alert("Please add a location first before adding rooms.");
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Room
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Rooms</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalRooms}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Active Rooms</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeRooms}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Capacity</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">{totalCapacity} people</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Locations</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{mockUnits.length}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 bg-white rounded-xl px-4 py-3">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms or equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
          />
        </div>

        <button
          onClick={() =>
            setExpandedUnits(expandedUnits.length === mockUnits.length ? [] : mockUnits.map((u) => u.id))
          }
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
              onEditRoom={handleEditRoom}
              onDeleteRoom={handleDeleteRoom}
              onAddRoom={handleAddRoom}
            />
          ))
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No rooms found</h3>
            <p className="text-gray-500">Try adjusting your search or add a new room</p>
          </div>
        )}
      </div>

      {/* Room Modal */}
      <RoomModal
        room={selectedRoom}
        unitId={selectedUnitId}
        unitName={selectedUnit?.name || ""}
        isOpen={showRoomModal}
        onClose={() => setShowRoomModal(false)}
        onSave={handleSaveRoom}
      />
    </div>
  );
}
