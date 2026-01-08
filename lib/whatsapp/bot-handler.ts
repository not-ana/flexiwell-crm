// WhatsApp Bot Handler - Core logic for handling conversations
// Now integrated with MongoDB database

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { Client, Class, Booking, BotSession } from "@/lib/db/schemas";
import {
  ConversationState,
  BotFlow,
  IncomingMessage,
  InteractiveContent,
  WhatsAppPlanFeatures,
  WHATSAPP_PLANS,
} from "./types";

interface ClientClass {
  id: string;
  name: string;
  date: string;
  time: string;
  instructor: string;
  confirmed: boolean;
  classId: string;
}

interface ClientData {
  id: string;
  name: string;
  phone: string;
  planName: string;
  classesRemaining: number;
  upcomingClasses: ClientClass[];
}

export class WhatsAppBotHandler {
  private establishmentId: string;
  private planFeatures: WhatsAppPlanFeatures;

  constructor(establishmentId: string, plan: string = "pro") {
    this.establishmentId = establishmentId;
    this.planFeatures = WHATSAPP_PLANS[plan] || WHATSAPP_PLANS.starter;
  }

  async handleMessage(message: IncomingMessage): Promise<InteractiveContent | { body: string }> {
    const phoneNumber = message.from;
    const client = await this.getClientByPhone(phoneNumber);

    if (!client) {
      return {
        body: "Ola! Nao encontrei seu cadastro. Por favor, entre em contato com a recepcao para vincular seu WhatsApp a sua conta.",
      };
    }

    let state = await this.getConversationState(phoneNumber);
    if (!state) {
      state = await this.createNewState(client.id, phoneNumber);
    }

    // Update last interaction
    await this.updateStateInteraction(phoneNumber);

    // Handle based on message type
    if (message.type === "text") {
      return this.handleTextMessage(message.text?.body || "", state, client);
    } else if (message.type === "interactive") {
      return this.handleInteractiveMessage(message, state, client);
    }

    return this.getMainMenu(client);
  }

  private async handleTextMessage(
    text: string,
    state: ConversationState,
    client: ClientData
  ): Promise<InteractiveContent | { body: string }> {
    const lowerText = text.toLowerCase().trim();

    // Quick commands
    if (lowerText === "menu" || lowerText === "inicio" || lowerText === "oi" || lowerText === "ola") {
      await this.updateStateFlow(state.phoneNumber, "main_menu");
      return this.getMainMenu(client);
    }

    if (lowerText === "aulas" || lowerText === "minhas aulas") {
      return this.handleViewClasses(client);
    }

    if (lowerText === "plano") {
      return this.handleViewPlan(client);
    }

    if (lowerText === "ajuda" || lowerText === "help") {
      return this.handleHelp();
    }

    // Handle number input for class selection
    const num = parseInt(lowerText);
    if (!isNaN(num) && num > 0) {
      if (state.currentFlow === "confirm_class") {
        return this.processConfirmClass(num, state, client);
      } else if (state.currentFlow === "cancel_class") {
        return this.processCancelClass(num, state, client);
      } else if (state.currentFlow === "book_class") {
        return this.processBookClass(num, state, client);
      }
    }

    // Natural language intents
    if (/agendar|disponive|quero\s*aula|marcar/.test(lowerText)) {
      await this.updateStateFlow(state.phoneNumber, "book_class");
      return this.getAvailableClasses(client);
    }

    if (/cancelar|desmarcar/.test(lowerText)) {
      await this.updateStateFlow(state.phoneNumber, "cancel_class");
      return this.getClassSelectionForCancel(client);
    }

    if (/confirmar|presenca/.test(lowerText)) {
      await this.updateStateFlow(state.phoneNumber, "confirm_class");
      return this.getClassSelectionForConfirm(client);
    }

    if (/quantas?\s*aulas?|restante|saldo/.test(lowerText)) {
      return this.handleViewPlan(client);
    }

    // Default: show menu
    return this.getMainMenu(client);
  }

  private async handleInteractiveMessage(
    message: IncomingMessage,
    state: ConversationState,
    client: ClientData
  ): Promise<InteractiveContent | { body: string }> {
    const replyId = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id;

    if (!replyId) {
      return this.getMainMenu(client);
    }

    // Main menu options
    switch (replyId) {
      case "view_classes":
        return this.handleViewClasses(client);

      case "confirm_class":
        if (!this.planFeatures.confirmClass) {
          return { body: "Esta funcionalidade nao esta disponivel no seu plano atual." };
        }
        await this.updateStateFlow(state.phoneNumber, "confirm_class");
        return this.getClassSelectionForConfirm(client);

      case "cancel_class":
        if (!this.planFeatures.cancelClass) {
          return { body: "Esta funcionalidade nao esta disponivel no seu plano atual." };
        }
        await this.updateStateFlow(state.phoneNumber, "cancel_class");
        return this.getClassSelectionForCancel(client);

      case "book_class":
        if (!this.planFeatures.bookNewClass) {
          return { body: "O agendamento por WhatsApp nao esta disponivel no seu plano." };
        }
        await this.updateStateFlow(state.phoneNumber, "book_class");
        return this.getAvailableClasses(client);

      case "view_plan":
        return this.handleViewPlan(client);

      case "talk_human":
        await this.updateStateFlow(state.phoneNumber, "talk_to_human");
        await this.flagForHumanHandoff(state.phoneNumber);
        return { body: "Um atendente ira responder em breve. Nosso horario de atendimento e de segunda a sexta, das 8h as 20h." };

      case "back_menu":
        await this.updateStateFlow(state.phoneNumber, "main_menu");
        return this.getMainMenu(client);

      default:
        // Handle class-specific actions
        if (replyId.startsWith("confirm_")) {
          const classId = replyId.replace("confirm_", "");
          return this.confirmClass(classId, client);
        }
        if (replyId.startsWith("cancel_")) {
          const classId = replyId.replace("cancel_", "");
          return this.cancelClass(classId, client);
        }
        if (replyId.startsWith("book_")) {
          const classId = replyId.replace("book_", "");
          return this.bookClass(classId, client);
        }

        return this.getMainMenu(client);
    }
  }

  private getMainMenu(client: ClientData): InteractiveContent {
    const pendingClasses = client.upcomingClasses.filter(c => !c.confirmed).length;

    const buttons: Array<{ type: "reply"; reply: { id: string; title: string } }> = [
      { type: "reply", reply: { id: "view_classes", title: "Minhas Aulas" } },
    ];

    if (this.planFeatures.bookNewClass) {
      buttons.push({ type: "reply", reply: { id: "book_class", title: "Agendar Aula" } });
    }

    buttons.push({ type: "reply", reply: { id: "talk_human", title: "Atendimento" } });

    return {
      type: "button",
      header: { type: "text", text: "FlexiWell" },
      body: {
        text: `Ola ${client.name}! Como posso ajudar?\n\n${
          pendingClasses > 0
            ? `Voce tem ${pendingClasses} aula(s) pendente(s) de confirmacao.`
            : "Todas as suas aulas estao confirmadas!"
        }\n\nAulas restantes: ${client.classesRemaining}`,
      },
      footer: { text: "Digite 'menu' a qualquer momento para voltar" },
      action: { buttons },
    };
  }

  private async handleViewClasses(client: ClientData): Promise<InteractiveContent> {
    // Refresh client data
    const freshClient = await this.getClientByPhone(client.phone);
    if (!freshClient) {
      return {
        type: "button",
        body: { text: "Erro ao buscar suas aulas." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Voltar" } }],
        },
      };
    }

    if (freshClient.upcomingClasses.length === 0) {
      return {
        type: "button",
        body: { text: "Voce nao tem aulas agendadas no momento.\n\nQue tal agendar uma?" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "book_class", title: "Agendar Aula" } },
            { type: "reply", reply: { id: "back_menu", title: "Voltar" } },
          ],
        },
      };
    }

    const classesText = freshClient.upcomingClasses
      .map((c, i) => `${i + 1}. ${c.name}\n   ${c.date} as ${c.time}\n   Prof. ${c.instructor}\n   ${c.confirmed ? "Confirmada" : "Pendente"}`)
      .join("\n\n");

    const buttons: Array<{ type: "reply"; reply: { id: string; title: string } }> = [];

    const pendingClasses = freshClient.upcomingClasses.filter(c => !c.confirmed);
    if (pendingClasses.length > 0 && this.planFeatures.confirmClass) {
      buttons.push({ type: "reply", reply: { id: "confirm_class", title: "Confirmar" } });
    }

    if (this.planFeatures.cancelClass) {
      buttons.push({ type: "reply", reply: { id: "cancel_class", title: "Cancelar" } });
    }

    buttons.push({ type: "reply", reply: { id: "back_menu", title: "Menu" } });

    return {
      type: "button",
      header: { type: "text", text: "Suas Proximas Aulas" },
      body: { text: classesText },
      action: { buttons },
    };
  }

  private async getAvailableClasses(client: ClientData): Promise<InteractiveContent> {
    const db = await getDatabase();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const classes = await db.collection<Class>("classes")
      .find({
        scheduledDate: { $gte: now, $lte: nextWeek },
        status: "scheduled",
        $expr: { $lt: ["$currentEnrollment", "$maxCapacity"] },
      })
      .sort({ scheduledDate: 1 })
      .limit(5)
      .toArray();

    if (classes.length === 0) {
      return {
        type: "button",
        body: { text: "Nao ha aulas disponiveis nos proximos 7 dias." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Voltar" } }],
        },
      };
    }

    let message = "Aulas disponiveis:\n\n";
    classes.forEach((cls, index) => {
      const date = new Date(cls.scheduledDate).toLocaleDateString("pt-BR");
      const spotsLeft = cls.maxCapacity - cls.currentEnrollment;
      message += `${index + 1}. ${cls.title}\n`;
      message += `   ${date} as ${cls.startTime}\n`;
      message += `   Prof. ${cls.instructorName}\n`;
      message += `   ${spotsLeft} vagas\n\n`;
    });

    message += "Digite o numero da aula para agendar.";

    // Store class IDs in session for later reference
    const classIds = classes.map(c => c._id?.toString() || "");
    await this.storeFlowData(client.phone, { availableClassIds: classIds });

    return {
      type: "button",
      body: { text: message },
      action: {
        buttons: [{ type: "reply", reply: { id: "back_menu", title: "Voltar" } }],
      },
    };
  }

  private getClassSelectionForConfirm(client: ClientData): InteractiveContent {
    const pendingClasses = client.upcomingClasses.filter(c => !c.confirmed);

    if (pendingClasses.length === 0) {
      return {
        type: "button",
        body: { text: "Todas as suas aulas ja estao confirmadas!" },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Menu" } }],
        },
      };
    }

    let message = "Qual aula deseja confirmar?\n\n";
    pendingClasses.forEach((c, i) => {
      message += `${i + 1}. ${c.name}\n   ${c.date} as ${c.time}\n\n`;
    });
    message += "Digite o numero da aula.";

    return {
      type: "button",
      body: { text: message },
      action: {
        buttons: [{ type: "reply", reply: { id: "back_menu", title: "Voltar" } }],
      },
    };
  }

  private getClassSelectionForCancel(client: ClientData): InteractiveContent {
    if (client.upcomingClasses.length === 0) {
      return {
        type: "button",
        body: { text: "Voce nao tem aulas para cancelar." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Menu" } }],
        },
      };
    }

    let message = "Cancelamentos com menos de 24h podem ser cobrados.\n\nQual aula deseja cancelar?\n\n";
    client.upcomingClasses.forEach((c, i) => {
      message += `${i + 1}. ${c.name}\n   ${c.date} as ${c.time}\n\n`;
    });
    message += "Digite o numero da aula.";

    return {
      type: "button",
      body: { text: message },
      action: {
        buttons: [{ type: "reply", reply: { id: "back_menu", title: "Voltar" } }],
      },
    };
  }

  private async processConfirmClass(
    num: number,
    state: ConversationState,
    client: ClientData
  ): Promise<InteractiveContent | { body: string }> {
    const pendingClasses = client.upcomingClasses.filter(c => !c.confirmed);

    if (num < 1 || num > pendingClasses.length) {
      return { body: "Numero invalido. Por favor, tente novamente." };
    }

    const selectedClass = pendingClasses[num - 1];
    return this.confirmClass(selectedClass.id, client);
  }

  private async processCancelClass(
    num: number,
    state: ConversationState,
    client: ClientData
  ): Promise<InteractiveContent | { body: string }> {
    if (num < 1 || num > client.upcomingClasses.length) {
      return { body: "Numero invalido. Por favor, tente novamente." };
    }

    const selectedClass = client.upcomingClasses[num - 1];
    return this.cancelClass(selectedClass.id, client);
  }

  private async processBookClass(
    num: number,
    state: ConversationState,
    client: ClientData
  ): Promise<InteractiveContent | { body: string }> {
    const db = await getDatabase();

    // Get flow data with available class IDs
    const session = await db.collection<BotSession>("bot_sessions").findOne({
      platformUserId: state.phoneNumber,
      platform: "whatsapp",
    });

    const classIds = session?.flowData?.availableClassIds as string[] | undefined;

    if (!classIds || num < 1 || num > classIds.length) {
      return { body: "Numero invalido. Por favor, tente novamente." };
    }

    const classId = classIds[num - 1];
    return this.bookClass(classId, client);
  }

  private async confirmClass(bookingId: string, client: ClientData): Promise<InteractiveContent> {
    const db = await getDatabase();

    // Find the booking
    const booking = await db.collection<Booking>("bookings").findOne({
      _id: new ObjectId(bookingId),
      clientId: client.id,
    });

    if (!booking) {
      return {
        type: "button",
        body: { text: "Aula nao encontrada." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Menu" } }],
        },
      };
    }

    // Update booking status
    await db.collection("bookings").updateOne(
      { _id: new ObjectId(bookingId) },
      { $set: { status: "confirmed", updatedAt: new Date() } }
    );

    const date = new Date(booking.scheduledDate).toLocaleDateString("pt-BR");

    return {
      type: "button",
      header: { type: "text", text: "Presenca Confirmada!" },
      body: {
        text: `Sua presenca foi confirmada:\n\n${booking.className}\n${date} as ${booking.startTime}\nProf. ${booking.instructorName}\n\nTe esperamos!`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "view_classes", title: "Ver Aulas" } },
          { type: "reply", reply: { id: "back_menu", title: "Menu" } },
        ],
      },
    };
  }

  private async cancelClass(bookingId: string, client: ClientData): Promise<InteractiveContent> {
    const db = await getDatabase();

    // Find the booking
    const booking = await db.collection<Booking>("bookings").findOne({
      _id: new ObjectId(bookingId),
      clientId: client.id,
    });

    if (!booking) {
      return {
        type: "button",
        body: { text: "Aula nao encontrada." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Menu" } }],
        },
      };
    }

    // Check 24h policy
    const classDate = new Date(booking.scheduledDate);
    const now = new Date();
    const hoursUntilClass = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilClass < 24) {
      return {
        type: "button",
        body: {
          text: `Cancelamentos devem ser feitos com pelo menos 24 horas de antecedencia.\n\nFaltam apenas ${Math.round(hoursUntilClass)} horas para sua aula.\n\nDeseja falar com um atendente?`,
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "talk_human", title: "Falar com Atendente" } },
            { type: "reply", reply: { id: "back_menu", title: "Voltar" } },
          ],
        },
      };
    }

    // Cancel booking
    await db.collection("bookings").updateOne(
      { _id: new ObjectId(bookingId) },
      { $set: { status: "cancelled", updatedAt: new Date() } }
    );

    // Update class enrollment
    await db.collection("classes").updateOne(
      { _id: new ObjectId(booking.classId) },
      {
        $inc: { currentEnrollment: -1 },
      }
    );

    // Restore client's class credit
    await db.collection("clients").updateOne(
      { _id: new ObjectId(client.id) },
      {
        $inc: { "plan.usedClasses": -1, "plan.remainingClasses": 1 },
      }
    );

    return {
      type: "button",
      header: { type: "text", text: "Aula Cancelada" },
      body: {
        text: `Sua aula foi cancelada:\n\n${booking.className}\n\nSua aula foi restaurada ao seu pacote.`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "book_class", title: "Agendar Nova" } },
          { type: "reply", reply: { id: "back_menu", title: "Menu" } },
        ],
      },
    };
  }

  private async bookClass(classId: string, client: ClientData): Promise<InteractiveContent> {
    const db = await getDatabase();

    // Check if client has remaining classes
    if (client.classesRemaining <= 0) {
      return {
        type: "button",
        body: {
          text: "Voce nao tem mais aulas disponiveis no seu plano atual. Entre em contato para renovar.",
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "talk_human", title: "Falar com Atendente" } },
            { type: "reply", reply: { id: "back_menu", title: "Menu" } },
          ],
        },
      };
    }

    // Get class info
    const classInfo = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classInfo) {
      return {
        type: "button",
        body: { text: "Aula nao encontrada." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Menu" } }],
        },
      };
    }

    // Check capacity
    if (classInfo.currentEnrollment >= classInfo.maxCapacity) {
      return {
        type: "button",
        body: { text: "Esta aula esta lotada. Deseja entrar na lista de espera?" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "talk_human", title: "Lista de Espera" } },
            { type: "reply", reply: { id: "back_menu", title: "Voltar" } },
          ],
        },
      };
    }

    // Check if already enrolled
    const existingBooking = await db.collection<Booking>("bookings").findOne({
      clientId: client.id,
      classId: classId,
      status: { $in: ["confirmed", "pending"] },
    });

    if (existingBooking) {
      return {
        type: "button",
        body: { text: "Voce ja esta inscrito nesta aula." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Menu" } }],
        },
      };
    }

    // Get full client info
    const fullClient = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(client.id),
    });

    // Create booking
    const booking: Omit<Booking, "_id"> = {
      clientId: client.id,
      clientName: client.name,
      classId: classId,
      className: classInfo.title,
      instructorId: classInfo.instructorId,
      instructorName: classInfo.instructorName,
      scheduledDate: classInfo.scheduledDate,
      startTime: classInfo.startTime,
      endTime: classInfo.endTime,
      status: "confirmed",
      source: "bot",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("bookings").insertOne(booking);

    // Update class enrollment count
    await db.collection("classes").updateOne(
      { _id: new ObjectId(classId) },
      { $inc: { currentEnrollment: 1 } }
    );

    // Add client to enrolled list
    const enrolledClient = {
      clientId: client.id,
      clientName: client.name,
      status: "confirmed" as const,
      enrolledAt: new Date(),
    };
    await db.collection("classes").updateOne(
      { _id: new ObjectId(classId) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $push: { enrolledClients: enrolledClient } } as any
    );

    // Update client's remaining classes
    await db.collection("clients").updateOne(
      { _id: new ObjectId(client.id) },
      {
        $inc: { "plan.usedClasses": 1, "plan.remainingClasses": -1 },
      }
    );

    const date = new Date(classInfo.scheduledDate).toLocaleDateString("pt-BR");

    return {
      type: "button",
      header: { type: "text", text: "Aula Agendada!" },
      body: {
        text: `Sua aula foi agendada com sucesso!\n\n${classInfo.title}\n${date} as ${classInfo.startTime}\nProf. ${classInfo.instructorName}\n\nVoce tem ${client.classesRemaining - 1} aulas restantes.`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "view_classes", title: "Ver Aulas" } },
          { type: "reply", reply: { id: "back_menu", title: "Menu" } },
        ],
      },
    };
  }

  private handleViewPlan(client: ClientData): InteractiveContent {
    return {
      type: "button",
      header: { type: "text", text: "Seu Plano" },
      body: {
        text: `*${client.planName}*\n\nAulas restantes: *${client.classesRemaining}*\n\nPara mais detalhes ou alterar seu plano, fale com nossa equipe.`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "back_menu", title: "Menu" } },
        ],
      },
    };
  }

  private handleHelp(): InteractiveContent {
    return {
      type: "button",
      header: { type: "text", text: "Ajuda" },
      body: {
        text: `Comandos disponiveis:\n\n` +
          `*"menu"* - Menu principal\n` +
          `*"aulas"* - Ver suas aulas\n` +
          `*"agendar"* - Agendar nova aula\n` +
          `*"cancelar"* - Cancelar aula\n` +
          `*"confirmar"* - Confirmar presenca\n` +
          `*"plano"* - Ver seu plano\n` +
          `*"ajuda"* - Esta mensagem`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "back_menu", title: "Menu" } },
        ],
      },
    };
  }

  // Database helper methods
  private async getClientByPhone(phone: string): Promise<ClientData | null> {
    const db = await getDatabase();

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, "");

    const client = await db.collection<Client>("clients").findOne({
      $or: [
        { phone: normalizedPhone },
        { phone: `+${normalizedPhone}` },
        { phone: { $regex: normalizedPhone.slice(-9) } },
      ],
    });

    if (!client) {
      return null;
    }

    // Get upcoming bookings
    const now = new Date();
    const bookings = await db.collection<Booking>("bookings")
      .find({
        clientId: client._id?.toString(),
        scheduledDate: { $gte: now },
        status: { $in: ["confirmed", "pending"] },
      })
      .sort({ scheduledDate: 1 })
      .limit(10)
      .toArray();

    const upcomingClasses: ClientClass[] = bookings.map(b => ({
      id: b._id?.toString() || "",
      classId: b.classId,
      name: b.className,
      date: new Date(b.scheduledDate).toLocaleDateString("pt-BR"),
      time: b.startTime,
      instructor: b.instructorName,
      confirmed: b.status === "confirmed",
    }));

    return {
      id: client._id?.toString() || "",
      name: client.name,
      phone: normalizedPhone,
      planName: client.plan.type || "Plano",
      classesRemaining: client.plan.remainingClasses || 0,
      upcomingClasses,
    };
  }

  private async getConversationState(phoneNumber: string): Promise<ConversationState | null> {
    const db = await getDatabase();
    const session = await db.collection<BotSession>("bot_sessions").findOne({
      platformUserId: phoneNumber,
      platform: "whatsapp",
      expiresAt: { $gt: new Date() },
    });

    if (!session) return null;

    return {
      clientId: session.clientId || "",
      phoneNumber,
      currentFlow: (session.currentFlow as BotFlow) || "main_menu",
      step: session.flowStep || 0,
      data: session.flowData || {},
      lastInteraction: session.lastInteraction,
    };
  }

  private async createNewState(clientId: string, phoneNumber: string): Promise<ConversationState> {
    const db = await getDatabase();

    const session: BotSession = {
      platformUserId: phoneNumber,
      platform: "whatsapp",
      clientId,
      isAuthenticated: true,
      currentFlow: "main_menu",
      flowStep: 0,
      flowData: {},
      lastInteraction: new Date(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    };

    await db.collection("bot_sessions").insertOne(session);

    return {
      clientId,
      phoneNumber,
      currentFlow: "main_menu",
      step: 0,
      data: {},
      lastInteraction: new Date(),
    };
  }

  private async updateStateInteraction(phoneNumber: string): Promise<void> {
    const db = await getDatabase();
    await db.collection("bot_sessions").updateOne(
      { platformUserId: phoneNumber, platform: "whatsapp" },
      {
        $set: {
          lastInteraction: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      }
    );
  }

  private async updateStateFlow(phoneNumber: string, flow: string): Promise<void> {
    const db = await getDatabase();
    await db.collection("bot_sessions").updateOne(
      { platformUserId: phoneNumber, platform: "whatsapp" },
      { $set: { currentFlow: flow } }
    );
  }

  private async storeFlowData(phoneNumber: string, data: Record<string, unknown>): Promise<void> {
    const db = await getDatabase();
    await db.collection("bot_sessions").updateOne(
      { platformUserId: phoneNumber, platform: "whatsapp" },
      { $set: { flowData: data } }
    );
  }

  private async flagForHumanHandoff(phoneNumber: string): Promise<void> {
    const db = await getDatabase();
    await db.collection("conversations").updateOne(
      { platformUserId: phoneNumber, platform: "whatsapp", status: "active" },
      {
        $set: {
          "context.awaitingHumanResponse": true,
          "context.handoffRequestedAt": new Date(),
        },
      },
      { upsert: true }
    );
  }
}

// Message templates for proactive notifications
export const MESSAGE_TEMPLATES = {
  classReminder: {
    name: "class_reminder_24h",
    language: { code: "pt_BR" },
    components: [
      {
        type: "body" as const,
        parameters: [
          { type: "text" as const, text: "{{1}}" }, // client name
          { type: "text" as const, text: "{{2}}" }, // class name
          { type: "text" as const, text: "{{3}}" }, // date
          { type: "text" as const, text: "{{4}}" }, // time
        ],
      },
    ],
  },

  confirmationRequest: {
    name: "confirmation_request",
    language: { code: "pt_BR" },
    components: [
      {
        type: "body" as const,
        parameters: [
          { type: "text" as const, text: "{{1}}" }, // client name
          { type: "text" as const, text: "{{2}}" }, // class name
          { type: "text" as const, text: "{{3}}" }, // date/time
        ],
      },
    ],
  },

  waitlistNotification: {
    name: "waitlist_spot_available",
    language: { code: "pt_BR" },
    components: [
      {
        type: "body" as const,
        parameters: [
          { type: "text" as const, text: "{{1}}" }, // client name
          { type: "text" as const, text: "{{2}}" }, // class name
          { type: "text" as const, text: "{{3}}" }, // date/time
        ],
      },
    ],
  },

  bookingConfirmation: {
    name: "booking_confirmed",
    language: { code: "pt_BR" },
    components: [
      {
        type: "body" as const,
        parameters: [
          { type: "text" as const, text: "{{1}}" }, // client name
          { type: "text" as const, text: "{{2}}" }, // class name
          { type: "text" as const, text: "{{3}}" }, // date
          { type: "text" as const, text: "{{4}}" }, // time
          { type: "text" as const, text: "{{5}}" }, // instructor
        ],
      },
    ],
  },
};
