import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/lib/services/booking.service";

// GET /api/bookings/available - Get available classes for booking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const type = searchParams.get("type");
    const instructorId = searchParams.get("instructorId");
    const hasAvailability = searchParams.get("hasAvailability") === "true";

    const classes = await bookingService.getAvailableClasses({
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      type: type || undefined,
      instructorId: instructorId || undefined,
      hasAvailability,
    });

    return NextResponse.json({
      classes,
      total: classes.length,
    });
  } catch (error) {
    console.error("Error fetching available classes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar aulas disponíveis" },
      { status: 500 }
    );
  }
}
