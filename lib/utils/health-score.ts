// Health Score Calculator — Hormozi Value Equation Applied
// Health Score = Attendance (25) + Plan Utilization (25) + Recency (25) + Payment Health (25)

export interface HealthScoreInput {
  // Attendance
  completedBookings: number;
  totalBookings: number; // completed + no-shows + cancelled by client
  // Plan utilization
  classesUsed: number;
  classesTotal: number;
  planStartDate: Date | string;
  planEndDate: Date | string;
  // Recency
  lastActivityDate?: Date | string | null;
  // Payment
  totalPayments: number;
  failedPayments: number;
  latePayments: number;
}

export interface HealthScoreResult {
  overall: number;
  breakdown: {
    attendance: number;
    planUtilization: number;
    recency: number;
    paymentHealth: number;
  };
  riskLevel: "healthy" | "watch" | "at_risk" | "critical";
}

export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const attendance = calculateAttendanceScore(input);
  const planUtilization = calculatePlanUtilizationScore(input);
  const recency = calculateRecencyScore(input);
  const paymentHealth = calculatePaymentHealthScore(input);

  const overall = Math.round(attendance + planUtilization + recency + paymentHealth);

  let riskLevel: HealthScoreResult["riskLevel"] = "healthy";
  if (overall < 30) riskLevel = "critical";
  else if (overall < 50) riskLevel = "at_risk";
  else if (overall < 70) riskLevel = "watch";

  return {
    overall,
    breakdown: {
      attendance: Math.round(attendance),
      planUtilization: Math.round(planUtilization),
      recency: Math.round(recency),
      paymentHealth: Math.round(paymentHealth),
    },
    riskLevel,
  };
}

function calculateAttendanceScore(input: HealthScoreInput): number {
  if (input.totalBookings === 0) return 15; // New client, neutral score
  const rate = input.completedBookings / input.totalBookings;
  return rate * 25;
}

function calculatePlanUtilizationScore(input: HealthScoreInput): number {
  if (input.classesTotal === 0) return 12.5;

  const now = new Date();
  const start = new Date(input.planStartDate);
  const end = new Date(input.planEndDate);
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = Math.max(0, now.getTime() - start.getTime());
  const timeProgress = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 1;

  const classProgress = input.classesUsed / input.classesTotal;

  // Ideal: class usage tracks time elapsed. Penalize both under-use and over-use
  const utilizationRatio = timeProgress > 0 ? classProgress / timeProgress : classProgress;

  if (utilizationRatio >= 0.8 && utilizationRatio <= 1.3) return 25; // On track
  if (utilizationRatio >= 0.5 && utilizationRatio < 0.8) return 18; // Slightly under
  if (utilizationRatio > 1.3) return 20; // Using fast (not bad but might run out)
  if (utilizationRatio >= 0.2) return 10; // Under-utilizing
  return 5; // Barely using
}

function calculateRecencyScore(input: HealthScoreInput): number {
  if (!input.lastActivityDate) return 5; // No activity = concerning

  const now = new Date();
  const lastActivity = new Date(input.lastActivityDate);
  const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceActivity <= 3) return 25;
  if (daysSinceActivity <= 7) return 22;
  if (daysSinceActivity <= 14) return 15;
  if (daysSinceActivity <= 21) return 10;
  if (daysSinceActivity <= 30) return 5;
  return 2; // 30+ days inactive
}

function calculatePaymentHealthScore(input: HealthScoreInput): number {
  if (input.totalPayments === 0) return 20; // New client, assume good

  const failRate = input.failedPayments / input.totalPayments;
  const lateRate = input.latePayments / input.totalPayments;

  let score = 25;
  score -= failRate * 25; // Failed payments heavily penalize
  score -= lateRate * 10; // Late payments mildly penalize

  return Math.max(0, score);
}

// Determine upgrade suggestion based on Hormozi Ascension Model
export interface UpgradeSuggestion {
  trigger: string;
  currentPlan: string;
  suggestedPlan: string;
  message: string;
  savingsPercent?: number;
}

export function getUpgradeSuggestion(client: {
  planType: string;
  classesUsed: number;
  classesTotal: number;
  dropInCount?: number;
  preferredInstructors?: string[];
  currentStreak?: number;
}): UpgradeSuggestion | null {
  const { planType, classesUsed, classesTotal, dropInCount = 0, preferredInstructors = [], currentStreak = 0 } = client;

  // Drop-in → Monthly
  if (planType === "drop-in" && dropInCount >= 3) {
    return {
      trigger: "frequent_dropin",
      currentPlan: "drop-in",
      suggestedPlan: "monthly",
      message: `This client has used ${dropInCount} drop-ins. A monthly plan saves them ~40%.`,
      savingsPercent: 40,
    };
  }

  // Monthly → Quarterly (high utilization)
  if (planType === "monthly" && classesTotal > 0 && classesUsed / classesTotal > 0.8) {
    return {
      trigger: "high_utilization",
      currentPlan: "monthly",
      suggestedPlan: "quarterly",
      message: "Using 80%+ of classes. Quarterly plan offers better value.",
      savingsPercent: 15,
    };
  }

  // Quarterly → Annual (loyal client)
  if (planType === "quarterly" && currentStreak >= 12) {
    return {
      trigger: "loyal_client",
      currentPlan: "quarterly",
      suggestedPlan: "annual",
      message: "12+ week streak. Annual plan locks in savings.",
      savingsPercent: 20,
    };
  }

  // Same instructor repeatedly → Premium/Semi-private
  if (preferredInstructors.length === 1 && classesUsed >= 10) {
    return {
      trigger: "instructor_loyalty",
      currentPlan: planType,
      suggestedPlan: "premium",
      message: `Always books with the same instructor. Semi-private sessions available.`,
    };
  }

  return null;
}

// Determine lifecycle stage based on behavior
export function determineLifecycleStage(client: {
  status: string;
  healthScore: number;
  daysSinceLastActivity: number;
  totalClasses: number;
  planType: string;
  daysSinceCreated: number;
}): "lead" | "trial" | "active" | "at_risk" | "churned" | "won_back" {
  const { status, healthScore, daysSinceLastActivity, totalClasses, planType, daysSinceCreated } = client;

  if (status === "pending") return "lead";
  if (planType === "trial" || (daysSinceCreated <= 14 && totalClasses <= 2)) return "trial";
  if (status === "inactive" || daysSinceLastActivity > 60) return "churned";
  if (healthScore < 40 || daysSinceLastActivity > 21) return "at_risk";
  if (status === "active" && healthScore >= 40) return "active";

  return "active";
}
