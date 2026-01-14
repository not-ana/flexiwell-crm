import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { SupportTicket } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/support/[id] - Get a single support ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid ticket ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const ticket = await db.collection<SupportTicket>("support_tickets").findOne({
      _id: new ObjectId(id),
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Support ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Error fetching support ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch support ticket" },
      { status: 500 }
    );
  }
}

// PUT /api/support/[id] - Update a support ticket
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid ticket ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // If adding a message/reply
    if (body.reply) {
      const isAdmin = body.reply.from === "admin";
      const newMessage = {
        id: `msg-${Date.now()}`,
        from: body.reply.from || "admin",
        content: body.reply.content,
        isAdmin,
        timestamp: new Date(),
      };

      const result = await db.collection<SupportTicket>("support_tickets").findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $push: { messages: newMessage },
          $set: {
            updatedAt: new Date(),
            status: body.reply.from === "admin" ? "in_progress" : undefined,
          },
        },
        { returnDocument: "after" }
      );

      if (!result) {
        return NextResponse.json(
          { error: "Support ticket not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        ticket: result,
      });
    }

    // General update
    const { _id, createdAt, ...updateData } = body;
    const result = await db.collection<SupportTicket>("support_tickets").findOneAndUpdate(
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
        { error: "Support ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: result,
    });
  } catch (error) {
    console.error("Error updating support ticket:", error);
    return NextResponse.json(
      { error: "Failed to update support ticket" },
      { status: 500 }
    );
  }
}

// PATCH /api/support/[id] - Update ticket status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, assignedTo, priority } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid ticket ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    let updateOperation: Record<string, unknown> = {};

    switch (action) {
      case "assign":
        updateOperation = {
          $set: {
            assignedTo,
            status: "in_progress",
            updatedAt: new Date(),
          },
        };
        break;

      case "resolve":
        updateOperation = {
          $set: {
            status: "resolved",
            resolvedAt: new Date(),
            updatedAt: new Date(),
          },
        };
        break;

      case "close":
        updateOperation = {
          $set: {
            status: "closed",
            updatedAt: new Date(),
          },
        };
        break;

      case "reopen":
        updateOperation = {
          $set: {
            status: "open",
            updatedAt: new Date(),
          },
          $unset: {
            resolvedAt: "",
          },
        };
        break;

      case "set_priority":
        if (!priority) {
          return NextResponse.json(
            { error: "Priority is required for set_priority action" },
            { status: 400 }
          );
        }
        updateOperation = {
          $set: {
            priority,
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

    const result = await db.collection<SupportTicket>("support_tickets").findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateOperation,
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Support ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: result,
    });
  } catch (error) {
    console.error("Error updating support ticket:", error);
    return NextResponse.json(
      { error: "Failed to update support ticket" },
      { status: 500 }
    );
  }
}

// DELETE /api/support/[id] - Delete a support ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid ticket ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db.collection<SupportTicket>("support_tickets").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Support ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Support ticket deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting support ticket:", error);
    return NextResponse.json(
      { error: "Failed to delete support ticket" },
      { status: 500 }
    );
  }
}
