// AI-Powered Waitlist Intelligence
// Predictive analytics and smart recommendations for waitlist management

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

// AI-powered waitlist prediction
export async function predictClassCancellations(
  classId: string,
  historicalData: {
    date: string;
    cancellations: number;
    totalBookings: number;
  }[]
): Promise<WaitlistPrediction> {
  // TODO: Implement ML model for prediction
  // For now, use rule-based heuristics

  const avgCancellationRate =
    historicalData.reduce((sum, d) => sum + d.cancellations / d.totalBookings, 0) /
    historicalData.length;

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
    early_morning: 1.3, // 6-9am
    morning: 1.0, // 9-12pm
    afternoon: 0.9, // 12-5pm
    evening: 0.8, // 5-8pm
  };

  const date = new Date();
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const hour = date.getHours();

  let timeOfDay = "morning";
  if (hour < 9) timeOfDay = "early_morning";
  else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
  else if (hour >= 17) timeOfDay = "evening";

  const dayFactor = dayFactors[dayOfWeek] || 1.0;
  const timeFactor = timeFactors[timeOfDay] || 1.0;

  const predictedRate = avgCancellationRate * dayFactor * timeFactor;
  const totalBookings = historicalData[historicalData.length - 1]?.totalBookings || 10;
  const predictedCancellations = Math.round(predictedRate * totalBookings);

  return {
    classId,
    className: "Sample Class", // TODO: Get from database
    date: date.toISOString(),
    predictedCancellations: Math.max(1, predictedCancellations),
    confidence: 75,
    recommendedWaitlistSize: predictedCancellations + 2, // Buffer of 2
    peakCancellationTime: "2 hours before class",
    factors: {
      historicalCancellationRate: avgCancellationRate * 100,
      dayOfWeek,
      timeOfDay,
      weatherImpact: 0, // TODO: Integrate weather API
      seasonalTrend: 0, // TODO: Calculate from historical data
    },
  };
}

// Predict client behavior
export function predictClientBehavior(
  clientId: string,
  historicalBookings: {
    booked: number;
    attended: number;
    cancelled: number;
    noShows: number;
    avgResponseTime: number;
  },
  communicationPrefs: {
    whatsapp: number;
    sms: number;
    email: number;
    push: number;
  }
): ClientPrediction {
  const totalBookings =
    historicalBookings.attended + historicalBookings.cancelled + historicalBookings.noShows;

  const showUpRate =
    totalBookings > 0 ? (historicalBookings.attended / totalBookings) * 100 : 80;

  const cancellationLikelihood =
    totalBookings > 0
      ? ((historicalBookings.cancelled + historicalBookings.noShows) / totalBookings) * 100
      : 20;

  // Find preferred channel
  const maxChannel = Object.entries(communicationPrefs).reduce((max, [channel, count]) =>
    count > max.count ? { channel, count } : max
  , { channel: "whatsapp", count: 0 });

  // Optimal notification time based on response patterns
  let optimalTime = "2 hours before";
  if (historicalBookings.avgResponseTime < 30) {
    optimalTime = "1 hour before";
  } else if (historicalBookings.avgResponseTime > 120) {
    optimalTime = "4 hours before";
  }

  return {
    clientId,
    showUpProbability: showUpRate,
    cancellationLikelihood,
    optimalNotificationTime: optimalTime,
    preferredChannel: maxChannel.channel as "whatsapp" | "sms" | "email" | "push",
    factors: {
      historicalShowUpRate: showUpRate,
      recentCancellations: historicalBookings.cancelled,
      responseTimeAvg: historicalBookings.avgResponseTime,
      timeOfDayPreference: "morning", // TODO: Calculate from booking patterns
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

  // Calculate estimated conversion rate
  const historicalConversionRate = 0.65; // TODO: Calculate from actual data
  const estimatedConversionRate = Math.min(
    historicalConversionRate * (prediction.confidence / 100),
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
