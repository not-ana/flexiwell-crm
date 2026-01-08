// MongoDB Schema Types for FlexiWell CRM
import { ObjectId } from "mongodb";

export interface Client {
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  whatsappId?: string;
  instagramId?: string;
  avatar?: string;
  plan: {
    type: "monthly" | "quarterly" | "annual" | "drop-in";
    totalClasses: number;
    usedClasses: number;
    remainingClasses: number;
    startDate: Date;
    endDate: Date;
    price: number;
  };
  status: "active" | "inactive" | "pending";
  preferences: {
    preferredInstructors?: string[];
    preferredClassTypes?: string[];
    notifications: {
      email: boolean;
      whatsapp: boolean;
      instagram: boolean;
    };
  };
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "teacher" | "receptionist";
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
  source: "web" | "bot" | "admin";
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
  platform: "whatsapp" | "instagram";
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

export type WaitlistStatus = "waiting" | "notified" | "confirmed" | "expired" | "declined";

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
  // Request details
  requestType: WaitlistRequestType;
  reason?: string;
  isUrgent: boolean;
  // Class preferences
  preferredClassId?: string; // Specific class they want
  preferredClassName?: string;
  preferredClassTypes?: string[]; // e.g., ["yoga", "pilates"]
  preferredInstructorIds?: string[];
  preferredDays?: string[]; // e.g., ["monday", "wednesday"]
  preferredTimeSlots?: { start: string; end: string }[];
  // Original booking (for reschedules)
  originalBookingId?: string;
  originalClassId?: string;
  originalClassName?: string;
  originalDate?: Date;
  // Priority calculation
  priorityScore: number;
  priorityBreakdown: {
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
  declinedAt?: Date;
  declineReason?: string;
  // Metadata
  position?: number; // Current position in queue
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // Auto-expire after X days
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
export interface User {
  _id?: ObjectId;
  email: string;
  password: string; // hashed
  name: string;
  role: "admin" | "teacher" | "client";
  avatar?: string;
  phone?: string;
  // Link to other entities based on role
  staffId?: string; // For admin/teacher roles
  clientId?: string; // For client role
  isActive: boolean;
  lastLoginAt?: Date;
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
  platform: "whatsapp" | "instagram";
  clientId?: string;
  isAuthenticated: boolean;
  currentFlow?: string;
  flowStep?: number;
  flowData?: Record<string, unknown>;
  lastInteraction: Date;
  createdAt: Date;
  expiresAt: Date;
}

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
    language: string;
    businessType: string;
  };
  // Branding settings
  branding?: {
    primaryColor: string;
    logo?: string;
    favicon?: string;
  };
  // Notification preferences
  notifications?: {
    emailEnabled: boolean;
    whatsappEnabled: boolean;
    smsEnabled: boolean;
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
