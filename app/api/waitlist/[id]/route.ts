import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { WaitlistEntry, WaitlistNotification } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";
import { notificationService } from "@/lib/services/notification.service";

// GET /api/waitlist/[id] - Get a single waitlist entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid waitlist entry ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const entry = await db.collection<WaitlistEntry>("waitlist").findOne({
      _id: new ObjectId(id),
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error fetching waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist entry" },
      { status: 500 }
    );
  }
}

// PUT /api/waitlist/[id] - Update a waitlist entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid waitlist entry ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Remove _id and createdAt from update data if present
    const { _id, createdAt, ...updateData } = body;

    const result = await db.collection<WaitlistEntry>("waitlist").findOneAndUpdate(
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
        { error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      entry: result,
    });
  } catch (error) {
    console.error("Error updating waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to update waitlist entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/waitlist/[id] - Delete a waitlist entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid waitlist entry ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db.collection<WaitlistEntry>("waitlist").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Waitlist entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to delete waitlist entry" },
      { status: 500 }
    );
  }
}

// PATCH /api/waitlist/[id] - Update waitlist entry status
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
        { error: "Invalid waitlist entry ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    let updateOperation: Record<string, unknown> = {};

    switch (action) {
      case "notify":
        updateOperation = {
          $set: {
            status: "notified",
            notifiedAt: new Date(),
            notificationExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            updatedAt: new Date(),
          },
        };
        break;

      case "confirm":
        if (!body.classId || !body.className || !body.classDate) {
          return NextResponse.json(
            { error: "Class ID, name, and date are required for confirmation" },
            { status: 400 }
          );
        }
        updateOperation = {
          $set: {
            status: "confirmed",
            confirmedClassId: body.classId,
            confirmedClassName: body.className,
            confirmedDate: new Date(body.classDate),
            updatedAt: new Date(),
          },
        };
        break;

      case "decline":
        updateOperation = {
          $set: {
            status: "declined",
            declinedAt: new Date(),
            declineReason: body.reason || undefined,
            updatedAt: new Date(),
          },
        };
        break;

      case "expire":
        updateOperation = {
          $set: {
            status: "expired",
            updatedAt: new Date(),
          },
        };
        break;

      case "reset":
        updateOperation = {
          $set: {
            status: "waiting",
            updatedAt: new Date(),
          },
          $unset: {
            notifiedAt: "",
            notificationExpiresAt: "",
            confirmedClassId: "",
            confirmedClassName: "",
            confirmedDate: "",
            declinedAt: "",
            declineReason: "",
          },
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const result = await db.collection<WaitlistEntry>("waitlist").findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateOperation,
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    // Send actual notification when action is "notify"
    if (action === "notify") {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const confirmUrl = `${baseUrl}/dashboard/classes/book?confirm=${id}`;

      // Send notification via WhatsApp and SMS (no email)
      const notificationData = {
        type: "waitlist_spot_available" as const,
        clientId: result.clientId,
        data: {
          clientId: result.clientId,
          className: result.preferredClassName || "Aula",
          date: result.confirmedDate
            ? new Date(result.confirmedDate).toLocaleDateString("pt-BR")
            : "",
          startTime: "",
          confirmUrl,
        },
      };

      const [whatsappResult, smsResult] = await Promise.all([
        notificationService.send({ ...notificationData, channels: "whatsapp" }),
        notificationService.send({ ...notificationData, channels: "sms" }),
      ]);

      const sent = whatsappResult.success || smsResult.success;

      // Log waitlist notification record for tracking
      const notificationRecord: Omit<WaitlistNotification, "_id"> = {
        waitlistEntryId: id,
        clientId: result.clientId,
        clientName: result.clientName,
        classId: result.preferredClassId || "",
        className: result.preferredClassName || "Aula",
        classDate: result.confirmedDate || new Date(),
        classTime: "",
        spotsAvailable: 1,
        status: sent ? "sent" : "expired",
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        notificationChannel: whatsappResult.whatsappSent ? "whatsapp" : "sms",
        createdAt: new Date(),
      };

      await db
        .collection<WaitlistNotification>("waitlist_notifications")
        .insertOne(notificationRecord as WaitlistNotification);

      return NextResponse.json({
        success: true,
        entry: result,
        notification: {
          sent,
          whatsappSent: whatsappResult.whatsappSent || false,
          smsSent: smsResult.smsSent || false,
          error: whatsappResult.error || smsResult.error,
        },
      });
    }

    return NextResponse.json({
      success: true,
      entry: result,
    });
  } catch (error) {
    console.error("Error updating waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to update waitlist entry" },
      { status: 500 }
    );
  }
}
