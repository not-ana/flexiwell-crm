// MongoDB Schema Types for FlexiWell CRM

export interface Client {
  _id?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "teacher" | "receptionist";
  avatar?: string;
  specialties?: string[];
  schedule?: {
    day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
    slots: { start: string; end: string }[];
  }[];
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  _id?: string;
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
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  _id?: string;
  clientId: string;
  clientName: string;
  classId: string;
  className: string;
  instructorId: string;
  instructorName: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled" | "completed" | "no-show";
  source: "web" | "bot" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface Request {
  _id?: string;
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
  _id?: string;
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
  _id?: string;
  clientId: string;
  clientName: string;
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
  _id?: string;
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
  _id?: string;
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

// Bot-specific types
export interface BotCommand {
  command: string;
  description: string;
  handler: string;
  aliases?: string[];
  requiresAuth: boolean;
}

export interface BotSession {
  _id?: string;
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
