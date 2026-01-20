// Booking Actions - Command Pattern for PATCH operations
// This module follows OCP: add new actions without modifying the route handler

import { NextResponse } from "next/server";
import { bookingService } from "@/lib/services/booking.service";
import { bookingRepository } from "@/lib/repositories";
import type { PatchBookingInput } from "@/lib/validation";

// Action interface following Command Pattern
export interface BookingAction {
  execute(bookingId: string, data: PatchBookingInput): Promise<NextResponse>;
}

// Confirm booking action
class ConfirmAction implements BookingAction {
  async execute(bookingId: string): Promise<NextResponse> {
    const booking = await bookingRepository.update(bookingId, {
      status: "confirmed",
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking,
      message: "Agendamento confirmado",
    });
  }
}

// Cancel booking action
class CancelAction implements BookingAction {
  async execute(
    bookingId: string,
    data: Extract<PatchBookingInput, { action: "cancel" }>
  ): Promise<NextResponse> {
    const result = await bookingService.cancelBooking(
      bookingId,
      data.cancelledBy || "admin",
      data.reason
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      message: "Agendamento cancelado com sucesso",
    });
  }
}

// Complete booking action (mark as attended)
class CompleteAction implements BookingAction {
  async execute(bookingId: string): Promise<NextResponse> {
    const result = await bookingService.markAttendance(bookingId, true, "admin");

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      message: "Presença registrada com sucesso",
    });
  }
}

// No-show action
class NoShowAction implements BookingAction {
  async execute(bookingId: string): Promise<NextResponse> {
    const result = await bookingService.markAttendance(bookingId, false, "admin");

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      message: "Falta registrada",
    });
  }
}

// Reschedule action
class RescheduleAction implements BookingAction {
  async execute(
    bookingId: string,
    data: Extract<PatchBookingInput, { action: "reschedule" }>
  ): Promise<NextResponse> {
    // For now, reschedule just cancels and creates a new booking
    // In the future, this could be more sophisticated
    const cancelResult = await bookingService.cancelBooking(bookingId, "admin", "Reagendamento");

    if (!cancelResult.success) {
      return NextResponse.json(
        { error: cancelResult.error, errorCode: cancelResult.errorCode },
        { status: 400 }
      );
    }

    const booking = cancelResult.booking;
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Create new booking with the new class
    const newBookingResult = await bookingService.createBooking({
      clientId: booking.clientId,
      classId: data.newClassId,
      source: booking.source,
      useCredit: true,
    });

    if (!newBookingResult.success) {
      // Try to restore the old booking
      return NextResponse.json(
        { error: newBookingResult.error, errorCode: newBookingResult.errorCode },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: newBookingResult.booking,
      message: "Agendamento reagendado com sucesso",
    });
  }
}

// Action registry - OCP compliant
// Add new actions here without modifying the route handler
export const bookingActions: Record<string, BookingAction> = {
  confirm: new ConfirmAction(),
  cancel: new CancelAction(),
  complete: new CompleteAction(),
  no_show: new NoShowAction(),
  reschedule: new RescheduleAction(),
};

// Type guard for action names
export function isValidAction(action: string): action is keyof typeof bookingActions {
  return action in bookingActions;
}
