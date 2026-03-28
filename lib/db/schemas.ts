// MongoDB Schema Types for FlexiWell CRM
import { ObjectId } from "mongodb";

// Lifecycle stages based on Hormozi's lead-to-retention framework
export type ClientLifecycleStage = "lead" | "trial" | "active" | "at_risk" | "churned" | "won_back";

export interface ClientHealthScore {
  overall: number; // 0-100
  breakdown: {
    attendance: number; // 0-25 - based on class attendance rate
    planUtilization: number; // 0-25 - remaining vs total classes vs time elapsed
    recency: number; // 0-25 - days since last activity
    paymentHealth: number; // 0-25 - payment status and history
  };
  lastCalculatedAt: Date;
}

export type IntakeStatus = "not_sent" | "sent" | "opened" | "completed";

// Behavior-based onboarding (Hormozi framework)
// Each step triggers based on what the client DID, not when they signed up.
// Flow: welcome → health assessment → first class → post-class feedback → week 1 → goal review
export type OnboardingPhase =
  | "welcome"           // Just signed up — send welcome
  | "health_assessment" // Welcome delivered — get health form
  | "first_booking"     // Health done (or skipped) — get them to book
  | "pre_class"         // Booked — prep them for class
  | "post_class"        // Completed first class — get feedback
  | "week_one"          // 1+ classes done — check-in
  | "goal_review"       // 7+ days active — review goals + upsell
  | "completed";        // Fully onboarded

export interface ClientOnboarding {
  // Current phase in the behavior-based flow
  currentPhase: OnboardingPhase;

  // Step 1: Welcome
  welcomeEmailSent: boolean;
  welcomeEmailSentAt?: Date;
  welcomeEmailOpened?: boolean;
  welcomeEmailOpenedAt?: Date;
  welcomeSmsFollowUp?: boolean;  // Sent SMS because email wasn't opened in 4h

  // Step 2: Health assessment
  healthAssessmentCompleted: boolean;
  healthAssessmentCompletedAt?: Date;
  // Intake pipeline tracking
  intakeStatus: IntakeStatus;
  intakeSentAt?: Date;
  intakeSentVia?: "email" | "sms" | "whatsapp";
  intakeOpenedAt?: Date;
  intakeCompletedAt?: Date;
  intakeReminderCount?: number;
  intakeLastReminderAt?: Date;

  // Step 3: First class
  firstClassBooked: boolean;
  firstClassBookedAt?: Date;
  firstClassNudgeCount?: number;   // How many "book your first class" nudges sent
  firstClassLastNudgeAt?: Date;

  // Step 4: Post-class
  firstClassCompleted: boolean;
  firstClassCompletedAt?: Date;
  firstClassFeedbackRating?: number;  // 1-5 rating after first class
  firstClassFeedbackAt?: Date;
  firstClassFeedbackSent?: boolean;   // Whether we asked for feedback

  // Step 5: Week 1 check-in
  weekOneCheckInSent: boolean;
  weekOneCheckInSentAt?: Date;
  weekOneClassCount?: number;         // How many classes in week 1

  // Step 6: Goal review
  weekTwoGoalReviewSent: boolean;
  weekTwoGoalReviewSentAt?: Date;

  // Completion
  onboardingCompletedAt?: Date;

  // Staff alerts — set when client is stuck, cleared when they progress
  staffAlertActive?: boolean;
  staffAlertType?: "health_form_stuck" | "no_booking" | "low_rating" | "disengaged";
  staffAlertCreatedAt?: Date;
  staffAlertResolvedAt?: Date;
}

export interface ClientMilestone {
  type: "first_class" | "10_classes" | "25_classes" | "50_classes" | "100_classes" | "3_months" | "6_months" | "1_year" | "streak_4_weeks" | "streak_12_weeks";
  achievedAt: Date;
  acknowledged: boolean;
}

export interface Client {
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  whatsappId?: string;
  instagramId?: string;
  avatar?: string;
  plan: {
    type: "monthly" | "quarterly" | "annual" | "drop-in" | "trial" | "challenge" | "premium" | "vip";
    totalClasses: number;
    usedClasses: number;
    remainingClasses: number;
    startDate: Date;
    endDate: Date;
    price: number; // Final price (after discount)
    originalPrice?: number; // List/catalog price before discount
    discountType?: "percentage" | "fixed" | "custom";
    discountValue?: number; // % or fixed amount
    discountReason?: string; // e.g. "early bird", "family", "partner"
  };
  status: "active" | "inactive" | "pending";
  // Hormozi lifecycle tracking
  lifecycleStage?: ClientLifecycleStage;
  healthScore?: ClientHealthScore;
  onboarding?: ClientOnboarding;
  milestones?: ClientMilestone[];
  // Streak tracking
  currentStreak?: number; // consecutive weeks with at least 1 class
  longestStreak?: number;
  lastClassDate?: Date;
  // Ascension tracking
  totalLifetimeRevenue?: number;
  upgradeHistory?: { from: string; to: string; date: Date }[];
  // Churn prevention
  churnRiskScore?: number; // 0-100, higher = more likely to churn
  lastChurnAlertSentAt?: Date;
  pauseHistory?: { pausedAt: Date; resumedAt?: Date; reason?: string }[];
  preferences: {
    preferredInstructors?: string[];
    preferredClassTypes?: string[];
    notifications: {
      email: boolean;
      whatsapp: boolean;
      instagram: boolean;
      sms: boolean; // SMS for US market
    };
  };
  // Mindbody integration fields
  mindbodyClientId?: string; // Client ID from Mindbody for sync/export
  // Wellhub integration fields
  wellhubId?: string; // unique_token from Wellhub
  wellhubGympassId?: string; // 13-digit gympass_id
  isWellhubMember?: boolean;
  wellhubPlan?: string;
  wellhubJoinedAt?: Date;
  // Google Calendar integration
  integrations?: {
    googleCalendar?: {
      accessToken: string;
      refreshToken: string;
      tokenExpiresAt: Date;
      calendarEmail: string;
      syncEnabled: boolean;
      connectedAt: Date;
      lastSyncAt?: Date;
    };
  };
  // Health assessment data (synced from intake form)
  healthAssessmentId?: string;
  dateOfBirth?: Date;
  gender?: string;
  height?: number;
  weight?: number;
  occupation?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalFlags?: {
    hasHeartCondition?: boolean;
    hasHighBloodPressure?: boolean;
    hasAsthma?: boolean;
    hasArthritis?: boolean;
    hasOsteoporosis?: boolean;
    hasScoliosis?: boolean;
    hasHernias?: boolean;
    hasDiabetes?: boolean;
    isPregnant?: boolean;
    hasSurgeryHistory?: boolean;
    hasCurrentPain?: boolean;
    hasMedications?: boolean;
    hasAllergies?: boolean;
  };
  goals?: string[];
  physicalRestrictions?: string[];
  // Soft-delete
  deletedAt?: Date;
  deletedBy?: string;
  deleteReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "teacher";
  avatar?: string;
  bio?: string;
  specialties?: string[];
  schedule?: {
    day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
    slots: { start: string; end: string }[];
  }[];
  status: "active" | "inactive";
  unit?: string; // Establishment/unit name
  establishmentId?: string; // Reference to Establishment
  // Rating system
  rating?: {
    average: number; // 0-5
    totalReviews: number;
    breakdown: {
      five: number;
      four: number;
      three: number;
      two: number;
      one: number;
    };
  };
  // Soft-delete
  deletedAt?: Date;
  deletedBy?: string;
  deleteReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  _id?: ObjectId;
  title: string;
  description?: string;
  type: "yoga" | "pilates" | "stretching" | "meditation" | "other";
  instructorId: string;
  instructorName: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  maxCapacity: number;
  currentEnrollment: number;
  enrolledClients: {
    clientId: string;
    clientName: string;
    status: "confirmed" | "cancelled" | "pending";
    enrolledAt: Date;
  }[];
  waitlist: {
    clientId: string;
    clientName: string;
    addedAt: Date;
  }[];
  status: "scheduled" | "completed" | "cancelled";
  location?: string;
  roomId?: string;
  establishmentId?: string; // Reference to Establishment/unit
  notes?: string;
  // Wellhub sync fields
  wellhubClassId?: string;
  wellhubSyncEnabled?: boolean;
  wellhubLastSyncAt?: Date;
  wellhubSyncStatus?: "synced" | "pending" | "failed";
  wellhubSyncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  _id?: ObjectId;
  clientId: string;
  clientName: string;
  classId: string;
  className: string;
  instructorId: string;
  instructorName: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no-show";
  source: "web" | "bot" | "sms" | "admin" | "trial" | "direct" | "mindbody-import";
  // Wellhub integration fields
  wellhubBookingId?: string;
  isWellhubBooking?: boolean;
  wellhubStatus?: "pending" | "accepted" | "rejected" | "cancelled" | "completed";
  wellhubCheckedIn?: boolean;
  wellhubCheckedInAt?: Date;
  // Google Calendar sync
  googleCalendarEventId?: string;
  googleCalendarSynced?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Request {
  _id?: ObjectId;
  clientId: string;
  clientName: string;
  type: "cancel" | "reschedule" | "change-instructor" | "other";
  classId?: string;
  className?: string;
  reason: string;
  preferredDate?: Date;
  preferredInstructorId?: string;
  status: "pending" | "approved" | "rejected";
  adminResponse?: string;
  adminId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface Conversation {
  _id?: ObjectId;
  clientId: string;
  clientName: string;
  // SMS added for US market support
  platform: "whatsapp" | "instagram" | "sms";
  platformUserId: string;
  messages: {
    id: string;
    from: "client" | "bot" | "admin";
    content: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }[];
  context: {
    currentIntent?: string;
    lastAction?: string;
    awaitingResponse?: boolean;
    sessionData?: Record<string, unknown>;
  };
  status: "active" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicket {
  _id?: ObjectId;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  subject: string;
  category: "billing" | "classes" | "technical" | "feedback" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  messages: {
    id: string;
    from: string;
    content: string;
    isAdmin: boolean;
    timestamp: Date;
  }[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface Payment {
  _id?: ObjectId;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  type: "subscription" | "drop-in" | "package";
  planDetails?: {
    type: string;
    classes: number;
    period: string;
  };
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: "credit_card" | "pix" | "bank_transfer" | "cash";
  transactionId?: string;
  invoiceUrl?: string;
  createdAt: Date;
  paidAt?: Date;
}

export interface Activity {
  _id?: ObjectId;
  type: "client" | "class" | "payment" | "booking" | "cancel" | "staff" | "system";
  action: string;
  description: string;
  entityId?: string;
  entityType?: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Waitlist types
export type WaitlistRequestType = "reschedule" | "extra_class" | "cancelled_by_studio";

export type WaitlistStatus = "waiting" | "notified" | "confirmed" | "expired" | "declined" | "removed";

export interface WaitlistPriorityConfig {
  _id?: ObjectId;
  // Points per criteria
  planTypePoints: {
    annual: number;
    quarterly: number;
    monthly: number;
    "drop-in": number;
  };
  waitingTimePointsPerDay: number;
  attendanceRateMultiplier: number; // e.g., 0.5 means 0.5 points per 1% attendance
  vipBonus: number;
  cancelledByStudioBonus: number;
  urgentReasonBonus: number;
  // Notification settings
  notificationWindowMinutes: number; // Time client has to respond
  autoDeclineAfterMinutes: number;
  maxNotificationsPerSlot: number;
  updatedAt: Date;
}

export interface WaitlistEntry {
  _id?: ObjectId;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  // Class info (current schema)
  classId?: string;
  className?: string;
  clientSource?: string;
  priority?: number;
  // Legacy request details
  requestType?: WaitlistRequestType;
  reason?: string;
  isUrgent?: boolean;
  // Legacy class preferences
  preferredClassId?: string;
  preferredClassName?: string;
  preferredClassTypes?: string[];
  preferredInstructorIds?: string[];
  preferredDays?: string[];
  preferredTimeSlots?: { start: string; end: string }[];
  // Original booking (for reschedules)
  originalBookingId?: string;
  originalClassId?: string;
  originalClassName?: string;
  originalDate?: Date;
  // Priority calculation (legacy)
  priorityScore?: number;
  priorityBreakdown?: {
    planTypePoints: number;
    waitingTimePoints: number;
    attendancePoints: number;
    vipPoints: number;
    cancelledByStudioPoints: number;
    urgentReasonPoints: number;
  };
  // Status tracking
  status: WaitlistStatus;
  notifiedAt?: Date;
  notificationExpiresAt?: Date;
  confirmedClassId?: string;
  confirmedClassName?: string;
  confirmedDate?: Date;
  confirmedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
  // Metadata
  position?: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface WaitlistNotification {
  _id?: ObjectId;
  waitlistEntryId: string;
  clientId: string;
  clientName: string;
  classId: string;
  className: string;
  classDate: Date;
  classTime: string;
  spotsAvailable: number;
  status: "sent" | "opened" | "confirmed" | "declined" | "expired";
  sentAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
  responseType?: "confirmed" | "declined";
  notificationChannel: "email" | "whatsapp" | "sms" | "push";
  createdAt: Date;
}

// User Authentication types
export interface LinkedAccount {
  provider: "google";
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
  linkedAt: Date;
}

export interface User {
  _id?: ObjectId;
  email: string;
  password: string; // hashed
  name: string;
  role: "admin" | "teacher" | "client"; // Primary role
  additionalRoles?: ("admin" | "teacher" | "client")[]; // Additional roles user can switch to
  avatar?: string;
  phone?: string;
  // Link to other entities based on role
  staffId?: string; // For admin/teacher roles
  clientId?: string; // For client role
  establishmentId?: string; // Scopes data to a specific establishment
  isActive: boolean;
  lastLoginAt?: Date;
  // Linked social accounts
  linkedAccounts?: LinkedAccount[];
  // Trial and subscription fields
  trialStartDate?: Date;
  trialEndDate?: Date;
  trialStatus?: "active" | "expired" | "converted";
  trialConvertedAt?: Date;
  subscriptionStatus?: "none" | "trialing" | "active" | "past_due" | "canceled";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planTier?: "retention_pro" | "scale";
  // Per-instance feature overrides — allows disabling specific features
  // on a per-client basis (e.g. negotiated on a sales call for a lower price)
  featureOverrides?: Partial<Record<string, boolean>>;
  customPrice?: number; // Custom monthly price negotiated on call
  priceLockUntil?: Date; // Founding member / early adopter price lock expiry
  pricingPhase?: "founding_member" | "early_adopter" | "full_price";
  // Trial notification tracking
  trialNotifications?: {
    sevenDaysSent?: boolean;
    threeDaysSent?: boolean;
    oneDaySent?: boolean;
    expiredSent?: boolean;
  };
  // Data cleanup tracking
  dataCleanedUp?: boolean;
  dataCleanedUpAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshToken {
  _id?: ObjectId;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Bot-specific types
export interface BotCommand {
  command: string;
  description: string;
  handler: string;
  aliases?: string[];
  requiresAuth: boolean;
}

export interface BotSession {
  _id?: ObjectId;
  platformUserId: string;
  platform: "whatsapp" | "sms" | "instagram";
  clientId?: string;
  isAuthenticated: boolean;
  currentFlow?: string;
  flowStep?: number;
  flowData?: Record<string, unknown>;
  lastInteraction: Date;
  createdAt: Date;
  expiresAt: Date;
}

// Supported locales for internationalization
export type SupportedLocale = "pt-BR" | "en-US" | "en-GB" | "es-ES";
export type SupportedRegion = "BR" | "US" | "EU" | "GLOBAL";

// Settings types
export interface StudioSettings {
  _id?: ObjectId;
  // General settings
  general: {
    studioName: string;
    email: string;
    phone: string;
    address: string;
    timezone: string;
    currency: string;
    language: SupportedLocale;
    region: SupportedRegion;
    businessType: string;
    country?: string;
  };
  // Branding settings
  branding?: {
    primaryColor: string;
    logo?: string;
    favicon?: string;
  };
  // Notification preferences - messaging channel based on region
  notifications?: {
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    smsEnabled: boolean;
    // Primary messaging channel: US = sms, BR = whatsapp
    primaryMessagingChannel: "whatsapp" | "sms";
    // Bot settings
    messagingBotEnabled: boolean;
    reminderHours: number;
    confirmationEmail: boolean;
    marketingEmails: boolean;
  };
  // Waitlist configuration
  waitlist?: {
    enabled: boolean;
    maxSize: number;
    autoNotify: boolean;
    notificationWindowMinutes: number;
    priorityByPlanType: boolean;
  };
  // Trial & drop-in booking configuration
  trialBooking?: {
    trialEnabled: boolean;
    trialPrice: number; // 0 = free
    dropInEnabled: boolean;
    dropInPrice: number;
    acceptedPaymentMethods: ("card" | "cash" | "pix" | "bank_transfer")[];
    requirePaymentUpfront: boolean; // false = can pay at studio (cash)
    maxTrialsPerClient: number; // how many free trials per email
    postTrialCouponCode?: string; // e.g. "FIRSTCLASS"
    postTrialDiscountPercent?: number; // e.g. 20
  };
  // Integration settings (API keys stored separately for security)
  integrations?: {
    stripeConnected: boolean;
    whatsappConnected: boolean;
    googleCalendarConnected: boolean;
    resendConnected: boolean;
  };
  updatedAt: Date;
  createdAt: Date;
}

export interface Establishment {
  _id?: ObjectId;
  name: string;
  location: string;
  address?: string;
  phone?: string;
  assignedTeachers: string[];
  rooms?: string[];
  isActive: boolean;
  // Owner/Admin relationship
  ownerId: string; // userId of the admin who owns this establishment
  adminIds?: string[]; // Additional admins with access
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  _id?: ObjectId;
  name: string;
  establishmentId: string;
  capacity: number;
  equipment?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Google Calendar sync log
export interface CalendarSyncLog {
  _id?: ObjectId;
  clientId: string;
  bookingId: string;
  googleEventId: string;
  action: "create" | "update" | "delete";
  status: "success" | "failed" | "pending";
  errorMessage?: string;
  retries: number;
  nextRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Wellhub error log for manual review
export interface WellhubErrorLog {
  _id?: ObjectId;
  type: "booking_accept_failed" | "checkin_validate_failed" | "class_sync_failed";
  bookingId?: string;
  classId?: string;
  error: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}

// Company Invite Codes - Códigos de convite para vincular clientes
export interface CompanyInvite {
  _id?: ObjectId;
  companyId: string; // ID da empresa (userId do admin)
  code: string; // Código único ex: "STUDIO-ABC123"
  name?: string; // Nome descritivo ex: "Convite Geral"
  maxUses: number | null; // null = ilimitado
  currentUses: number;
  expiresAt: Date | null; // null = nunca expira
  isActive: boolean;
  createdBy: string; // userId do admin que criou
  createdAt: Date;
  updatedAt: Date;
}

// Authorized Clients - Lista de clientes pré-autorizados pela empresa
export interface AuthorizedClient {
  _id?: ObjectId;
  companyId: string; // ID da empresa
  identifier: string; // email, telefone ou CPF
  identifierType: "email" | "phone" | "cpf";
  name?: string; // Nome para referência (opcional)
  claimedBy?: string; // userId quando o cliente se cadastrar
  claimedAt?: Date;
  invitedBy?: string; // userId do admin que adicionou
  invitedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Company Clients - Vínculo efetivo entre empresa e cliente
export interface CompanyClient {
  _id?: ObjectId;
  userId: string; // ID do usuário (cliente)
  companyId: string; // ID da empresa
  joinedVia: "invite_code" | "pre_authorized" | "manual";
  inviteCodeUsed?: string; // código usado (se joinedVia = invite_code)
  status: "active" | "inactive" | "pending";
  role?: "client" | "vip"; // tipo de cliente na empresa
  joinedAt: Date;
  leftAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// WhatsApp Credentials per Establishment
export interface EstablishmentWhatsAppCredentials {
  _id?: ObjectId;
  establishmentId: string; // Reference to establishment/company
  companyId: string; // Same as establishmentId for backwards compat
  provider: "cloud-api" | "twilio";
  // Cloud API (Meta) credentials
  phoneNumberId?: string;
  accessToken?: string;
  businessAccountId?: string;
  verifyToken?: string;
  // Twilio credentials
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  // Phone number for lookup (normalized, e.g., "5511999999999")
  phoneNumber: string;
  displayPhoneNumber?: string; // Human readable, e.g., "+55 11 99999-9999"
  // Status
  isConnected: boolean;
  connectionStatus?: "active" | "disconnected" | "pending_verification";
  qualityRating?: "GREEN" | "YELLOW" | "RED";
  lastVerifiedAt?: Date;
  // Bot settings
  botEnabled: boolean;
  botFeatures?: {
    viewClasses: boolean;
    confirmAttendance: boolean;
    cancelClass: boolean;
    bookNewClass: boolean;
    automaticReminders: boolean;
  };
  // Custom bot commands per establishment
  botCommands?: BotMenuCommand[];
  botWelcomeMessage?: string;
  // Timestamps
  connectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Custom bot menu command
export interface BotMenuCommand {
  id: string; // unique id
  trigger: string; // "1", "2", "3" or keywords
  label: string; // Display text: "View Classes"
  action: BotCommandAction;
  customMessage?: string; // For CUSTOM_MESSAGE action
  enabled: boolean;
  order: number; // Sort order
}

export type BotCommandAction =
  | "VIEW_CLASSES" // Show upcoming classes
  | "BOOK_CLASS" // Book a new class
  | "MY_BOOKINGS" // Show user's bookings
  | "CANCEL_BOOKING" // Cancel a booking
  | "REMAINING_CREDITS" // Show remaining class credits
  | "CONTACT_SUPPORT" // Forward to human support
  | "CUSTOM_MESSAGE"; // Send a custom text message

export interface BotCommandConfig {
  action: BotCommandAction;
  customMessage?: string; // For CUSTOM_MESSAGE action
}

// Teacher/Staff Review system
export interface Review {
  _id?: ObjectId;
  staffId: string; // The teacher being reviewed
  staffName: string;
  clientId: string; // The client who submitted the review
  clientName: string;
  bookingId?: string; // Optional: link to the booking/class
  classId?: string;
  className?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  // Moderation
  status: "pending" | "approved" | "rejected";
  moderatedBy?: string;
  moderatedAt?: Date;
  rejectionReason?: string;
  // Response from teacher
  response?: {
    content: string;
    respondedAt: Date;
  };
  // Visibility
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Health Assessment (Anamnese) Types
// ============================================

export type HealthAssessmentStatus = "draft" | "submitted" | "reviewed" | "requires_update";

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface MedicalHistory {
  // Cardiovascular
  hasHeartCondition: boolean;
  hasHighBloodPressure: boolean;
  hasLowBloodPressure: boolean;
  // Respiratory
  hasAsthma: boolean;
  hasRespiratoryIssues: boolean;
  // Musculoskeletal
  hasArthritis: boolean;
  hasOsteoporosis: boolean;
  hasScoliosis: boolean;
  hasHernias: boolean;
  // Neurological
  hasEpilepsy: boolean;
  // Metabolic
  hasDiabetes: boolean;
  hasThyroidIssues: boolean;
  // Other conditions
  isPregnant: boolean;
  pregnancyWeeks?: number;
  hasSurgeryHistory: boolean;
  surgeryDetails?: string;
  hasOtherConditions: boolean;
  otherConditionsDetails?: string;
}

export interface CurrentCondition {
  id: string;
  area: string;
  description: string;
  severity: "mild" | "moderate" | "severe";
  isChronicPain: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  reason?: string;
}

export interface HealthAssessmentConsent {
  agreedToTerms: boolean;
  agreedToLiabilityWaiver: boolean;
  signedAt: Date;
  signedIp: string;
}

export interface HealthAssessment {
  _id?: ObjectId;
  clientId: string;
  clientName: string;
  clientEmail: string;
  establishmentId?: string;
  version: number;

  // Personal data
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  height?: number; // in cm
  weight?: number; // in kg
  occupation?: string;

  // Medical history
  medicalHistory: MedicalHistory;

  // Current conditions/injuries
  currentConditions: CurrentCondition[];
  hasCurrentPain: boolean;
  painDescription?: string;

  // Medications
  medications: Medication[];
  takingMedications: boolean;

  // Allergies
  allergies: string[];
  hasAllergies: boolean;

  // Fitness background
  exerciseFrequency?: "none" | "1-2_week" | "3-4_week" | "5+_week";
  previousExperience?: string;

  // Goals
  goals: string[];
  additionalGoalNotes?: string;

  // Physical restrictions
  physicalRestrictions: string[];
  restrictionDetails?: string;

  // Emergency contact (required)
  emergencyContact: EmergencyContact;

  // Consent
  consent: HealthAssessmentConsent;

  // Custom fields (dynamic based on form config)
  customFields?: Record<string, unknown>;

  // Admin fields
  status: HealthAssessmentStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  updateRequestedAt?: Date;
  updateRequestedBy?: string;
  updateRequestMessage?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
}

// Public access token for unauthenticated form submissions
export interface HealthAssessmentToken {
  _id?: ObjectId;
  token: string;
  clientId?: string; // Optional - for existing clients
  clientEmail?: string; // For new clients
  clientName?: string; // For new clients
  establishmentId: string;
  createdBy: string; // Admin userId who generated the link
  expiresAt: Date;
  usedAt?: Date;
  isUsed: boolean;
  createdAt: Date;
}

// Form configuration for customizable sections
export type FormFieldType = "text" | "textarea" | "number" | "select" | "checkbox" | "checkboxGroup" | "date" | "tags";

export interface FormFieldConfig {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
  conditionalOn?: { field: string; value: unknown };
}

export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  enabled: boolean;
  required: boolean;
  order: number;
  isBuiltIn: boolean; // true for default sections, false for custom
  fields: FormFieldConfig[];
}

export interface HealthAssessmentFormConfig {
  _id?: ObjectId;
  establishmentId: string;
  sections: FormSectionConfig[];
  liabilityWaiverText: string;
  termsText: string;
  updatedAt: Date;
  updatedBy: string;
}

// ============================================
// Subscription Events — Audit log for billing
// ============================================

export interface SubscriptionEvent {
  _id?: ObjectId;
  userId: string;
  stripeEventId?: string;
  type:
    | "subscription_created"
    | "subscription_updated"
    | "subscription_cancelled"
    | "subscription_reactivated"
    | "trial_started"
    | "trial_expired"
    | "trial_converted"
    | "plan_upgraded"
    | "plan_downgraded"
    | "addon_added"
    | "addon_removed"
    | "invoice_paid"
    | "invoice_failed"
    | "payment_succeeded"
    | "payment_failed"
    | "refund_issued";
  data: {
    planTier?: string;
    previousPlanTier?: string;
    billingPeriod?: string;
    amount?: number;
    currency?: string;
    addonId?: string;
    invoiceId?: string;
    reason?: string;
  };
  createdAt: Date;
}

// ============================================
// Usage Tracking — Monthly metered features
// ============================================

export interface UsageTracking {
  _id?: ObjectId;
  userId: string;
  monthly: Record<string, {
    messagingBotMessages: number;
    aiChats: number;
    apiCalls: number;
  }>;
  total: {
    messagingBotMessages: number;
    aiChats: number;
    apiCalls: number;
  };
  storageUsedMB: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Coupons / Discount Codes
// ============================================

export type CouponDiscountType = "percentage" | "fixed_amount";

export interface Coupon {
  _id?: ObjectId;
  code: string; // Unique, uppercase, e.g. "LAUNCH20"
  name: string; // Display name, e.g. "Launch Discount 20%"
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number; // % or fixed amount
  currency?: string; // For fixed_amount coupons
  // Scope
  applicablePlans?: string[]; // Plan tiers this applies to, empty = all
  applicableAddons?: string[]; // Addon IDs this applies to, empty = all
  // Limits
  maxRedemptions?: number; // Total times this coupon can be used, null = unlimited
  maxRedemptionsPerUser?: number; // Per user limit, default 1
  currentRedemptions: number;
  // Validity
  isActive: boolean;
  startsAt?: Date;
  expiresAt?: Date;
  // Stripe integration
  stripeCouponId?: string; // If synced to Stripe
  // Tracking
  createdBy: string; // Admin userId
  createdAt: Date;
  updatedAt: Date;
}

export interface CouponRedemption {
  _id?: ObjectId;
  couponId: string;
  couponCode: string;
  userId: string;
  userEmail: string;
  discountApplied: number; // Actual amount discounted
  originalAmount: number;
  finalAmount: number;
  context: "checkout" | "plan_change" | "addon" | "manual";
  stripeInvoiceId?: string;
  redeemedAt: Date;
}

// ============================================
// Refund Requests — 60-Day Guarantee workflow
// ============================================

export type RefundRequestStatus = "pending" | "under_review" | "approved" | "rejected" | "refunded";

export interface RefundRequest {
  _id?: ObjectId;
  userId: string;
  userName: string;
  userEmail: string;
  // Guarantee context
  guaranteeType: "60_day_results" | "other";
  subscriptionStartDate: Date;
  requestDate: Date;
  daysIntoSubscription: number;
  // Baseline metrics at start
  baselineMetrics?: {
    noShowRate?: number;
    activeClients?: number;
    retentionRate?: number;
  };
  // Current metrics at request time
  currentMetrics?: {
    noShowRate?: number;
    activeClients?: number;
    retentionRate?: number;
  };
  // Request details
  reason: string;
  additionalDetails?: string;
  // Amount
  totalPaid: number;
  refundAmount: number;
  currency: string;
  // Review
  status: RefundRequestStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  // Stripe
  stripeRefundId?: string;
  stripeChargeIds?: string[];
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Pricing Audit Trail
// ============================================

export interface PricingAudit {
  _id?: ObjectId;
  userId: string;
  userEmail: string;
  action:
    | "custom_price_set"
    | "custom_price_changed"
    | "custom_price_removed"
    | "feature_override_set"
    | "feature_override_removed"
    | "coupon_applied"
    | "coupon_removed"
    | "price_lock_set"
    | "price_lock_expired"
    | "plan_changed"
    | "discount_applied";
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  performedBy: string; // Admin userId who made the change
  performedByName?: string;
  createdAt: Date;
}

// ============================================
// Soft-delete mixin — add to Client, Staff, Class
// ============================================

export interface SoftDeletable {
  deletedAt?: Date;
  deletedBy?: string;
  deleteReason?: string;
}
