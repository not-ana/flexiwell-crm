import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import type { Room } from "@/lib/db/schemas";

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuthFromCookie();
    if (error) return error;

    const db = await getDatabase();

    // Get all establishments
    const establishments = await db.collection("establishments")
      .find()
      .toArray();

    // Get all rooms
    const rooms = await db.collection<Room>("rooms")
      .find()
      .toArray();

    // Define room colors
    const roomColors = [
      "bg-purple-500",
      "bg-green-500",
      "bg-blue-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-teal-500",
    ];

    // Group rooms by establishment
    const roomsByEstablishment: Record<string, Room[]> = {};
    for (const room of rooms) {
      const estId = room.establishmentId;
      if (!roomsByEstablishment[estId]) {
        roomsByEstablishment[estId] = [];
      }
      roomsByEstablishment[estId].push(room);
    }

    // Format units with rooms
    const units = establishments.map((est, estIndex) => {
      const estRooms = roomsByEstablishment[est._id.toString()] || [];

      return {
        id: est._id.toString(),
        name: est.name,
        address: est.address || "",
        rooms: estRooms.map((room, roomIndex) => ({
          id: room._id?.toString() || "",
          name: room.name,
          capacity: room.capacity,
          equipment: room.equipment || [],
          status: room.isActive ? "active" : "inactive",
          color: roomColors[(estIndex + roomIndex) % roomColors.length],
        })),
      };
    });

    // If no establishments, create a default one
    if (units.length === 0) {
      // Check if there are any orphan rooms
      const orphanRooms = rooms.filter(r => !establishments.find(e => e._id.toString() === r.establishmentId));

      if (orphanRooms.length > 0) {
        units.push({
          id: "default",
          name: "FlexiWell Studio",
          address: "Main Location",
          rooms: orphanRooms.map((room, roomIndex) => ({
            id: room._id?.toString() || "",
            name: room.name,
            capacity: room.capacity,
            equipment: room.equipment || [],
            status: room.isActive ? "active" : "inactive",
            color: roomColors[roomIndex % roomColors.length],
          })),
        });
      } else {
        // Return empty default unit
        units.push({
          id: "default",
          name: "FlexiWell Studio",
          address: "Main Location",
          rooms: [],
        });
      }
    }

    return NextResponse.json({ units });
  } catch (error) {
    console.error("Admin rooms error:", error);
    return NextResponse.json(
      { error: "Failed to load rooms" },
      { status: 500 }
    );
  }
}
