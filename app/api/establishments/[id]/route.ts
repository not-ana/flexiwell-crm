import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Establishment } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/establishments/[id] - Get a single establishment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid establishment ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const establishment = await db.collection<Establishment>("establishments").findOne({
      _id: new ObjectId(id),
    });

    if (!establishment) {
      return NextResponse.json(
        { error: "Establishment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ establishment });
  } catch (error) {
    console.error("Error fetching establishment:", error);
    return NextResponse.json(
      { error: "Failed to fetch establishment" },
      { status: 500 }
    );
  }
}

// PUT /api/establishments/[id] - Update an establishment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid establishment ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const { _id, createdAt, ...updateData } = body;
    const result = await db.collection<Establishment>("establishments").findOneAndUpdate(
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
        { error: "Establishment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      establishment: result,
    });
  } catch (error) {
    console.error("Error updating establishment:", error);
    return NextResponse.json(
      { error: "Failed to update establishment" },
      { status: 500 }
    );
  }
}

// PATCH /api/establishments/[id] - Update specific fields (like teacher assignments)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, teacherId, teacherIds } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid establishment ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    let updateOperation: Record<string, unknown> = {};

    switch (action) {
      case "assign_teacher":
        if (!teacherId) {
          return NextResponse.json(
            { error: "Teacher ID is required" },
            { status: 400 }
          );
        }
        updateOperation = {
          $addToSet: { assignedTeachers: teacherId },
          $set: { updatedAt: new Date() },
        };
        break;

      case "unassign_teacher":
        if (!teacherId) {
          return NextResponse.json(
            { error: "Teacher ID is required" },
            { status: 400 }
          );
        }
        updateOperation = {
          $pull: { assignedTeachers: teacherId },
          $set: { updatedAt: new Date() },
        };
        break;

      case "set_teachers":
        updateOperation = {
          $set: {
            assignedTeachers: teacherIds || [],
            updatedAt: new Date(),
          },
        };
        break;

      case "deactivate":
        updateOperation = {
          $set: {
            isActive: false,
            updatedAt: new Date(),
          },
        };
        break;

      case "activate":
        updateOperation = {
          $set: {
            isActive: true,
            updatedAt: new Date(),
          },
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const result = await db.collection<Establishment>("establishments").findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateOperation,
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Establishment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      establishment: result,
    });
  } catch (error) {
    console.error("Error updating establishment:", error);
    return NextResponse.json(
      { error: "Failed to update establishment" },
      { status: 500 }
    );
  }
}

// DELETE /api/establishments/[id] - Delete an establishment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid establishment ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db.collection<Establishment>("establishments").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Establishment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Establishment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting establishment:", error);
    return NextResponse.json(
      { error: "Failed to delete establishment" },
      { status: 500 }
    );
  }
}
