import { z } from "zod";

// Phone validation (Brazilian format with optional country code)
const phoneSchema = z
  .string()
  .min(10, "Phone must have at least 10 digits")
  .regex(/^[\d\s\-+()]+$/, "Phone can only contain numbers and formatting characters");

// Plan schema
const planSchema = z.object({
  type: z.enum(["monthly", "quarterly", "annual", "drop-in"]),
  totalClasses: z.number().int().nonnegative(),
  usedClasses: z.number().int().nonnegative().optional().default(0),
  remainingClasses: z.number().int().nonnegative(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  price: z.number().nonnegative(),
});

// Notification preferences
const notificationPreferencesSchema = z.object({
  email: z.boolean().optional().default(true),
  whatsapp: z.boolean().optional().default(true),
  instagram: z.boolean().optional().default(false),
  sms: z.boolean().optional().default(false),
});

// Client preferences
const preferencesSchema = z.object({
  preferredInstructors: z.array(z.string()).optional(),
  preferredClassTypes: z.array(z.string()).optional(),
  notifications: notificationPreferencesSchema.optional(),
});

// Create client request
export const createClientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").toLowerCase(),
  phone: phoneSchema,
  plan: planSchema,
  status: z.enum(["active", "inactive", "pending"]).optional().default("active"),
  preferences: preferencesSchema.optional(),
  // Wellhub fields
  wellhubId: z.string().optional(),
  wellhubGympassId: z.string().optional(),
  isWellhubMember: z.boolean().optional(),
  wellhubPlan: z.string().optional(),
});

// Update client request
export const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().toLowerCase().optional(),
  phone: phoneSchema.optional(),
  plan: planSchema.partial().optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
  preferences: preferencesSchema.partial().optional(),
  avatar: z.string().url().optional().nullable(),
  whatsappId: z.string().optional(),
  instagramId: z.string().optional(),
  // Wellhub fields
  wellhubId: z.string().optional(),
  wellhubGympassId: z.string().optional(),
  isWellhubMember: z.boolean().optional(),
  wellhubPlan: z.string().optional(),
});

// Client import schema (for bulk import)
export const importClientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().toLowerCase(),
  phone: phoneSchema.optional(),
  planType: z.enum(["monthly", "quarterly", "annual", "drop-in"]).optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
});

export const importClientsSchema = z.object({
  clients: z.array(importClientSchema).min(1, "At least one client is required"),
  defaultPlan: planSchema.optional(),
});

// Query params schema for listing clients
export const clientQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  skip: z.coerce.number().int().nonnegative().optional(),
  status: z.enum(["all", "active", "inactive", "pending"]).optional(),
  planType: z.enum(["all", "monthly", "quarterly", "annual", "drop-in"]).optional(),
  search: z.string().optional(),
  isWellhubMember: z.coerce.boolean().optional(),
  hasGoogleCalendar: z.coerce.boolean().optional(),
});

// Google Calendar integration
export const googleCalendarIntegrationSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenExpiresAt: z.coerce.date(),
  calendarEmail: z.string().email(),
  syncEnabled: z.boolean().optional().default(true),
});

// Update preferences
export const updatePreferencesSchema = z.object({
  preferredInstructors: z.array(z.string()).optional(),
  preferredClassTypes: z.array(z.string()).optional(),
  notifications: notificationPreferencesSchema.optional(),
});

// Types
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ImportClientInput = z.infer<typeof importClientSchema>;
export type ImportClientsInput = z.infer<typeof importClientsSchema>;
export type ClientQueryInput = z.infer<typeof clientQuerySchema>;
export type GoogleCalendarIntegrationInput = z.infer<typeof googleCalendarIntegrationSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
