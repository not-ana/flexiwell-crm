import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Staff } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/staff/[id] - Get a single staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid staff ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const staff = await db.collection<Staff>("staff").findOne({
      _id: new ObjectId(id),
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ staff });
  } catch (error) {
    console.error("Error fetching staff member:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff member" },
      { status: 500 }
    );
  }
}

// PUT /api/staff/[id] - Update a staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid staff ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Remove _id and createdAt from update data if present
    const { _id, createdAt, ...updateData } = body;

    // Validate role if provided
    if (updateData.role && !["admin", "teacher"].includes(updateData.role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin or teacher" },
        { status: 400 }
      );
    }

    // Check if updating email and if it conflicts
    if (updateData.email) {
      const existingStaff = await db.collection<Staff>("staff").findOne({
        email: updateData.email.toLowerCase(),
        _id: { $ne: new ObjectId(id) },
      });

      if (existingStaff) {
        return NextResponse.json(
          { error: "A staff member with this email already exists" },
          { status: 409 }
        );
      }
      updateData.email = updateData.email.toLowerCase();
    }

    const result = await db.collection<Staff>("staff").findOneAndUpdate(
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
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      staff: result,
    });
  } catch (error) {
    console.error("Error updating staff member:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}

// DELETE /api/staff/[id] - Delete a staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid staff ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db.collection<Staff>("staff").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting staff member:", error);
    return NextResponse.json(
      { error: "Failed to delete staff member" },
      { status: 500 }
    );
  }
}

// PATCH /api/staff/[id] - Partial update (e.g., status change, schedule update)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid staff ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    let updateOperation: Record<string, unknown> = {};

    switch (action) {
      case "activate":
        updateOperation = {
          $set: {
            status: "active",
            updatedAt: new Date(),
          },
        };
        break;

      case "deactivate":
        updateOperation = {
          $set: {
            status: "inactive",
            updatedAt: new Date(),
          },
        };
        break;

      case "update_schedule":
        if (!body.schedule) {
          return NextResponse.json(
            { error: "Schedule data is required" },
            { status: 400 }
          );
        }
        updateOperation = {
          $set: {
            schedule: body.schedule,
            updatedAt: new Date(),
          },
        };
        break;

      case "update_specialties":
        if (!body.specialties) {
          return NextResponse.json(
            { error: "Specialties data is required" },
            { status: 400 }
          );
        }
        updateOperation = {
          $set: {
            specialties: body.specialties,
            updatedAt: new Date(),
          },
        };
        break;

      case "update_role":
        if (!body.role) {
          return NextResponse.json(
            { error: "Role is required" },
            { status: 400 }
          );
        }
        if (!["admin", "teacher"].includes(body.role)) {
          return NextResponse.json(
            { error: "Invalid role. Must be admin or teacher" },
            { status: 400 }
          );
        }
        updateOperation = {
          $set: {
            role: body.role,
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

    const result = await db.collection<Staff>("staff").findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateOperation,
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      staff: result,
    });
  } catch (error) {
    console.error("Error updating staff member:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}
