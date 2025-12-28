import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Booking } from "@/lib/db/schemas";

// GET /api/bookings - List all bookings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const classId = searchParams.get("classId");
    const instructorId = searchParams.get("instructorId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const source = searchParams.get("source");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (clientId) {
      filter.clientId = clientId;
    }

    if (classId) {
      filter.classId = classId;
    }

    if (instructorId) {
      filter.instructorId = instructorId;
    }

    if (source && source !== "all") {
      filter.source = source;
    }

    if (dateFrom || dateTo) {
      filter.scheduledDate = {};
      if (dateFrom) {
        (filter.scheduledDate as Record<string, Date>).$gte = new Date(dateFrom);
      }
      if (dateTo) {
        (filter.scheduledDate as Record<string, Date>).$lte = new Date(dateTo);
      }
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      db
        .collection<Booking>("bookings")
        .find(filter)
        .sort({ scheduledDate: -1, startTime: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Booking>("bookings").countDocuments(filter),
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      clientName,
      classId,
      className,
      instructorId,
      instructorName,
      scheduledDate,
      startTime,
      endTime,
      source,
    } = body;

    // Validation
    if (!clientId || !clientName || !classId || !className || !instructorId || !instructorName || !scheduledDate || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Client, class, instructor details, and schedule are required" },
        { status: 400 }
      );
    }

    const validSources = ["web", "bot", "admin"];
    if (source && !validSources.includes(source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${validSources.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Check for existing booking (same client, same class)
    const existingBooking = await db.collection<Booking>("bookings").findOne({
      clientId,
      classId,
      status: { $in: ["confirmed", "pending"] },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "Client already has a booking for this class" },
        { status: 409 }
      );
    }

    const newBooking: Omit<Booking, "_id"> = {
      clientId,
      clientName,
      classId,
      className,
      instructorId,
      instructorName,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      status: "confirmed",
      source: source || "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Booking>("bookings").insertOne(newBooking);

    return NextResponse.json(
      {
        success: true,
        booking: {
          _id: result.insertedId,
          ...newBooking,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
