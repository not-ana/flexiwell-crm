import { NextRequest, NextResponse } from "next/server";
import { bookingService } from "@/lib/services/booking.service";

// POST /api/bookings/waitlist - Add client to waitlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, classId } = body;

    if (!clientId || !classId) {
      return NextResponse.json(
        { error: "clientId e classId são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await bookingService.addToWaitlist(clientId, classId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      position: result.position,
      message: `You have been added to the waitlist at position ${result.position}`,
    });
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return NextResponse.json(
      { error: "Failed to add to waitlist" },
      { status: 500 }
    );
  }
}
