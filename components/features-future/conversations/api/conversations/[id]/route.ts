import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Conversation } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/conversations/[id] - Get a single conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const conversation = await db.collection<Conversation>("conversations").findOne({
      _id: new ObjectId(id),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

// PUT /api/conversations/[id] - Update a conversation (add message)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // If adding a message
    if (body.message) {
      const newMessage = {
        id: `msg-${Date.now()}`,
        from: body.message.from || "admin",
        content: body.message.content,
        timestamp: new Date(),
        metadata: body.message.metadata,
      };

      const result = await db.collection<Conversation>("conversations").findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $push: { messages: newMessage },
          $set: {
            updatedAt: new Date(),
            "context.awaitingResponse": body.message.from === "client",
          },
        },
        { returnDocument: "after" }
      );

      if (!result) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        conversation: result,
      });
    }

    // General update
    const { _id, createdAt, ...updateData } = body;
    const result = await db.collection<Conversation>("conversations").findOneAndUpdate(
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
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: result,
    });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Update conversation status
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
        { error: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    let updateOperation: Record<string, unknown> = {};

    switch (action) {
      case "close":
        updateOperation = {
          $set: {
            status: "closed",
            "context.awaitingResponse": false,
            updatedAt: new Date(),
          },
        };
        break;

      case "reopen":
        updateOperation = {
          $set: {
            status: "active",
            updatedAt: new Date(),
          },
        };
        break;

      case "mark_read":
        updateOperation = {
          $set: {
            "context.awaitingResponse": false,
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

    const result = await db.collection<Conversation>("conversations").findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateOperation,
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation: result,
    });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete a conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db.collection<Conversation>("conversations").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
