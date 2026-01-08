import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/middleware";
import type { Room } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/admin/rooms/[id] - Get a single room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role
    const { error } = requireRole(request, ["admin"]);
    if (error) return error;

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid room ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const room = await db.collection<Room>("rooms").findOne({
      _id: new ObjectId(id),
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/rooms/[id] - Update a room
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role
    const { error } = requireRole(request, ["admin"]);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid room ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Remove _id from update data
    const { _id, createdAt, ...updateData } = body;

    const result = await db.collection<Room>("rooms").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      room: result,
    });
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/rooms/[id] - Delete a room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role
    const { error } = requireRole(request, ["admin"]);
    if (error) return error;

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid room ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check if room exists
    const room = await db.collection<Room>("rooms").findOne({
      _id: new ObjectId(id),
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Check for classes scheduled in this room
    const scheduledClasses = await db.collection("classes").countDocuments({
      roomId: id,
      status: "scheduled",
    });

    if (scheduledClasses > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete room with scheduled classes",
          scheduledClasses,
          suggestion: "Please reassign or cancel the classes first",
        },
        { status: 409 }
      );
    }

    // Mark historical records
    await db.collection("classes").updateMany(
      { roomId: id },
      {
        $set: {
          roomDeleted: true,
          updatedAt: new Date(),
        }
      }
    );

    // Delete the room
    const result = await db.collection<Room>("rooms").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete room" },
        { status: 500 }
      );
    }

    // Log activity
    await db.collection("activities").insertOne({
      type: "system",
      action: "delete",
      description: `Room ${room.name} was deleted`,
      entityId: id,
      entityType: "room",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
