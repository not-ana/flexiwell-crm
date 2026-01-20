import { z } from "zod";

// Valid payment types and methods
export const PAYMENT_TYPES = ["subscription", "drop-in", "package"] as const;
export const PAYMENT_METHODS = ["credit_card", "pix", "bank_transfer", "cash"] as const;
export const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"] as const;

// Plan details schema
const planDetailsSchema = z.object({
  type: z.string(),
  classes: z.number().int().nonnegative(),
  period: z.string(),
});

// Create payment request
export const createPaymentSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientName: z.string().min(1, "Client name is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency must be a 3-letter code").optional().default("BRL"),
  type: z.enum(PAYMENT_TYPES),
  planDetails: planDetailsSchema.optional(),
  status: z.enum(PAYMENT_STATUSES).optional().default("pending"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  transactionId: z.string().optional(),
  invoiceUrl: z.string().url().optional(),
});

// Update payment request
export const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  status: z.enum(PAYMENT_STATUSES).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  transactionId: z.string().optional(),
  invoiceUrl: z.string().url().optional().nullable(),
  paidAt: z.coerce.date().optional(),
});

// Payment action schemas
export const markPaidSchema = z.object({
  action: z.literal("mark_paid"),
  paidAt: z.coerce.date().optional(),
  transactionId: z.string().optional(),
});

export const markRefundedSchema = z.object({
  action: z.literal("refund"),
  reason: z.string().optional(),
  refundAmount: z.number().positive().optional(),
});

export const markFailedSchema = z.object({
  action: z.literal("mark_failed"),
  reason: z.string().optional(),
});

export const sendInvoiceSchema = z.object({
  action: z.literal("send_invoice"),
  email: z.string().email().optional(),
});

// Combined PATCH action schema
export const patchPaymentSchema = z.discriminatedUnion("action", [
  markPaidSchema,
  markRefundedSchema,
  markFailedSchema,
  sendInvoiceSchema,
]);

// Query params schema for listing payments
export const paymentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  status: z.enum(["all", ...PAYMENT_STATUSES]).optional(),
  type: z.enum(["all", ...PAYMENT_TYPES]).optional(),
  paymentMethod: z.enum(["all", ...PAYMENT_METHODS]).optional(),
  clientId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
});

// Stripe checkout schema
export const stripeCheckoutSchema = z.object({
  clientId: z.string().min(1),
  planType: z.enum(["monthly", "quarterly", "annual"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// Stripe webhook schema (basic validation)
export const stripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
});

// Types
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type PatchPaymentInput = z.infer<typeof patchPaymentSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;
export type StripeCheckoutInput = z.infer<typeof stripeCheckoutSchema>;
