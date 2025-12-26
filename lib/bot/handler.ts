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
  return { ...newSession, _id: result.insertedId.toString() };
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
        const bookingId = session.flowData?.bookings?.[parseInt(messageContent, 10) - 1];
        if (bookingId) {
          response = await handleCancelClass(session, bookingId);
          await clearSessionFlow(session);
        } else {
          response = { text: "Número inválido. Por favor, tente novamente." };
        }
      } else {
        response = { text: "Não entendi. Digite 'menu' para ver as opções disponíveis." };
      }
      break;

    case "CANCEL_CLASS":
      response = await startCancelFlow(session);
      break;

    case "RESCHEDULE":
      response = {
        text: "Para reagendar uma aula, você precisa cancelar a aula atual e agendar uma nova.\n\n" +
          "Deseja ver suas aulas agendadas para cancelar?",
        buttons: [
          { text: "Ver minhas aulas", payload: "MY_CLASSES" },
          { text: "Voltar ao menu", payload: "MENU" },
        ],
      };
      break;

    case "INSTRUCTOR_SCHEDULE":
      // Extract instructor name
      const nameMatch = messageContent.match(/(?:professor[a]?|prof\.?|instrutor[a]?)\s+(\w+)/i);
      if (nameMatch) {
        response = await handleInstructorSchedule(session, nameMatch[1]);
      } else {
        response = {
          text: "Por favor, informe o nome do instrutor.\n\nExemplo: 'horário da Ana' ou 'agenda do professor João'",
        };
      }
      break;

    case "SUPPORT":
      response = {
        text: "Você será direcionado para nosso suporte.\n\n" +
          "Por favor, descreva sua dúvida ou problema que um de nossos atendentes irá responder em breve.",
        buttons: [{ text: "Voltar ao menu", payload: "MENU" }],
      };
      // Flag for human handoff
      await db.collection("conversations").updateOne(
        { platformUserId: session.platformUserId, status: "active" },
        { $set: { "context.awaitingResponse": true, "context.currentIntent": "SUPPORT" } }
      );
      break;

    default:
      response = {
        text: "Desculpe, não entendi sua mensagem. 😅\n\nDigite 'ajuda' para ver os comandos disponíveis ou 'menu' para voltar ao menu principal.",
        quickReplies: ["Menu", "Ajuda"],
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
      text: "Você precisa estar cadastrado para cancelar aulas.",
      buttons: [{ text: "Falar com Suporte", payload: "SUPPORT" }],
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
      text: "Você não tem aulas agendadas para cancelar.",
      quickReplies: ["Agendar aula", "Menu principal"],
    };
  }

  // Store bookings in flow data
  await updateSessionFlow(session, "CANCEL_CLASS", 1, {
    bookings: bookings.map(b => b._id?.toString()),
  });

  let message = "📅 *Suas aulas agendadas*\n\nQual aula deseja cancelar?\n\n";
  bookings.forEach((booking, index) => {
    const date = new Date(booking.scheduledDate).toLocaleDateString("pt-BR");
    message += `${index + 1}. *${booking.className}*\n`;
    message += `   📆 ${date} às ${booking.startTime}\n`;
    message += `   👩‍🏫 Prof. ${booking.instructorName}\n\n`;
  });

  message += "Digite o número da aula que deseja cancelar.";

  return {
    text: message,
    buttons: [{ text: "Voltar ao menu", payload: "MENU" }],
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

// Access db in support handler
const db = await getDatabase();
