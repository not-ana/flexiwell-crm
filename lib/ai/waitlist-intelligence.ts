// AI-Powered Waitlist Intelligence
// Predictive analytics and smart recommendations for waitlist management

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { Class, Booking, Client } from "@/lib/db/schemas";
import {
  WaitlistEntry,
  WaitlistSettings,
  ClientSource,
  calculateEffectivePriority,
} from "@/lib/config/waitlist";

export interface WaitlistPrediction {
  classId: string;
  className: string;
  date: string;
  predictedCancellations: number;
  confidence: number; // 0-100
  recommendedWaitlistSize: number;
  peakCancellationTime: string; // e.g., "2 hours before class"
  factors: {
    historicalCancellationRate: number;
    dayOfWeek: string;
    timeOfDay: string;
    weatherImpact?: number;
    seasonalTrend?: number;
  };
}

export interface ClientPrediction {
  clientId: string;
  showUpProbability: number; // 0-100
  cancellationLikelihood: number; // 0-100
  optimalNotificationTime: string;
  preferredChannel: "whatsapp" | "sms" | "email" | "push";
  factors: {
    historicalShowUpRate: number;
    recentCancellations: number;
    responseTimeAvg: number; // minutes
    timeOfDayPreference: string;
  };
}

export interface WaitlistOptimization {
  currentWaitlist: WaitlistEntry[];
  recommendations: {
    type:
      | "increase_capacity"
      | "add_class"
      | "notify_early"
      | "adjust_priority"
      | "contact_client";
    priority: "high" | "medium" | "low";
    message: string;
    action?: {
      type: string;
      params: Record<string, unknown>;
    };
  }[];
  estimatedConversionRate: number;
  suggestedActions: string[];
}

// Helper to get historical data from database
async function getHistoricalCancellationData(
  classType?: string,
  instructorId?: string,
  daysBack: number = 90
): Promise<{ date: string; cancellations: number; totalBookings: number }[]> {
  const db = await getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const matchStage: Record<string, unknown> = {
    scheduledDate: { $gte: startDate, $lt: new Date() },
  };

  if (classType) matchStage.type = classType;
  if (instructorId) matchStage.instructorId = instructorId;

  const bookingsByDate = await db.collection<Booking>("bookings")
    .aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$scheduledDate" }
          },
          totalBookings: { $sum: 1 },
          cancellations: {
            $sum: {
              $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0]
            }
          },
          noShows: {
            $sum: {
              $cond: [{ $eq: ["$status", "no-show"] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ])
    .toArray();

  return bookingsByDate.map(d => ({
    date: d._id as string,
    cancellations: (d.cancellations as number) + (d.noShows as number),
    totalBookings: d.totalBookings as number,
  }));
}

// Calculate seasonal trend based on month comparisons
function calculateSeasonalTrend(historicalData: { date: string; cancellations: number; totalBookings: number }[]): number {
  if (historicalData.length < 30) return 0;

  const currentMonth = new Date().getMonth();
  const currentMonthData = historicalData.filter(d => new Date(d.date).getMonth() === currentMonth);
  const otherMonthsData = historicalData.filter(d => new Date(d.date).getMonth() !== currentMonth);

  if (currentMonthData.length === 0 || otherMonthsData.length === 0) return 0;

  const currentRate = currentMonthData.reduce((sum, d) =>
    sum + (d.totalBookings > 0 ? d.cancellations / d.totalBookings : 0), 0) / currentMonthData.length;

  const otherRate = otherMonthsData.reduce((sum, d) =>
    sum + (d.totalBookings > 0 ? d.cancellations / d.totalBookings : 0), 0) / otherMonthsData.length;

  // Return percentage difference
  return otherRate > 0 ? ((currentRate - otherRate) / otherRate) * 100 : 0;
}

// AI-powered waitlist prediction
export async function predictClassCancellations(
  classId: string,
  historicalData?: {
    date: string;
    cancellations: number;
    totalBookings: number;
  }[]
): Promise<WaitlistPrediction> {
  const db = await getDatabase();

  // Get class info from database
  let classInfo: Class | null = null;
  if (ObjectId.isValid(classId)) {
    classInfo = await db.collection<Class>("classes").findOne({ _id: new ObjectId(classId) });
  }

  // If no historical data provided, fetch from database
  let data = historicalData;
  if (!data || data.length === 0) {
    data = await getHistoricalCancellationData(
      classInfo?.type,
      classInfo?.instructorId,
      90
    );
  }

  // Calculate average cancellation rate with fallback
  let avgCancellationRate = 0.15; // Default 15% if no data
  if (data.length > 0) {
    const validData = data.filter(d => d.totalBookings > 0);
    if (validData.length > 0) {
      avgCancellationRate = validData.reduce((sum, d) => sum + d.cancellations / d.totalBookings, 0) / validData.length;
    }
  }

  const dayFactors: Record<string, number> = {
    monday: 1.2, // 20% more cancellations on Mondays
    friday: 0.8, // 20% fewer cancellations on Fridays
    saturday: 0.7,
    sunday: 0.9,
    tuesday: 1.0,
    wednesday: 1.0,
    thursday: 1.0,
  };

  const timeFactors: Record<string, number> = {
    early_morning: 1.3, // 6-9am - higher cancellations
    morning: 1.0, // 9-12pm
    afternoon: 0.9, // 12-5pm
    evening: 0.8, // 5-8pm - lower cancellations
  };

  // Use class scheduled date if available, otherwise use today
  const classDate = classInfo?.scheduledDate ? new Date(classInfo.scheduledDate) : new Date();
  const dayOfWeek = classDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  // Parse class start time
  let hour = 9; // default morning
  if (classInfo?.startTime) {
    const [h] = classInfo.startTime.split(":").map(Number);
    hour = h;
  }

  let timeOfDay = "morning";
  if (hour < 9) timeOfDay = "early_morning";
  else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
  else if (hour >= 17) timeOfDay = "evening";

  const dayFactor = dayFactors[dayOfWeek] || 1.0;
  const timeFactor = timeFactors[timeOfDay] || 1.0;

  // Calculate seasonal trend
  const seasonalTrend = calculateSeasonalTrend(data);
  const seasonalFactor = 1 + (seasonalTrend / 100);

  const predictedRate = avgCancellationRate * dayFactor * timeFactor * seasonalFactor;
  const totalBookings = classInfo?.currentEnrollment || data[data.length - 1]?.totalBookings || 10;
  const predictedCancellations = Math.round(predictedRate * totalBookings);

  // Calculate confidence based on data quality
  let confidence = 50; // Base confidence
  if (data.length >= 30) confidence += 15;
  if (data.length >= 60) confidence += 10;
  if (data.length >= 90) confidence += 5;
  // Boost confidence if we have class-specific data
  if (classInfo) confidence += 10;
  // Cap at 95%
  confidence = Math.min(confidence, 95);

  // Determine peak cancellation time based on historical patterns
  let peakCancellationTime = "2 hours before class";
  if (avgCancellationRate > 0.25) {
    peakCancellationTime = "4 hours before class";
  } else if (avgCancellationRate < 0.1) {
    peakCancellationTime = "1 hour before class";
  }

  return {
    classId,
    className: classInfo?.title || "Class",
    date: classDate.toISOString(),
    predictedCancellations: Math.max(1, predictedCancellations),
    confidence,
    recommendedWaitlistSize: Math.max(predictedCancellations + 2, 3), // Minimum 3, buffer of 2
    peakCancellationTime,
    factors: {
      historicalCancellationRate: Math.round(avgCancellationRate * 100),
      dayOfWeek,
      timeOfDay,
      weatherImpact: 0, // Weather integration would require external API
      seasonalTrend: Math.round(seasonalTrend),
    },
  };
}

// Helper to get client booking statistics from database
async function getClientBookingStats(clientId: string): Promise<{
  booked: number;
  attended: number;
  cancelled: number;
  noShows: number;
  avgResponseTime: number;
  timeOfDayPreference: string;
}> {
  const db = await getDatabase();

  const bookings = await db.collection<Booking>("bookings")
    .find({ clientId })
    .toArray();

  const attended = bookings.filter(b => b.status === "completed").length;
  const cancelled = bookings.filter(b => b.status === "cancelled").length;
  const noShows = bookings.filter(b => b.status === "no-show").length;

  // Calculate average response time (time between booking creation and class date)
  let totalResponseTime = 0;
  let responseCount = 0;
  for (const booking of bookings) {
    if (booking.createdAt && booking.scheduledDate) {
      const diff = new Date(booking.scheduledDate).getTime() - new Date(booking.createdAt).getTime();
      totalResponseTime += diff / (1000 * 60); // Convert to minutes
      responseCount++;
    }
  }
  const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 60;

  // Calculate time of day preference
  const timeSlots: Record<string, number> = {
    early_morning: 0,
    morning: 0,
    afternoon: 0,
    evening: 0,
  };

  for (const booking of bookings) {
    if (booking.startTime) {
      const [hour] = booking.startTime.split(":").map(Number);
      if (hour < 9) timeSlots.early_morning++;
      else if (hour < 12) timeSlots.morning++;
      else if (hour < 17) timeSlots.afternoon++;
      else timeSlots.evening++;
    }
  }

  const preferredTime = Object.entries(timeSlots).reduce((max, [time, count]) =>
    count > max.count ? { time, count } : max
  , { time: "morning", count: 0 }).time;

  return {
    booked: bookings.length,
    attended,
    cancelled,
    noShows,
    avgResponseTime: Math.round(avgResponseTime),
    timeOfDayPreference: preferredTime,
  };
}

// Predict client behavior - can be called with data or will fetch from DB
export async function predictClientBehavior(
  clientId: string,
  historicalBookings?: {
    booked: number;
    attended: number;
    cancelled: number;
    noShows: number;
    avgResponseTime: number;
  },
  communicationPrefs?: {
    whatsapp: number;
    sms: number;
    email: number;
    push: number;
  }
): Promise<ClientPrediction> {
  // Fetch data from database if not provided
  let bookingData = historicalBookings;
  let timeOfDayPreference = "morning";

  if (!bookingData) {
    const stats = await getClientBookingStats(clientId);
    bookingData = stats;
    timeOfDayPreference = stats.timeOfDayPreference;
  }

  // Get client preferences from database if not provided
  let prefs = communicationPrefs;
  if (!prefs) {
    const db = await getDatabase();
    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(clientId)
    });

    // Default preferences based on client notification settings
    const notifications = client?.preferences?.notifications;
    prefs = {
      whatsapp: notifications?.whatsapp ? 10 : 0,
      sms: 0, // SMS not in current schema
      email: notifications?.email ? 3 : 0,
      push: 0, // Push not in current schema
    };

    // If no preferences set, default to whatsapp
    if (Object.values(prefs).every(v => v === 0)) {
      prefs.whatsapp = 10;
    }
  }

  const totalBookings =
    bookingData.attended + bookingData.cancelled + bookingData.noShows;

  const showUpRate =
    totalBookings > 0 ? (bookingData.attended / totalBookings) * 100 : 80;

  const cancellationLikelihood =
    totalBookings > 0
      ? ((bookingData.cancelled + bookingData.noShows) / totalBookings) * 100
      : 20;

  // Find preferred channel
  const maxChannel = Object.entries(prefs).reduce((max, [channel, count]) =>
    count > max.count ? { channel, count } : max
  , { channel: "whatsapp", count: 0 });

  // Optimal notification time based on response patterns
  let optimalTime = "2 hours before";
  if (bookingData.avgResponseTime < 30) {
    optimalTime = "1 hour before";
  } else if (bookingData.avgResponseTime > 120) {
    optimalTime = "4 hours before";
  }

  return {
    clientId,
    showUpProbability: Math.round(showUpRate),
    cancellationLikelihood: Math.round(cancellationLikelihood),
    optimalNotificationTime: optimalTime,
    preferredChannel: maxChannel.channel as "whatsapp" | "sms" | "email" | "push",
    factors: {
      historicalShowUpRate: Math.round(showUpRate),
      recentCancellations: bookingData.cancelled,
      responseTimeAvg: bookingData.avgResponseTime,
      timeOfDayPreference,
    },
  };
}

// Smart waitlist reordering based on AI predictions
export function optimizeWaitlistOrder(
  waitlist: WaitlistEntry[],
  clientPredictions: Map<string, ClientPrediction>,
  settings: WaitlistSettings
): WaitlistEntry[] {
  return waitlist
    .map((entry) => {
      const prediction = clientPredictions.get(entry.clientId);
      const basePriority = calculateEffectivePriority(entry, settings);

      let adjustedPriority = basePriority;

      // Boost priority for high show-up probability clients
      if (prediction && prediction.showUpProbability > 85) {
        adjustedPriority *= 1.15; // 15% boost
      }

      // Reduce priority for high cancellation likelihood
      if (prediction && prediction.cancellationLikelihood > 40) {
        adjustedPriority *= 0.9; // 10% penalty
      }

      return {
        ...entry,
        _aiPriority: adjustedPriority,
      };
    })
    .sort((a, b) => (b as any)._aiPriority - (a as any)._aiPriority);
}

// Generate waitlist optimization recommendations
export function generateWaitlistRecommendations(
  classId: string,
  currentWaitlist: WaitlistEntry[],
  prediction: WaitlistPrediction,
  capacity: number,
  currentBookings: number
): WaitlistOptimization {
  const recommendations: WaitlistOptimization["recommendations"] = [];
  const availableSpots = capacity - currentBookings;
  const waitlistSize = currentWaitlist.length;

  // Recommendation 1: Waitlist size management
  if (waitlistSize < prediction.recommendedWaitlistSize) {
    recommendations.push({
      type: "increase_capacity",
      priority: "medium",
      message: `Consider increasing max waitlist size to ${prediction.recommendedWaitlistSize} based on predicted ${prediction.predictedCancellations} cancellations`,
      action: {
        type: "update_waitlist_limit",
        params: { classId, maxSize: prediction.recommendedWaitlistSize },
      },
    });
  }

  // Recommendation 2: Early notification
  if (prediction.confidence > 70 && waitlistSize > 0) {
    recommendations.push({
      type: "notify_early",
      priority: "high",
      message: `High confidence (${prediction.confidence}%) of ${prediction.predictedCancellations} cancellations. Consider notifying top ${prediction.predictedCancellations} waitlist members early.`,
      action: {
        type: "send_early_notification",
        params: { classId, count: prediction.predictedCancellations },
      },
    });
  }

  // Recommendation 3: Add class
  if (waitlistSize > prediction.recommendedWaitlistSize * 1.5) {
    recommendations.push({
      type: "add_class",
      priority: "high",
      message: `High demand! Waitlist (${waitlistSize}) exceeds recommended size by 50%. Consider adding another class.`,
      action: {
        type: "suggest_additional_class",
        params: { classId, waitlistSize },
      },
    });
  }

  // Recommendation 4: Priority adjustment
  const vipCount = currentWaitlist.filter((e) => e.priorityTier === "vip").length;
  const lowPriorityCount = currentWaitlist.filter((e) => e.priorityTier === "low").length;

  if (lowPriorityCount > vipCount * 3) {
    recommendations.push({
      type: "adjust_priority",
      priority: "low",
      message: `Waitlist has ${lowPriorityCount} low-priority members vs ${vipCount} VIP. Consider reviewing priority settings.`,
    });
  }

  // Recommendation 5: Proactive client contact
  const expiringSoon = currentWaitlist.filter((e) => {
    if (!e.respondBy) return false;
    const minutesLeft = (e.respondBy.getTime() - Date.now()) / 60000;
    return minutesLeft < 15 && minutesLeft > 0;
  });

  if (expiringSoon.length > 0) {
    recommendations.push({
      type: "contact_client",
      priority: "high",
      message: `${expiringSoon.length} client(s) have < 15 min to respond. Consider a follow-up notification.`,
      action: {
        type: "send_reminder",
        params: { clientIds: expiringSoon.map((e) => e.clientId) },
      },
    });
  }

  // Calculate estimated conversion rate from waitlist history
  // Using prediction confidence to adjust expected conversion
  const baseConversionRate = 0.65; // Industry average fallback
  const estimatedConversionRate = Math.min(
    baseConversionRate * (prediction.confidence / 100),
    0.95
  );

  // Generate suggested actions
  const suggestedActions = recommendations
    .filter((r) => r.priority === "high")
    .map((r) => r.message);

  return {
    currentWaitlist,
    recommendations: recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }),
    estimatedConversionRate: Math.round(estimatedConversionRate * 100),
    suggestedActions,
  };
}

// Real-time waitlist analytics
export interface RealTimeWaitlistMetrics {
  totalWaitlisted: number;
  byPriority: Record<string, number>;
  avgWaitTime: number; // minutes
  conversionRate: number; // %
  activeNotifications: number;
  expiringNotifications: number; // < 15 min
  predictedConversions: number;
  revenueAtRisk: number; // potential lost revenue if waitlist fails
}

export function calculateRealTimeMetrics(
  waitlist: WaitlistEntry[],
  avgClassValue: number,
  historicalConversionRate: number
): RealTimeWaitlistMetrics {
  const totalWaitlisted = waitlist.length;

  const byPriority = waitlist.reduce(
    (acc, entry) => {
      acc[entry.priorityTier] = (acc[entry.priorityTier] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const avgWaitTime =
    waitlist.reduce((sum, entry) => {
      const waitMinutes = (Date.now() - entry.joinedAt.getTime()) / 60000;
      return sum + waitMinutes;
    }, 0) / (totalWaitlisted || 1);

  const activeNotifications = waitlist.filter((e) => e.status === "notified").length;

  const expiringNotifications = waitlist.filter((e) => {
    if (!e.respondBy || e.status !== "notified") return false;
    const minutesLeft = (e.respondBy.getTime() - Date.now()) / 60000;
    return minutesLeft < 15 && minutesLeft > 0;
  }).length;

  const predictedConversions = Math.round(totalWaitlisted * (historicalConversionRate / 100));

  const revenueAtRisk =
    (totalWaitlisted - predictedConversions) * avgClassValue;

  return {
    totalWaitlisted,
    byPriority,
    avgWaitTime: Math.round(avgWaitTime),
    conversionRate: Math.round(historicalConversionRate),
    activeNotifications,
    expiringNotifications,
    predictedConversions,
    revenueAtRisk: Math.round(revenueAtRisk),
  };
}

// Smart notification timing
export function calculateOptimalNotificationTime(
  entry: WaitlistEntry,
  classStartTime: Date,
  clientPrediction: ClientPrediction
): Date {
  const hoursBeforeClass = parseInt(clientPrediction.optimalNotificationTime);
  const notificationTime = new Date(classStartTime);
  notificationTime.setHours(notificationTime.getHours() - hoursBeforeClass);

  // Don't notify in the middle of the night
  const hour = notificationTime.getHours();
  if (hour < 7) {
    notificationTime.setHours(7, 0, 0, 0);
  } else if (hour > 21) {
    // Notify next morning instead
    notificationTime.setDate(notificationTime.getDate() + 1);
    notificationTime.setHours(7, 0, 0, 0);
  }

  return notificationTime;
}

// Waitlist health score
export function calculateWaitlistHealth(
  waitlist: WaitlistEntry[],
  metrics: RealTimeWaitlistMetrics,
  prediction: WaitlistPrediction
): {
  score: number; // 0-100
  status: "excellent" | "good" | "fair" | "poor";
  issues: string[];
  strengths: string[];
} {
  let score = 100;
  const issues: string[] = [];
  const strengths: string[] = [];

  // Factor 1: Conversion rate
  if (metrics.conversionRate < 50) {
    score -= 20;
    issues.push(`Low conversion rate (${metrics.conversionRate}%)`);
  } else if (metrics.conversionRate > 70) {
    strengths.push(`High conversion rate (${metrics.conversionRate}%)`);
  }

  // Factor 2: Response time
  if (metrics.avgWaitTime > 180) {
    score -= 15;
    issues.push(`Long average wait time (${Math.round(metrics.avgWaitTime / 60)} hours)`);
  } else if (metrics.avgWaitTime < 60) {
    strengths.push("Quick wait times");
  }

  // Factor 3: Expiring notifications
  if (metrics.expiringNotifications > 2) {
    score -= 10;
    issues.push(`${metrics.expiringNotifications} notifications expiring soon`);
  }

  // Factor 4: Prediction confidence
  if (prediction.confidence < 60) {
    score -= 10;
    issues.push("Low prediction confidence - need more data");
  } else if (prediction.confidence > 80) {
    strengths.push("High prediction accuracy");
  }

  // Factor 5: Revenue at risk
  if (metrics.revenueAtRisk > 500) {
    score -= 15;
    issues.push(`$${metrics.revenueAtRisk} revenue at risk from unconverted waitlist`);
  }

  let status: "excellent" | "good" | "fair" | "poor";
  if (score >= 90) status = "excellent";
  else if (score >= 75) status = "good";
  else if (score >= 60) status = "fair";
  else status = "poor";

  return {
    score: Math.max(0, score),
    status,
    issues,
    strengths,
  };
}

// Calculate historical conversion rate from waitlist entries
export async function getHistoricalConversionRate(daysBack: number = 90): Promise<number> {
  const db = await getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const waitlistStats = await db.collection("waitlist")
    .aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ["confirmed", "expired", "declined"] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          converted: {
            $sum: {
              $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0]
            }
          }
        }
      }
    ])
    .toArray();

  if (waitlistStats.length === 0 || waitlistStats[0].total === 0) {
    return 65; // Default industry average
  }

  return Math.round((waitlistStats[0].converted / waitlistStats[0].total) * 100);
}

// Full waitlist intelligence analysis
export async function analyzeWaitlistIntelligence(classId: string): Promise<{
  prediction: WaitlistPrediction;
  clientPredictions: Map<string, ClientPrediction>;
  historicalConversionRate: number;
}> {
  const db = await getDatabase();

  // Get prediction for the class
  const prediction = await predictClassCancellations(classId);

  // Get waitlist entries for this class
  const waitlistEntries = await db.collection("waitlist")
    .find({ classId, status: { $in: ["waiting", "notified"] } })
    .toArray();

  // Get client predictions for all waitlisted clients
  const clientPredictions = new Map<string, ClientPrediction>();
  for (const entry of waitlistEntries) {
    const clientPrediction = await predictClientBehavior(entry.clientId);
    clientPredictions.set(entry.clientId, clientPrediction);
  }

  // Get historical conversion rate
  const historicalConversionRate = await getHistoricalConversionRate();

  return {
    prediction,
    clientPredictions,
    historicalConversionRate,
  };
}

// Batch analysis for dashboard
export async function getWaitlistDashboardAnalytics(): Promise<{
  overallHealth: { score: number; status: string };
  topPredictions: WaitlistPrediction[];
  conversionRate: number;
  totalWaitlisted: number;
  avgWaitTime: number;
}> {
  const db = await getDatabase();

  // Get upcoming classes with waitlists
  const upcomingClasses = await db.collection<Class>("classes")
    .find({
      scheduledDate: { $gte: new Date() },
      status: "scheduled",
      "waitlist.0": { $exists: true }
    })
    .sort({ scheduledDate: 1 })
    .limit(10)
    .toArray();

  // Get predictions for each class
  const predictions: WaitlistPrediction[] = [];
  for (const cls of upcomingClasses) {
    const prediction = await predictClassCancellations(cls._id?.toString() || "");
    predictions.push(prediction);
  }

  // Get all active waitlist entries
  const activeWaitlist = await db.collection("waitlist")
    .find({ status: { $in: ["waiting", "notified"] } })
    .toArray();

  // Calculate average wait time
  const totalWaitMinutes = activeWaitlist.reduce((sum, entry) => {
    const waitTime = entry.createdAt
      ? (Date.now() - new Date(entry.createdAt).getTime()) / 60000
      : 0;
    return sum + waitTime;
  }, 0);
  const avgWaitTime = activeWaitlist.length > 0
    ? Math.round(totalWaitMinutes / activeWaitlist.length)
    : 0;

  // Get conversion rate
  const conversionRate = await getHistoricalConversionRate();

  // Calculate overall health score
  let healthScore = 75; // Base score
  if (conversionRate > 70) healthScore += 10;
  else if (conversionRate < 50) healthScore -= 15;
  if (avgWaitTime < 60) healthScore += 5;
  else if (avgWaitTime > 180) healthScore -= 10;
  healthScore = Math.min(100, Math.max(0, healthScore));

  const status = healthScore >= 80 ? "excellent" :
    healthScore >= 60 ? "good" :
    healthScore >= 40 ? "fair" : "poor";

  return {
    overallHealth: { score: healthScore, status },
    topPredictions: predictions.slice(0, 5),
    conversionRate,
    totalWaitlisted: activeWaitlist.length,
    avgWaitTime,
  };
}
