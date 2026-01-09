import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { notificationService, NotificationChannel } from "@/lib/services/notification.service";
import type { Client } from "@/lib/db/schemas";

// POST /api/clients/[id]/message - Send a message to a specific client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { subject, message, channel = "both" as NotificationChannel } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid client ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get the client
    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(id),
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Send the notification
    const result = await notificationService.sendCustomMessage(
      id,
      subject || "Mensagem do Studio",
      message,
      channel
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send message" },
        { status: 500 }
      );
    }

    // Log the message
    await db.collection("client_messages").insertOne({
      clientId: new ObjectId(id),
      clientName: client.name,
      subject,
      message,
      channel,
      sentAt: new Date(),
      results: result,
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      results: result,
    });
  } catch (error) {
    console.error("Error sending message to client:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
