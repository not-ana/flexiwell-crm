import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Room } from "@/lib/db/schemas";

// GET /api/rooms - List all rooms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const establishmentId = searchParams.get("establishmentId");
    const activeOnly = searchParams.get("active") === "true";

    const db = await getDatabase();

    const filter: Record<string, unknown> = {};
    if (establishmentId) {
      filter.establishmentId = establishmentId;
    }
    if (activeOnly) {
      filter.isActive = true;
    }

    const rooms = await db
      .collection<Room>("rooms")
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, establishmentId, capacity, equipment } = body;

    if (!name || !establishmentId) {
      return NextResponse.json(
        { error: "Name and establishment ID are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const newRoom: Omit<Room, "_id"> = {
      name,
      establishmentId,
      capacity: capacity || 10,
      equipment: equipment || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Room>("rooms").insertOne(newRoom);

    return NextResponse.json(
      {
        success: true,
        room: {
          _id: result.insertedId,
          ...newRoom,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
