// Easy Onboarding & Migration System
// Makes it super simple for studios to start using FlexiWell

export type OnboardingStep =
  | "account_created"
  | "business_info"
  | "data_import"
  | "team_setup"
  | "first_class"
  | "first_client"
  | "payment_setup"
  | "go_live";

export interface OnboardingProgress {
  userId: string;
  studioName: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  startedAt: Date;
  completedAt?: Date;
  estimatedTimeRemaining: number; // minutes
  needsHelp: boolean;
  skipDataImport: boolean; // For brand new studios
}

export interface OnboardingStepConfig {
  id: OnboardingStep;
  title: string;
  description: string;
  estimatedMinutes: number;
  required: boolean;
  canSkip: boolean;
  helpText: string;
  videoUrl?: string;
  actions: {
    label: string;
    type: "form" | "upload" | "connect" | "skip";
    description: string;
  }[];
}

export const onboardingSteps: OnboardingStepConfig[] = [
  {
    id: "account_created",
    title: "Welcome to FlexiWell! 👋",
    description: "Your account is ready. Let's get you set up in just 15 minutes.",
    estimatedMinutes: 0,
    required: true,
    canSkip: false,
    helpText: "This should happen automatically",
    actions: [
      {
        label: "Continue",
        type: "form",
        description: "Let's start your setup",
      },
    ],
  },
  {
    id: "business_info",
    title: "Tell us about your studio",
    description: "Basic information so we can customize your experience",
    estimatedMinutes: 3,
    required: true,
    canSkip: false,
    helpText: "We'll use this to set up your dashboard and client portal",
    actions: [
      {
        label: "Fill Studio Info",
        type: "form",
        description: "Name, type (Pilates/Yoga/etc), location, contact",
      },
    ],
  },
  {
    id: "data_import",
    title: "Import your existing data (or start fresh)",
    description: "Bring your clients, classes, and bookings from your old system",
    estimatedMinutes: 5,
    required: false,
    canSkip: true,
    helpText: "Choose the easiest option for you - we support multiple ways",
    videoUrl: "https://www.youtube.com/watch?v=demo",
    actions: [
      {
        label: "Upload CSV",
        type: "upload",
        description: "Download template, fill it, upload. Done in 5 minutes.",
      },
      {
        label: "Connect via API",
        type: "connect",
        description: "Mindbody, Glofox, Zen Planner, and 10+ others supported",
      },
      {
        label: "Manual Entry",
        type: "form",
        description: "Add clients one by one (good for small studios)",
      },
      {
        label: "Skip for now",
        type: "skip",
        description: "Start fresh or import later",
      },
    ],
  },
  {
    id: "team_setup",
    title: "Add your team",
    description: "Invite instructors and staff (optional - you can do this later)",
    estimatedMinutes: 3,
    required: false,
    canSkip: true,
    helpText: "They'll get email invites with login instructions",
    actions: [
      {
        label: "Invite Team Members",
        type: "form",
        description: "Add email addresses and roles (instructor, admin)",
      },
      {
        label: "Skip - I'll do this later",
        type: "skip",
        description: "You can always add team members from Settings",
      },
    ],
  },
  {
    id: "first_class",
    title: "Create your first class",
    description: "Let's set up a sample class so you can see how scheduling works",
    estimatedMinutes: 2,
    required: true,
    canSkip: false,
    helpText: "Don't worry - you can edit or delete this later",
    actions: [
      {
        label: "Create Class",
        type: "form",
        description: "Name, date, time, instructor, capacity (we'll pre-fill smart defaults)",
      },
    ],
  },
  {
    id: "first_client",
    title: "Add your first client (or skip if you imported)",
    description: "Add a test client to see the client portal",
    estimatedMinutes: 2,
    required: false,
    canSkip: true,
    helpText: "We recommend adding yourself first to test the client experience",
    actions: [
      {
        label: "Add Client",
        type: "form",
        description: "Name, email, phone - that's it!",
      },
      {
        label: "Skip - I already imported",
        type: "skip",
        description: "If you imported data in step 3",
      },
    ],
  },
  {
    id: "payment_setup",
    title: "Connect payment processing (optional)",
    description: "Set up Stripe to accept online payments",
    estimatedMinutes: 5,
    required: false,
    canSkip: true,
    helpText: "You can track manual payments without this, but online payments are easier",
    actions: [
      {
        label: "Connect Stripe",
        type: "connect",
        description: "One-click Stripe Connect integration",
      },
      {
        label: "Manual payments only",
        type: "skip",
        description: "I'll track payments manually for now",
      },
    ],
  },
  {
    id: "go_live",
    title: "You're all set! 🎉",
    description: "Your studio is ready to use. Here's what to do next:",
    estimatedMinutes: 0,
    required: true,
    canSkip: false,
    helpText: "Congratulations! You completed setup faster than 90% of users.",
    actions: [
      {
        label: "Go to Dashboard",
        type: "form",
        description: "Start managing your studio",
      },
    ],
  },
];

// Quick Start Templates for different studio types
export interface QuickStartTemplate {
  studioType: string;
  icon: string;
  description: string;
  preConfigured: {
    classTypes: string[];
    clientPlans: {
      name: string;
      price: number;
      classes: number;
    }[];
    sampleSchedule: {
      dayOfWeek: string;
      classes: {
        name: string;
        time: string;
        duration: number;
      }[];
    }[];
  };
}

export const quickStartTemplates: QuickStartTemplate[] = [
  {
    studioType: "Pilates Studio",
    icon: "🧘‍♀️",
    description: "Reformer, Mat, and Tower classes",
    preConfigured: {
      classTypes: [
        "Reformer Beginner",
        "Reformer Intermediate",
        "Reformer Advanced",
        "Mat Pilates",
        "Tower",
        "Cardio Reformer",
      ],
      clientPlans: [
        { name: "4 Classes/Month", price: 120, classes: 4 },
        { name: "8 Classes/Month", price: 200, classes: 8 },
        { name: "Unlimited", price: 300, classes: -1 },
      ],
      sampleSchedule: [
        {
          dayOfWeek: "Monday",
          classes: [
            { name: "Reformer Beginner", time: "09:00", duration: 60 },
            { name: "Mat Pilates", time: "10:30", duration: 60 },
            { name: "Reformer Intermediate", time: "18:00", duration: 60 },
          ],
        },
        {
          dayOfWeek: "Wednesday",
          classes: [
            { name: "Reformer Advanced", time: "09:00", duration: 60 },
            { name: "Cardio Reformer", time: "10:30", duration: 45 },
            { name: "Tower", time: "18:00", duration: 60 },
          ],
        },
      ],
    },
  },
  {
    studioType: "Yoga Studio",
    icon: "🧘",
    description: "Vinyasa, Hatha, Yin, and more",
    preConfigured: {
      classTypes: [
        "Vinyasa Flow",
        "Hatha Yoga",
        "Yin Yoga",
        "Power Yoga",
        "Restorative",
        "Hot Yoga",
      ],
      clientPlans: [
        { name: "Drop-in", price: 25, classes: 1 },
        { name: "10-Class Pack", price: 200, classes: 10 },
        { name: "Unlimited Monthly", price: 150, classes: -1 },
      ],
      sampleSchedule: [
        {
          dayOfWeek: "Monday",
          classes: [
            { name: "Vinyasa Flow", time: "08:00", duration: 75 },
            { name: "Yin Yoga", time: "12:00", duration: 60 },
            { name: "Power Yoga", time: "18:30", duration: 60 },
          ],
        },
      ],
    },
  },
  {
    studioType: "CrossFit Box",
    icon: "💪",
    description: "WODs, Olympic lifting, and conditioning",
    preConfigured: {
      classTypes: [
        "CrossFit WOD",
        "Foundations",
        "Olympic Lifting",
        "Open Gym",
        "Competitor Training",
      ],
      clientPlans: [
        { name: "Unlimited", price: 199, classes: -1 },
        { name: "3x/Week", price: 129, classes: 12 },
        { name: "Drop-in", price: 25, classes: 1 },
      ],
      sampleSchedule: [
        {
          dayOfWeek: "Monday",
          classes: [
            { name: "CrossFit WOD", time: "06:00", duration: 60 },
            { name: "CrossFit WOD", time: "09:00", duration: 60 },
            { name: "Olympic Lifting", time: "12:00", duration: 90 },
            { name: "CrossFit WOD", time: "17:00", duration: 60 },
            { name: "CrossFit WOD", time: "18:30", duration: 60 },
          ],
        },
      ],
    },
  },
  {
    studioType: "Dance Studio",
    icon: "💃",
    description: "Ballet, Contemporary, Hip-Hop, and more",
    preConfigured: {
      classTypes: [
        "Ballet Beginner",
        "Ballet Intermediate",
        "Contemporary",
        "Hip-Hop",
        "Jazz",
        "Tap",
      ],
      clientPlans: [
        { name: "1 Class/Week", price: 80, classes: 4 },
        { name: "2 Classes/Week", price: 140, classes: 8 },
        { name: "Unlimited", price: 200, classes: -1 },
      ],
      sampleSchedule: [
        {
          dayOfWeek: "Tuesday",
          classes: [
            { name: "Ballet Beginner", time: "16:00", duration: 60 },
            { name: "Hip-Hop", time: "17:30", duration: 60 },
            { name: "Contemporary", time: "19:00", duration: 90 },
          ],
        },
      ],
    },
  },
  {
    studioType: "Starting from Scratch",
    icon: "✨",
    description: "I'll configure everything myself",
    preConfigured: {
      classTypes: [],
      clientPlans: [],
      sampleSchedule: [],
    },
  },
];

// Data Import Helpers
export interface CSVTemplate {
  name: string;
  description: string;
  downloadUrl: string;
  exampleRows: string[][];
  requiredColumns: string[];
  optionalColumns: string[];
}

export const csvTemplates: CSVTemplate[] = [
  {
    name: "Clients",
    description: "Import your client list",
    downloadUrl: "/templates/clients.csv",
    exampleRows: [
      ["First Name", "Last Name", "Email", "Phone", "Notes"],
      ["John", "Doe", "john@example.com", "+1234567890", "VIP member"],
      ["Jane", "Smith", "jane@example.com", "+0987654321", "Beginner"],
    ],
    requiredColumns: ["First Name", "Last Name", "Email"],
    optionalColumns: ["Phone", "Birthday", "Emergency Contact", "Notes", "Plan"],
  },
  {
    name: "Classes",
    description: "Import your class schedule",
    downloadUrl: "/templates/classes.csv",
    exampleRows: [
      ["Class Name", "Date", "Time", "Duration", "Instructor", "Capacity"],
      ["Reformer Intermediate", "2025-01-15", "09:00", "60", "Sarah Smith", "8"],
      ["Vinyasa Flow", "2025-01-15", "10:30", "75", "Mike Johnson", "12"],
    ],
    requiredColumns: ["Class Name", "Date", "Time", "Duration", "Capacity"],
    optionalColumns: ["Instructor", "Location", "Level", "Notes"],
  },
  {
    name: "Bookings",
    description: "Import existing bookings",
    downloadUrl: "/templates/bookings.csv",
    exampleRows: [
      ["Client Email", "Class Name", "Date", "Status"],
      ["john@example.com", "Reformer Intermediate", "2025-01-15", "confirmed"],
      ["jane@example.com", "Vinyasa Flow", "2025-01-15", "confirmed"],
    ],
    requiredColumns: ["Client Email", "Class Name", "Date"],
    optionalColumns: ["Status", "Notes"],
  },
];

// Competitor API Integrations
export interface CompetitorIntegration {
  id: string;
  name: string;
  logo: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: number; // minutes
  requiresApiKey: boolean;
  instructions: string[];
  helpUrl: string;
}

export const competitorIntegrations: CompetitorIntegration[] = [
  {
    id: "mindbody",
    name: "Mindbody",
    logo: "/integrations/mindbody.svg",
    description: "Import clients, classes, and bookings from Mindbody",
    difficulty: "easy",
    estimatedTime: 10,
    requiresApiKey: true,
    instructions: [
      "Log in to your Mindbody account",
      "Go to Account Settings > API Credentials",
      "Copy your API Key and Site ID",
      "Paste them below and click Connect",
      "We'll import your data automatically (usually takes 5-10 minutes)",
    ],
    helpUrl: "https://support.mindbodyonline.com/s/article/API-Credentials",
  },
  {
    id: "glofox",
    name: "Glofox",
    logo: "/integrations/glofox.svg",
    description: "Migrate from Glofox in minutes",
    difficulty: "easy",
    estimatedTime: 10,
    requiresApiKey: true,
    instructions: [
      "Contact Glofox support to request an API key",
      "Once you have it, paste it below",
      "Click Connect and we'll handle the rest",
    ],
    helpUrl: "https://help.glofox.com",
  },
  {
    id: "zenplanner",
    name: "Zen Planner",
    logo: "/integrations/zenplanner.svg",
    description: "Import your Zen Planner data",
    difficulty: "medium",
    estimatedTime: 15,
    requiresApiKey: true,
    instructions: [
      "Export your data from Zen Planner as CSV",
      "Or connect via API (requires API key from ZP support)",
      "Upload the CSV files or enter your API key",
    ],
    helpUrl: "https://zenplanner.com/support",
  },
  {
    id: "manual_csv",
    name: "CSV Upload (Any System)",
    logo: "/integrations/csv.svg",
    description: "Works with any system - just export to CSV",
    difficulty: "easy",
    estimatedTime: 5,
    requiresApiKey: false,
    instructions: [
      "Export your data from your current system as CSV",
      "Download our template to see the required format",
      "Match your columns to ours (or we'll help you map them)",
      "Upload and done!",
    ],
    helpUrl: "/help/csv-import",
  },
];

// Onboarding Checklist (shown after go-live)
export interface PostOnboardingTask {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  estimatedMinutes: number;
  category: "essential" | "recommended" | "optional";
  completed: boolean;
  actionUrl: string;
}

export const postOnboardingTasks: PostOnboardingTask[] = [
  {
    id: "invite_clients",
    title: "Send invites to your clients",
    description: "Let your clients know they can now book online",
    priority: "high",
    estimatedMinutes: 5,
    category: "essential",
    completed: false,
    actionUrl: "/admin/clients?action=bulk-invite",
  },
  {
    id: "customize_branding",
    title: "Customize your branding",
    description: "Add your logo and colors to the client portal",
    priority: "medium",
    estimatedMinutes: 10,
    category: "recommended",
    completed: false,
    actionUrl: "/admin/settings/branding",
  },
  {
    id: "setup_notifications",
    title: "Configure notifications",
    description: "Set up email/SMS reminders for classes",
    priority: "high",
    estimatedMinutes: 5,
    category: "essential",
    completed: false,
    actionUrl: "/admin/notifications",
  },
  {
    id: "test_booking",
    title: "Test the booking flow",
    description: "Book yourself into a class to see the client experience",
    priority: "high",
    estimatedMinutes: 3,
    category: "essential",
    completed: false,
    actionUrl: "/dashboard/classes",
  },
  {
    id: "setup_whatsapp",
    title: "Enable WhatsApp bot",
    description: "Let clients book and get updates via WhatsApp",
    priority: "medium",
    estimatedMinutes: 10,
    category: "recommended",
    completed: false,
    actionUrl: "/admin/integrations/whatsapp",
  },
  {
    id: "configure_waitlist",
    title: "Set up waitlist rules",
    description: "Configure priority tiers and notification preferences",
    priority: "low",
    estimatedMinutes: 5,
    category: "optional",
    completed: false,
    actionUrl: "/admin/settings/waitlist",
  },
  {
    id: "create_packages",
    title: "Create membership packages",
    description: "Set up monthly plans and class packs",
    priority: "high",
    estimatedMinutes: 10,
    category: "essential",
    completed: false,
    actionUrl: "/admin/settings/packages",
  },
  {
    id: "train_staff",
    title: "Train your staff",
    description: "Show your team how to use the system",
    priority: "medium",
    estimatedMinutes: 30,
    category: "recommended",
    completed: false,
    actionUrl: "/help/staff-training",
  },
];

// Helper functions
export function calculateOnboardingProgress(
  completedSteps: OnboardingStep[]
): number {
  const totalSteps = onboardingSteps.length;
  return Math.round((completedSteps.length / totalSteps) * 100);
}

export function getNextStep(
  currentStep: OnboardingStep
): OnboardingStepConfig | null {
  const currentIndex = onboardingSteps.findIndex((s) => s.id === currentStep);
  if (currentIndex === -1 || currentIndex === onboardingSteps.length - 1) {
    return null;
  }
  return onboardingSteps[currentIndex + 1];
}

export function estimateRemainingTime(currentStep: OnboardingStep): number {
  const currentIndex = onboardingSteps.findIndex((s) => s.id === currentStep);
  if (currentIndex === -1) return 0;

  return onboardingSteps
    .slice(currentIndex)
    .reduce((sum, step) => sum + step.estimatedMinutes, 0);
}
