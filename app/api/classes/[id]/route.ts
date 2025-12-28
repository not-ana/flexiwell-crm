import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Class } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/classes/[id] - Get a single class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid class ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const classData = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(id),
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ class: classData });
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { error: "Failed to fetch class" },
      { status: 500 }
    );
  }
}

// PUT /api/classes/[id] - Update a class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid class ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Remove _id and createdAt from update data if present
    const { _id, createdAt, ...updateData } = body;

    // Validate type if provided
    if (updateData.type) {
      const validTypes = ["yoga", "pilates", "stretching", "meditation", "other"];
      if (!validTypes.includes(updateData.type)) {
        return NextResponse.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Convert scheduledDate if present
    if (updateData.scheduledDate) {
      updateData.scheduledDate = new Date(updateData.scheduledDate);
    }

    const result = await db.collection<Class>("classes").findOneAndUpdate(
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
        { error: "Class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      class: result,
    });
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id] - Delete a class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid class ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db.collection<Class>("classes").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}

// PATCH /api/classes/[id] - Partial update (status, enrollment, waitlist)
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
        { error: "Invalid class ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    let updateOperation: Record<string, unknown> = {};

    switch (action) {
      case "cancel":
        updateOperation = {
          $set: {
            status: "cancelled",
            updatedAt: new Date(),
          },
        };
        break;

      case "complete":
        updateOperation = {
          $set: {
            status: "completed",
            updatedAt: new Date(),
          },
        };
        break;

      case "enroll_client":
        if (!body.clientId || !body.clientName) {
          return NextResponse.json(
            { error: "Client ID and name are required" },
            { status: 400 }
          );
        }

        // Check current enrollment
        const classForEnroll = await db.collection<Class>("classes").findOne({
          _id: new ObjectId(id),
        });

        if (!classForEnroll) {
          return NextResponse.json(
            { error: "Class not found" },
            { status: 404 }
          );
        }

        if (classForEnroll.currentEnrollment >= classForEnroll.maxCapacity) {
          return NextResponse.json(
            { error: "Class is full" },
            { status: 400 }
          );
        }

        // Check if already enrolled
        const alreadyEnrolled = classForEnroll.enrolledClients.some(
          (c) => c.clientId === body.clientId
        );

        if (alreadyEnrolled) {
          return NextResponse.json(
            { error: "Client is already enrolled" },
            { status: 400 }
          );
        }

        updateOperation = {
          $push: {
            enrolledClients: {
              clientId: body.clientId,
              clientName: body.clientName,
              status: "confirmed",
              enrolledAt: new Date(),
            },
          },
          $inc: { currentEnrollment: 1 },
          $set: { updatedAt: new Date() },
        };
        break;

      case "cancel_enrollment":
        if (!body.clientId) {
          return NextResponse.json(
            { error: "Client ID is required" },
            { status: 400 }
          );
        }
        updateOperation = {
          $set: {
            "enrolledClients.$[elem].status": "cancelled",
            updatedAt: new Date(),
          },
          $inc: { currentEnrollment: -1 },
        };

        const result = await db.collection<Class>("classes").findOneAndUpdate(
          { _id: new ObjectId(id) },
          updateOperation,
          {
            arrayFilters: [{ "elem.clientId": body.clientId }],
            returnDocument: "after",
          }
        );

        if (!result) {
          return NextResponse.json(
            { error: "Class not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          class: result,
        });

      case "add_to_waitlist":
        if (!body.clientId || !body.clientName) {
          return NextResponse.json(
            { error: "Client ID and name are required" },
            { status: 400 }
          );
        }
        updateOperation = {
          $push: {
            waitlist: {
              clientId: body.clientId,
              clientName: body.clientName,
              addedAt: new Date(),
            },
          },
          $set: { updatedAt: new Date() },
        };
        break;

      case "remove_from_waitlist":
        if (!body.clientId) {
          return NextResponse.json(
            { error: "Client ID is required" },
            { status: 400 }
          );
        }
        updateOperation = {
          $pull: {
            waitlist: { clientId: body.clientId },
          },
          $set: { updatedAt: new Date() },
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const updateResult = await db.collection<Class>("classes").findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateOperation,
      { returnDocument: "after" }
    );

    if (!updateResult) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      class: updateResult,
    });
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}
