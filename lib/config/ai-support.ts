// AI Support Configuration
// Re-export from ai-assistant for backwards compatibility

export {
  type AssistantCapability,
  type AssistantPersonality,
  type AssistantChannel,
  type AIAssistantConfig,
  type AssistantPromptTemplate,
  type QuickReply,
  type AssistantAnalytics,
  type CustomTrainingData,
  defaultAssistantConfig,
  assistantPrompts,
  quickReplies,
  getCapabilityLabel,
  getPersonalityDescription,
  generateSystemPrompt,
} from "./ai-assistant";

// Personality configurations
export const personalityConfigs = {
  professional: {
    systemPrompt: "You are a professional AI assistant. Maintain a formal, efficient tone. Be concise and business-like.",
    style: "formal",
  },
  friendly: {
    systemPrompt: "You are a friendly AI assistant named Flexi. Be warm, approachable, and helpful. Use a conversational tone.",
    style: "casual",
  },
  casual: {
    systemPrompt: "You are a relaxed AI assistant. Use informal language, contractions, and feel free to use appropriate emojis.",
    style: "informal",
  },
  enthusiastic: {
    systemPrompt: "You are an enthusiastic AI assistant! Be energetic, positive, and motivating. Use exclamation points and encouraging language.",
    style: "energetic",
  },
};

// AI capabilities
export const aiCapabilities = [
  { name: "booking", description: "Help clients book classes and appointments" },
  { name: "cancellation", description: "Process class cancellations and explain policies" },
  { name: "waitlist", description: "Manage waitlist entries and notifications" },
  { name: "schedule", description: "Show class schedules and availability" },
  { name: "payments", description: "Answer questions about payments and plans" },
  { name: "faq", description: "Answer frequently asked questions" },
  { name: "recommendations", description: "Recommend classes based on preferences" },
  { name: "escalation", description: "Escalate to human support when needed" },
];

// Alias for backwards compatibility
export const aiSupportConfig = {
  enabled: true,
  model: "gpt-4o",
  maxTokens: 2000,
  temperature: 0.7,
  systemPromptBase: `You are Flexi, a helpful AI assistant for a wellness studio.
You help clients with class bookings, cancellations, waitlist management, and general questions.
Be friendly, professional, and helpful. If you can't help with something, offer to connect them with a human.`,

  // Personality configurations
  personality: personalityConfigs,

  // Capabilities
  capabilities: aiCapabilities,

  // Function definitions for OpenAI function calling
  functions: [
    {
      name: "check_available_classes",
      description: "Check available classes for a specific date or date range",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Date in YYYY-MM-DD format" },
          classType: { type: "string", description: "Type of class (yoga, pilates, etc.)" },
          instructorId: { type: "string", description: "Specific instructor ID (optional)" },
        },
        required: ["date"],
      },
    },
    {
      name: "book_class",
      description: "Book a class for the client",
      parameters: {
        type: "object",
        properties: {
          classId: { type: "string", description: "ID of the class to book" },
          clientId: { type: "string", description: "ID of the client" },
        },
        required: ["classId", "clientId"],
      },
    },
    {
      name: "cancel_booking",
      description: "Cancel an existing booking",
      parameters: {
        type: "object",
        properties: {
          bookingId: { type: "string", description: "ID of the booking to cancel" },
          reason: { type: "string", description: "Reason for cancellation (optional)" },
        },
        required: ["bookingId"],
      },
    },
    {
      name: "check_waitlist_status",
      description: "Check client's position on waitlists",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "ID of the client" },
          classId: { type: "string", description: "Specific class ID (optional)" },
        },
        required: ["clientId"],
      },
    },
    {
      name: "get_client_schedule",
      description: "Get upcoming bookings for a client",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "ID of the client" },
          limit: { type: "number", description: "Number of bookings to return (default 5)" },
        },
        required: ["clientId"],
      },
    },
    {
      name: "get_payment_status",
      description: "Check payment status and plan details for a client",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "ID of the client" },
        },
        required: ["clientId"],
      },
    },
    {
      name: "recommend_class",
      description: "Recommend classes based on client preferences",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "ID of the client" },
          preferences: {
            type: "object",
            properties: {
              type: { type: "string", description: "Preferred class type" },
              difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
              timeOfDay: { type: "string", enum: ["morning", "afternoon", "evening"] },
            },
          },
        },
        required: ["clientId"],
      },
    },
    {
      name: "escalate_to_human",
      description: "Escalate the conversation to a human support agent",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Reason for escalation" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Priority level" },
        },
        required: ["reason"],
      },
    },
  ],

  // Escalation triggers
  escalationTriggers: [
    "speak to human",
    "real person",
    "manager",
    "complaint",
    "refund",
    "angry",
    "frustrated",
    "not helpful",
  ],

  // Response limits by plan (4 plans: starter, growth, business, enterprise)
  limitsPerPlan: {
    starter: 0,
    growth: 0,
    business: 2000,
    enterprise: -1, // unlimited
  },
};
