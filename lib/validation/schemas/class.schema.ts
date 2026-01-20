import { z } from "zod";

// Time format validation (HH:mm)
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format");

// Valid class types
export const CLASS_TYPES = ["yoga", "pilates", "stretching", "meditation", "other"] as const;

// Create class request
export const createClassSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(CLASS_TYPES),
  instructorId: z.string().min(1, "Instructor ID is required"),
  instructorName: z.string().min(1, "Instructor name is required"),
  scheduledDate: z.coerce.date(),
  startTime: timeSchema,
  endTime: timeSchema,
  duration: z.number().int().positive().optional(), // Will be calculated if not provided
  maxCapacity: z.number().int().positive().min(1, "Capacity must be at least 1"),
  currentEnrollment: z.number().int().nonnegative().optional().default(0),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional().default("scheduled"),
  location: z.string().optional(),
  roomId: z.string().optional(),
  establishmentId: z.string().optional(),
  notes: z.string().optional(),
  // Wellhub fields
  wellhubClassId: z.string().optional(),
  wellhubSyncEnabled: z.boolean().optional(),
}).refine(
  (data) => {
    const [startHour, startMin] = data.startTime.split(":").map(Number);
    const [endHour, endMin] = data.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  },
  { message: "End time must be after start time", path: ["endTime"] }
);

// Update class request
export const updateClassSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(CLASS_TYPES).optional(),
  instructorId: z.string().optional(),
  instructorName: z.string().optional(),
  scheduledDate: z.coerce.date().optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  duration: z.number().int().positive().optional(),
  maxCapacity: z.number().int().positive().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
  location: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  establishmentId: z.string().optional(),
  notes: z.string().optional().nullable(),
  // Wellhub fields
  wellhubClassId: z.string().optional(),
  wellhubSyncEnabled: z.boolean().optional(),
});

// Class action schemas
export const cancelClassSchema = z.object({
  action: z.literal("cancel"),
  reason: z.string().optional(),
  notifyClients: z.boolean().optional().default(true),
});

export const completeClassSchema = z.object({
  action: z.literal("complete"),
});

export const duplicateClassSchema = z.object({
  action: z.literal("duplicate"),
  newDate: z.coerce.date(),
  newTime: timeSchema.optional(),
});

export const updateCapacitySchema = z.object({
  action: z.literal("update_capacity"),
  maxCapacity: z.number().int().positive(),
});

export const changeInstructorSchema = z.object({
  action: z.literal("change_instructor"),
  instructorId: z.string().min(1),
  instructorName: z.string().min(1),
  notifyClients: z.boolean().optional().default(true),
});

// Combined PATCH action schema
export const patchClassSchema = z.discriminatedUnion("action", [
  cancelClassSchema,
  completeClassSchema,
  duplicateClassSchema,
  updateCapacitySchema,
  changeInstructorSchema,
]);

// Query params schema for listing classes
export const classQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  status: z.enum(["all", "scheduled", "completed", "cancelled"]).optional(),
  type: z.enum(["all", ...CLASS_TYPES]).optional(),
  instructorId: z.string().optional(),
  roomId: z.string().optional(),
  establishmentId: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  hasAvailability: z.coerce.boolean().optional(),
});

// Recurring class schema
export const recurringClassSchema = z.object({
  baseClass: createClassSchema,
  recurrence: z.object({
    frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // 0 = Sunday
    endDate: z.coerce.date(),
    excludeDates: z.array(z.coerce.date()).optional(),
  }),
});

// Bulk operations
export const bulkCancelClassesSchema = z.object({
  classIds: z.array(z.string()).min(1),
  reason: z.string().optional(),
  notifyClients: z.boolean().optional().default(true),
});

export const bulkCompleteClassesSchema = z.object({
  classIds: z.array(z.string()).min(1),
});

// Types
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type PatchClassInput = z.infer<typeof patchClassSchema>;
export type ClassQueryInput = z.infer<typeof classQuerySchema>;
export type RecurringClassInput = z.infer<typeof recurringClassSchema>;
export type BulkCancelClassesInput = z.infer<typeof bulkCancelClassesSchema>;
export type BulkCompleteClassesInput = z.infer<typeof bulkCompleteClassesSchema>;
