// Waitlist Management System Configuration

export type ClientSource =
  | "native"        // Direct client - pays studio directly
  | "classpass"     // ClassPass integration
  | "gympass"       // Gympass/Wellhub
  | "totalpass"     // TotalPass
  | "urban"         // Urban Sports Club
  | "package"       // Purchased package/credits
  | "trial";        // Trial/first-time

export type PriorityTier = "vip" | "high" | "medium" | "low";

export interface WaitlistPriorityConfig {
  tier: PriorityTier;
  label: string;
  responseTimeMinutes: number;      // Time to confirm before moving to next
  cancellationGraceHours: number;   // Hours before class when cancellation is penalty-free
  sources: ClientSource[];
  color: string;
  description: string;
}

export interface WaitlistSettings {
  enabled: boolean;
  maxWaitlistSize: number;           // Max people on waitlist per class
  autoNotifyOnCancel: boolean;       // Auto-notify next in line
  notificationChannels: ("whatsapp" | "sms" | "email" | "push")[];
  confirmationMethod: "link" | "reply" | "app";
  showPositionToClient: boolean;     // Show queue position
  allowAutoConfirm: boolean;         // Let clients set auto-confirm
  noShowPenalty: {
    enabled: boolean;
    maxNoShows: number;              // Max no-shows before penalty
    penaltyDays: number;             // Days banned from waitlist
  };
  priorityBoost: {
    enabled: boolean;
    attendanceThreshold: number;     // Classes per month for boost
    boostPercentage: number;         // Priority boost (e.g., 20%)
  };
}

// Default priority tiers
export const defaultPriorityTiers: WaitlistPriorityConfig[] = [
  {
    tier: "vip",
    label: "VIP Members",
    responseTimeMinutes: 240,        // 4 hours to respond
    cancellationGraceHours: 2,       // Can cancel up to 2h before
    sources: ["native"],
    color: "#6938EF",
    description: "Premium members with highest priority",
  },
  {
    tier: "high",
    label: "Direct Clients",
    responseTimeMinutes: 120,        // 2 hours to respond
    cancellationGraceHours: 4,       // Can cancel up to 4h before
    sources: ["native", "package"],
    color: "#8870E9",
    description: "Clients who pay directly or have packages",
  },
  {
    tier: "medium",
    label: "ClassPass",
    responseTimeMinutes: 60,         // 1 hour to respond
    cancellationGraceHours: 12,      // Must cancel 12h before
    sources: ["classpass"],
    color: "#DD2590",
    description: "ClassPass members",
  },
  {
    tier: "low",
    label: "Aggregators",
    responseTimeMinutes: 30,         // 30 min to respond
    cancellationGraceHours: 24,      // Must cancel 24h before
    sources: ["gympass", "totalpass", "urban"],
    color: "#98A2B3",
    description: "Gympass, TotalPass, and other aggregators",
  },
];

export const defaultWaitlistSettings: WaitlistSettings = {
  enabled: true,
  maxWaitlistSize: 10,
  autoNotifyOnCancel: true,
  notificationChannels: ["whatsapp", "email"],
  confirmationMethod: "link",
  showPositionToClient: true,
  allowAutoConfirm: true,
  noShowPenalty: {
    enabled: true,
    maxNoShows: 2,
    penaltyDays: 7,
  },
  priorityBoost: {
    enabled: true,
    attendanceThreshold: 8,          // 8+ classes/month
    boostPercentage: 20,
  },
};

// Waitlist entry interface
export interface WaitlistEntry {
  id: string;
  classId: string;
  clientId: string;
  clientName: string;
  clientSource: ClientSource;
  priorityTier: PriorityTier;
  position: number;
  joinedAt: Date;
  notifiedAt?: Date;
  respondBy?: Date;
  status: "waiting" | "notified" | "confirmed" | "expired" | "cancelled";
  autoConfirm: boolean;
  attendanceScore?: number;          // For priority boost calculation
}

// Waitlist analytics
export interface WaitlistAnalytics {
  totalEnqueued: number;
  totalConverted: number;
  conversionRate: number;
  avgWaitTime: number;               // Minutes
  bySource: Record<ClientSource, {
    enqueued: number;
    converted: number;
    rate: number;
  }>;
  peakDemandClasses: string[];       // Classes with most waitlist activity
}

// Helper functions
export function getClientPriorityTier(
  source: ClientSource,
  isVip: boolean,
  tiers: WaitlistPriorityConfig[] = defaultPriorityTiers
): WaitlistPriorityConfig {
  if (isVip) {
    return tiers.find(t => t.tier === "vip")!;
  }
  return tiers.find(t => t.sources.includes(source)) || tiers[tiers.length - 1];
}

export function calculateEffectivePriority(
  entry: WaitlistEntry,
  settings: WaitlistSettings
): number {
  // Base priority from tier (vip=100, high=75, medium=50, low=25)
  const tierPriority: Record<PriorityTier, number> = {
    vip: 100,
    high: 75,
    medium: 50,
    low: 25,
  };

  let priority = tierPriority[entry.priorityTier];

  // Apply attendance boost if enabled
  if (settings.priorityBoost.enabled && entry.attendanceScore) {
    if (entry.attendanceScore >= settings.priorityBoost.attendanceThreshold) {
      priority += (priority * settings.priorityBoost.boostPercentage) / 100;
    }
  }

  // Time in queue factor (longer wait = slight boost, max 10%)
  const minutesWaiting = (Date.now() - entry.joinedAt.getTime()) / 60000;
  const timeBoost = Math.min(minutesWaiting / 60, 10); // Cap at 10%
  priority += timeBoost;

  return priority;
}

export function sortWaitlistByPriority(
  entries: WaitlistEntry[],
  settings: WaitlistSettings
): WaitlistEntry[] {
  return [...entries].sort((a, b) => {
    const priorityA = calculateEffectivePriority(a, settings);
    const priorityB = calculateEffectivePriority(b, settings);
    return priorityB - priorityA; // Higher priority first
  });
}

// Notification templates
export const waitlistNotificationTemplates = {
  spotAvailable: {
    whatsapp: `🎉 Great news! A spot opened in {{className}} on {{date}} at {{time}}!

You have {{responseTime}} minutes to confirm.

👉 Tap to confirm: {{confirmLink}}

Your spot will go to the next person if not confirmed in time.`,

    email: {
      subject: "A spot opened up in {{className}}!",
      body: `A spot just opened in your waitlisted class!

Class: {{className}}
Date: {{date}}
Time: {{time}}
Instructor: {{instructor}}

You have {{responseTime}} minutes to confirm your spot.

[Confirm My Spot]

If you don't confirm in time, the spot will go to the next person on the waitlist.`,
    },
  },

  positionUpdate: {
    whatsapp: `📊 Waitlist update: You're now #{{position}} for {{className}} on {{date}}.

We'll notify you immediately when a spot opens!`,
  },

  spotConfirmed: {
    whatsapp: `✅ Confirmed! You're booked for {{className}} on {{date}} at {{time}}.

See you there! 🧘‍♀️`,
  },

  spotExpired: {
    whatsapp: `⏰ Time expired. The spot in {{className}} went to the next person.

You're still on the waitlist. We'll notify you if another spot opens.`,
  },
};
