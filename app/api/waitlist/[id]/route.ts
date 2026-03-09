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

// DELETE /api/waitlist/[id] - Soft-delete (move to trash)
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

    // Check for ?permanent=true to hard-delete from trash
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
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
        message: "Waitlist entry permanently deleted",
      });
    }

    // Soft-delete: move to "removed" status
    const result = await db.collection<WaitlistEntry>("waitlist").findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "removed",
          removedAt: new Date(),
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

    // Auto-cleanup: permanently delete entries removed more than 7 days ago
    await db.collection<WaitlistEntry>("waitlist").deleteMany({
      status: "removed",
      removedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    return NextResponse.json({
      success: true,
      message: "Moved to trash. Will be permanently deleted after 7 days.",
      entry: result,
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

      case "restore":
        updateOperation = {
          $set: {
            status: "waiting",
            updatedAt: new Date(),
          },
          $unset: {
            removedAt: "",
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

      // Look up client notification preferences
      const client = await db.collection("clients").findOne({
        _id: new ObjectId(result.clientId),
      });
      const prefs = client?.preferences?.notifications;
      const wantsSMS = prefs?.sms !== false; // default true
      const wantsEmail = prefs?.email !== false; // default true

      const notificationData = {
        type: "waitlist_spot_available" as const,
        clientId: result.clientId,
        data: {
          clientId: result.clientId,
          className: result.className || "Class",
          date: result.createdAt
            ? new Date(result.createdAt).toLocaleDateString("en-US")
            : "",
          startTime: "",
          confirmUrl,
        },
      };

      // Send via SMS (primary) and Email (secondary)
      const smsResult = wantsSMS
        ? await notificationService.send({ ...notificationData, channels: "sms" })
        : { success: false, error: "SMS disabled by client", smsSent: false };

      const emailResult = wantsEmail
        ? await notificationService.send({ ...notificationData, channels: "email" })
        : { success: false, error: "Email disabled by client", emailSent: false };

      const sent = smsResult.success || emailResult.success;
      const noChannelsEnabled = !wantsSMS && !wantsEmail;

      // Build per-channel status for the frontend
      const channels: { name: string; sent: boolean; error?: string; disabled?: boolean }[] = [];
      if (wantsSMS) {
        channels.push({ name: "sms", sent: !!smsResult.smsSent, error: smsResult.error });
      } else {
        channels.push({ name: "sms", sent: false, disabled: true });
      }
      if (wantsEmail) {
        channels.push({ name: "email", sent: !!emailResult.emailSent, error: emailResult.error });
      } else {
        channels.push({ name: "email", sent: false, disabled: true });
      }

      // Log waitlist notification record for tracking
      const notificationRecord: Omit<WaitlistNotification, "_id"> = {
        waitlistEntryId: id,
        clientId: result.clientId,
        clientName: result.clientName,
        classId: result.classId || "",
        className: result.className || "Class",
        classDate: result.createdAt || new Date(),
        classTime: "",
        spotsAvailable: 1,
        status: sent ? "sent" : "expired",
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        notificationChannel: smsResult.smsSent ? "sms" : "email",
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
          smsSent: smsResult.smsSent || false,
          emailSent: emailResult.emailSent || false,
          channels,
          noChannelsEnabled,
          error: smsResult.error || emailResult.error,
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
