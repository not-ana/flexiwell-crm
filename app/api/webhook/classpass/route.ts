// ClassPass Webhook Handler
// POST /api/webhook/classpass - Handle all ClassPass webhook events

import { NextRequest, NextResponse } from "next/server";
import { verifyAndParseWebhook } from "@/lib/classpass/signature";
import { classpassClient } from "@/lib/classpass/client";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type {
  ClassPassWebhookEvent,
  ClassPassReservationWebhook,
  ClassPassCheckinWebhook,
  ClassPassNoShowWebhook,
} from "@/lib/classpass/types";

export const runtime = "nodejs";

// Handle reservation created webhook
async function handleReservationCreated(data: ClassPassReservationWebhook["data"]) {
  const db = await getDatabase();

  console.log("ClassPass reservation created:", data.id);

  // Find or create client from ClassPass user
  let client = await db.collection("clients").findOne({
    $or: [
      { classpassId: data.user.id },
      { email: data.user.email },
    ],
  });

  if (!client) {
    // Create new client from ClassPass user
    const newClient = {
      name: `${data.user.firstName} ${data.user.lastName}`,
      email: data.user.email,
      phone: data.user.phone || "",
      classpassId: data.user.id,
      isClassPassMember: true,
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
          whatsapp: false,
          instagram: false,
          sms: true,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("clients").insertOne(newClient);
    client = { ...newClient, _id: result.insertedId };
    console.log("Created new ClassPass client:", client._id);
  } else if (!client.classpassId) {
    // Link existing client with ClassPass ID
    await db.collection("clients").updateOne(
      { _id: client._id },
      {
        $set: {
          classpassId: data.user.id,
          isClassPassMember: true,
          updatedAt: new Date(),
        },
      }
    );
  }

  // Find the class by ClassPass schedule ID or by matching details
  // Build query conditions, excluding null values
  const orConditions: Record<string, unknown>[] = [
    { classpassScheduleId: data.schedule.id },
    {
      title: data.schedule.name,
      scheduledDate: { $gte: new Date(data.schedule.startAt) },
    },
  ];

  // Only add _id condition if externalId is provided
  if (data.schedule.externalId) {
    orConditions.push({ _id: new ObjectId(data.schedule.externalId) });
  }

  const classDoc = await db.collection("classes").findOne({
    $or: orConditions,
  });

  if (!classDoc) {
    console.error("Class not found for ClassPass reservation:", data.schedule.id);
    await classpassClient.declineReservation(
      data.id,
      "Class not found or not available"
    );
    return;
  }

  // Check capacity
  if (classDoc.currentEnrollment >= classDoc.maxCapacity) {
    console.log("Class is full, declining ClassPass reservation");
    await classpassClient.declineReservation(data.id, "Class is full");
    return;
  }

  // Create booking
  const scheduleStart = new Date(data.schedule.startAt);
  const scheduleEnd = new Date(data.schedule.endAt);

  const booking = {
    clientId: client._id.toString(),
    clientName: client.name,
    classId: classDoc._id.toString(),
    className: classDoc.title,
    instructorId: classDoc.instructorId,
    instructorName: classDoc.instructorName,
    scheduledDate: scheduleStart,
    startTime: scheduleStart.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    endTime: scheduleEnd.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    status: "confirmed" as const,
    source: "bot" as const,
    classpassReservationId: data.id,
    isClassPassBooking: true,
    classpassState: "confirmed" as const,
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

  // Confirm the reservation on ClassPass
  try {
    await classpassClient.confirmReservation(data.id);
    console.log("ClassPass reservation confirmed:", data.id);
  } catch (error) {
    console.error("Failed to confirm ClassPass reservation:", error);
    await db.collection("marketplace_errors").insertOne({
      provider: "classpass",
      type: "reservation_confirm_failed",
      bookingId: data.id,
      error: error instanceof Error ? error.message : "Unknown error",
      createdAt: new Date(),
    });
  }

  // Log activity
  await db.collection("activities").insertOne({
    type: "booking",
    action: "classpass_reservation_created",
    description: `ClassPass reservation created for ${client.name} - ${classDoc.title}`,
    entityId: data.id,
    entityType: "booking",
    metadata: {
      classpassReservationId: data.id,
      clientId: client._id.toString(),
      classId: classDoc._id.toString(),
    },
    createdAt: new Date(),
  });
}

// Handle check-in webhook
async function handleCheckin(data: ClassPassCheckinWebhook["data"]) {
  const db = await getDatabase();

  console.log("ClassPass check-in:", data.reservationId);

  // Find the booking
  const booking = await db.collection("bookings").findOne({
    classpassReservationId: data.reservationId,
  });

  if (booking) {
    // Update booking as attended
    await db.collection("bookings").updateOne(
      { _id: booking._id },
      {
        $set: {
          status: "completed",
          classpassCheckedIn: true,
          classpassCheckedInAt: new Date(data.checkedInAt),
          classpassState: "completed",
          updatedAt: new Date(),
        },
      }
    );
    console.log("ClassPass check-in recorded for booking:", booking._id);
  } else {
    console.error("Booking not found for ClassPass check-in:", data.reservationId);
  }

  // Log activity
  const client = await db.collection("clients").findOne({
    classpassId: data.user.id,
  });

  await db.collection("activities").insertOne({
    type: "booking",
    action: "classpass_checkin",
    description: `ClassPass check-in for ${client?.name || data.user.firstName}`,
    entityId: data.reservationId,
    entityType: "checkin",
    metadata: {
      reservationId: data.reservationId,
      userId: data.user.id,
    },
    createdAt: new Date(),
  });
}

// Handle cancellation webhook
async function handleCancellation(data: ClassPassReservationWebhook["data"]) {
  const db = await getDatabase();

  console.log("ClassPass reservation cancelled:", data.id);

  // Find and cancel the booking
  const booking = await db.collection("bookings").findOne({
    classpassReservationId: data.id,
  });

  if (!booking) {
    console.error("Booking not found for ClassPass cancellation:", data.id);
    return;
  }

  // Update booking status
  await db.collection("bookings").updateOne(
    { _id: booking._id },
    {
      $set: {
        status: "cancelled",
        classpassState: "cancelled",
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
    action: "classpass_reservation_cancelled",
    description: `ClassPass reservation cancelled for ${booking.clientName}`,
    entityId: data.id,
    entityType: "booking",
    metadata: {
      bookingId: booking._id.toString(),
    },
    createdAt: new Date(),
  });
}

// Handle no-show webhook
async function handleNoShow(data: ClassPassNoShowWebhook["data"]) {
  const db = await getDatabase();

  console.log("ClassPass no-show:", data.reservationId);

  // Find and update the booking
  const booking = await db.collection("bookings").findOne({
    classpassReservationId: data.reservationId,
  });

  if (booking) {
    await db.collection("bookings").updateOne(
      { _id: booking._id },
      {
        $set: {
          status: "no_show",
          classpassState: "no_show",
          updatedAt: new Date(),
        },
      }
    );
  }

  // Log activity
  await db.collection("activities").insertOne({
    type: "booking",
    action: "classpass_no_show",
    description: `ClassPass no-show recorded for reservation ${data.reservationId}`,
    entityId: data.reservationId,
    entityType: "booking",
    metadata: {
      reservationId: data.reservationId,
      markedAt: data.markedAt,
    },
    createdAt: new Date(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-classpass-signature");

    // Verify webhook signature
    const { valid, data, error } = await verifyAndParseWebhook<ClassPassWebhookEvent>(
      rawBody,
      signature
    );

    if (!valid || !data) {
      console.error("ClassPass webhook verification failed:", error);
      return NextResponse.json({ error }, { status: 401 });
    }

    console.log("Received ClassPass webhook:", data.event);

    // Route to appropriate handler
    switch (data.event) {
      case "reservation.created":
        await handleReservationCreated((data as ClassPassReservationWebhook).data);
        break;

      case "reservation.checkin":
        await handleCheckin((data as ClassPassCheckinWebhook).data);
        break;

      case "reservation.cancelled":
        await handleCancellation((data as ClassPassReservationWebhook).data);
        break;

      case "reservation.no_show":
        await handleNoShow((data as ClassPassNoShowWebhook).data);
        break;

      default:
        console.log("Unhandled ClassPass webhook event:", (data as ClassPassWebhookEvent).event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("ClassPass webhook error:", error);
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
