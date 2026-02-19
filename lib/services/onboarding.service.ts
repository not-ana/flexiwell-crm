// Hormozi Onboarding Automation Service
// "The Second Sale" - Structured onboarding reduces churn by 30-50%

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export interface OnboardingStep {
  step: string;
  dayOffset: number; // Days after signup
  channel: "email" | "whatsapp" | "sms";
  subject: string;
  message: string;
}

// Hormozi onboarding sequence
const ONBOARDING_SEQUENCE: OnboardingStep[] = [
  {
    step: "welcome",
    dayOffset: 0,
    channel: "email",
    subject: "Welcome to {{studioName}}!",
    message: "Hi {{clientName}}, welcome to {{studioName}}! We're thrilled to have you. Your plan includes {{planClasses}} classes — let's make every one count. Book your first class here: {{bookingUrl}}",
  },
  {
    step: "health_assessment",
    dayOffset: 1,
    channel: "whatsapp",
    subject: "Quick Health Check",
    message: "Hi {{clientName}}! Before your first class, please complete your health assessment so we can personalize your experience: {{assessmentUrl}}",
  },
  {
    step: "first_class_nudge",
    dayOffset: 3,
    channel: "whatsapp",
    subject: "Book Your First Class",
    message: "Hey {{clientName}}! Haven't booked your first class yet? Your {{planClasses}} classes are waiting. Book now: {{bookingUrl}}",
  },
  {
    step: "week_one_checkin",
    dayOffset: 7,
    channel: "whatsapp",
    subject: "How's Your First Week?",
    message: "Hi {{clientName}}, it's been a week since you joined! How are you feeling? Your instructor {{instructorName}} is here to help if you have any questions.",
  },
  {
    step: "goal_review",
    dayOffset: 14,
    channel: "email",
    subject: "Let's Check In On Your Goals",
    message: "Hi {{clientName}}, two weeks in! Let's review your goals and make sure you're on the right track. Reply to this email or message us on WhatsApp.",
  },
];

export async function getOnboardingStatus(clientId: string) {
  const db = await getDatabase();
  const client = await db.collection("clients").findOne(
    { _id: new ObjectId(clientId) },
    { projection: { onboarding: 1, createdAt: 1 } }
  );

  if (!client) return null;

  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const onboarding = client.onboarding || {};
  const pendingSteps = ONBOARDING_SEQUENCE.filter(step => {
    if (step.dayOffset > daysSinceJoin) return false; // Not time yet
    const stepField = step.step === "welcome" ? "welcomeEmailSent"
      : step.step === "health_assessment" ? "healthAssessmentCompleted"
      : step.step === "first_class_nudge" ? "firstClassBooked"
      : step.step === "week_one_checkin" ? "weekOneCheckInSent"
      : "weekTwoGoalReviewSent";
    return !onboarding[stepField];
  });

  return {
    clientId,
    daysSinceJoin,
    completedSteps: ONBOARDING_SEQUENCE.length - pendingSteps.length,
    totalSteps: ONBOARDING_SEQUENCE.length,
    pendingSteps,
    isComplete: pendingSteps.length === 0,
  };
}

export async function markOnboardingStep(clientId: string, step: string) {
  const db = await getDatabase();

  const fieldMap: Record<string, string> = {
    welcome: "onboarding.welcomeEmailSent",
    health_assessment: "onboarding.healthAssessmentCompleted",
    first_class_nudge: "onboarding.firstClassBooked",
    first_class_complete: "onboarding.firstClassCompleted",
    week_one_checkin: "onboarding.weekOneCheckInSent",
    goal_review: "onboarding.weekTwoGoalReviewSent",
  };

  const field = fieldMap[step];
  if (!field) return false;

  const dateField = field + "At";

  await db.collection("clients").updateOne(
    { _id: new ObjectId(clientId) },
    {
      $set: {
        [field]: true,
        [dateField]: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  // Check if all steps complete
  const client = await db.collection("clients").findOne(
    { _id: new ObjectId(clientId) },
    { projection: { onboarding: 1 } }
  );

  if (client?.onboarding) {
    const o = client.onboarding;
    if (o.welcomeEmailSent && o.healthAssessmentCompleted && o.firstClassCompleted && o.weekOneCheckInSent && o.weekTwoGoalReviewSent) {
      await db.collection("clients").updateOne(
        { _id: new ObjectId(clientId) },
        { $set: { "onboarding.onboardingCompletedAt": new Date() } }
      );
    }
  }

  return true;
}

// Win-Back Campaign for churned clients
export async function sendWinBackCampaign(clientIds: string[]) {
  const db = await getDatabase();
  const results: { sent: number; failed: number } = { sent: 0, failed: 0 };

  for (const id of clientIds) {
    try {
      const client = await db.collection("clients").findOne({ _id: new ObjectId(id) });
      if (!client) { results.failed++; continue; }

      // Log the win-back attempt
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

      // Update client lifecycle
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

// Milestone checker - call after each booking completion
export async function checkAndAwardMilestones(clientId: string) {
  const db = await getDatabase();
  const client = await db.collection("clients").findOne({ _id: new ObjectId(clientId) });
  if (!client) return [];

  const existingTypes = (client.milestones || []).map((m: { type: string }) => m.type);
  const newMilestones: { type: string; achievedAt: Date; acknowledged: boolean }[] = [];

  // Count completed bookings
  const completedCount = await db.collection("bookings").countDocuments({
    clientId: clientId,
    status: "completed",
  });

  // Class milestones
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

  // Time milestones
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

  // Streak milestones
  const streak = client.currentStreak || 0;
  if (streak >= 4 && !existingTypes.includes("streak_4_weeks")) {
    newMilestones.push({ type: "streak_4_weeks", achievedAt: new Date(), acknowledged: false });
  }
  if (streak >= 12 && !existingTypes.includes("streak_12_weeks")) {
    newMilestones.push({ type: "streak_12_weeks", achievedAt: new Date(), acknowledged: false });
  }

  // Save new milestones
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
