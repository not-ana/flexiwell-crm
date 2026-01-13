// SOLID Interfaces - Dependency Inversion & Interface Segregation

// ============================================
// Notification Interfaces (ISP + DIP)
// ============================================

export interface NotificationData {
  clientId: string;
  clientName?: string;
  [key: string]: unknown;
}

export interface NotificationResult {
  success: boolean;
  error?: string;
}

export interface INotificationChannel {
  send(type: string, recipient: string, data: NotificationData): Promise<NotificationResult>;
  isConfigured(): boolean;
}

export interface INotificationService {
  send(type: string, clientId: string, data: NotificationData): Promise<NotificationResult>;
}

// ============================================
// Repository Interfaces (DIP)
// ============================================

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filter: Record<string, unknown>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// ============================================
// Booking Interfaces (ISP)
// ============================================

export interface BookingValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: string;
}

export interface IBookingValidator {
  validate(clientId: string, classId: string): Promise<BookingValidationResult>;
}

export interface IConflictChecker {
  checkConflicts(clientId: string, classId: string): Promise<ConflictCheckResult>;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType?: "time" | "duplicate" | "capacity" | "credits" | "plan_expired";
  conflictDetails?: string;
}

// ============================================
// Calendar Sync Interfaces (ISP)
// ============================================

export interface ICalendarSync {
  syncBooking(bookingId: string, clientId: string): Promise<void>;
  removeBooking(bookingId: string, clientId: string, eventId: string): Promise<void>;
}

// ============================================
// Activity Logger Interface (SRP)
// ============================================

export interface ActivityData {
  type: string;
  action: string;
  description: string;
  entityId?: string;
  entityType?: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
}

export interface IActivityLogger {
  log(activity: ActivityData): Promise<void>;
}

// ============================================
// Credit Manager Interface (SRP)
// ============================================

export interface ICreditManager {
  deductCredit(clientId: string): Promise<boolean>;
  refundCredit(clientId: string): Promise<boolean>;
  hasCredits(clientId: string): Promise<boolean>;
}

// ============================================
// Messaging Bot Interface (Region-aware)
// WhatsApp for BR, SMS/WhatsApp for US
// ============================================

export type MessagingChannel = "whatsapp" | "sms";
export type SupportedRegion = "BR" | "US" | "EU" | "GLOBAL";

export interface MessagingBotConfig {
  region: SupportedRegion;
  primaryChannel: MessagingChannel;
  fallbackChannel?: MessagingChannel;
  studioId: string;
  studioName: string;
  locale: string;
}

export interface MessagingRequest {
  recipientPhone: string;
  messageType: MessagingType;
  data: MessagingData;
  preferredChannel?: MessagingChannel;
}

export type MessagingType =
  | "greeting"
  | "booking_confirmation"
  | "booking_reminder"
  | "booking_cancellation"
  | "waitlist_notification"
  | "waitlist_confirmation"
  | "waitlist_expired"
  | "payment_confirmation"
  | "custom";

export interface MessagingData {
  clientId?: string;
  clientName?: string;
  className?: string;
  classDate?: string;
  classTime?: string;
  instructorName?: string;
  studioName?: string;
  position?: number;
  minutesToConfirm?: number;
  customMessage?: string;
  [key: string]: unknown;
}

export interface MessagingResult {
  success: boolean;
  channel: MessagingChannel;
  messageId?: string;
  error?: string;
}

export interface IMessagingBot {
  send(request: MessagingRequest): Promise<MessagingResult>;
  getAvailableChannels(): MessagingChannel[];
  isChannelConfigured(channel: MessagingChannel): boolean;
}

export interface IMessagingRouter {
  route(request: MessagingRequest, config: MessagingBotConfig): Promise<MessagingResult>;
  getDefaultChannel(region: SupportedRegion): MessagingChannel;
}

// ============================================
// Waitlist Management Interface (Revenue Focus)
// ============================================

export interface WaitlistSpotOffer {
  waitlistEntryId: string;
  clientId: string;
  clientPhone: string;
  classId: string;
  className: string;
  classDate: Date;
  classTime: string;
  spotsAvailable: number;
  expiresAt: Date;
  notificationChannel: MessagingChannel;
}

export interface WaitlistOfferResult {
  success: boolean;
  notificationSent: boolean;
  expiresAt?: Date;
  error?: string;
}

export interface IWaitlistNotifier {
  offerSpot(offer: WaitlistSpotOffer): Promise<WaitlistOfferResult>;
  sendConfirmation(entryId: string, classDetails: MessagingData): Promise<MessagingResult>;
  sendExpiredNotice(entryId: string): Promise<MessagingResult>;
}
