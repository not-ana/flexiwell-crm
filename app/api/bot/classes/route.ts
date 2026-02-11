import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Class, Booking, Client } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/bot/classes - Get available classes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const type = searchParams.get("type"); // "available" | "enrolled"
    const days = parseInt(searchParams.get("days") || "7");

    const db = await getDatabase();
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    if (type === "enrolled" && clientId) {
      // Get client's enrolled classes
      const bookings = await db.collection<Booking>("bookings")
        .find({
          clientId,
          scheduledDate: { $gte: now },
          status: "confirmed",
        })
        .sort({ scheduledDate: 1 })
        .toArray();

      return NextResponse.json({ classes: bookings });
    }

    // Get available classes
    const classes = await db.collection<Class>("classes")
      .find({
        scheduledDate: { $gte: now, $lte: endDate },
        status: "scheduled",
        $expr: { $lt: ["$currentEnrollment", "$maxCapacity"] },
      })
      .sort({ scheduledDate: 1 })
      .toArray();

    return NextResponse.json({
      classes: classes.map((cls) => ({
        id: cls._id,
        title: cls.title,
        type: cls.type,
        instructor: cls.instructorName,
        date: cls.scheduledDate,
        startTime: cls.startTime,
        endTime: cls.endTime,
        duration: cls.duration,
        spotsAvailable: cls.maxCapacity - cls.currentEnrollment,
        maxCapacity: cls.maxCapacity,
      })),
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/bot/classes/book - Book a class
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, classId, source = "bot" } = body;

    if (!clientId || !classId) {
      return NextResponse.json(
        { error: "clientId and classId are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get client
    const client = await db.collection("clients").findOne({
      _id: new ObjectId(clientId),
    }) as Client | null;

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check remaining classes
    if (client.plan.remainingClasses <= 0) {
      return NextResponse.json(
        { error: "No remaining classes in plan", code: "NO_CLASSES" },
        { status: 400 }
      );
    }

    // Get class
    const classDoc = await db.collection("classes").findOne({
      _id: new ObjectId(classId),
      status: "scheduled",
    }) as Class | null;

    if (!classDoc) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Check capacity
    if (classDoc.currentEnrollment >= classDoc.maxCapacity) {
      return NextResponse.json(
        { error: "Class is full", code: "CLASS_FULL" },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingBooking = await db.collection<Booking>("bookings").findOne({
      clientId,
      classId,
      status: "confirmed",
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "Already enrolled in this class", code: "ALREADY_ENROLLED" },
        { status: 400 }
      );
    }

    // Create booking
    const booking: Booking = {
      clientId,
      clientName: client.name,
      classId,
      className: classDoc.title,
      instructorId: classDoc.instructorId,
      instructorName: classDoc.instructorName,
      scheduledDate: classDoc.scheduledDate,
      startTime: classDoc.startTime,
      endTime: classDoc.endTime,
      status: "confirmed",
      source,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Booking>("bookings").insertOne(booking);

    // Update class enrollment
    await db.collection("classes").updateOne(
      { _id: new ObjectId(classId) },
       
      {
        $inc: { currentEnrollment: 1 },
        $push: {
          enrolledClients: {
            clientId,
            clientName: client.name,
            status: "confirmed",
            enrolledAt: new Date(),
          },
        },
      } as any
    );

    // Update client's remaining classes
    await db.collection("clients").updateOne(
      { _id: new ObjectId(clientId) },
      {
        $inc: { "plan.usedClasses": 1, "plan.remainingClasses": -1 },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json({
      success: true,
      bookingId: result.insertedId,
      booking: {
        className: classDoc.title,
        instructor: classDoc.instructorName,
        date: classDoc.scheduledDate,
        startTime: classDoc.startTime,
        endTime: classDoc.endTime,
      },
      remainingClasses: client.plan.remainingClasses - 1,
    });
  } catch (error) {
    console.error("Error booking class:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/bot/classes/cancel - Cancel a booking
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, bookingId } = body;

    if (!clientId || !bookingId) {
      return NextResponse.json(
        { error: "clientId and bookingId are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get booking
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
      clientId,
      status: "confirmed",
    }) as Booking | null;

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check cancellation window (24h before)
    const classDate = new Date(booking.scheduledDate);
    const now = new Date();
    const hoursUntilClass = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilClass < 24) {
      return NextResponse.json(
        {
          error: "Cannot cancel within 24 hours of class",
          code: "TOO_LATE",
          hoursUntilClass: Math.round(hoursUntilClass),
        },
        { status: 400 }
      );
    }

    // Cancel booking
    await db.collection("bookings").updateOne(
      { _id: new ObjectId(bookingId) },
      { $set: { status: "cancelled", updatedAt: new Date() } }
    );

    // Update class enrollment
    await db.collection("classes").updateOne(
      { _id: new ObjectId(booking.classId) },
       
      {
        $inc: { currentEnrollment: -1 },
        $pull: { enrolledClients: { clientId } },
      } as any
    );

    // Restore client's class credit
    await db.collection("clients").updateOne(
      { _id: new ObjectId(clientId) },
      {
        $inc: { "plan.usedClasses": -1, "plan.remainingClasses": 1 },
        $set: { updatedAt: new Date() },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
