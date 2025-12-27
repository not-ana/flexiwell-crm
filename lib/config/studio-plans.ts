// Studio Plans Configuration
// Admins create these plans for their studio, clients can subscribe to them

export type PlanInterval = "weekly" | "monthly" | "quarterly" | "semi-annual" | "annual";
export type PlanStatus = "active" | "inactive" | "archived";

export interface StudioPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: PlanInterval;
  classesIncluded: number;        // -1 for unlimited
  rolloverClasses: boolean;       // Can unused classes roll over?
  maxRollover?: number;           // Max classes to roll over
  features: string[];
  status: PlanStatus;
  highlighted?: boolean;          // Show as "popular" or "recommended"
  trialDays?: number;             // Free trial period
  setupFee?: number;              // One-time setup fee
  cancellationPolicy?: {
    noticeDays: number;           // Days notice required to cancel
    refundable: boolean;
    refundPercentage?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientSubscription {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  planId: string;
  planName: string;
  status: "active" | "pending" | "past_due" | "cancelled" | "trial";
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  classesUsed: number;
  classesRemaining: number;
  rolledOverClasses: number;
  paymentMethod?: {
    type: "card" | "pix" | "bank_transfer" | "cash";
    last4?: string;
    brand?: string;
  };
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  nextPaymentDate?: Date;
  nextPaymentAmount?: number;
}

export interface PaymentRecord {
  id: string;
  subscriptionId: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
  dueDate: Date;
  paidAt?: Date;
  paymentMethod?: string;
  invoiceUrl?: string;
  receiptUrl?: string;
  notes?: string;
}

// Interval labels
export const intervalLabels: Record<PlanInterval, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  "semi-annual": "Semi-annual",
  annual: "Annual",
};

// Default studio plans example
export const defaultStudioPlans: StudioPlan[] = [
  {
    id: "basic-monthly",
    name: "Basic Monthly",
    description: "Perfect for beginners or those with a busy schedule",
    price: 79,
    currency: "USD",
    interval: "monthly",
    classesIncluded: 4,
    rolloverClasses: false,
    features: [
      "4 classes per month",
      "Access to all class types",
      "Online booking",
      "Mobile app access",
    ],
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "standard-monthly",
    name: "Standard Monthly",
    description: "Our most popular plan for regular practitioners",
    price: 129,
    currency: "USD",
    interval: "monthly",
    classesIncluded: 8,
    rolloverClasses: true,
    maxRollover: 2,
    features: [
      "8 classes per month",
      "Roll over up to 2 unused classes",
      "Access to all class types",
      "Priority booking",
      "Guest passes (2/month)",
    ],
    status: "active",
    highlighted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "premium-monthly",
    name: "Premium Monthly",
    description: "For dedicated practitioners who want it all",
    price: 199,
    currency: "USD",
    interval: "monthly",
    classesIncluded: 16,
    rolloverClasses: true,
    maxRollover: 4,
    features: [
      "16 classes per month",
      "Roll over up to 4 unused classes",
      "Access to all class types",
      "Priority booking",
      "Guest passes (4/month)",
      "Free equipment rental",
      "10% retail discount",
    ],
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "unlimited-monthly",
    name: "Unlimited Monthly",
    description: "Unlimited access for the truly committed",
    price: 299,
    currency: "USD",
    interval: "monthly",
    classesIncluded: -1, // Unlimited
    rolloverClasses: false,
    features: [
      "Unlimited classes",
      "Access to all class types",
      "Priority booking",
      "Unlimited guest passes",
      "Free equipment rental",
      "15% retail discount",
      "Early access to workshops",
    ],
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "quarterly-pack",
    name: "Quarterly Pack",
    description: "Save 15% with a 3-month commitment",
    price: 329,
    currency: "USD",
    interval: "quarterly",
    classesIncluded: 24,
    rolloverClasses: true,
    maxRollover: 4,
    features: [
      "24 classes over 3 months",
      "15% savings vs monthly",
      "Roll over up to 4 unused classes",
      "Access to all class types",
      "Priority booking",
    ],
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "annual-pack",
    name: "Annual Membership",
    description: "Best value - save 20% with annual commitment",
    price: 999,
    currency: "USD",
    interval: "annual",
    classesIncluded: 96,
    rolloverClasses: true,
    maxRollover: 8,
    features: [
      "96 classes per year (8/month)",
      "20% savings vs monthly",
      "Roll over up to 8 unused classes",
      "Access to all class types",
      "VIP priority booking",
      "Free guest passes",
      "Free equipment rental",
      "20% retail discount",
    ],
    status: "active",
    cancellationPolicy: {
      noticeDays: 30,
      refundable: true,
      refundPercentage: 50,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Helper functions
export function getPlanById(plans: StudioPlan[], id: string): StudioPlan | undefined {
  return plans.find(p => p.id === id);
}

export function getActivePlans(plans: StudioPlan[]): StudioPlan[] {
  return plans.filter(p => p.status === "active");
}

export function formatPlanPrice(plan: StudioPlan): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: plan.currency,
  });
  return `${formatter.format(plan.price)}/${intervalLabels[plan.interval].toLowerCase()}`;
}

export function getClassesDisplay(plan: StudioPlan): string {
  if (plan.classesIncluded === -1) return "Unlimited classes";
  return `${plan.classesIncluded} classes/${intervalLabels[plan.interval].toLowerCase()}`;
}

export function calculateMonthlyEquivalent(plan: StudioPlan): number {
  switch (plan.interval) {
    case "weekly":
      return plan.price * 4;
    case "monthly":
      return plan.price;
    case "quarterly":
      return plan.price / 3;
    case "semi-annual":
      return plan.price / 6;
    case "annual":
      return plan.price / 12;
    default:
      return plan.price;
  }
}

// Payment status helpers
export type PaymentStatus = "paid" | "pending" | "overdue" | "failed";

export function getPaymentStatus(subscription: ClientSubscription): PaymentStatus {
  if (!subscription.nextPaymentDate) return "paid";

  const now = new Date();
  const dueDate = new Date(subscription.nextPaymentDate);
  const daysDiff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (subscription.status === "past_due") return "overdue";
  if (daysDiff < 0) return "overdue";
  if (daysDiff <= 7) return "pending";
  return "paid";
}

export function getUnpaidSubscriptions(subscriptions: ClientSubscription[]): ClientSubscription[] {
  return subscriptions.filter(sub => {
    const status = getPaymentStatus(sub);
    return status === "overdue" || status === "pending";
  });
}

export function getOverdueSubscriptions(subscriptions: ClientSubscription[]): ClientSubscription[] {
  return subscriptions.filter(sub => getPaymentStatus(sub) === "overdue");
}

// Notification config for payment reminders
export interface PaymentReminderConfig {
  enabled: boolean;
  reminderDaysBefore: number[];  // e.g., [7, 3, 1] = remind 7, 3, and 1 days before
  overdueReminderDays: number[]; // e.g., [1, 3, 7] = remind 1, 3, 7 days after due
  channels: ("email" | "whatsapp" | "sms" | "push")[];
}

export const defaultPaymentReminderConfig: PaymentReminderConfig = {
  enabled: true,
  reminderDaysBefore: [7, 3, 1],
  overdueReminderDays: [1, 3, 7, 14],
  channels: ["email", "whatsapp"],
};

// Notification templates
export const paymentNotificationTemplates = {
  reminder: {
    email: {
      subject: "Payment reminder - {{planName}} due in {{daysUntilDue}} days",
      body: `Hi {{clientName}},

This is a friendly reminder that your {{planName}} subscription payment of {{amount}} is due on {{dueDate}}.

To avoid any interruption to your classes, please ensure your payment is processed on time.

If you have any questions or need to update your payment method, please log in to your account or contact us.

Best,
{{studioName}}`,
    },
    whatsapp: `Hi {{clientName}}! 👋

Quick reminder: Your {{planName}} payment of {{amount}} is due on {{dueDate}}.

Please ensure payment is processed to continue enjoying your classes! 🧘‍♀️

Questions? Just reply to this message.`,
  },

  overdue: {
    email: {
      subject: "Action required - Payment overdue for {{planName}}",
      body: `Hi {{clientName}},

Your {{planName}} subscription payment of {{amount}} was due on {{dueDate}} and is now {{daysOverdue}} days overdue.

To continue accessing classes, please update your payment as soon as possible.

If you're experiencing difficulties, please contact us and we'll be happy to help find a solution.

Best,
{{studioName}}`,
    },
    whatsapp: `Hi {{clientName}},

Your {{planName}} payment of {{amount}} is now {{daysOverdue}} days overdue.

Please update your payment to continue your classes. Need help? Just reply here!`,
  },

  paymentSuccess: {
    email: {
      subject: "Payment confirmed - {{planName}}",
      body: `Hi {{clientName}},

Great news! We've received your payment of {{amount}} for {{planName}}.

Your subscription is active until {{nextDueDate}}.

Thank you for being a valued member!

Best,
{{studioName}}`,
    },
    whatsapp: `Payment confirmed! ✅

Hi {{clientName}}, we received your {{amount}} payment for {{planName}}.

Your subscription is active until {{nextDueDate}}. See you in class! 🧘‍♀️`,
  },

  planChanged: {
    email: {
      subject: "Plan change confirmed - {{newPlanName}}",
      body: `Hi {{clientName}},

Your plan has been successfully changed from {{oldPlanName}} to {{newPlanName}}.

New plan details:
- Plan: {{newPlanName}}
- Price: {{newAmount}}/{{interval}}
- Classes: {{classesIncluded}}
- Effective from: {{effectiveDate}}

If you have any questions about this change, please don't hesitate to reach out.

Best,
{{studioName}}`,
    },
    whatsapp: `Plan change confirmed! ✨

Hi {{clientName}}, you're now on {{newPlanName}} ({{newAmount}}/{{interval}}).

Effective from {{effectiveDate}}. Happy practicing! 🧘‍♀️`,
  },
};
