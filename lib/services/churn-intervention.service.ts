// Churn Intervention Service
// Detects WHY a client is at risk and recommends a specific action + message template
// Used by the weekly checkup to give studio owners one-tap interventions

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { calculateHealthScore, type HealthScoreResult } from "@/lib/utils/health-score";

// ============================================
// Types
// ============================================

export type ChurnSignal =
  | "attendance_dropping"    // Was consistent, now fading
  | "plan_underutilized"     // Past midpoint, barely using classes
  | "gone_cold"              // 10+ days since last visit
  | "no_shows_spiking"       // Sudden increase in no-shows
  | "payment_failed"         // First failed payment from clean record
  | "new_not_activated"      // New client, <2 classes in first 2 weeks
  | "streak_broken";         // Had a streak going, now broke it

export type InterventionAction =
  | "schedule_checkin"       // Ask if schedule still works
  | "personal_booking"       // Book a class for them
  | "miss_you_message"       // "We miss you" + class recommendation
  | "offer_pause"            // Suggest plan pause instead of cancel
  | "payment_outreach"       // Personal payment help
  | "instructor_nudge"       // Instructor sends personal invite
  | "milestone_reminder";    // "You're X classes away from Y!"

export interface ChurnIntervention {
  signal: ChurnSignal;
  severity: "low" | "medium" | "high" | "critical";
  action: InterventionAction;
  reason: string;
  messageTemplate: {
    en: string;
    pt: string;
  };
  // Data to fill template placeholders
  templateData?: Record<string, string | number>;
}

export interface ClientChurnCheckup {
  clientId: string;
  clientName: string;
  email: string;
  phone: string;
  healthScore: number;
  healthBreakdown: HealthScoreResult["breakdown"];
  riskLevel: string;
  planType: string;
  planEndDate: Date;
  lastClassDate: Date | null;
  daysSinceLastClass: number;
  currentStreak: number;
  interventions: ChurnIntervention[];
  // The single most important intervention to show first
  primaryIntervention: ChurnIntervention;
}

export interface WeeklyCheckupReport {
  generatedAt: Date;
  establishmentId: string;
  period: { from: Date; to: Date };
  summary: {
    totalAtRisk: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    newlyAtRisk: number; // Became at-risk this week
    improved: number;    // Were at-risk, now improving
  };
  clients: ClientChurnCheckup[];
  // Aggregated insight for the studio owner
  topInsight: string;
}

// ============================================
// Signal Detection
// ============================================

interface ClientData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  plan: {
    type: string;
    totalClasses: number;
    usedClasses: number;
    startDate: Date;
    endDate: Date;
  };
  healthScore?: { overall: number; breakdown: HealthScoreResult["breakdown"]; lastCalculatedAt: Date };
  lastClassDate?: Date;
  currentStreak?: number;
  longestStreak?: number;
  createdAt: Date;
  // Populated from bookings query
  bookingStats?: {
    completedBookings: number;
    totalBookings: number;
    noShows: number;
    recentNoShows: number; // No-shows in last 2 weeks
    previousNoShows: number; // No-shows in the 2 weeks before that
    weeklyAttendance: number[]; // Classes per week for last 4 weeks (newest first)
  };
  paymentStats?: {
    totalPayments: number;
    failedPayments: number;
    recentFailed: number; // Failed in last 2 weeks
  };
}

function detectSignals(client: ClientData): ChurnIntervention[] {
  const interventions: ChurnIntervention[] = [];
  const now = new Date();
  const daysSinceLastClass = client.lastClassDate
    ? Math.floor((now.getTime() - new Date(client.lastClassDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  const daysSinceCreated = Math.floor(
    (now.getTime() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const bs = client.bookingStats;
  const ps = client.paymentStats;

  // 1. New client not activated — <2 classes in first 14 days
  if (daysSinceCreated <= 21 && (bs?.completedBookings ?? 0) < 2) {
    interventions.push({
      signal: "new_not_activated",
      severity: "high",
      action: "instructor_nudge",
      reason: `New client (${daysSinceCreated} days ago) with only ${bs?.completedBookings ?? 0} classes`,
      messageTemplate: {
        en: `Hi {clientName}! This is {instructorName} from {studioName}. I'd love to see you in {nextClassName} on {nextClassDay} — it's a great fit for what you're looking for. Want me to save you a spot?`,
        pt: `Oi {clientName}! Aqui é {instructorName} do {studioName}. Adoraria te ver na aula de {nextClassName} na {nextClassDay} — é perfeita pra o que você busca. Quer que eu reserve sua vaga?`,
      },
    });
  }

  // 2. Attendance dropping — compare last 2 weeks vs previous 2 weeks
  if (bs && bs.weeklyAttendance.length >= 3) {
    const recent = bs.weeklyAttendance[0] + bs.weeklyAttendance[1];
    const previous = bs.weeklyAttendance[2] + (bs.weeklyAttendance[3] ?? bs.weeklyAttendance[2]);
    if (previous > 0 && recent < previous * 0.5) {
      interventions.push({
        signal: "attendance_dropping",
        severity: recent === 0 ? "critical" : "high",
        action: "schedule_checkin",
        reason: `Attendance dropped from ${previous} to ${recent} classes over 2 weeks`,
        messageTemplate: {
          en: `Hi {clientName}! We noticed we haven't seen you as much lately. Did your schedule change? We have new class times that might work better — want me to help find one?`,
          pt: `Oi {clientName}! Sentimos sua falta por aqui. Sua agenda mudou? Temos novos horários que podem funcionar melhor — quer que eu ajude a encontrar um?`,
        },
        templateData: { recentClasses: recent, previousClasses: previous },
      });
    }
  }

  // 3. Gone cold — 10+ days without a visit
  if (daysSinceLastClass >= 10 && daysSinceLastClass < 60 && daysSinceCreated > 21) {
    const severity = daysSinceLastClass >= 21 ? "critical" : daysSinceLastClass >= 14 ? "high" : "medium";
    interventions.push({
      signal: "gone_cold",
      severity,
      action: "miss_you_message",
      reason: `${daysSinceLastClass} days since last class`,
      messageTemplate: {
        en: `Hi {clientName}! It's been a while and we miss you at {studioName}. {instructorName} has a {nextClassName} on {nextClassDay} that would be perfect. Ready to get back into it?`,
        pt: `Oi {clientName}! Faz um tempo que não te vemos no {studioName}. {instructorName} tem uma aula de {nextClassName} na {nextClassDay} que seria perfeita. Bora voltar?`,
      },
      templateData: { daysSinceLastClass },
    });
  }

  // 4. Plan underutilized — past midpoint with <40% usage
  if (client.plan.totalClasses > 0) {
    const planStart = new Date(client.plan.startDate).getTime();
    const planEnd = new Date(client.plan.endDate).getTime();
    const totalDuration = planEnd - planStart;
    const elapsed = now.getTime() - planStart;
    const timeProgress = totalDuration > 0 ? elapsed / totalDuration : 1;
    const classProgress = client.plan.usedClasses / client.plan.totalClasses;

    if (timeProgress > 0.5 && classProgress < 0.4) {
      const remaining = client.plan.totalClasses - client.plan.usedClasses;
      interventions.push({
        signal: "plan_underutilized",
        severity: classProgress < 0.2 ? "high" : "medium",
        action: "personal_booking",
        reason: `${Math.round(timeProgress * 100)}% through plan but only used ${Math.round(classProgress * 100)}% of classes (${remaining} remaining)`,
        messageTemplate: {
          en: `Hi {clientName}! You still have {remainingClasses} classes on your plan — that's a lot of great sessions waiting for you! Want me to help you book a few this week so you get the most out of it?`,
          pt: `Oi {clientName}! Você ainda tem {remainingClasses} aulas no seu plano — são muitas sessões incríveis te esperando! Quer que eu te ajude a reservar algumas essa semana pra aproveitar ao máximo?`,
        },
        templateData: { remainingClasses: remaining, usedClasses: client.plan.usedClasses, totalClasses: client.plan.totalClasses },
      });
    }
  }

  // 5. No-shows spiking — more no-shows recently than before
  if (bs && bs.recentNoShows >= 2 && bs.recentNoShows > bs.previousNoShows) {
    interventions.push({
      signal: "no_shows_spiking",
      severity: bs.recentNoShows >= 3 ? "high" : "medium",
      action: "offer_pause",
      reason: `${bs.recentNoShows} no-shows in last 2 weeks (was ${bs.previousNoShows} before)`,
      messageTemplate: {
        en: `Hi {clientName}! Life gets busy — we get it. If you need a breather, we can pause your plan for a week or two so you don't lose classes. Just let us know what works!`,
        pt: `Oi {clientName}! A vida fica corrida, a gente entende. Se precisar de um respiro, podemos pausar seu plano por uma ou duas semanas pra você não perder aulas. É só avisar!`,
      },
      templateData: { recentNoShows: bs.recentNoShows },
    });
  }

  // 6. Payment failed — first failure from a previously clean client
  if (ps && ps.recentFailed > 0 && ps.failedPayments <= ps.recentFailed) {
    interventions.push({
      signal: "payment_failed",
      severity: "high",
      action: "payment_outreach",
      reason: `First payment failure — ${ps.recentFailed} failed in last 2 weeks`,
      messageTemplate: {
        en: `Hi {clientName}! We noticed a small hiccup with your last payment. No worries — these things happen! Want to update your payment info or need any help?`,
        pt: `Oi {clientName}! Notamos um probleminha com seu último pagamento. Sem stress — isso acontece! Quer atualizar seus dados de pagamento ou precisa de ajuda?`,
      },
    });
  }

  // 7. Streak broken — had a streak, now missed a week
  if (
    (client.currentStreak ?? 0) === 0 &&
    (client.longestStreak ?? 0) >= 4 &&
    daysSinceLastClass >= 7 &&
    daysSinceLastClass < 21
  ) {
    interventions.push({
      signal: "streak_broken",
      severity: "medium",
      action: "milestone_reminder",
      reason: `Had a ${client.longestStreak}-week streak, now broken`,
      messageTemplate: {
        en: `Hi {clientName}! You had an amazing {longestStreak}-week streak going — don't let it slip away! One class this week puts you back on track. What day works?`,
        pt: `Oi {clientName}! Você tinha uma sequência incrível de {longestStreak} semanas — não deixa escapar! Uma aula essa semana te coloca de volta no ritmo. Qual dia funciona?`,
      },
      templateData: { longestStreak: client.longestStreak ?? 0 },
    });
  }

  return interventions;
}

// ============================================
// Weekly Checkup Generator
// ============================================

export async function generateWeeklyCheckup(establishmentId: string): Promise<WeeklyCheckupReport> {
  const db = await getDatabase();
  const now = new Date();
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get active clients for this establishment
  const clients = await db.collection("clients").find({
    establishmentId,
    status: "active",
    deletedAt: { $exists: false },
  }).toArray();

  const checkups: ClientChurnCheckup[] = [];

  for (const client of clients) {
    const clientId = client._id.toString();

    // Get booking stats for last 4 weeks
    const bookings = await db.collection("bookings").find({
      clientId,
      createdAt: { $gte: fourWeeksAgo },
    }).toArray();

    // Weekly attendance buckets (newest first)
    const weekBuckets = [0, 0, 0, 0]; // [this week, last week, 2 weeks ago, 3 weeks ago]
    for (const b of bookings) {
      if (b.status !== "completed") continue;
      const daysAgo = Math.floor((now.getTime() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.min(3, Math.floor(daysAgo / 7));
      weekBuckets[weekIndex]++;
    }

    const noShows = bookings.filter(b => b.status === "no-show");
    const recentNoShows = noShows.filter(b => new Date(b.createdAt) >= twoWeeksAgo).length;
    const previousNoShows = noShows.filter(b => {
      const d = new Date(b.createdAt);
      return d < twoWeeksAgo && d >= fourWeeksAgo;
    }).length;

    // All-time booking stats for health score
    const allBookings = await db.collection("bookings").find({ clientId }).toArray();
    const completedBookings = allBookings.filter(b => b.status === "completed").length;
    const totalBookings = allBookings.filter(b =>
      ["completed", "no-show", "cancelled"].includes(b.status)
    ).length;

    // Payment stats
    const payments = await db.collection("payments").find({ clientId }).toArray();
    const recentPayments = payments.filter(p => new Date(p.createdAt) >= twoWeeksAgo);

    // Recalculate health score
    const healthResult = calculateHealthScore({
      completedBookings,
      totalBookings,
      classesUsed: client.plan?.usedClasses || 0,
      classesTotal: client.plan?.totalClasses || 1,
      planStartDate: client.plan?.startDate || client.createdAt,
      planEndDate: client.plan?.endDate || now,
      lastActivityDate: client.lastClassDate,
      totalPayments: payments.length,
      failedPayments: payments.filter(p => p.status === "failed").length,
      latePayments: 0,
    });

    // Only process at-risk clients (score < 70)
    if (healthResult.overall >= 70) continue;

    const clientData: ClientData = {
      _id: clientId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      status: client.status,
      plan: client.plan,
      healthScore: {
        overall: healthResult.overall,
        breakdown: healthResult.breakdown,
        lastCalculatedAt: now,
      },
      lastClassDate: client.lastClassDate,
      currentStreak: client.currentStreak,
      longestStreak: client.longestStreak,
      createdAt: client.createdAt,
      bookingStats: {
        completedBookings,
        totalBookings,
        noShows: noShows.length,
        recentNoShows,
        previousNoShows,
        weeklyAttendance: weekBuckets,
      },
      paymentStats: {
        totalPayments: payments.length,
        failedPayments: payments.filter(p => p.status === "failed").length,
        recentFailed: recentPayments.filter(p => p.status === "failed").length,
      },
    };

    const interventions = detectSignals(clientData);
    if (interventions.length === 0) continue;

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    interventions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const daysSinceLastClass = client.lastClassDate
      ? Math.floor((now.getTime() - new Date(client.lastClassDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    checkups.push({
      clientId,
      clientName: client.name,
      email: client.email,
      phone: client.phone,
      healthScore: healthResult.overall,
      healthBreakdown: healthResult.breakdown,
      riskLevel: healthResult.riskLevel,
      planType: client.plan?.type || "unknown",
      planEndDate: client.plan?.endDate,
      lastClassDate: client.lastClassDate || null,
      daysSinceLastClass,
      currentStreak: client.currentStreak || 0,
      interventions,
      primaryIntervention: interventions[0],
    });
  }

  // Sort clients: critical first, then by health score ascending
  checkups.sort((a, b) => a.healthScore - b.healthScore);

  // Summary
  const summary = {
    totalAtRisk: checkups.length,
    critical: checkups.filter(c => c.primaryIntervention.severity === "critical").length,
    high: checkups.filter(c => c.primaryIntervention.severity === "high").length,
    medium: checkups.filter(c => c.primaryIntervention.severity === "medium").length,
    low: checkups.filter(c => c.primaryIntervention.severity === "low").length,
    newlyAtRisk: 0, // Will be populated by comparing with previous week's snapshot
    improved: 0,
  };

  // Compare with last week's snapshot to find newly at-risk and improved
  const lastSnapshot = await db.collection("churn_checkup_snapshots").findOne(
    { establishmentId },
    { sort: { generatedAt: -1 } }
  );
  if (lastSnapshot) {
    const previousClientIds = new Set(lastSnapshot.clientIds as string[]);
    const currentClientIds = new Set(checkups.map(c => c.clientId));
    summary.newlyAtRisk = checkups.filter(c => !previousClientIds.has(c.clientId)).length;
    summary.improved = Array.from(previousClientIds).filter(id => !currentClientIds.has(id)).length;
  }

  // Generate top insight
  const topInsight = generateTopInsight(summary, checkups);

  const report: WeeklyCheckupReport = {
    generatedAt: now,
    establishmentId,
    period: { from: oneWeekAgo, to: now },
    summary,
    clients: checkups,
    topInsight,
  };

  // Save snapshot for next week's comparison
  await db.collection("churn_checkup_snapshots").insertOne({
    establishmentId,
    generatedAt: now,
    clientIds: checkups.map(c => c.clientId),
    summary,
  });

  // Log activity
  await db.collection("activities").insertOne({
    type: "system",
    action: "weekly_churn_checkup",
    description: `Weekly checkup: ${summary.totalAtRisk} at-risk clients (${summary.critical} critical)`,
    metadata: { summary },
    createdAt: now,
  });

  return report;
}

function generateTopInsight(
  summary: WeeklyCheckupReport["summary"],
  clients: ClientChurnCheckup[]
): string {
  if (summary.critical > 0) {
    const criticalNames = clients
      .filter(c => c.primaryIntervention.severity === "critical")
      .slice(0, 3)
      .map(c => c.clientName);
    return `${summary.critical} client${summary.critical > 1 ? "s need" : " needs"} urgent attention: ${criticalNames.join(", ")}. Reach out today before they cancel.`;
  }

  if (summary.newlyAtRisk > summary.improved) {
    return `${summary.newlyAtRisk} new at-risk clients this week (${summary.improved} improved). Engagement is trending down — focus on re-activation messages.`;
  }

  if (summary.improved > 0) {
    return `${summary.improved} client${summary.improved > 1 ? "s" : ""} improved since last week. Your outreach is working — keep it up.`;
  }

  // Signal-based insight
  const signalCounts: Record<string, number> = {};
  for (const c of clients) {
    signalCounts[c.primaryIntervention.signal] = (signalCounts[c.primaryIntervention.signal] || 0) + 1;
  }
  const topSignal = Object.entries(signalCounts).sort((a, b) => b[1] - a[1])[0];
  if (topSignal) {
    const signalLabels: Record<string, string> = {
      attendance_dropping: "dropping attendance",
      plan_underutilized: "underutilized plans",
      gone_cold: "gone cold",
      no_shows_spiking: "increasing no-shows",
      payment_failed: "payment issues",
      new_not_activated: "new clients not booking",
      streak_broken: "broken streaks",
    };
    return `Top risk pattern: ${topSignal[1]} clients with ${signalLabels[topSignal[0]] || topSignal[0]}. Prioritize these for outreach.`;
  }

  return `${summary.totalAtRisk} clients need attention this week.`;
}

// ============================================
// Fill message template with client data
// ============================================

export function fillTemplate(
  template: string,
  data: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return data[key] !== undefined ? String(data[key]) : `{${key}}`;
  });
}

// ============================================
// Execute Interventions — Send messages from checkup
// ============================================

/**
 * Execute a single intervention for a client — sends the message via SMS or email
 * and logs it. Called from the admin dashboard when the owner taps "Send".
 */
export async function executeIntervention(
  clientCheckup: ClientChurnCheckup,
  intervention: ChurnIntervention,
  options: {
    channel?: "sms" | "email";
    locale?: "en" | "pt";
    studioName?: string;
    instructorName?: string;
  } = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const db = await getDatabase();
  const now = new Date();
  const locale = options.locale || "en";
  const channel = options.channel || "sms";

  // Build template data
  const templateData: Record<string, string | number> = {
    clientName: clientCheckup.clientName,
    studioName: options.studioName || "the studio",
    instructorName: options.instructorName || "your instructor",
    ...intervention.templateData,
  };

  // Fill the message template
  const message = fillTemplate(
    intervention.messageTemplate[locale],
    templateData
  );

  try {
    // Insert the message record
    const messageDoc = {
      clientId: clientCheckup.clientId,
      clientName: clientCheckup.clientName,
      type: "churn_intervention" as const,
      signal: intervention.signal,
      action: intervention.action,
      severity: intervention.severity,
      channel,
      message,
      healthScore: clientCheckup.healthScore,
      status: "sent" as const,
      sentAt: now,
      createdAt: now,
    };

    const result = await db.collection("client_messages").insertOne(messageDoc);

    // Update client's last intervention timestamp
    await db.collection("clients").updateOne(
      { _id: new ObjectId(clientCheckup.clientId) },
      {
        $set: {
          lastChurnInterventionAt: now,
          lastChurnInterventionSignal: intervention.signal,
          updatedAt: now,
        },
      }
    );

    // Log activity
    await db.collection("activities").insertOne({
      type: "churn_intervention",
      action: intervention.action,
      description: `${intervention.severity} intervention sent to ${clientCheckup.clientName}: ${intervention.signal}`,
      metadata: {
        clientId: clientCheckup.clientId,
        signal: intervention.signal,
        severity: intervention.severity,
        healthScore: clientCheckup.healthScore,
        channel,
      },
      createdAt: now,
    });

    return { success: true, messageId: result.insertedId.toString() };
  } catch (error) {
    console.error("Failed to execute intervention:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Auto-execute critical interventions from a weekly checkup.
 * Sends the primary intervention for each critical/high severity client
 * that hasn't received an intervention in the last 7 days.
 */
export async function autoExecuteInterventions(
  report: WeeklyCheckupReport,
  options: {
    locale?: "en" | "pt";
    studioName?: string;
    maxPerRun?: number;
  } = {}
): Promise<{ sent: number; skipped: number; errors: number }> {
  const db = await getDatabase();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const maxPerRun = options.maxPerRun || 20;

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  // Only auto-send for critical and high severity
  const urgentClients = report.clients.filter(
    (c) => c.primaryIntervention.severity === "critical" || c.primaryIntervention.severity === "high"
  );

  for (const client of urgentClients.slice(0, maxPerRun)) {
    // Check if we already sent an intervention recently
    const recentIntervention = await db.collection("client_messages").findOne({
      clientId: client.clientId,
      type: "churn_intervention",
      sentAt: { $gte: sevenDaysAgo },
    });

    if (recentIntervention) {
      skipped++;
      continue;
    }

    const result = await executeIntervention(client, client.primaryIntervention, {
      locale: options.locale,
      studioName: options.studioName,
    });

    if (result.success) {
      sent++;
    } else {
      errors++;
    }
  }

  return { sent, skipped, errors };
}
