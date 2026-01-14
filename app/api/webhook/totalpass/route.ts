// TotalPass Webhook Handler
// POST /api/webhook/totalpass - Handle all TotalPass webhook events

import { NextRequest, NextResponse } from "next/server";
import { verifyAndParseWebhook } from "@/lib/totalpass/signature";
import { totalpassClient, TotalPassApiException } from "@/lib/totalpass/client";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type {
  TotalPassWebhookEvent,
  TotalPassBookingWebhook,
  TotalPassCheckinWebhook,
  TotalPassCancellationWebhook,
} from "@/lib/totalpass/types";

export const runtime = "nodejs";

// Handle booking created webhook
async function handleBookingCreated(data: TotalPassBookingWebhook["data"]) {
  const db = await getDatabase();

  console.log("TotalPass booking created:", data.bookingId);

  // Find or create client from TotalPass member
  let client = await db.collection("clients").findOne({
    $or: [
      { totalpassId: data.member.id },
      { email: data.member.email },
    ],
  });

  if (!client && data.member.email) {
    // Create new client from TotalPass member
    const newClient = {
      name: data.member.name || "TotalPass Member",
      email: data.member.email,
      phone: data.member.phone || "",
      totalpassId: data.member.id,
      isTotalPassMember: true,
      plan: {
        type: "drop-in" as const,
        totalClasses: 0,
        usedClasses: 0,
        remainingClasses: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        price: 0,
      },
      status: "active" as const,
      preferences: {
        notifications: {
          email: true,
          whatsapp: true,
          instagram: false,
          sms: false,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("clients").insertOne(newClient);
    client = { ...newClient, _id: result.insertedId };
    console.log("Created new TotalPass client:", client._id);
  } else if (client && !client.totalpassId) {
    // Link existing client with TotalPass ID
    await db.collection("clients").updateOne(
      { _id: client._id },
      {
        $set: {
          totalpassId: data.member.id,
          isTotalPassMember: true,
          updatedAt: new Date(),
        },
      }
    );
  }

  if (!client) {
    console.error("Could not find or create client for TotalPass booking");
    await totalpassClient.rejectBooking(
      data.bookingId,
      "Unable to process booking - client not found"
    );
    return;
  }

  // Find the class by TotalPass class ID or by matching details
  const classDoc = await db.collection("classes").findOne({
    $or: [
      { totalpassClassId: data.class.id },
      {
        title: data.class.name,
        scheduledDate: { $gte: new Date(data.class.datetime) },
      },
    ],
  });

  if (!classDoc) {
    console.error("Class not found for TotalPass booking:", data.class.id);
    await totalpassClient.rejectBooking(
      data.bookingId,
      "Class not found or not available"
    );
    return;
  }

  // Check capacity
  if (classDoc.currentEnrollment >= classDoc.maxCapacity) {
    console.log("Class is full, rejecting TotalPass booking");
    await totalpassClient.rejectBooking(data.bookingId, "Class is full");
    return;
  }

  // Create booking
  const classDatetime = new Date(data.class.datetime);
  const booking = {
    clientId: client._id.toString(),
    clientName: client.name,
    classId: classDoc._id.toString(),
    className: classDoc.title,
    instructorId: classDoc.instructorId,
    instructorName: classDoc.instructorName,
    scheduledDate: classDatetime,
    startTime: classDatetime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    endTime: classDoc.endTime,
    status: "confirmed" as const,
    source: "bot" as const,
    totalpassBookingId: data.bookingId,
    isTotalPassBooking: true,
    totalpassStatus: "accepted" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection("bookings").insertOne(booking);

  // Update class enrollment
  await db.collection("classes").updateOne(
    { _id: classDoc._id },
    {
      $inc: { currentEnrollment: 1 },
      $push: {
        enrolledClients: {
          clientId: client._id.toString(),
          clientName: client.name,
          status: "confirmed",
          enrolledAt: new Date(),
        } as never,
      },
      $set: { updatedAt: new Date() },
    }
  );

  // Accept the booking on TotalPass
  try {
    await totalpassClient.acceptBooking(data.bookingId);
    console.log("TotalPass booking accepted:", data.bookingId);
  } catch (error) {
    console.error("Failed to accept TotalPass booking:", error);
    await db.collection("marketplace_errors").insertOne({
      provider: "totalpass",
      type: "booking_accept_failed",
      bookingId: data.bookingId,
      error: error instanceof Error ? error.message : "Unknown error",
      createdAt: new Date(),
    });
  }

  // Log activity
  await db.collection("activities").insertOne({
    type: "booking",
    action: "totalpass_booking_created",
    description: `TotalPass booking created for ${client.name} - ${classDoc.title}`,
    entityId: booking.totalpassBookingId,
    entityType: "booking",
    metadata: {
      totalpassBookingId: data.bookingId,
      clientId: client._id.toString(),
      classId: classDoc._id.toString(),
    },
    createdAt: new Date(),
  });
}

// Handle check-in webhook
async function handleCheckin(data: TotalPassCheckinWebhook["data"]) {
  const db = await getDatabase();

  console.log("TotalPass check-in:", data.checkinId);

  // Find client by TotalPass ID
  const client = await db.collection("clients").findOne({
    totalpassId: data.member.id,
  });

  if (!client) {
    console.error("Client not found for TotalPass check-in:", data.member.id);
    return;
  }

  // Find pending booking for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const booking = await db.collection("bookings").findOne({
    clientId: client._id.toString(),
    isTotalPassBooking: true,
    scheduledDate: { $gte: today, $lt: tomorrow },
    status: { $in: ["confirmed", "pending"] },
  });

  if (booking) {
    // Update booking as attended
    await db.collection("bookings").updateOne(
      { _id: booking._id },
      {
        $set: {
          status: "completed",
          totalpassCheckedIn: true,
          totalpassCheckedInAt: new Date(data.checkedInAt),
          updatedAt: new Date(),
        },
      }
    );

    // Validate check-in with TotalPass API
    try {
      await totalpassClient.validateCheckin({
        cardNumber: data.member.cardNumber,
      });
      console.log("TotalPass check-in validated:", data.member.cardNumber);
    } catch (error) {
      if (error instanceof TotalPassApiException && error.isConflict()) {
        console.log("TotalPass check-in already validated");
      } else {
        console.error("Failed to validate TotalPass check-in:", error);
      }
    }
  } else {
    // Walk-in check-in
    console.log("TotalPass check-in without booking, creating walk-in record");
    try {
      await totalpassClient.validateCheckin({
        cardNumber: data.member.cardNumber,
      });
    } catch (error) {
      console.error("Failed to validate TotalPass walk-in check-in:", error);
    }
  }

  // Log activity
  await db.collection("activities").insertOne({
    type: "booking",
    action: "totalpass_checkin",
    description: `TotalPass check-in for ${client.name}`,
    entityId: data.checkinId,
    entityType: "checkin",
    metadata: {
      clientId: client._id.toString(),
      cardNumber: data.member.cardNumber,
    },
    createdAt: new Date(),
  });
}

// Handle cancellation webhook
async function handleCancellation(data: TotalPassCancellationWebhook["data"]) {
  const db = await getDatabase();

  console.log("TotalPass booking cancelled:", data.bookingId);

  // Find and cancel the booking
  const booking = await db.collection("bookings").findOne({
    totalpassBookingId: data.bookingId,
  });

  if (!booking) {
    console.error("Booking not found for TotalPass cancellation:", data.bookingId);
    return;
  }

  // Update booking status
  await db.collection("bookings").updateOne(
    { _id: booking._id },
    {
      $set: {
        status: "cancelled",
        totalpassStatus: "cancelled",
        updatedAt: new Date(),
      },
    }
  );

  // Update class enrollment
  await db.collection("classes").updateOne(
    { _id: new ObjectId(booking.classId) },
    {
      $inc: { currentEnrollment: -1 },
      $set: {
        "enrolledClients.$[elem].status": "cancelled",
        updatedAt: new Date(),
      },
    },
    {
      arrayFilters: [{ "elem.clientId": booking.clientId }],
    }
  );

  // Log activity
  await db.collection("activities").insertOne({
    type: "cancel",
    action: "totalpass_booking_cancelled",
    description: `TotalPass booking cancelled for ${booking.clientName}`,
    entityId: data.bookingId,
    entityType: "booking",
    metadata: {
      bookingId: booking._id.toString(),
      reason: data.reason,
    },
    createdAt: new Date(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-totalpass-signature");

    // Verify webhook signature
    const { valid, data, error } = await verifyAndParseWebhook<TotalPassWebhookEvent>(
      rawBody,
      signature
    );

    if (!valid || !data) {
      console.error("TotalPass webhook verification failed:", error);
      return NextResponse.json({ error }, { status: 401 });
    }

    console.log("Received TotalPass webhook:", data.event);

    // Route to appropriate handler
    switch (data.event) {
      case "booking.created":
        await handleBookingCreated((data as TotalPassBookingWebhook).data);
        break;

      case "checkin":
        await handleCheckin((data as TotalPassCheckinWebhook).data);
        break;

      case "booking.cancelled":
        await handleCancellation((data as TotalPassCancellationWebhook).data);
        break;

      default:
        console.log("Unhandled TotalPass webhook event:", (data as TotalPassWebhookEvent).event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("TotalPass webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ status: "ok" });
}
