// American English translations
// Focus: Support, Waitlist Management, Revenue Predictability

import type { TranslationKeys } from "./pt-BR";

export const enUS: TranslationKeys = {
  // Common
  common: {
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    filter: "Filter",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    warning: "Warning",
    back: "Back",
    next: "Next",
    previous: "Previous",
    close: "Close",
    yes: "Yes",
    no: "No",
    or: "or",
    and: "and",
  },

  // Navigation
  nav: {
    dashboard: "Dashboard",
    schedule: "Schedule",
    clients: "Clients",
    classes: "Classes",
    bookings: "Bookings",
    waitlist: "Waitlist",
    payments: "Payments",
    reports: "Reports",
    settings: "Settings",
    support: "Support",
    logout: "Log out",
  },

  // Pricing & Plans
  pricing: {
    title: "Plans & Pricing",
    subtitle: "Choose the right plan for your studio",
    monthly: "Monthly",
    annual: "Annual",
    perMonth: "/month",
    billedAnnually: "billed annually",
    save: "Save",
    mostPopular: "Most popular",
    bestForPredictability: "Best for predictability",
    contactSales: "Contact sales",
    startFreeTrial: "Start free trial",
    currentPlan: "Current plan",
    upgrade: "Upgrade",
    downgrade: "Downgrade",

    // Plan names
    plans: {
      starter: {
        name: "Starter",
        description: "Scheduling, payments, and basic studio management.",
        tagline: "The essentials",
      },
      retention_pro: {
        name: "Retention Pro",
        description: "The Retention Engine™ — stop losing clients and fill your studio.",
        tagline: "The Retention Engine™",
      },
      scale: {
        name: "Scale",
        description: "For multi-location studios and franchises with unlimited everything.",
        tagline: "Multi-location mastery",
      },
    },

    // Features
    features: {
      onlineScheduling: "Online scheduling",
      clientPortal: "Client portal",
      paymentProcessing: "Payment processing",
      emailReminders: "Email reminders",
      calendarSync: "Calendar sync",
      smsNotifications: "SMS notifications",
      whatsappNotifications: "WhatsApp notifications",
      messagingBot: "Messaging Bot",
      messagingBotTooltip: "WhatsApp/SMS Bot - automated scheduling, confirmations, reminders",
      aiSupportAssistant: "AI Support Assistant",
      smartWaitlist: "Smart Waitlist",
      smartWaitlistTooltip: "AI-powered priority, auto-fill cancellations, reduce no-shows by 40%",
      cancellationPredictions: "Cancellation predictions",
      cancellationPredictionsTooltip: "ML-based predictions to proactively fill spots",
      autoFillSpots: "Auto-fill spots",
      revenueProtection: "Revenue protection",
      revenueProtectionTooltip: "Late cancellation fees, no-show tracking",
      customWaitlistRules: "Custom waitlist rules",
      wellhubGympass: "Wellhub/Gympass",
      basicReports: "Basic reports",
      advancedReports: "Advanced reports",
      revenueAnalytics: "Revenue analytics",
      revenueAnalyticsTooltip: "Full cash flow predictability dashboard",
      monthlyRevenueForecast: "Monthly revenue forecast",
      monthlyRevenueForecastTooltip: "30-day revenue predictions based on bookings",
      multiLocationAnalytics: "Multi-location analytics",
      dataExport: "Data export",
      emailSupport: "Email support",
      chatSupport: "Chat support",
      prioritySupport: "Priority support",
      dedicatedAccountManager: "Dedicated account manager",
      apiAccess: "API access",
      whiteLabelBranding: "White-label branding",
      customIntegrations: "Custom integrations",
    },

    // Limits
    limits: {
      clients: "clients",
      teamMembers: "team members",
      locations: "locations",
      storage: "storage",
      unlimited: "unlimited",
      msgsPerMonth: "msgs/mo",
      chatsPerMonth: "chats/mo",
    },
  },

  // Waitlist - Core feature
  waitlist: {
    title: "Smart Waitlist",
    subtitle: "Reduce revenue variation and increase cash flow predictability",

    // Status
    status: {
      waiting: "Waiting",
      notified: "Notified",
      confirmed: "Confirmed",
      expired: "Expired",
      declined: "Declined",
    },

    // Priority
    priority: {
      vip: "VIP",
      high: "High",
      medium: "Medium",
      low: "Low",
    },

    // Actions
    actions: {
      addToWaitlist: "Add to waitlist",
      removeFromWaitlist: "Remove from waitlist",
      notifyNext: "Notify next",
      notifyAll: "Notify all",
      confirmSpot: "Confirm spot",
      declineSpot: "Decline spot",
    },

    // Messages
    messages: {
      spotAvailable: "Spot available! You have {minutes} minutes to confirm.",
      addedToWaitlist: "You've been added to the waitlist at position {position}.",
      confirmedFromWaitlist: "Your spot has been confirmed!",
      expiredOffer: "The spot offer has expired.",
      queuePosition: "Your queue position: {position}",
    },

    // Settings
    settings: {
      enableSmartPriority: "Enable smart priority",
      autoNotifyOnCancel: "Auto-notify on cancellation",
      notificationWindow: "Notification window (minutes)",
      maxWaitlistSize: "Max waitlist size",
      priorityByPlanType: "Prioritize by plan type",
    },

    // Revenue impact
    revenue: {
      spotsFilledFromWaitlist: "Spots filled from waitlist",
      revenueRecovered: "Revenue recovered",
      noShowsReduced: "No-shows reduced",
      cancellationsPredicted: "Cancellations predicted",
    },
  },

  // Messaging Bot
  messaging: {
    title: "Messaging Bot",
    whatsappBot: "WhatsApp Bot",
    smsBot: "SMS Bot",

    // Bot responses
    bot: {
      greeting: "Hi! I'm the virtual assistant for {studioName}. How can I help?",
      bookingConfirmed: "Your {className} class is confirmed for {date} at {time}.",
      reminder24h: "Reminder: Your {className} class is tomorrow at {time}.",
      reminder2h: "Your {className} class starts in 2 hours. See you there!",
      cancellationReceived: "Cancellation received. Would you like to reschedule?",
      waitlistNotification: "Great news! A spot opened for {className} on {date}. Reply YES to confirm.",
      waitlistConfirmed: "Spot confirmed! You're booked for {className} on {date} at {time}.",
      waitlistExpired: "The spot offer has expired. You remain on the waitlist.",
    },

    // Settings
    settings: {
      enableBot: "Enable messaging bot",
      autoConfirmation: "Auto-confirm bookings",
      autoReminders: "Auto-reminders",
      waitlistNotifications: "Waitlist notifications",
      messageLimit: "Message limit/month",
    },
  },

  // Support
  support: {
    title: "Support",
    newTicket: "New ticket",
    myTickets: "My tickets",
    aiAssistant: "AI Assistant",

    // Categories
    categories: {
      billing: "Billing",
      classes: "Classes",
      technical: "Technical",
      feedback: "Feedback",
      other: "Other",
    },

    // Priority
    priority: {
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "Urgent",
    },

    // Status
    status: {
      open: "Open",
      inProgress: "In progress",
      resolved: "Resolved",
      closed: "Closed",
    },
  },

  // Revenue & Analytics
  revenue: {
    title: "Revenue Analytics",
    dashboard: "Revenue Dashboard",
    forecast: "Forecast",
    actual: "Actual",
    variance: "Variance",

    // Metrics
    metrics: {
      monthlyRecurring: "Monthly recurring revenue",
      projectedRevenue: "Projected revenue",
      actualRevenue: "Actual revenue",
      revenueVariance: "Revenue variance",
      cashFlowPredictability: "Cash flow predictability",
      occupancyRate: "Occupancy rate",
      noShowRate: "No-show rate",
      cancellationRate: "Cancellation rate",
    },

    // Insights
    insights: {
      revenueAtRisk: "Revenue at risk",
      predictedCancellations: "Predicted cancellations",
      waitlistConversions: "Waitlist conversions",
      recommendedActions: "Recommended actions",
    },
  },

  // Notifications
  notifications: {
    title: "Notifications",
    email: "Email",
    whatsapp: "WhatsApp",
    sms: "SMS",
    push: "Push",

    // Types
    types: {
      bookingConfirmation: "Booking confirmation",
      bookingReminder: "Class reminder",
      bookingCancellation: "Booking cancellation",
      waitlistNotification: "Waitlist notification",
      paymentConfirmation: "Payment confirmation",
      planExpiring: "Plan expiring",
    },
  },

  // Errors
  errors: {
    generic: "An error occurred. Please try again.",
    notFound: "Not found",
    unauthorized: "Unauthorized",
    forbidden: "Access denied",
    validation: "Please check the information provided.",
    network: "Connection error. Check your internet.",
  },
};
