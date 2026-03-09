import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { bookingService } from "@/lib/services/booking.service";
import type { Booking } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/bookings/[id] - Get a single booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const booking = await db.collection<Booking>("bookings").findOne({
      _id: new ObjectId(id),
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/[id] - Update a booking
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Remove _id and createdAt from update data if present
    const { _id, createdAt, ...updateData } = body;

    // Convert scheduledDate if present
    if (updateData.scheduledDate) {
      updateData.scheduledDate = new Date(updateData.scheduledDate);
    }

    const result = await db.collection<Booking>("bookings").findOneAndUpdate(
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
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const result = await db.collection<Booking>("bookings").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}

// PATCH /api/bookings/[id] - Update booking status
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
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    let updateOperation: Record<string, unknown> = {};

    switch (action) {
      case "confirm":
        updateOperation = {
          $set: {
            status: "confirmed",
            updatedAt: new Date(),
          },
        };
        break;

      case "cancel":
        // Use booking service for proper cancellation with credit refund
        const cancelResult = await bookingService.cancelBooking(
          id,
          body.cancelledBy || "admin",
          body.reason
        );

        if (!cancelResult.success) {
          return NextResponse.json(
            { error: cancelResult.error, errorCode: cancelResult.errorCode },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          booking: cancelResult.booking,
          message: "Booking cancelled successfully",
        });
        break;

      case "complete":
        // Use booking service for proper attendance marking
        const completeResult = await bookingService.markAttendance(
          id,
          true,
          body.markedBy || "admin"
        );

        if (!completeResult.success) {
          return NextResponse.json(
            { error: completeResult.error, errorCode: completeResult.errorCode },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          booking: completeResult.booking,
          message: "Attendance recorded successfully",
        });
        break;

      case "no_show":
        // Use booking service for proper no-show marking
        const noShowResult = await bookingService.markAttendance(
          id,
          false,
          body.markedBy || "admin"
        );

        if (!noShowResult.success) {
          return NextResponse.json(
            { error: noShowResult.error, errorCode: noShowResult.errorCode },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          booking: noShowResult.booking,
          message: "No-show recorded",
        });
        break;

      case "reschedule":
        if (!body.scheduledDate || !body.startTime || !body.endTime) {
          return NextResponse.json(
            { error: "New scheduled date and times are required" },
            { status: 400 }
          );
        }
        updateOperation = {
          $set: {
            scheduledDate: new Date(body.scheduledDate),
            startTime: body.startTime,
            endTime: body.endTime,
            classId: body.classId || undefined,
            className: body.className || undefined,
            updatedAt: new Date(),
          },
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    const result = await db.collection<Booking>("bookings").findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateOperation,
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
