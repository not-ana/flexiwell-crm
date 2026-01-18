// Main Bot Handler for FlexiWell
// Handles messages from WhatsApp and Instagram

import { getDatabase } from "@/lib/db/mongodb";
import type { BotSession, Client, Conversation } from "@/lib/db/schemas";
import {
  CommandResponse,
  detectIntent,
  handleMainMenu,
  handleHelp,
  handleRemainingClasses,
  handleUpcomingClasses,
  handleAvailableClasses,
  handleBookClass,
  handleCancelClass,
  handleInstructorSchedule,
} from "./commands";

export interface IncomingMessage {
  platform: "whatsapp" | "instagram";
  platformUserId: string;
  messageId: string;
  text?: string;
  payload?: string; // For button clicks
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface OutgoingMessage {
  platform: "whatsapp" | "instagram";
  recipientId: string;
  text: string;
  buttons?: { text: string; payload: string }[];
  quickReplies?: string[];
}

// Session management
async function getOrCreateSession(platformUserId: string, platform: "whatsapp" | "instagram"): Promise<BotSession> {
  const db = await getDatabase();
  const sessionsCollection = db.collection<BotSession>("bot_sessions");

  // Try to find existing active session
  let session = await sessionsCollection.findOne({
    platformUserId,
    platform,
    expiresAt: { $gt: new Date() },
  });

  if (session) {
    // Update last interaction
    await sessionsCollection.updateOne(
      { _id: session._id },
      {
        $set: {
          lastInteraction: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
        },
      }
    );
    return session;
  }

  // Try to find client by platform ID
  const field = platform === "whatsapp" ? "whatsappId" : "instagramId";
  const client = await db.collection<Client>("clients").findOne({ [field]: platformUserId });

  // Create new session
  const newSession: BotSession = {
    platformUserId,
    platform,
    clientId: client?._id?.toString(),
    isAuthenticated: !!client,
    lastInteraction: new Date(),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  };

  const result = await sessionsCollection.insertOne(newSession);
  return { ...newSession, _id: result.insertedId };
}

// Log conversation
async function logMessage(
  session: BotSession,
  message: string,
  from: "client" | "bot",
  metadata?: Record<string, unknown>
) {
  const db = await getDatabase();

  await db.collection<Conversation>("conversations").updateOne(
    {
      platformUserId: session.platformUserId,
      platform: session.platform,
      status: "active",
    },
    {
      $push: {
        messages: {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          from,
          content: message,
          timestamp: new Date(),
          metadata,
        },
      },
      $set: { updatedAt: new Date() },
      $setOnInsert: {
        clientId: session.clientId || "",
        clientName: "",
        platform: session.platform,
        platformUserId: session.platformUserId,
        context: {},
        status: "active",
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
}

// Main message handler
export async function handleMessage(incoming: IncomingMessage): Promise<OutgoingMessage> {
  // Get or create session
  const session = await getOrCreateSession(incoming.platformUserId, incoming.platform);

  // Log incoming message
  const messageContent = incoming.payload || incoming.text || "";
  await logMessage(session, messageContent, "client");

  // Determine intent
  const intent = incoming.payload || detectIntent(messageContent);

  // Handle intent
  let response: CommandResponse;

  switch (intent) {
    case "GREETING":
    case "MENU":
      response = handleMainMenu();
      break;

    case "HELP":
      response = handleHelp();
      break;

    case "REMAINING_CLASSES":
      response = await handleRemainingClasses(session);
      break;

    case "MY_CLASSES":
      response = await handleUpcomingClasses(session);
      break;

    case "AVAILABLE_CLASSES":
      // Store current flow for number input
      await updateSessionFlow(session, "BOOK_CLASS", 1);
      response = await handleAvailableClasses(session);
      break;

    case "NUMBER_INPUT":
      // Check if we're in a flow
      if (session.currentFlow === "BOOK_CLASS") {
        const classIndex = parseInt(messageContent, 10);
        response = await handleBookClass(session, classIndex);
        await clearSessionFlow(session);
      } else if (session.currentFlow === "CANCEL_CLASS") {
        const bookings = session.flowData?.bookings as string[] | undefined;
        const bookingId = bookings?.[parseInt(messageContent, 10) - 1];
        if (bookingId) {
          response = await handleCancelClass(session, bookingId);
          await clearSessionFlow(session);
        } else {
          response = { text: "Invalid number. Please try again." };
        }
      } else {
        response = { text: "I didn't understand. Type 'menu' to see available options." };
      }
      break;

    case "CANCEL_CLASS":
      response = await startCancelFlow(session);
      break;

    case "RESCHEDULE":
      response = {
        text: "To reschedule a class, you need to cancel the current one and book a new one.\n\n" +
          "Would you like to see your scheduled classes to cancel?",
        buttons: [
          { text: "View my classes", payload: "MY_CLASSES" },
          { text: "Back to menu", payload: "MENU" },
        ],
      };
      break;

    case "INSTRUCTOR_SCHEDULE":
      // Extract instructor name
      const nameMatch = messageContent.match(/(?:instructor|teacher|coach)\s+(\w+)/i);
      if (nameMatch) {
        response = await handleInstructorSchedule(session, nameMatch[1]);
      } else {
        response = {
          text: "Please provide the instructor's name.\n\nExample: 'instructor Ana' or 'teacher John schedule'",
        };
      }
      break;

    case "SUPPORT":
      response = {
        text: "You will be connected to our support team.\n\n" +
          "Please describe your question or issue and one of our agents will respond shortly.",
        buttons: [{ text: "Back to menu", payload: "MENU" }],
      };
      // Flag for human handoff
      const supportDb = await getDatabase();
      await supportDb.collection("conversations").updateOne(
        { platformUserId: session.platformUserId, status: "active" },
        { $set: { "context.awaitingResponse": true, "context.currentIntent": "SUPPORT" } }
      );
      break;

    default:
      response = {
        text: "Sorry, I didn't understand your message.\n\nType 'help' to see available commands or 'menu' to return to the main menu.",
        quickReplies: ["Menu", "Help"],
      };
  }

  // Log bot response
  await logMessage(session, response.text, "bot");

  return {
    platform: incoming.platform,
    recipientId: incoming.platformUserId,
    ...response,
  };
}

// Helper to start cancel flow
async function startCancelFlow(session: BotSession): Promise<CommandResponse> {
  if (!session.clientId) {
    return {
      text: "You need to be registered to cancel classes.",
      buttons: [{ text: "Contact Support", payload: "SUPPORT" }],
    };
  }

  const db = await getDatabase();
  const now = new Date();

  const bookings = await db.collection("bookings")
    .find({
      clientId: session.clientId,
      scheduledDate: { $gte: now },
      status: "confirmed",
    })
    .sort({ scheduledDate: 1 })
    .toArray();

  if (bookings.length === 0) {
    return {
      text: "You don't have any scheduled classes to cancel.",
      quickReplies: ["Book class", "Main menu"],
    };
  }

  // Store bookings in flow data
  await updateSessionFlow(session, "CANCEL_CLASS", 1, {
    bookings: bookings.map(b => b._id?.toString()),
  });

  let message = "📅 *Your Scheduled Classes*\n\nWhich class would you like to cancel?\n\n";
  bookings.forEach((booking, index) => {
    const date = new Date(booking.scheduledDate).toLocaleDateString("en-US");
    message += `${index + 1}. *${booking.className}*\n`;
    message += `   📆 ${date} at ${booking.startTime}\n`;
    message += `   👩‍🏫 Instructor: ${booking.instructorName}\n\n`;
  });

  message += "Type the number of the class you want to cancel.";

  return {
    text: message,
    buttons: [{ text: "Back to menu", payload: "MENU" }],
  };
}

// Session flow helpers
async function updateSessionFlow(
  session: BotSession,
  flow: string,
  step: number,
  data?: Record<string, unknown>
) {
  const db = await getDatabase();
  await db.collection<BotSession>("bot_sessions").updateOne(
    { _id: session._id },
    {
      $set: {
        currentFlow: flow,
        flowStep: step,
        flowData: data || session.flowData,
      },
    }
  );
  session.currentFlow = flow;
  session.flowStep = step;
  if (data) session.flowData = data;
}

async function clearSessionFlow(session: BotSession) {
  const db = await getDatabase();
  await db.collection<BotSession>("bot_sessions").updateOne(
    { _id: session._id },
    { $unset: { currentFlow: "", flowStep: "", flowData: "" } }
  );
  delete session.currentFlow;
  delete session.flowStep;
  delete session.flowData;
}

