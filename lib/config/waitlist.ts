// Waitlist Configuration - Simplified for MVP
// Priority based on client source (direct clients > aggregators)

export type ClientSource =
  | "direct"       // Direct client - pays studio directly
  | "package"      // Purchased package/credits
  | "classpass"    // ClassPass
  | "gympass"      // Gympass/Wellhub
  | "trial";       // Trial/first-time

export interface SourcePriority {
  source: ClientSource;
  label: string;
  points: number;
  color: string;
}

// Priority by client source - direct clients first
export const sourcePriorities: SourcePriority[] = [
  { source: "direct", label: "Direct Client", points: 100, color: "#6938EF" },
  { source: "package", label: "Package", points: 75, color: "#8870E9" },
  { source: "classpass", label: "ClassPass", points: 50, color: "#DD2590" },
  { source: "gympass", label: "Gympass", points: 25, color: "#F79009" },
  { source: "trial", label: "Trial", points: 10, color: "#98A2B3" },
];

export interface SourcePriorityConfig {
  source: ClientSource;
  enabled: boolean;
  points: number;
}

export interface WaitlistSettings {
  enabled: boolean;
  maxPerClass: number;
  notifyViaSMS: boolean;
  notifyViaEmail: boolean;
  autoConfirmDirect: boolean; // Auto-confirm direct clients
  sourcePriorities: SourcePriorityConfig[];
}

export const defaultSourcePriorities: SourcePriorityConfig[] = [
  { source: "direct", enabled: true, points: 100 },
  { source: "package", enabled: true, points: 75 },
  { source: "classpass", enabled: false, points: 50 },
  { source: "gympass", enabled: false, points: 25 },
  { source: "trial", enabled: true, points: 10 },
];

export const defaultWaitlistSettings: WaitlistSettings = {
  enabled: true,
  maxPerClass: 10,
  notifyViaSMS: true,
  notifyViaEmail: true,
  autoConfirmDirect: false,
  sourcePriorities: defaultSourcePriorities,
};

// Simple priority calculation: source points + time in queue
export function calculatePriority(source: ClientSource, joinedAt: Date): number {
  const sourcePriority = sourcePriorities.find(s => s.source === source);
  const basePoints = sourcePriority?.points || 25;

  // +1 point per hour in queue (max 24 points = 1 day)
  const hoursWaiting = (Date.now() - joinedAt.getTime()) / (1000 * 60 * 60);
  const timePoints = Math.min(Math.floor(hoursWaiting), 24);

  return basePoints + timePoints;
}

export function getSourceInfo(source: ClientSource): SourcePriority {
  return sourcePriorities.find(s => s.source === source) || sourcePriorities[0];
}

export function sortByPriority<T extends { source: ClientSource; joinedAt: Date }>(
  entries: T[]
): T[] {
  return [...entries].sort((a, b) => {
    const priorityA = calculatePriority(a.source, a.joinedAt);
    const priorityB = calculatePriority(b.source, b.joinedAt);
    return priorityB - priorityA;
  });
}

// Notification templates
export const notificationTemplates = {
  spotAvailable: {
    sms: `Spot open! {{className}} on {{date}} at {{time}}. Confirm in 30min or it goes to the next person. {{confirmUrl}}`,
    email: `Hi {{clientName}}! A spot opened up in {{className}} ({{date}} at {{time}}). You have 30 minutes to confirm your spot.`,
  },
  confirmed: {
    sms: `Confirmed! You're in {{className}} on {{date}} at {{time}}. See you there!`,
    email: `You're confirmed for {{className}} on {{date}} at {{time}}. See you there!`,
  },
  expired: {
    sms: `Your spot in {{className}} expired. You're still on the waitlist - we'll text you when another opens.`,
    email: `The time to confirm your spot in {{className}} has expired. You're still on the waitlist and we'll notify you when another spot opens up.`,
  },
};
