import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { bookingRepository } from "@/lib/repositories";
import { validateRequestBody, patchBookingSchema, updateBookingSchema, hasData } from "@/lib/validation";
import { bookingActions, isValidAction } from "./actions";

// GET /api/bookings/[id] - Get a single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const booking = await bookingRepository.findById(id);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

// PUT /api/bookings/[id] - Update a booking
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    // Validate request body
    const validation = await validateRequestBody(request, updateBookingSchema);
    if (!hasData(validation)) {
      return validation.response;
    }

    const booking = await bookingRepository.update(id, validation.data);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

// DELETE /api/bookings/[id] - Delete a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const deleted = await bookingRepository.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}

// PATCH /api/bookings/[id] - Update booking status using Command Pattern
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    // Validate request body against discriminated union schema
    const validation = await validateRequestBody(request, patchBookingSchema);
    if (!hasData(validation)) {
      return validation.response;
    }

    const { action } = validation.data;

    // Get the appropriate action handler
    if (!isValidAction(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Execute the action - Command Pattern
    return bookingActions[action].execute(id, validation.data);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
