// Booking Module - Exports all booking-related services
// Following SOLID principles with proper separation of concerns

// Credit management
export { CreditManager, createCreditManager } from "./credit-manager";

// Conflict detection
export { ConflictChecker, createConflictChecker } from "./conflict-checker";

// Booking validation
export { BookingValidator, createBookingValidator, bookingValidator } from "./booking-validator";
export type { ValidationContext } from "./booking-validator";

// Waitlist management
export { WaitlistService, createWaitlistService, waitlistService } from "./waitlist.service";
export type { AddToWaitlistResult, WaitlistNotificationResult } from "./waitlist.service";
