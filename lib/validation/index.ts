// Validation middleware exports
export {
  validate,
  safeParse,
  validationErrorResponse,
  validateRequestBody,
  validateQueryParams,
  parseQueryParams,
  hasData,
  hasResponse,
} from "./middleware";
export type { ValidationResult, ValidationError, ValidationResponse } from "./middleware";

// Booking schemas
export {
  createBookingSchema,
  updateBookingSchema,
  patchBookingSchema,
  bookingQuerySchema,
  wellhubBookingSchema,
  batchMarkAttendanceSchema,
  confirmBookingSchema,
  cancelBookingSchema,
  completeBookingSchema,
  noShowBookingSchema,
  rescheduleBookingSchema,
} from "./schemas/booking.schema";
export type {
  CreateBookingInput,
  UpdateBookingInput,
  PatchBookingInput,
  BookingQueryInput,
  WellhubBookingInput,
  BatchMarkAttendanceInput,
} from "./schemas/booking.schema";

// Client schemas
export {
  createClientSchema,
  updateClientSchema,
  importClientSchema,
  importClientsSchema,
  clientQuerySchema,
  googleCalendarIntegrationSchema,
  updatePreferencesSchema,
} from "./schemas/client.schema";
export type {
  CreateClientInput,
  UpdateClientInput,
  ImportClientInput,
  ImportClientsInput,
  ClientQueryInput,
  GoogleCalendarIntegrationInput,
  UpdatePreferencesInput,
} from "./schemas/client.schema";

// Class schemas
export {
  createClassSchema,
  updateClassSchema,
  patchClassSchema,
  classQuerySchema,
  recurringClassSchema,
  bulkCancelClassesSchema,
  bulkCompleteClassesSchema,
  cancelClassSchema,
  completeClassSchema,
  duplicateClassSchema,
  updateCapacitySchema,
  changeInstructorSchema,
  CLASS_TYPES,
} from "./schemas/class.schema";
export type {
  CreateClassInput,
  UpdateClassInput,
  PatchClassInput,
  ClassQueryInput,
  RecurringClassInput,
  BulkCancelClassesInput,
  BulkCompleteClassesInput,
} from "./schemas/class.schema";

// Payment schemas
export {
  createPaymentSchema,
  updatePaymentSchema,
  patchPaymentSchema,
  paymentQuerySchema,
  stripeCheckoutSchema,
  stripeWebhookSchema,
  markPaidSchema,
  markRefundedSchema,
  markFailedSchema,
  sendInvoiceSchema,
  PAYMENT_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from "./schemas/payment.schema";
export type {
  CreatePaymentInput,
  UpdatePaymentInput,
  PatchPaymentInput,
  PaymentQueryInput,
  StripeCheckoutInput,
} from "./schemas/payment.schema";
