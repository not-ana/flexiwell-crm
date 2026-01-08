// Wellhub Webhook Handler
// POST /api/webhook/wellhub - Handle all Wellhub webhook events

import { NextRequest, NextResponse } from "next/server";
import { verifyAndParseWebhook } from "@/lib/wellhub/signature";
import { wellhubClient, WellhubApiException } from "@/lib/wellhub/client";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type {
  WellhubWebhookEvent,
  WellhubBookingWebhook,
  WellhubCheckinWebhook,
  WellhubCancellationWebhook,
} from "@/lib/wellhub/types";

export const runtime = "nodejs";

// Handle booking created webhook
async function handleBookingCreated(data: WellhubBookingWebhook["data"]) {
  const db = await getDatabase();

  console.log("Wellhub booking created:", data.booking_id);

  // Find or create client from Wellhub user
  let client = await db.collection("clients").findOne({
    $or: [
      { wellhubId: data.user.unique_token },
      { email: data.user.email },
    ],
  });

  if (!client && data.user.email) {
    // Create new client from Wellhub member
    const newClient = {
      name: data.user.name || "Wellhub Member",
      email: data.user.email,
      phone: data.user.phone || "",
      wellhubId: data.user.unique_token,
      isWellhubMember: true,
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
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("clients").insertOne(newClient);
    client = { ...newClient, _id: result.insertedId };
    console.log("Created new Wellhub client:", client._id);
  } else if (client && !client.wellhubId) {
    // Link existing client with Wellhub ID
    await db.collection("clients").updateOne(
      { _id: client._id },
      {
        $set: {
          wellhubId: data.user.unique_token,
          isWellhubMember: true,
          updatedAt: new Date(),
        },
      }
    );
  }

  if (!client) {
    console.error("Could not find or create client for Wellhub booking");
    // Reject booking if we can't process it
    await wellhubClient.rejectBooking(
      data.booking_id,
      "Unable to process booking - client not found"
    );
    return;
  }

  // Find the class by Wellhub class ID or by matching details
  const classDoc = await db.collection("classes").findOne({
    $or: [
      { wellhubClassId: data.class.id },
      {
        title: data.class.name,
        scheduledDate: { $gte: new Date(data.class.start_time) },
      },
    ],
  });

  if (!classDoc) {
    console.error("Class not found for Wellhub booking:", data.class.id);
    await wellhubClient.rejectBooking(
      data.booking_id,
      "Class not found or not available"
    );
    return;
  }

  // Check capacity
  if (classDoc.currentEnrollment >= classDoc.maxCapacity) {
    console.log("Class is full, rejecting Wellhub booking");
    await wellhubClient.rejectBooking(data.booking_id, "Class is full");
    return;
  }

  // Create booking
  const booking = {
    clientId: client._id.toString(),
    clientName: client.name,
    classId: classDoc._id.toString(),
    className: classDoc.title,
    instructorId: classDoc.instructorId,
    instructorName: classDoc.instructorName,
    scheduledDate: new Date(data.class.start_time),
    startTime: new Date(data.class.start_time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    endTime: new Date(data.class.end_time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    status: "confirmed" as const,
    source: "bot" as const, // Using 'bot' for external integrations
    wellhubBookingId: data.booking_id,
    isWellhubBooking: true,
    wellhubStatus: "accepted" as const,
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

  // Accept the booking on Wellhub (must be within 15 minutes)
  try {
    await wellhubClient.acceptBooking(data.booking_id);
    console.log("Wellhub booking accepted:", data.booking_id);
  } catch (error) {
    console.error("Failed to accept Wellhub booking:", error);
    // Booking is created locally, but we failed to notify Wellhub
    // Log for manual review
    await db.collection("wellhub_errors").insertOne({
      type: "booking_accept_failed",
      bookingId: data.booking_id,
      error: error instanceof Error ? error.message : "Unknown error",
      createdAt: new Date(),
    });
  }

  // Log activity
  await db.collection("activities").insertOne({
    type: "booking",
    action: "wellhub_booking_created",
    description: `Wellhub booking created for ${client.name} - ${classDoc.title}`,
    entityId: booking.wellhubBookingId,
    entityType: "booking",
    metadata: {
      wellhubBookingId: data.booking_id,
      clientId: client._id.toString(),
      classId: classDoc._id.toString(),
    },
    createdAt: new Date(),
  });
}

// Handle check-in webhook
async function handleCheckin(data: WellhubCheckinWebhook["data"]) {
  const db = await getDatabase();

  console.log("Wellhub check-in:", data.checkin_id);

  // Find client by Wellhub ID
  const client = await db.collection("clients").findOne({
    wellhubId: data.user.unique_token,
  });

  if (!client) {
    console.error("Client not found for Wellhub check-in:", data.user.unique_token);
    return;
  }

  // Find pending booking for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const booking = await db.collection("bookings").findOne({
    clientId: client._id.toString(),
    isWellhubBooking: true,
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
          wellhubCheckedIn: true,
          wellhubCheckedInAt: new Date(data.checked_in_at),
          updatedAt: new Date(),
        },
      }
    );

    // Validate check-in with Wellhub API (generates payment)
    try {
      await wellhubClient.validateCheckin({
        gympass_id: data.user.gympass_id,
      });
      console.log("Wellhub check-in validated:", data.user.gympass_id);
    } catch (error) {
      if (error instanceof WellhubApiException && error.isConflict()) {
        // Already validated, ignore
        console.log("Wellhub check-in already validated");
      } else {
        console.error("Failed to validate Wellhub check-in:", error);
      }
    }
  } else {
    // No booking found, but member checked in (walk-in)
    console.log("Wellhub check-in without booking, creating walk-in record");

    // Still validate with Wellhub for payment
    try {
      await wellhubClient.validateCheckin({
        gympass_id: data.user.gympass_id,
      });
    } catch (error) {
      console.error("Failed to validate Wellhub walk-in check-in:", error);
    }
  }

  // Log activity
  await db.collection("activities").insertOne({
    type: "booking",
    action: "wellhub_checkin",
    description: `Wellhub check-in for ${client.name}`,
    entityId: data.checkin_id,
    entityType: "checkin",
    metadata: {
      clientId: client._id.toString(),
      gympassId: data.user.gympass_id,
    },
    createdAt: new Date(),
  });
}

// Handle cancellation webhook
async function handleCancellation(data: WellhubCancellationWebhook["data"]) {
  const db = await getDatabase();

  console.log("Wellhub booking cancelled:", data.booking_id);

  // Find and cancel the booking
  const booking = await db.collection("bookings").findOne({
    wellhubBookingId: data.booking_id,
  });

  if (!booking) {
    console.error("Booking not found for Wellhub cancellation:", data.booking_id);
    return;
  }

  // Update booking status
  await db.collection("bookings").updateOne(
    { _id: booking._id },
    {
      $set: {
        status: "cancelled",
        wellhubStatus: "cancelled",
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
    action: "wellhub_booking_cancelled",
    description: `Wellhub booking cancelled for ${booking.clientName}`,
    entityId: data.booking_id,
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
    const signature = request.headers.get("x-gympass-signature");

    // Verify webhook signature
    const { valid, data, error } = await verifyAndParseWebhook<WellhubWebhookEvent>(
      rawBody,
      signature
    );

    if (!valid || !data) {
      console.error("Wellhub webhook verification failed:", error);
      return NextResponse.json({ error }, { status: 401 });
    }

    console.log("Received Wellhub webhook:", data.event);

    // Route to appropriate handler
    switch (data.event) {
      case "booking_created":
        await handleBookingCreated((data as WellhubBookingWebhook).data);
        break;

      case "checkin":
        await handleCheckin((data as WellhubCheckinWebhook).data);
        break;

      case "booking_cancelled":
        await handleCancellation((data as WellhubCancellationWebhook).data);
        break;

      default:
        console.log("Unhandled Wellhub webhook event:", (data as WellhubWebhookEvent).event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Wellhub webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (if required by Wellhub)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ status: "ok" });
}
