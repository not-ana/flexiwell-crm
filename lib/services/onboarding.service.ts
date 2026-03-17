// Hormozi Behavior-Based Onboarding Service
// "The Second Sale" — onboarding reacts to what the client DID, not calendar time.
//
// Flow:
//   welcome → health_assessment → first_booking → pre_class → post_class → week_one → goal_review → completed
//
// Each transition is triggered by a client ACTION (or inaction after a timeout).
// Staff alerts fire when a client is stuck at any phase for too long.

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { OnboardingPhase, ClientOnboarding } from "@/lib/db/schemas";

// ── Message Templates ──────────────────────────────────────────────────

export interface OnboardingMessage {
  channel: "email" | "sms";
  subject: string;
  message: string;
}

const MESSAGES = {
  welcome_email: {
    channel: "email" as const,
    subject: "Welcome to {{studioName}}!",
    message:
      "Hi {{clientName}}, welcome to {{studioName}}! We're thrilled to have you. " +
      "Your plan includes {{planClasses}} classes — let's make every one count. " +
      "Book your first class here: {{bookingUrl}}",
  },
  welcome_sms_followup: {
    channel: "sms" as const,
    subject: "Welcome",
    message:
      "Hey {{clientName}}! We just sent you a welcome email — check it out when you get a chance. " +
      "Or book your first class directly: {{bookingUrl}}",
  },
  health_assessment_request: {
    channel: "sms" as const,
    subject: "Health Assessment",
    message:
      "Hi {{clientName}}! Before your first class, please fill out a quick health form " +
      "so we can personalize your experience (takes 2 min): {{assessmentUrl}}",
  },
  health_assessment_reminder: {
    channel: "sms" as const,
    subject: "Health Form Reminder",
    message:
      "Hey {{clientName}}, just a reminder to complete your health form before class: {{assessmentUrl}} " +
      "— it helps your instructor give you the best experience.",
  },
  first_class_nudge: {
    channel: "sms" as const,
    subject: "Book Your First Class",
    message:
      "Hey {{clientName}}! Spots are filling up this week. " +
      "Book your first class and start feeling the difference: {{bookingUrl}}",
  },
  pre_class_reminder: {
    channel: "sms" as const,
    subject: "See You Tomorrow",
    message:
      "{{clientName}}, see you tomorrow at {{classTime}}! " +
      "Arrive 10 minutes early so we can get you set up. Wear comfortable clothes — we handle the rest.",
  },
  post_class_feedback: {
    channel: "sms" as const,
    subject: "How Was Your First Class?",
    message:
      "Hi {{clientName}}, how was your first class? " +
      "Reply with a number 1-5 (5 = loved it!). Your feedback helps us improve.",
  },
  post_class_positive: {
    channel: "sms" as const,
    subject: "Glad You Loved It",
    message:
      "So glad you enjoyed it, {{clientName}}! Ready for more? " +
      "Book your next class: {{bookingUrl}} — consistency is where the magic happens.",
  },
  post_class_negative: {
    channel: "sms" as const,
    subject: "We'd Love to Help",
    message:
      "Thanks for the honest feedback, {{clientName}}. " +
      "We'd love to make your next class better — a team member will reach out to you today.",
  },
  week_one_engaged: {
    channel: "sms" as const,
    subject: "Week 1 Check-in",
    message:
      "{{clientName}}, you've done {{classCount}} classes this week — amazing! " +
      "Keep this up and you'll feel a real difference by week 3. Book your next one: {{bookingUrl}}",
  },
  week_one_disengaged: {
    channel: "sms" as const,
    subject: "Everything OK?",
    message:
      "Hey {{clientName}}, we noticed you've only been to {{classCount}} class so far. " +
      "Everything ok? Reply YES and we'll recommend the perfect class for you.",
  },
  goal_review: {
    channel: "email" as const,
    subject: "2-Week Progress: You've Done {{classCount}} Classes!",
    message:
      "Hi {{clientName}}, you're 2 weeks in! Here's your progress:\n\n" +
      "- Classes completed: {{classCount}}\n" +
      "- Current streak: {{streak}} weeks\n\n" +
      "At this pace, you'll hit your goals by {{projectedDate}}. " +
      "Keep going — the best results come in weeks 3-6.\n\n" +
      "Want to lock in your progress? Use code {{couponCode}} for {{discount}}% off any plan.",
  },
};

// ── Phase Transition Logic ─────────────────────────────────────────────
// Each function is called when a specific event happens.
// It checks the current phase and advances if conditions are met.

/**
 * Called when a new client signs up or is created.
 * Triggers: welcome email
 */
export async function onClientCreated(clientId: string) {
  const db = await getDatabase();
  const now = new Date();

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    {
      $set: {
        "onboarding.currentPhase": "welcome" as OnboardingPhase,
        "onboarding.welcomeEmailSent": true,
        "onboarding.welcomeEmailSentAt": now,
        updatedAt: now,
      },
    }
  );

  await logOnboardingEvent(db, clientId, "welcome_email_sent", MESSAGES.welcome_email);
  return { action: "welcome_email_sent", message: MESSAGES.welcome_email };
}

/**
 * Called when welcome email is opened (via tracking pixel or link click).
 * Advances to health_assessment phase.
 */
export async function onWelcomeOpened(clientId: string) {
  const db = await getDatabase();
  const now = new Date();

  const client = await db.collection("clients").findOne({ _id: new ObjectId(clientId) });
  if (!client?.onboarding || client.onboarding.currentPhase !== "welcome") return null;

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    {
      $set: {
        "onboarding.currentPhase": "health_assessment" as OnboardingPhase,
        "onboarding.welcomeEmailOpened": true,
        "onboarding.welcomeEmailOpenedAt": now,
        updatedAt: now,
      },
    }
  );

  await logOnboardingEvent(db, clientId, "advanced_to_health_assessment", MESSAGES.health_assessment_request);
  return { action: "health_assessment_requested", message: MESSAGES.health_assessment_request };
}

/**
 * Called when health assessment is completed.
 * Advances to first_booking phase.
 */
export async function onHealthAssessmentCompleted(clientId: string) {
  const db = await getDatabase();
  const now = new Date();

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    {
      $set: {
        "onboarding.currentPhase": "first_booking" as OnboardingPhase,
        "onboarding.healthAssessmentCompleted": true,
        "onboarding.healthAssessmentCompletedAt": now,
        "onboarding.intakeStatus": "completed",
        "onboarding.intakeCompletedAt": now,
        // Clear any staff alert for health form
        "onboarding.staffAlertActive": false,
        "onboarding.staffAlertResolvedAt": now,
        updatedAt: now,
      },
    }
  );

  await logOnboardingEvent(db, clientId, "health_assessment_completed");

  // If they haven't booked yet, send booking nudge
  const client = await db.collection("clients").findOne({ _id: new ObjectId(clientId) });
  if (!client?.onboarding?.firstClassBooked) {
    return { action: "first_class_nudge", message: MESSAGES.first_class_nudge };
  }

  return { action: "health_completed_already_booked" };
}

/**
 * Called when client books their first class.
 * Advances to pre_class phase.
 */
export async function onFirstClassBooked(clientId: string, classTime?: string) {
  const db = await getDatabase();
  const now = new Date();

  const client = await db.collection("clients").findOne({ _id: new ObjectId(clientId) });
  if (!client) return null;

  const isFirstBooking = !client.onboarding?.firstClassBooked;
  if (!isFirstBooking) return null;

  const newPhase: OnboardingPhase = client.onboarding?.healthAssessmentCompleted
    ? "pre_class"
    : "pre_class"; // Book even without health form — don't block them

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    {
      $set: {
        "onboarding.currentPhase": newPhase,
        "onboarding.firstClassBooked": true,
        "onboarding.firstClassBookedAt": now,
        // Clear booking alerts
        "onboarding.staffAlertActive": false,
        "onboarding.staffAlertResolvedAt": now,
        updatedAt: now,
      },
    }
  );

  await logOnboardingEvent(db, clientId, "first_class_booked");

  // Send pre-class message if we have the time
  if (classTime) {
    const preClassMsg = { ...MESSAGES.pre_class_reminder };
    preClassMsg.message = preClassMsg.message.replace("{{classTime}}", classTime);
    return { action: "pre_class_reminder", message: preClassMsg };
  }

  return { action: "first_class_booked" };
}

/**
 * Called when client completes their first class.
 * Advances to post_class phase and asks for feedback.
 */
export async function onFirstClassCompleted(clientId: string) {
  const db = await getDatabase();
  const now = new Date();

  const client = await db.collection("clients").findOne({ _id: new ObjectId(clientId) });
  if (!client) return null;

  const isFirstCompletion = !client.onboarding?.firstClassCompleted;
  if (!isFirstCompletion) return null;

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    {
      $set: {
        "onboarding.currentPhase": "post_class" as OnboardingPhase,
        "onboarding.firstClassCompleted": true,
        "onboarding.firstClassCompletedAt": now,
        "onboarding.firstClassFeedbackSent": true,
        updatedAt: now,
      },
    }
  );

  await logOnboardingEvent(db, clientId, "first_class_completed", MESSAGES.post_class_feedback);
  return { action: "feedback_requested", message: MESSAGES.post_class_feedback };
}

/**
 * Called when client replies with a feedback rating (1-5).
 * Branches: positive (4-5) → encourage, negative (1-3) → staff alert.
 */
export async function onFeedbackReceived(clientId: string, rating: number) {
  const db = await getDatabase();
  const now = new Date();

  const isPositive = rating >= 4;

  const updates: Record<string, unknown> = {
    "onboarding.currentPhase": "week_one" as OnboardingPhase,
    "onboarding.firstClassFeedbackRating": rating,
    "onboarding.firstClassFeedbackAt": now,
    updatedAt: now,
  };

  // Negative feedback → staff alert for personal follow-up
  if (!isPositive) {
    updates["onboarding.staffAlertActive"] = true;
    updates["onboarding.staffAlertType"] = "low_rating";
    updates["onboarding.staffAlertCreatedAt"] = now;
  }

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    { $set: updates }
  );

  const message = isPositive ? MESSAGES.post_class_positive : MESSAGES.post_class_negative;
  const eventType = isPositive ? "positive_feedback" : "negative_feedback_staff_alerted";
  await logOnboardingEvent(db, clientId, eventType, message);

  return {
    action: isPositive ? "positive_followup" : "negative_staff_alert",
    message,
    staffAlert: !isPositive,
  };
}

/**
 * Called by cron/scheduler to process time-based checks.
 * Handles: welcome email not opened, health form not done, no booking, week 1, goal review.
 */
export async function processOnboardingTimers() {
  const db = await getDatabase();
  const now = new Date();
  const results = {
    welcomeFollowUps: 0,
    healthReminders: 0,
    healthStaffAlerts: 0,
    bookingNudges: 0,
    bookingStaffAlerts: 0,
    weekOneCheckins: 0,
    goalReviews: 0,
    completed: 0,
  };

  // ── Welcome not opened after 4 hours → SMS follow-up ──
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const welcomeStuck = await db.collection("clients").find({
    "onboarding.currentPhase": "welcome",
    "onboarding.welcomeEmailSentAt": { $lt: fourHoursAgo },
    "onboarding.welcomeSmsFollowUp": { $ne: true },
  }).toArray();

  for (const client of welcomeStuck) {
    await db.collection("clients").updateOne(
      { _id: client._id },
      {
        $set: {
          "onboarding.currentPhase": "health_assessment" as OnboardingPhase,
          "onboarding.welcomeSmsFollowUp": true,
          updatedAt: now,
        },
      }
    );
    await logOnboardingEvent(db, client._id!.toString(), "welcome_sms_followup", MESSAGES.welcome_sms_followup);
    results.welcomeFollowUps++;
  }

  // ── Health form not done after 24h → reminder ──
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const healthPending = await db.collection("clients").find({
    "onboarding.currentPhase": "health_assessment",
    "onboarding.healthAssessmentCompleted": { $ne: true },
    "onboarding.intakeReminderCount": { $lt: 2 },
    $or: [
      { "onboarding.intakeLastReminderAt": { $lt: oneDayAgo } },
      { "onboarding.intakeLastReminderAt": { $exists: false } },
    ],
    "onboarding.welcomeEmailSentAt": { $lt: oneDayAgo },
  }).toArray();

  for (const client of healthPending) {
    const reminderCount = (client.onboarding?.intakeReminderCount || 0) + 1;
    await db.collection("clients").updateOne(
      { _id: client._id },
      {
        $set: {
          "onboarding.intakeReminderCount": reminderCount,
          "onboarding.intakeLastReminderAt": now,
          updatedAt: now,
        },
      }
    );
    await logOnboardingEvent(db, client._id!.toString(), "health_reminder_sent", MESSAGES.health_assessment_reminder);
    results.healthReminders++;
  }

  // ── Health form not done after 48h → staff alert ──
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const healthStuck = await db.collection("clients").find({
    "onboarding.currentPhase": "health_assessment",
    "onboarding.healthAssessmentCompleted": { $ne: true },
    "onboarding.intakeReminderCount": { $gte: 2 },
    "onboarding.staffAlertActive": { $ne: true },
    "onboarding.welcomeEmailSentAt": { $lt: twoDaysAgo },
  }).toArray();

  for (const client of healthStuck) {
    await db.collection("clients").updateOne(
      { _id: client._id },
      {
        $set: {
          "onboarding.staffAlertActive": true,
          "onboarding.staffAlertType": "health_form_stuck",
          "onboarding.staffAlertCreatedAt": now,
          updatedAt: now,
        },
      }
    );
    await logOnboardingEvent(db, client._id!.toString(), "staff_alert_health_form");
    results.healthStaffAlerts++;
  }

  // ── No booking after 3 days → nudge ──
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const noBooking = await db.collection("clients").find({
    "onboarding.currentPhase": "first_booking",
    "onboarding.firstClassBooked": { $ne: true },
    "onboarding.firstClassNudgeCount": { $lt: 2 },
    createdAt: { $lt: threeDaysAgo },
    $or: [
      { "onboarding.firstClassLastNudgeAt": { $lt: threeDaysAgo } },
      { "onboarding.firstClassLastNudgeAt": { $exists: false } },
    ],
  }).toArray();

  for (const client of noBooking) {
    const nudgeCount = (client.onboarding?.firstClassNudgeCount || 0) + 1;
    await db.collection("clients").updateOne(
      { _id: client._id },
      {
        $set: {
          "onboarding.firstClassNudgeCount": nudgeCount,
          "onboarding.firstClassLastNudgeAt": now,
          updatedAt: now,
        },
      }
    );
    await logOnboardingEvent(db, client._id!.toString(), "booking_nudge_sent", MESSAGES.first_class_nudge);
    results.bookingNudges++;
  }

  // ── No booking after 7 days → staff alert ──
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const bookingStuck = await db.collection("clients").find({
    "onboarding.currentPhase": "first_booking",
    "onboarding.firstClassBooked": { $ne: true },
    "onboarding.firstClassNudgeCount": { $gte: 2 },
    "onboarding.staffAlertActive": { $ne: true },
    createdAt: { $lt: sevenDaysAgo },
  }).toArray();

  for (const client of bookingStuck) {
    await db.collection("clients").updateOne(
      { _id: client._id },
      {
        $set: {
          "onboarding.staffAlertActive": true,
          "onboarding.staffAlertType": "no_booking",
          "onboarding.staffAlertCreatedAt": now,
          updatedAt: now,
        },
      }
    );
    await logOnboardingEvent(db, client._id!.toString(), "staff_alert_no_booking");
    results.bookingStaffAlerts++;
  }

  // ── Week 1 check-in (7 days after first class) ──
  const weekOneCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekOneReady = await db.collection("clients").find({
    "onboarding.currentPhase": { $in: ["post_class", "week_one"] },
    "onboarding.firstClassCompletedAt": { $lt: weekOneCutoff },
    "onboarding.weekOneCheckInSent": { $ne: true },
  }).toArray();

  for (const client of weekOneReady) {
    // Count classes in first week
    const classCount = await db.collection("bookings").countDocuments({
      clientId: client._id!.toString(),
      status: "completed",
    });

    const isEngaged = classCount >= 2;
    const message = isEngaged ? MESSAGES.week_one_engaged : MESSAGES.week_one_disengaged;

    const updates: Record<string, unknown> = {
      "onboarding.currentPhase": "week_one" as OnboardingPhase,
      "onboarding.weekOneCheckInSent": true,
      "onboarding.weekOneCheckInSentAt": now,
      "onboarding.weekOneClassCount": classCount,
      updatedAt: now,
    };

    // Disengaged clients (0-1 classes) → staff alert
    if (!isEngaged) {
      updates["onboarding.staffAlertActive"] = true;
      updates["onboarding.staffAlertType"] = "disengaged";
      updates["onboarding.staffAlertCreatedAt"] = now;
    }

    await db.collection("clients").updateOne(
      { _id: client._id },
      { $set: updates }
    );

    await logOnboardingEvent(db, client._id!.toString(), isEngaged ? "week_one_engaged" : "week_one_disengaged", message);
    results.weekOneCheckins++;
  }

  // ── Goal review (14 days after first class, only if 1+ classes done) ──
  const twoWeeksCutoff = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const goalReviewReady = await db.collection("clients").find({
    "onboarding.currentPhase": "week_one",
    "onboarding.firstClassCompletedAt": { $lt: twoWeeksCutoff },
    "onboarding.weekTwoGoalReviewSent": { $ne: true },
  }).toArray();

  for (const client of goalReviewReady) {
    const classCount = await db.collection("bookings").countDocuments({
      clientId: client._id!.toString(),
      status: "completed",
    });

    // Only send goal review if they've done at least 1 class
    if (classCount === 0) continue;

    await db.collection("clients").updateOne(
      { _id: client._id },
      {
        $set: {
          "onboarding.currentPhase": "goal_review" as OnboardingPhase,
          "onboarding.weekTwoGoalReviewSent": true,
          "onboarding.weekTwoGoalReviewSentAt": now,
          updatedAt: now,
        },
      }
    );

    await logOnboardingEvent(db, client._id!.toString(), "goal_review_sent", MESSAGES.goal_review);
    results.goalReviews++;
  }

  // ── Mark completed (3+ days after goal review) ──
  const threeDaysAfterGoal = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const completionReady = await db.collection("clients").find({
    "onboarding.currentPhase": "goal_review",
    "onboarding.weekTwoGoalReviewSentAt": { $lt: threeDaysAfterGoal },
    "onboarding.onboardingCompletedAt": { $exists: false },
  }).toArray();

  for (const client of completionReady) {
    await db.collection("clients").updateOne(
      { _id: client._id },
      {
        $set: {
          "onboarding.currentPhase": "completed" as OnboardingPhase,
          "onboarding.onboardingCompletedAt": now,
          updatedAt: now,
        },
      }
    );
    await logOnboardingEvent(db, client._id!.toString(), "onboarding_completed");
    results.completed++;
  }

  return results;
}

// ── Getters ────────────────────────────────────────────────────────────

export async function getOnboardingStatus(clientId: string) {
  const db = await getDatabase();
  const client = await db.collection("clients").findOne(
    { _id: new ObjectId(clientId) },
    { projection: { onboarding: 1, createdAt: 1 } }
  );

  if (!client) return null;

  const o = client.onboarding || {};
  const phase = (o.currentPhase as OnboardingPhase) || "welcome";

  const PHASES: OnboardingPhase[] = [
    "welcome", "health_assessment", "first_booking",
    "pre_class", "post_class", "week_one", "goal_review", "completed",
  ];

  const currentIndex = PHASES.indexOf(phase);
  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    clientId,
    currentPhase: phase,
    progress: Math.round(((currentIndex + 1) / PHASES.length) * 100),
    completedSteps: currentIndex + 1,
    totalSteps: PHASES.length,
    daysSinceJoin,
    isComplete: phase === "completed",
    staffAlert: o.staffAlertActive
      ? { type: o.staffAlertType, since: o.staffAlertCreatedAt }
      : null,
    details: {
      welcomeSent: !!o.welcomeEmailSent,
      welcomeOpened: !!o.welcomeEmailOpened,
      healthDone: !!o.healthAssessmentCompleted,
      firstBooked: !!o.firstClassBooked,
      firstCompleted: !!o.firstClassCompleted,
      feedbackRating: o.firstClassFeedbackRating,
      weekOneClasses: o.weekOneClassCount,
      goalReviewSent: !!o.weekTwoGoalReviewSent,
    },
  };
}

/**
 * Get all clients with active staff alerts (for admin dashboard).
 */
export async function getStaffAlerts() {
  const db = await getDatabase();

  const alerts = await db.collection("clients").find(
    { "onboarding.staffAlertActive": true },
    {
      projection: {
        name: 1,
        email: 1,
        phone: 1,
        "onboarding.currentPhase": 1,
        "onboarding.staffAlertType": 1,
        "onboarding.staffAlertCreatedAt": 1,
        "onboarding.firstClassFeedbackRating": 1,
        createdAt: 1,
      },
    }
  ).sort({ "onboarding.staffAlertCreatedAt": -1 }).toArray();

  return alerts.map((client) => ({
    clientId: client._id!.toString(),
    clientName: client.name,
    clientEmail: client.email,
    clientPhone: client.phone,
    alertType: client.onboarding?.staffAlertType,
    alertSince: client.onboarding?.staffAlertCreatedAt,
    currentPhase: client.onboarding?.currentPhase,
    feedbackRating: client.onboarding?.firstClassFeedbackRating,
    daysSinceJoin: Math.floor(
      (Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

/**
 * Resolve a staff alert (admin marked as handled).
 */
export async function resolveStaffAlert(clientId: string) {
  const db = await getDatabase();
  const now = new Date();

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    {
      $set: {
        "onboarding.staffAlertActive": false,
        "onboarding.staffAlertResolvedAt": now,
        updatedAt: now,
      },
    }
  );

  return true;
}

/**
 * Skip health assessment and advance to first_booking phase.
 * Used when studio doesn't require it or admin manually skips.
 */
export async function skipHealthAssessment(clientId: string) {
  const db = await getDatabase();
  const now = new Date();

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    {
      $set: {
        "onboarding.currentPhase": "first_booking" as OnboardingPhase,
        "onboarding.staffAlertActive": false,
        "onboarding.staffAlertResolvedAt": now,
        updatedAt: now,
      },
    }
  );

  return { action: "health_skipped_to_first_booking" };
}

// ── Win-Back (unchanged) ──────────────────────────────────────────────

export async function sendWinBackCampaign(clientIds: string[]) {
  const db = await getDatabase();
  const results: { sent: number; failed: number } = { sent: 0, failed: 0 };

  for (const id of clientIds) {
    try {
      const client = await db.collection("clients").findOne({ _id: new ObjectId(id) });
      if (!client) { results.failed++; continue; }

      await db.collection("client_messages").insertOne({
        clientId: id,
        clientName: client.name,
        type: "win_back",
        channel: "email",
        subject: "We miss you at " + (client.unit || "the studio"),
        message: `Hi ${client.name}, we noticed you haven't been to class in a while. We'd love to have you back! Here's a special offer just for you.`,
        status: "sent",
        sentAt: new Date(),
        createdAt: new Date(),
      });

      await db.collection("clients").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            lastChurnAlertSentAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      results.sent++;
    } catch {
      results.failed++;
    }
  }

  return results;
}

// ── Milestones (unchanged) ─────────────────────────────────────────────

export async function checkAndAwardMilestones(clientId: string) {
  const db = await getDatabase();
  const client = await db.collection("clients").findOne({ _id: new ObjectId(clientId) });
  if (!client) return [];

  const existingTypes = (client.milestones || []).map((m: { type: string }) => m.type);
  const newMilestones: { type: string; achievedAt: Date; acknowledged: boolean }[] = [];

  const completedCount = await db.collection("bookings").countDocuments({
    clientId: clientId,
    status: "completed",
  });

  const classMilestones = [
    { count: 1, type: "first_class" },
    { count: 10, type: "10_classes" },
    { count: 25, type: "25_classes" },
    { count: 50, type: "50_classes" },
    { count: 100, type: "100_classes" },
  ];

  for (const cm of classMilestones) {
    if (completedCount >= cm.count && !existingTypes.includes(cm.type)) {
      newMilestones.push({ type: cm.type, achievedAt: new Date(), acknowledged: false });
    }
  }

  const daysSinceJoin = Math.floor((Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const timeMilestones = [
    { days: 90, type: "3_months" },
    { days: 180, type: "6_months" },
    { days: 365, type: "1_year" },
  ];

  for (const tm of timeMilestones) {
    if (daysSinceJoin >= tm.days && !existingTypes.includes(tm.type)) {
      newMilestones.push({ type: tm.type, achievedAt: new Date(), acknowledged: false });
    }
  }

  const streak = client.currentStreak || 0;
  if (streak >= 4 && !existingTypes.includes("streak_4_weeks")) {
    newMilestones.push({ type: "streak_4_weeks", achievedAt: new Date(), acknowledged: false });
  }
  if (streak >= 12 && !existingTypes.includes("streak_12_weeks")) {
    newMilestones.push({ type: "streak_12_weeks", achievedAt: new Date(), acknowledged: false });
  }

  if (newMilestones.length > 0) {
    await db.collection("clients").updateOne(
      { _id: new ObjectId(clientId) },
      {
        $push: { milestones: { $each: newMilestones } } as any,
        $set: { updatedAt: new Date() },
      }
    );
  }

  return newMilestones;
}

// ── Helpers ────────────────────────────────────────────────────────────

async function logOnboardingEvent(
  db: any,
  clientId: string,
  event: string,
  message?: OnboardingMessage
) {
  await db.collection("onboarding_events").insertOne({
    clientId,
    event,
    channel: message?.channel,
    subject: message?.subject,
    message: message?.message,
    createdAt: new Date(),
  });
}
