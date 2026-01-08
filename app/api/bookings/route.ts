import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { bookingService } from "@/lib/services/booking.service";
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

// POST /api/bookings - Create a new booking with full validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, classId, source = "web", useCredit = true } = body;

    // Validation
    if (!clientId || !classId) {
      return NextResponse.json(
        { error: "clientId e classId são obrigatórios" },
        { status: 400 }
      );
    }

    // Use booking service for complete validation and creation
    const result = await bookingService.createBooking({
      clientId,
      classId,
      source,
      useCredit,
    });

    if (!result.success) {
      const statusCode = result.errorCode === "CLASS_FULL" ? 409 :
                         result.errorCode === "DUPLICATE" ? 409 :
                         result.errorCode === "CLIENT_NOT_FOUND" ? 404 :
                         result.errorCode === "CLASS_NOT_FOUND" ? 404 :
                         400;

      return NextResponse.json(
        {
          error: result.error,
          errorCode: result.errorCode,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking: result.booking,
        message: "Aula agendada com sucesso!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Erro ao criar agendamento" },
      { status: 500 }
    );
  }
}
