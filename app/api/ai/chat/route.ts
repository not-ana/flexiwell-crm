import { NextRequest, NextResponse } from "next/server";
import { aiSupportConfig } from "@/lib/config/ai-support";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { Client, Booking } from "@/lib/db/schemas";
import OpenAI from "openai";

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
  try {
    if (!ObjectId.isValid(clientId)) {
      return null;
    }

    const db = await getDatabase();

    // Get client data
    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(clientId),
    });

    if (!client) {
      return null;
    }

    // Get last payment
    const lastPayment = await db.collection("payments").findOne(
      { clientId: clientId, status: "completed" },
      { sort: { createdAt: -1 } }
    );

    // Get upcoming bookings
    const now = new Date();
    const upcomingBookings = await db.collection<Booking>("bookings")
      .find({
        clientId: clientId,
        scheduledDate: { $gte: now },
        status: { $in: ["confirmed", "pending"] },
      })
      .sort({ scheduledDate: 1 })
      .limit(5)
      .toArray();

    // Map plan type to display name
    const planTypeNames: Record<string, string> = {
      "monthly": "Plano Mensal",
      "quarterly": "Plano Trimestral",
      "annual": "Plano Anual",
      "drop-in": "Avulso",
    };

    return {
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      plan: {
        name: planTypeNames[client.plan.type] || client.plan.type,
        remainingClasses: client.plan.remainingClasses,
        expiresAt: client.plan.endDate
          ? new Date(client.plan.endDate).toISOString().split("T")[0]
          : "N/A",
      },
      lastPayment: lastPayment
        ? {
            date: new Date(lastPayment.createdAt).toISOString().split("T")[0],
            amount: lastPayment.amount,
            status: lastPayment.status,
          }
        : {
            date: "N/A",
            amount: 0,
            status: "none",
          },
      upcomingClasses: upcomingBookings.map((booking) => ({
        name: booking.className,
        date: `${new Date(booking.scheduledDate).toISOString().split("T")[0]} ${booking.startTime}`,
        instructor: booking.instructorName,
      })),
      preferences: {
        language: "pt",
        timezone: "America/Sao_Paulo",
      },
    };
  } catch (error) {
    console.error("Error getting client context:", error);
    return null;
  }
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
  const db = await getDatabase();

  switch (functionName) {
    case "check_available_classes": {
      const dateStr = args.date as string;
      const modality = args.modality as string | undefined;

      // Parse date range for the given day
      const startDate = new Date(dateStr);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateStr);
      endDate.setHours(23, 59, 59, 999);

      // Build query
      const query: Record<string, unknown> = {
        scheduledDate: { $gte: startDate, $lte: endDate },
        status: "active",
      };

      if (modality) {
        query.title = { $regex: modality, $options: "i" };
      }

      const classes = await db.collection("classes")
        .find(query)
        .sort({ startTime: 1 })
        .toArray();

      // Filter classes with available spots
      const availableClasses = classes.filter(
        (c) => (c.currentEnrollment || 0) < (c.capacity || 10)
      );

      if (availableClasses.length === 0) {
        return {
          success: true,
          message: `No classes available on ${dateStr}${modality ? ` for ${modality}` : ""}`,
          data: [],
        };
      }

      return {
        success: true,
        message: `Found ${availableClasses.length} available class(es)`,
        data: availableClasses.map((c) => ({
          id: c._id.toString(),
          name: c.title,
          date: dateStr,
          time: c.startTime,
          instructor: c.instructorName,
          spotsAvailable: (c.capacity || 10) - (c.currentEnrollment || 0),
        })),
      };
    }

    case "book_class": {
      const classId = args.classId as string;
      const clientId = args.clientId as string;

      if (!ObjectId.isValid(classId) || !ObjectId.isValid(clientId)) {
        return { success: false, message: "Invalid class or client ID" };
      }

      // Get class and client
      const [classDoc, client] = await Promise.all([
        db.collection("classes").findOne({ _id: new ObjectId(classId) }),
        db.collection<Client>("clients").findOne({ _id: new ObjectId(clientId) }),
      ]);

      if (!classDoc) {
        return { success: false, message: "Class not found" };
      }

      if (!client) {
        return { success: false, message: "Client not found" };
      }

      // Check capacity
      if ((classDoc.currentEnrollment || 0) >= (classDoc.capacity || 10)) {
        return { success: false, message: "Class is full. Would you like to be added to the waitlist?" };
      }

      // Check credits
      if (client.plan.remainingClasses <= 0) {
        return { success: false, message: "No classes remaining in your plan. Please upgrade or purchase more credits." };
      }

      // Check for existing booking
      const existingBooking = await db.collection<Booking>("bookings").findOne({
        clientId: clientId,
        classId: classId,
        status: { $in: ["confirmed", "pending"] },
      });

      if (existingBooking) {
        return { success: false, message: "You already have a booking for this class" };
      }

      // Create booking
      const now = new Date();
      const booking: Omit<Booking, "_id"> = {
        clientId: clientId,
        clientName: client.name,
        classId: classId,
        className: classDoc.title,
        instructorId: classDoc.instructorId,
        instructorName: classDoc.instructorName,
        scheduledDate: new Date(classDoc.scheduledDate),
        startTime: classDoc.startTime,
        endTime: classDoc.endTime,
        status: "confirmed",
        source: "bot",
        createdAt: now,
        updatedAt: now,
      };

      const result = await db.collection<Booking>("bookings").insertOne(booking as Booking);

      // Update class enrollment
      await db.collection("classes").updateOne(
        { _id: new ObjectId(classId) },
        { $inc: { currentEnrollment: 1 } }
      );

      // Update client credits
      await db.collection<Client>("clients").updateOne(
        { _id: new ObjectId(clientId) },
        {
          $inc: { "plan.remainingClasses": -1 },
          $set: { updatedAt: now },
        }
      );

      return {
        success: true,
        message: `Class booked successfully! You're confirmed for ${classDoc.title} on ${new Date(classDoc.scheduledDate).toLocaleDateString()} at ${classDoc.startTime}.`,
        data: {
          bookingId: result.insertedId.toString(),
          classId,
          clientId,
          className: classDoc.title,
          date: classDoc.scheduledDate,
          time: classDoc.startTime,
        },
      };
    }

    case "cancel_booking": {
      const bookingId = args.bookingId as string;

      if (!ObjectId.isValid(bookingId)) {
        return { success: false, message: "Invalid booking ID" };
      }

      const booking = await db.collection<Booking>("bookings").findOne({
        _id: new ObjectId(bookingId),
      });

      if (!booking) {
        return { success: false, message: "Booking not found" };
      }

      if (booking.status === "cancelled") {
        return { success: false, message: "This booking is already cancelled" };
      }

      const now = new Date();

      // Cancel booking
      await db.collection<Booking>("bookings").updateOne(
        { _id: new ObjectId(bookingId) },
        {
          $set: {
            status: "cancelled",
            cancelledAt: now,
            cancellationReason: "Cancelled via chat",
            updatedAt: now,
          },
        }
      );

      // Restore class enrollment count
      await db.collection("classes").updateOne(
        { _id: new ObjectId(booking.classId) },
        { $inc: { currentEnrollment: -1 } }
      );

      // Restore client credit
      await db.collection<Client>("clients").updateOne(
        { _id: new ObjectId(booking.clientId) },
        {
          $inc: { "plan.remainingClasses": 1 },
          $set: { updatedAt: now },
        }
      );

      return {
        success: true,
        message: `Booking for ${booking.className} has been cancelled. Your class credit has been restored.`,
      };
    }

    case "check_waitlist_status": {
      const clientId = args.clientId as string;
      const classId = args.classId as string | undefined;

      if (!ObjectId.isValid(clientId)) {
        return { success: false, message: "Invalid client ID" };
      }

      const query: Record<string, unknown> = {
        clientId: clientId,
        status: "waiting",
      };

      if (classId && ObjectId.isValid(classId)) {
        query.preferredClassId = classId;
      }

      const waitlistEntries = await db.collection("waitlist")
        .find(query)
        .sort({ createdAt: 1 })
        .toArray();

      if (waitlistEntries.length === 0) {
        return {
          success: true,
          message: "You are not on any waitlists",
          data: [],
        };
      }

      // Get position for each entry
      const entriesWithPosition = await Promise.all(
        waitlistEntries.map(async (entry) => {
          const position = await db.collection("waitlist").countDocuments({
            preferredClassId: entry.preferredClassId,
            status: "waiting",
            createdAt: { $lt: entry.createdAt },
          });
          return {
            className: entry.preferredClassName || "Any class",
            position: position + 1,
            requestType: entry.requestType,
            createdAt: entry.createdAt,
          };
        })
      );

      return {
        success: true,
        message: `You are on ${entriesWithPosition.length} waitlist(s)`,
        data: entriesWithPosition,
      };
    }

    case "get_client_schedule": {
      const clientId = args.clientId as string;
      const days = (args.days as number) || 7;

      if (!ObjectId.isValid(clientId)) {
        return { success: false, message: "Invalid client ID" };
      }

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const bookings = await db.collection<Booking>("bookings")
        .find({
          clientId: clientId,
          scheduledDate: { $gte: now, $lte: futureDate },
          status: { $in: ["confirmed", "pending"] },
        })
        .sort({ scheduledDate: 1 })
        .toArray();

      if (bookings.length === 0) {
        return {
          success: true,
          message: `No upcoming classes in the next ${days} days`,
          data: [],
        };
      }

      return {
        success: true,
        message: `You have ${bookings.length} upcoming class(es)`,
        data: bookings.map((b) => ({
          bookingId: b._id?.toString(),
          className: b.className,
          date: new Date(b.scheduledDate).toISOString().split("T")[0],
          time: b.startTime,
          instructor: b.instructorName,
          status: b.status,
        })),
      };
    }

    case "get_payment_status": {
      const clientId = args.clientId as string;

      if (!ObjectId.isValid(clientId)) {
        return { success: false, message: "Invalid client ID" };
      }

      // Get client for plan info
      const client = await db.collection<Client>("clients").findOne({
        _id: new ObjectId(clientId),
      });

      if (!client) {
        return { success: false, message: "Client not found" };
      }

      // Get recent payments
      const payments = await db.collection("payments")
        .find({ clientId: clientId })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

      const lastPayment = payments[0];
      const pendingPayment = payments.find((p) => p.status === "pending");

      return {
        success: true,
        message: pendingPayment
          ? `You have a pending payment of R$${pendingPayment.amount}`
          : "Your account is in good standing",
        data: {
          plan: client.plan.type,
          classesRemaining: client.plan.remainingClasses,
          planExpiresAt: client.plan.endDate
            ? new Date(client.plan.endDate).toISOString().split("T")[0]
            : null,
          lastPayment: lastPayment
            ? {
                date: new Date(lastPayment.createdAt).toISOString().split("T")[0],
                amount: lastPayment.amount,
                status: lastPayment.status,
              }
            : null,
          pendingPayment: pendingPayment
            ? {
                amount: pendingPayment.amount,
                dueDate: pendingPayment.dueDate
                  ? new Date(pendingPayment.dueDate).toISOString().split("T")[0]
                  : null,
              }
            : null,
        },
      };
    }

    case "escalate_to_human": {
      const reason = args.reason as string;
      const priority = args.priority as string;

      // Log escalation to database
      await db.collection("escalations").insertOne({
        reason,
        priority,
        status: "pending",
        createdAt: new Date(),
      });

      return {
        success: true,
        message: "I'm connecting you with a human agent. Someone will be with you shortly.",
      };
    }

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

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to mock response if OpenAI is not configured
      const mockResponse = generateMockResponse(message, context);
      messages.push({ role: "assistant", content: mockResponse });
      saveConversation(sessionId, messages.slice(1));

      return NextResponse.json({
        type: "message",
        content: mockResponse,
        sessionId,
        note: "OpenAI not configured. Set OPENAI_API_KEY to enable AI features.",
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      tools: availableFunctions.map(fn => ({
        type: "function" as const,
        function: fn,
      })),
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 500,
    });

    const choice = response.choices[0];

    // Check if AI wants to call a function (tool)
    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      const toolCall = choice.message.tool_calls[0] as OpenAI.Chat.ChatCompletionMessageToolCall;
      if (toolCall.type !== "function") {
        throw new Error("Unsupported tool call type");
      }
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      // Execute the function
      const functionResult = await executeFunction(functionName, functionArgs);

      // Add function call and result to history
      messages.push(choice.message as any);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(functionResult),
      } as any);

      // Get final response from AI
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
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
