import { NextRequest, NextResponse } from "next/server";
import { aiSupportConfig } from "@/lib/config/ai-support";

// OpenAI integration
// You'll need to: npm install openai
// And add OPENAI_API_KEY to your .env.local

interface ChatMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
}

interface ChatRequest {
  message: string;
  sessionId: string;
  clientId?: string;
  channel: "web" | "whatsapp" | "instagram";
  personality?: "professional" | "friendly" | "casual" | "enthusiastic";
}

interface ClientContext {
  name: string;
  email: string;
  phone: string;
  plan: {
    name: string;
    remainingClasses: number;
    expiresAt: string;
  };
  lastPayment: {
    date: string;
    amount: number;
    status: string;
  };
  upcomingClasses: Array<{
    name: string;
    date: string;
    instructor: string;
  }>;
  preferences: {
    language: string;
    timezone: string;
  };
}

// In-memory conversation storage (use Redis in production)
const conversations = new Map<string, ChatMessage[]>();

// Escalation detection
const ESCALATION_KEYWORDS = [
  "falar com gerente",
  "speak to manager",
  "reclamação",
  "complaint",
  "problema urgente",
  "urgent problem",
  "cancelar conta",
  "cancel account",
  "reembolso",
  "refund",
  "insatisfeito",
  "unsatisfied",
];

function shouldEscalate(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return ESCALATION_KEYWORDS.some((keyword) => lowerMessage.includes(keyword));
}

// Get client context from database
async function getClientContext(clientId: string): Promise<ClientContext | null> {
  // TODO: Replace with actual database call
  // For now, return mock data
  return {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    plan: {
      name: "Growth Plan",
      remainingClasses: 8,
      expiresAt: "2025-01-30",
    },
    lastPayment: {
      date: "2024-12-28",
      amount: 99,
      status: "paid",
    },
    upcomingClasses: [
      {
        name: "Pilates Reformer",
        date: "2025-12-30 10:00",
        instructor: "Sarah Smith",
      },
    ],
    preferences: {
      language: "en",
      timezone: "America/New_York",
    },
  };
}

// Get conversation history
function getConversationHistory(sessionId: string): ChatMessage[] {
  return conversations.get(sessionId) || [];
}

// Save conversation
function saveConversation(sessionId: string, messages: ChatMessage[]): void {
  // Keep only last 20 messages to avoid token limits
  conversations.set(sessionId, messages.slice(-20));
}

// Build system prompt
function buildSystemPrompt(
  personality: string,
  context: ClientContext | null
): string {
  const personalityConfig =
    aiSupportConfig.personality[
      personality as keyof typeof aiSupportConfig.personality
    ] || aiSupportConfig.personality.friendly;

  let prompt = `${personalityConfig.systemPrompt}\n\n`;

  prompt += `You are an AI assistant for FlexiWell CRM, a studio management platform.\n\n`;

  prompt += `CAPABILITIES:\n`;
  aiSupportConfig.capabilities.forEach((cap) => {
    prompt += `- ${cap.name}: ${cap.description}\n`;
  });

  if (context) {
    prompt += `\n\nCLIENT CONTEXT:\n`;
    prompt += `- Name: ${context.name}\n`;
    prompt += `- Plan: ${context.plan.name} (${context.plan.remainingClasses} classes remaining)\n`;
    prompt += `- Last Payment: $${context.lastPayment.amount} on ${context.lastPayment.date} (${context.lastPayment.status})\n`;

    if (context.upcomingClasses.length > 0) {
      prompt += `- Upcoming Classes:\n`;
      context.upcomingClasses.forEach((cls) => {
        prompt += `  * ${cls.name} on ${cls.date} with ${cls.instructor}\n`;
      });
    }
  }

  prompt += `\n\nIMPORTANT RULES:\n`;
  prompt += `1. Always be helpful and empathetic\n`;
  prompt += `2. If you cannot help with something, escalate to a human agent\n`;
  prompt += `3. Never make up information - only use the context provided\n`;
  prompt += `4. For class bookings, cancellations, or account changes, use the available functions\n`;
  prompt += `5. Protect user privacy - never share client data with other clients\n`;
  prompt += `6. If asked about medical advice, politely decline and suggest consulting a healthcare professional\n`;

  return prompt;
}

// Available functions for the AI to call
const availableFunctions = [
  {
    name: "check_available_classes",
    description: "Check available classes for booking",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date to check classes (YYYY-MM-DD)",
        },
        modality: {
          type: "string",
          description: "Class modality (pilates, yoga, etc.)",
        },
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
        classId: {
          type: "string",
          description: "The ID of the class to book",
        },
        clientId: {
          type: "string",
          description: "The client ID",
        },
      },
      required: ["classId", "clientId"],
    },
  },
  {
    name: "cancel_booking",
    description: "Cancel a class booking",
    parameters: {
      type: "object",
      properties: {
        bookingId: {
          type: "string",
          description: "The booking ID to cancel",
        },
      },
      required: ["bookingId"],
    },
  },
  {
    name: "check_waitlist_status",
    description: "Check client's position in waitlist",
    parameters: {
      type: "object",
      properties: {
        clientId: {
          type: "string",
          description: "The client ID",
        },
        classId: {
          type: "string",
          description: "The class ID (optional)",
        },
      },
      required: ["clientId"],
    },
  },
  {
    name: "get_client_schedule",
    description: "Get client's upcoming schedule",
    parameters: {
      type: "object",
      properties: {
        clientId: {
          type: "string",
          description: "The client ID",
        },
        days: {
          type: "number",
          description: "Number of days ahead to check (default 7)",
        },
      },
      required: ["clientId"],
    },
  },
  {
    name: "get_payment_status",
    description: "Check payment status and history",
    parameters: {
      type: "object",
      properties: {
        clientId: {
          type: "string",
          description: "The client ID",
        },
      },
      required: ["clientId"],
    },
  },
  {
    name: "escalate_to_human",
    description: "Escalate the conversation to a human agent",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Reason for escalation",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "Priority level",
        },
      },
      required: ["reason", "priority"],
    },
  },
];

// Execute function calls
async function executeFunction(
  functionName: string,
  args: Record<string, unknown>
): Promise<{ success: boolean; message: string; data?: unknown }> {
  // TODO: Implement actual function logic with database calls
  // For now, return mock responses

  switch (functionName) {
    case "check_available_classes":
      return {
        success: true,
        message: "Found 5 available classes",
        data: [
          {
            id: "class_1",
            name: "Pilates Reformer",
            date: args.date,
            time: "10:00 AM",
            instructor: "Sarah Smith",
            spotsAvailable: 3,
          },
          {
            id: "class_2",
            name: "Yoga Flow",
            date: args.date,
            time: "2:00 PM",
            instructor: "Mike Johnson",
            spotsAvailable: 5,
          },
        ],
      };

    case "book_class":
      return {
        success: true,
        message: "Class booked successfully! Confirmation sent via email.",
        data: {
          bookingId: "booking_123",
          classId: args.classId,
          clientId: args.clientId,
        },
      };

    case "cancel_booking":
      return {
        success: true,
        message: "Booking cancelled successfully. Your class credit has been restored.",
      };

    case "check_waitlist_status":
      return {
        success: true,
        message: "You are #2 in the waitlist for Pilates Reformer on Dec 30",
        data: {
          position: 2,
          estimatedWaitTime: "2-3 hours",
        },
      };

    case "get_client_schedule":
      return {
        success: true,
        message: "Here's your upcoming schedule",
        data: [
          {
            className: "Pilates Reformer",
            date: "2025-12-30",
            time: "10:00 AM",
            instructor: "Sarah Smith",
          },
        ],
      };

    case "get_payment_status":
      return {
        success: true,
        message: "Your account is in good standing",
        data: {
          lastPayment: "2024-12-28",
          nextPayment: "2025-01-28",
          amount: 99,
          status: "paid",
        },
      };

    case "escalate_to_human":
      return {
        success: true,
        message:
          "I'm connecting you with a human agent. Someone will be with you shortly.",
      };

    default:
      return {
        success: false,
        message: `Unknown function: ${functionName}`,
      };
  }
}

// Main chat endpoint
export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const {
      message,
      sessionId,
      clientId,
      channel = "web",
      personality = "friendly",
    } = body;

    // Validate input
    if (!message || !sessionId) {
      return NextResponse.json(
        { error: "Message and sessionId are required" },
        { status: 400 }
      );
    }

    // Check for escalation keywords
    if (shouldEscalate(message)) {
      const result = await executeFunction("escalate_to_human", {
        reason: "User requested human assistance",
        priority: "high",
      });

      return NextResponse.json({
        type: "escalation",
        message: result.message,
        sessionId,
      });
    }

    // Get client context
    const context = clientId ? await getClientContext(clientId) : null;

    // Get conversation history
    const history = getConversationHistory(sessionId);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(personality, context);

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    // TODO: Uncomment when OpenAI is installed and configured
    /*
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      functions: availableFunctions,
      function_call: "auto",
      temperature: 0.7,
      max_tokens: 500,
    });

    const choice = response.choices[0];

    // Check if AI wants to call a function
    if (choice.finish_reason === "function_call" && choice.message.function_call) {
      const functionName = choice.message.function_call.name;
      const functionArgs = JSON.parse(choice.message.function_call.arguments);

      // Execute the function
      const functionResult = await executeFunction(functionName, functionArgs);

      // Add function call and result to history
      messages.push(choice.message as any);
      messages.push({
        role: "function",
        name: functionName,
        content: JSON.stringify(functionResult),
      });

      // Get final response from AI
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 500,
      });

      const finalMessage = finalResponse.choices[0].message.content;

      // Save conversation
      messages.push({ role: "assistant", content: finalMessage || "" });
      saveConversation(sessionId, messages.slice(1)); // Remove system prompt

      return NextResponse.json({
        type: "message",
        content: finalMessage,
        functionCalled: functionName,
        functionResult: functionResult,
        sessionId,
      });
    }

    // Regular text response (no function call)
    const aiMessage = choice.message.content;
    messages.push({ role: "assistant", content: aiMessage || "" });
    saveConversation(sessionId, messages.slice(1));

    return NextResponse.json({
      type: "message",
      content: aiMessage,
      sessionId,
    });
    */

    // Mock response until OpenAI is configured
    const mockResponse = generateMockResponse(message, context);
    messages.push({ role: "assistant", content: mockResponse });
    saveConversation(sessionId, messages.slice(1));

    return NextResponse.json({
      type: "message",
      content: mockResponse,
      sessionId,
      note: "This is a mock response. Configure OpenAI to enable AI features.",
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

// Mock response generator (temporary)
function generateMockResponse(
  message: string,
  context: ClientContext | null
): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("book") || lowerMessage.includes("reserve")) {
    return "I can help you book a class! Which day would you like to attend? We have Pilates, Yoga, and other modalities available.";
  }

  if (lowerMessage.includes("cancel")) {
    return "I can help you cancel your booking. Could you tell me which class you'd like to cancel?";
  }

  if (lowerMessage.includes("waitlist")) {
    return context
      ? `Hi ${context.name}! I can check your waitlist status. You're currently #2 in line for the Pilates Reformer class on Dec 30.`
      : "I can check the waitlist status for you. Which class are you interested in?";
  }

  if (lowerMessage.includes("payment") || lowerMessage.includes("billing")) {
    return context
      ? `Your last payment of $${context.lastPayment.amount} was processed on ${context.lastPayment.date}. Your account is ${context.lastPayment.status}.`
      : "I can help you with billing questions. What would you like to know?";
  }

  if (lowerMessage.includes("schedule")) {
    return context && context.upcomingClasses.length > 0
      ? `You have ${context.upcomingClasses.length} upcoming class(es). Your next class is ${context.upcomingClasses[0].name} on ${context.upcomingClasses[0].date} with ${context.upcomingClasses[0].instructor}.`
      : "I can show you the class schedule. What dates are you interested in?";
  }

  if (lowerMessage.includes("plan") || lowerMessage.includes("membership")) {
    return context
      ? `You're on the ${context.plan.name} with ${context.plan.remainingClasses} classes remaining. Your plan expires on ${context.plan.expiresAt}.`
      : "I can help you with membership information. What would you like to know?";
  }

  if (
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hi") ||
    lowerMessage.includes("hey")
  ) {
    return context
      ? `Hi ${context.name}! 👋 How can I help you today? I can assist with bookings, cancellations, waitlist, payments, and more!`
      : "Hello! 👋 How can I help you today? I can assist with class bookings, cancellations, waitlist, membership info, and more!";
  }

  return "I'm here to help! I can assist you with class bookings, cancellations, waitlist management, payment inquiries, and schedule information. What would you like help with?";
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: "AI Support API is running",
    version: "1.0.0",
    features: {
      openai_configured: !!process.env.OPENAI_API_KEY,
      available_functions: availableFunctions.map((f) => f.name),
      supported_channels: ["web", "whatsapp", "instagram"],
      personalities: Object.keys(aiSupportConfig.personality),
    },
  });
}
