import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { messagingService } from "@/lib/services/messaging.service";
import type { Conversation } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// POST /api/conversations/[id]/send - Send a message and deliver to platform
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, from = "admin" } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get the conversation
    const conversation = await db.collection<Conversation>("conversations").findOne({
      _id: new ObjectId(id),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Send message via the messaging service (this sends to platform AND saves to DB)
    const result = await messagingService.sendMessage(id, content, from);

    if (!result.success) {
      // If platform send failed, still save the message locally
      const newMessage = {
        id: `msg-${from}-${Date.now()}`,
        from,
        content,
        timestamp: new Date(),
        metadata: {
          deliveryFailed: true,
          error: result.error,
        },
      };

      await db.collection<Conversation>("conversations").updateOne(
        { _id: new ObjectId(id) },
        {
          $push: { messages: newMessage },
          $set: {
            updatedAt: new Date(),
            "context.awaitingResponse": false,
          },
        }
      );

      // Return with warning about delivery failure
      const updatedConversation = await db.collection<Conversation>("conversations").findOne({
        _id: new ObjectId(id),
      });

      return NextResponse.json({
        success: true,
        warning: `Message saved but delivery failed: ${result.error}`,
        conversation: updatedConversation,
      });
    }

    // Get updated conversation
    const updatedConversation = await db.collection<Conversation>("conversations").findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      conversation: updatedConversation,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
