// AI Assistant Configuration Types and Defaults

export type AssistantCapability =
  | "booking"
  | "cancellation"
  | "waitlist"
  | "schedule"
  | "payments"
  | "faq"
  | "recommendations"
  | "escalation";

export type AssistantPersonality =
  | "professional"
  | "friendly"
  | "casual"
  | "enthusiastic";

export type AssistantChannel =
  | "whatsapp"
  | "instagram"
  | "sms"
  | "web";

export interface AIAssistantConfig {
  enabled: boolean;
  personality: AssistantPersonality;
  capabilities: AssistantCapability[];
  channels: AssistantChannel[];
  maxTokens: number;
  temperature: number;
}

export interface AssistantPromptTemplate {
  id: string;
  name: string;
  prompt: string;
  variables?: string[];
}

export interface QuickReply {
  id: string;
  label: string;
  message: string;
}

export interface AssistantAnalytics {
  totalMessages: number;
  averageResponseTime: number;
  satisfactionScore: number;
  escalationRate: number;
}

export interface CustomTrainingData {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export const defaultAssistantConfig: AIAssistantConfig = {
  enabled: true,
  personality: "friendly",
  capabilities: ["booking", "cancellation", "schedule", "faq"],
  channels: ["whatsapp", "web"],
  maxTokens: 2000,
  temperature: 0.7,
};

export const assistantPrompts: AssistantPromptTemplate[] = [
  {
    id: "greeting",
    name: "Greeting",
    prompt: "Hello! I'm Flexi, your wellness assistant. How can I help you today?",
  },
  {
    id: "booking_confirm",
    name: "Booking Confirmation",
    prompt: "Your class has been booked! See you at {className} on {date} at {time}.",
    variables: ["className", "date", "time"],
  },
  {
    id: "cancellation_confirm",
    name: "Cancellation Confirmation",
    prompt: "Your booking for {className} on {date} has been cancelled.",
    variables: ["className", "date"],
  },
];

export const quickReplies: QuickReply[] = [
  { id: "book", label: "Book a class", message: "I want to book a class" },
  { id: "schedule", label: "View schedule", message: "Show me the class schedule" },
  { id: "cancel", label: "Cancel booking", message: "I need to cancel my booking" },
  { id: "help", label: "Help", message: "I need help" },
];

export function getCapabilityLabel(capability: AssistantCapability): string {
  const labels: Record<AssistantCapability, string> = {
    booking: "Class Booking",
    cancellation: "Cancellations",
    waitlist: "Waitlist Management",
    schedule: "Schedule Info",
    payments: "Payment Queries",
    faq: "FAQ",
    recommendations: "Recommendations",
    escalation: "Human Escalation",
  };
  return labels[capability] || capability;
}

export function getPersonalityDescription(personality: AssistantPersonality): string {
  const descriptions: Record<AssistantPersonality, string> = {
    professional: "Formal and business-like",
    friendly: "Warm and approachable",
    casual: "Relaxed and informal",
    enthusiastic: "Energetic and motivating",
  };
  return descriptions[personality] || personality;
}

export function generateSystemPrompt(config: AIAssistantConfig, studioName: string): string {
  const personalityPrompts: Record<AssistantPersonality, string> = {
    professional: "You are a professional AI assistant. Maintain a formal, efficient tone.",
    friendly: "You are a friendly AI assistant. Be warm, approachable, and helpful.",
    casual: "You are a relaxed AI assistant. Use informal language and contractions.",
    enthusiastic: "You are an enthusiastic AI assistant! Be energetic and motivating.",
  };

  return `${personalityPrompts[config.personality]}
You are an AI assistant for ${studioName}.
You can help with: ${config.capabilities.map(getCapabilityLabel).join(", ")}.
If you cannot help with something, offer to connect the user with a human.`;
}
