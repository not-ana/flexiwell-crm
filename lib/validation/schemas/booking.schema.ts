import { z } from "zod";

// Base booking data
export const bookingBaseSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  source: z.enum(["web", "bot", "admin"]).optional().default("web"),
  useCredit: z.boolean().optional().default(true),
});

// Create booking request
export const createBookingSchema = bookingBaseSchema;

// Update booking request
export const updateBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no-show"]).optional(),
  googleCalendarEventId: z.string().optional(),
  googleCalendarSynced: z.boolean().optional(),
});

// Booking action schemas using discriminated union
export const confirmBookingSchema = z.object({
  action: z.literal("confirm"),
});

export const cancelBookingSchema = z.object({
  action: z.literal("cancel"),
  cancelledBy: z.enum(["client", "admin", "system"]).optional().default("client"),
  reason: z.string().optional(),
});

export const completeBookingSchema = z.object({
  action: z.literal("complete"),
});

export const noShowBookingSchema = z.object({
  action: z.literal("no_show"),
});

export const rescheduleBookingSchema = z.object({
  action: z.literal("reschedule"),
  newClassId: z.string().min(1, "New class ID is required"),
});

// Combined PATCH action schema
export const patchBookingSchema = z.discriminatedUnion("action", [
  confirmBookingSchema,
  cancelBookingSchema,
  completeBookingSchema,
  noShowBookingSchema,
  rescheduleBookingSchema,
]);

// Query params schema for listing bookings
export const bookingQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  status: z.enum(["all", "pending", "confirmed", "cancelled", "completed", "no-show"]).optional(),
  clientId: z.string().optional(),
  classId: z.string().optional(),
  instructorId: z.string().optional(),
  source: z.enum(["all", "web", "bot", "admin"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// Wellhub booking schema
export const wellhubBookingSchema = z.object({
  booking_id: z.string(),
  class_id: z.string(),
  user_id: z.string(),
  gympass_id: z.string(),
  status: z.enum(["pending", "accepted", "rejected", "cancelled"]),
});

// Batch operations
export const batchMarkAttendanceSchema = z.object({
  bookingIds: z.array(z.string()).min(1, "At least one booking ID is required"),
  status: z.enum(["completed", "no-show"]),
});

// Types
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type PatchBookingInput = z.infer<typeof patchBookingSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
export type WellhubBookingInput = z.infer<typeof wellhubBookingSchema>;
export type BatchMarkAttendanceInput = z.infer<typeof batchMarkAttendanceSchema>;
