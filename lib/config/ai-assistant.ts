// AI Support Assistant Configuration
// Intelligent support powered by AI for 24/7 client assistance

export type AssistantCapability =
  | "booking"
  | "cancellation"
  | "rescheduling"
  | "waitlist"
  | "membership"
  | "payments"
  | "schedule_inquiry"
  | "general_faq"
  | "instructor_info"
  | "location_info"
  | "pricing_info"
  | "class_recommendations"
  | "feedback_collection";

export type AssistantPersonality = "professional" | "friendly" | "casual" | "enthusiastic";

export type AssistantChannel = "web_chat" | "whatsapp" | "instagram" | "facebook" | "sms" | "email";

export interface AIAssistantConfig {
  enabled: boolean;
  name: string;
  personality: AssistantPersonality;
  language: string;
  channels: AssistantChannel[];
  capabilities: AssistantCapability[];
  workingHours: {
    enabled: boolean;
    timezone: string;
    schedule: Record<string, { start: string; end: string } | null>;
  };
  escalation: {
    enabled: boolean;
    triggerKeywords: string[];
    escalateTo: "email" | "whatsapp" | "slack";
    maxAttempts: number;
  };
  branding: {
    avatarUrl?: string;
    welcomeMessage: string;
    offlineMessage: string;
    signatureEnabled: boolean;
  };
}

export interface AssistantPromptTemplate {
  id: string;
  name: string;
  capability: AssistantCapability;
  systemPrompt: string;
  examples: { user: string; assistant: string }[];
}

// Default assistant configuration
export const defaultAssistantConfig: AIAssistantConfig = {
  enabled: true,
  name: "Flexi",
  personality: "friendly",
  language: "en",
  channels: ["web_chat", "whatsapp"],
  capabilities: [
    "booking",
    "cancellation",
    "rescheduling",
    "waitlist",
    "schedule_inquiry",
    "general_faq",
    "class_recommendations",
  ],
  workingHours: {
    enabled: false,
    timezone: "America/New_York",
    schedule: {
      monday: { start: "09:00", end: "21:00" },
      tuesday: { start: "09:00", end: "21:00" },
      wednesday: { start: "09:00", end: "21:00" },
      thursday: { start: "09:00", end: "21:00" },
      friday: { start: "09:00", end: "21:00" },
      saturday: { start: "09:00", end: "17:00" },
      sunday: null,
    },
  },
  escalation: {
    enabled: true,
    triggerKeywords: ["speak to human", "real person", "manager", "complaint", "refund"],
    escalateTo: "whatsapp",
    maxAttempts: 3,
  },
  branding: {
    welcomeMessage: "Hi! I'm {{name}}, your virtual assistant at {{studioName}}. How can I help you today?",
    offlineMessage: "Thanks for reaching out! Our team will get back to you during business hours.",
    signatureEnabled: true,
  },
};

// System prompts for different capabilities
export const assistantPrompts: AssistantPromptTemplate[] = [
  {
    id: "booking",
    name: "Class Booking",
    capability: "booking",
    systemPrompt: `You are a helpful booking assistant for {{studioName}}, a {{businessType}} studio.

Your role is to help clients book classes. You have access to the class schedule and can:
- Show available classes for specific dates/times
- Check instructor availability
- Confirm bookings
- Add clients to waitlist if class is full

Guidelines:
- Always confirm the date, time, and class type before booking
- Check if the client has credits/membership before proceeding
- If class is full, offer to add to waitlist and explain how it works
- Suggest alternative times if preferred slot is unavailable
- Be warm but efficient

Current date: {{currentDate}}
Studio timezone: {{timezone}}`,
    examples: [
      {
        user: "I want to book a pilates class",
        assistant: "I'd love to help you book a Pilates class! When were you thinking? We have classes available today at 9am, 11am, and 4pm, or I can check any other day that works for you.",
      },
      {
        user: "Tomorrow at 9am",
        assistant: "Great choice! Tomorrow's 9am Pilates class with instructor Maria has 2 spots left. Would you like me to book you in?",
      },
    ],
  },
  {
    id: "cancellation",
    name: "Cancellation",
    capability: "cancellation",
    systemPrompt: `You are helping clients cancel their class bookings at {{studioName}}.

Guidelines:
- Check the cancellation policy before confirming (usually 12-24h notice required)
- If within penalty window, explain the policy kindly and offer alternatives
- Suggest rescheduling instead of canceling when possible
- Confirm the cancellation clearly
- For waitlist members, explain that spot will go to next person

Cancellation policy: {{cancellationPolicy}}`,
    examples: [
      {
        user: "I need to cancel my class tomorrow",
        assistant: "No problem! I can help you cancel your 9am Pilates class tomorrow. Since you're canceling more than 12 hours in advance, there's no penalty. Would you like me to proceed with the cancellation, or would you prefer to reschedule to another time?",
      },
    ],
  },
  {
    id: "waitlist",
    name: "Waitlist",
    capability: "waitlist",
    systemPrompt: `You are helping clients with waitlist-related questions at {{studioName}}.

You can:
- Add clients to waitlists
- Check their position in queue
- Explain how the waitlist works
- Update notification preferences

Key information:
- Priority is based on membership type
- Clients are notified via {{notificationChannels}} when a spot opens
- They have a limited time to confirm (varies by priority tier)
- Auto-confirm option is available for regular clients`,
    examples: [
      {
        user: "Can you add me to the waitlist for the 5pm yoga class?",
        assistant: "Of course! I've added you to the waitlist for today's 5pm Yoga class. You're currently #3 in line. If a spot opens up, I'll notify you immediately via WhatsApp, and you'll have 2 hours to confirm. Would you like to enable auto-confirm so you're automatically booked if a spot opens?",
      },
    ],
  },
  {
    id: "recommendations",
    name: "Class Recommendations",
    capability: "class_recommendations",
    systemPrompt: `You are helping clients discover the right classes at {{studioName}}.

Based on their:
- Experience level (beginner, intermediate, advanced)
- Goals (flexibility, strength, relaxation, fitness)
- Schedule preferences
- Past attendance

Recommend suitable classes and instructors.

Available class types: {{classTypes}}
Instructor specialties: {{instructorSpecialties}}`,
    examples: [
      {
        user: "I'm new to pilates, what class should I start with?",
        assistant: "Welcome! For beginners, I'd recommend our 'Pilates Foundations' class - it's perfect for learning the basics in a supportive environment. We have one tomorrow at 10am with instructor Ana, who's known for being great with newcomers. Would you like to try it?",
      },
    ],
  },
  {
    id: "faq",
    name: "General FAQ",
    capability: "general_faq",
    systemPrompt: `You are answering general questions about {{studioName}}.

Common topics:
- Location and parking
- What to bring to class
- Dress code
- Pricing and packages
- First-time visit experience
- COVID/health policies

Studio information:
Address: {{studioAddress}}
Parking: {{parkingInfo}}
What to bring: {{whatToBring}}`,
    examples: [
      {
        user: "What should I bring to my first class?",
        assistant: "For your first visit, just bring yourself and a positive attitude! We provide mats and all equipment. Wear comfortable, form-fitting clothing you can move in. We recommend arriving 10-15 minutes early to complete a quick waiver and get oriented. Water bottles are welcome, and we have filtered water available too.",
      },
    ],
  },
];

// Quick replies for common scenarios
export interface QuickReply {
  trigger: string[];
  response: string;
  followUp?: string;
}

export const quickReplies: QuickReply[] = [
  {
    trigger: ["hours", "open", "when are you open"],
    response: "We're open {{workingHours}}. Is there a specific day you're asking about?",
  },
  {
    trigger: ["location", "address", "where are you", "directions"],
    response: "We're located at {{address}}. {{parkingInfo}} Would you like me to send you directions?",
  },
  {
    trigger: ["price", "cost", "how much", "pricing"],
    response: "We have several options! Drop-in classes are ${{dropInPrice}}, or you can save with our packages starting at ${{packagePrice}} for {{packageClasses}} classes. Would you like me to explain the options?",
  },
  {
    trigger: ["first time", "never been", "new here", "beginner"],
    response: "Welcome! First-timers get a special intro offer: {{introOffer}}. I can help you book your first class - what type of class interests you most?",
  },
];

// Analytics for AI assistant
export interface AssistantAnalytics {
  totalConversations: number;
  successfulResolutions: number;
  escalatedToHuman: number;
  averageResponseTime: number;
  averageSatisfactionScore: number;
  topIntents: { intent: string; count: number }[];
  peakHours: { hour: number; count: number }[];
  channelBreakdown: Record<AssistantChannel, number>;
}

// Training data structure for custom responses
export interface CustomTrainingData {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  createdAt: Date;
  usageCount: number;
}

// Helper functions
export function getCapabilityLabel(capability: AssistantCapability): string {
  const labels: Record<AssistantCapability, string> = {
    booking: "Class Booking",
    cancellation: "Cancellations",
    rescheduling: "Rescheduling",
    waitlist: "Waitlist Management",
    membership: "Membership Questions",
    payments: "Payment Support",
    schedule_inquiry: "Schedule Inquiries",
    general_faq: "General FAQ",
    instructor_info: "Instructor Information",
    location_info: "Location & Directions",
    pricing_info: "Pricing Questions",
    class_recommendations: "Class Recommendations",
    feedback_collection: "Feedback Collection",
  };
  return labels[capability];
}

export function getPersonalityDescription(personality: AssistantPersonality): string {
  const descriptions: Record<AssistantPersonality, string> = {
    professional: "Formal and business-like, focuses on efficiency",
    friendly: "Warm and approachable, uses casual language with professionalism",
    casual: "Very relaxed, uses emojis and informal language",
    enthusiastic: "High energy, uses exclamation points and motivational language",
  };
  return descriptions[personality];
}

export function generateSystemPrompt(
  template: AssistantPromptTemplate,
  studioContext: Record<string, string>
): string {
  let prompt = template.systemPrompt;
  for (const [key, value] of Object.entries(studioContext)) {
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return prompt;
}

// Implementation suggestions for the backend
export const implementationNotes = `
AI Assistant Implementation Guide:

1. LLM Provider Options:
   - OpenAI GPT-4 (recommended for quality)
   - Anthropic Claude (good alternative)
   - Open-source: Llama 2 / Mistral (cost-effective at scale)

2. Architecture:
   - Use a conversation router to detect intent
   - Maintain conversation context in Redis/database
   - Implement function calling for real actions (booking, canceling, etc.)
   - Use embeddings for FAQ semantic search

3. WhatsApp Integration:
   - Use WhatsApp Business API (via Twilio or direct)
   - Handle message templates for proactive messages
   - Implement quick reply buttons for common actions

4. Safety & Guardrails:
   - Implement rate limiting per user
   - Add content moderation layer
   - Track and flag unusual patterns
   - Always offer human escalation option

5. Training & Improvement:
   - Log all conversations for review
   - Allow staff to flag incorrect responses
   - Regularly update FAQ based on common questions
   - A/B test different response styles

6. Metrics to Track:
   - Resolution rate (% handled without human)
   - Customer satisfaction score
   - Average conversation length
   - Booking conversion rate
   - Peak usage times
`;
