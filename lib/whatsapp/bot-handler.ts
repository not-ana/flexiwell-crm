// WhatsApp Bot Handler - Core logic for handling conversations

import {
  ConversationState,
  BotFlow,
  IncomingMessage,
  InteractiveContent,
  WhatsAppPlanFeatures,
  WHATSAPP_PLANS,
} from "./types";

// Mock data - in production, this would come from your database
interface ClientClass {
  id: string;
  name: string;
  date: string;
  time: string;
  instructor: string;
  confirmed: boolean;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  planName: string;
  classesRemaining: number;
  upcomingClasses: ClientClass[];
}

// Simulated database
const mockClients: Record<string, Client> = {
  "5521999990000": {
    id: "1",
    name: "Maria",
    phone: "5521999990000",
    planName: "Premium Monthly",
    classesRemaining: 8,
    upcomingClasses: [
      { id: "c1", name: "Morning Pilates", date: "27/12", time: "09:00", instructor: "Ana", confirmed: false },
      { id: "c2", name: "Yoga Flow", date: "28/12", time: "16:00", instructor: "Julia", confirmed: false },
      { id: "c3", name: "Reformer", date: "29/12", time: "10:00", instructor: "Ana", confirmed: true },
    ],
  },
};

// Conversation state management (in production, use Redis or database)
const conversationStates: Map<string, ConversationState> = new Map();

export class WhatsAppBotHandler {
  private establishmentId: string;
  private planFeatures: WhatsAppPlanFeatures;

  constructor(establishmentId: string, plan: string = "pro") {
    this.establishmentId = establishmentId;
    this.planFeatures = WHATSAPP_PLANS[plan] || WHATSAPP_PLANS.starter;
  }

  async handleMessage(message: IncomingMessage): Promise<InteractiveContent | { body: string }> {
    const phoneNumber = message.from;
    const client = this.getClientByPhone(phoneNumber);

    if (!client) {
      return {
        body: "Olá! Não encontrei seu cadastro. Por favor, entre em contato com a recepção para vincular seu WhatsApp à sua conta.",
      };
    }

    let state = conversationStates.get(phoneNumber);
    if (!state) {
      state = this.createNewState(client.id, phoneNumber);
      conversationStates.set(phoneNumber, state);
    }

    // Update last interaction
    state.lastInteraction = new Date();

    // Handle based on message type
    if (message.type === "text") {
      return this.handleTextMessage(message.text?.body || "", state, client);
    } else if (message.type === "interactive") {
      return this.handleInteractiveMessage(message, state, client);
    }

    return this.getMainMenu(client);
  }

  private handleTextMessage(
    text: string,
    state: ConversationState,
    client: Client
  ): InteractiveContent | { body: string } {
    const lowerText = text.toLowerCase().trim();

    // Quick commands
    if (lowerText === "menu" || lowerText === "início" || lowerText === "oi" || lowerText === "olá") {
      state.currentFlow = "main_menu";
      return this.getMainMenu(client);
    }

    if (lowerText === "aulas" || lowerText === "minhas aulas") {
      return this.handleViewClasses(client);
    }

    if (lowerText === "plano") {
      return this.handleViewPlan(client);
    }

    // If in a specific flow, handle accordingly
    switch (state.currentFlow) {
      case "confirm_class":
        return this.processConfirmClass(text, state, client);
      case "cancel_class":
        return this.processCancelClass(text, state, client);
      default:
        return this.getMainMenu(client);
    }
  }

  private handleInteractiveMessage(
    message: IncomingMessage,
    state: ConversationState,
    client: Client
  ): InteractiveContent | { body: string } {
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
          return { body: "Esta funcionalidade não está disponível no seu plano atual. Entre em contato para fazer upgrade!" };
        }
        state.currentFlow = "confirm_class";
        return this.getClassSelectionForConfirm(client);

      case "cancel_class":
        if (!this.planFeatures.cancelClass) {
          return { body: "Esta funcionalidade não está disponível no seu plano atual. Entre em contato para fazer upgrade!" };
        }
        state.currentFlow = "cancel_class";
        return this.getClassSelectionForCancel(client);

      case "book_class":
        if (!this.planFeatures.bookNewClass) {
          return { body: "O agendamento por WhatsApp não está disponível no seu plano. Entre em contato para fazer upgrade!" };
        }
        state.currentFlow = "book_class";
        return { body: "🗓️ Para agendar uma nova aula, acesse nosso app ou entre em contato com a recepção." };

      case "view_plan":
        return this.handleViewPlan(client);

      case "talk_human":
        state.currentFlow = "talk_to_human";
        return { body: "👋 Um atendente irá responder em breve. Nosso horário de atendimento é de segunda a sexta, das 8h às 20h." };

      case "back_menu":
        state.currentFlow = "main_menu";
        return this.getMainMenu(client);

      default:
        // Handle class-specific actions
        if (replyId.startsWith("confirm_")) {
          return this.confirmClass(replyId.replace("confirm_", ""), client);
        }
        if (replyId.startsWith("cancel_")) {
          return this.cancelClass(replyId.replace("cancel_", ""), client);
        }

        return this.getMainMenu(client);
    }
  }

  private getMainMenu(client: Client): InteractiveContent {
    const pendingClasses = client.upcomingClasses.filter(c => !c.confirmed).length;

    const buttons: Array<{ type: "reply"; reply: { id: string; title: string } }> = [
      { type: "reply", reply: { id: "view_classes", title: "📅 Minhas Aulas" } },
    ];

    if (this.planFeatures.confirmClass && pendingClasses > 0) {
      buttons.push({ type: "reply", reply: { id: "confirm_class", title: "✅ Confirmar" } });
    }

    buttons.push({ type: "reply", reply: { id: "talk_human", title: "💬 Atendimento" } });

    return {
      type: "button",
      header: { type: "text", text: "🧘 FlexiWell" },
      body: {
        text: `Olá ${client.name}! Como posso ajudar?\n\n${
          pendingClasses > 0 ? `📌 Você tem ${pendingClasses} aula(s) pendente(s) de confirmação.` : "✨ Todas as suas aulas estão confirmadas!"
        }`,
      },
      footer: { text: "Digite 'menu' a qualquer momento para voltar" },
      action: { buttons },
    };
  }

  private handleViewClasses(client: Client): InteractiveContent {
    if (client.upcomingClasses.length === 0) {
      return {
        type: "button",
        body: { text: "Você não tem aulas agendadas no momento.\n\nQue tal agendar uma?" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "book_class", title: "📅 Agendar Aula" } },
            { type: "reply", reply: { id: "back_menu", title: "⬅️ Voltar" } },
          ],
        },
      };
    }

    const classesText = client.upcomingClasses
      .map((c, i) => `${i + 1}. ${c.name}\n   📅 ${c.date} às ${c.time}\n   👩‍🏫 ${c.instructor}\n   ${c.confirmed ? "✅ Confirmada" : "⏳ Pendente"}`)
      .join("\n\n");

    return {
      type: "button",
      header: { type: "text", text: "📅 Suas Próximas Aulas" },
      body: { text: classesText },
      action: {
        buttons: [
          { type: "reply", reply: { id: "confirm_class", title: "✅ Confirmar" } },
          { type: "reply", reply: { id: "back_menu", title: "⬅️ Menu" } },
        ],
      },
    };
  }

  private getClassSelectionForConfirm(client: Client): InteractiveContent {
    const pendingClasses = client.upcomingClasses.filter(c => !c.confirmed);

    if (pendingClasses.length === 0) {
      return {
        type: "button",
        body: { text: "✨ Todas as suas aulas já estão confirmadas!" },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "⬅️ Menu" } }],
        },
      };
    }

    const buttons = pendingClasses.slice(0, 3).map(c => ({
      type: "reply" as const,
      reply: { id: `confirm_${c.id}`, title: `${c.date} ${c.time}` },
    }));

    return {
      type: "button",
      header: { type: "text", text: "✅ Confirmar Presença" },
      body: { text: "Selecione a aula que deseja confirmar:" },
      action: { buttons },
    };
  }

  private getClassSelectionForCancel(client: Client): InteractiveContent {
    const confirmedClasses = client.upcomingClasses.filter(c => c.confirmed);

    if (confirmedClasses.length === 0) {
      return {
        type: "button",
        body: { text: "Você não tem aulas confirmadas para cancelar." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "⬅️ Menu" } }],
        },
      };
    }

    const buttons = confirmedClasses.slice(0, 3).map(c => ({
      type: "reply" as const,
      reply: { id: `cancel_${c.id}`, title: `${c.date} ${c.time}` },
    }));

    return {
      type: "button",
      header: { type: "text", text: "❌ Cancelar Aula" },
      body: { text: "⚠️ Cancelamentos com menos de 24h podem ser cobrados.\n\nSelecione a aula:" },
      action: { buttons },
    };
  }

  private confirmClass(classId: string, client: Client): InteractiveContent {
    const classToConfirm = client.upcomingClasses.find(c => c.id === classId);

    if (!classToConfirm) {
      return {
        type: "button",
        body: { text: "Aula não encontrada." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "⬅️ Menu" } }],
        },
      };
    }

    // In production, update database here
    classToConfirm.confirmed = true;

    return {
      type: "button",
      header: { type: "text", text: "✅ Presença Confirmada!" },
      body: {
        text: `Sua presença foi confirmada:\n\n📅 ${classToConfirm.name}\n🗓️ ${classToConfirm.date} às ${classToConfirm.time}\n👩‍🏫 ${classToConfirm.instructor}\n\nTe esperamos! 🧘`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "view_classes", title: "📅 Ver Aulas" } },
          { type: "reply", reply: { id: "back_menu", title: "⬅️ Menu" } },
        ],
      },
    };
  }

  private cancelClass(classId: string, client: Client): InteractiveContent {
    const classToCancel = client.upcomingClasses.find(c => c.id === classId);

    if (!classToCancel) {
      return {
        type: "button",
        body: { text: "Aula não encontrada." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "⬅️ Menu" } }],
        },
      };
    }

    // In production, update database here
    const index = client.upcomingClasses.indexOf(classToCancel);
    client.upcomingClasses.splice(index, 1);

    return {
      type: "button",
      header: { type: "text", text: "❌ Aula Cancelada" },
      body: {
        text: `Sua aula foi cancelada:\n\n📅 ${classToCancel.name}\n🗓️ ${classToCancel.date} às ${classToCancel.time}\n\nVocê pode reagendar quando quiser!`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "book_class", title: "📅 Agendar Nova" } },
          { type: "reply", reply: { id: "back_menu", title: "⬅️ Menu" } },
        ],
      },
    };
  }

  private handleViewPlan(client: Client): InteractiveContent {
    return {
      type: "button",
      header: { type: "text", text: "📋 Seu Plano" },
      body: {
        text: `*${client.planName}*\n\n📊 Aulas restantes: *${client.classesRemaining}*\n\nPara mais detalhes ou alterar seu plano, acesse o app ou fale com a recepção.`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "back_menu", title: "⬅️ Menu" } },
        ],
      },
    };
  }

  private processConfirmClass(text: string, state: ConversationState, client: Client): InteractiveContent | { body: string } {
    // Handle text-based class selection
    const num = parseInt(text);
    if (!isNaN(num) && num > 0 && num <= client.upcomingClasses.length) {
      const selectedClass = client.upcomingClasses[num - 1];
      return this.confirmClass(selectedClass.id, client);
    }
    return this.getClassSelectionForConfirm(client);
  }

  private processCancelClass(text: string, state: ConversationState, client: Client): InteractiveContent | { body: string } {
    const num = parseInt(text);
    if (!isNaN(num) && num > 0 && num <= client.upcomingClasses.length) {
      const selectedClass = client.upcomingClasses[num - 1];
      return this.cancelClass(selectedClass.id, client);
    }
    return this.getClassSelectionForCancel(client);
  }

  private getClientByPhone(phone: string): Client | null {
    return mockClients[phone] || null;
  }

  private createNewState(clientId: string, phoneNumber: string): ConversationState {
    return {
      clientId,
      phoneNumber,
      currentFlow: "main_menu",
      step: 0,
      data: {},
      lastInteraction: new Date(),
    };
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

  classCancelled: {
    name: "class_cancelled_notice",
    language: { code: "pt_BR" },
    components: [
      {
        type: "body" as const,
        parameters: [
          { type: "text" as const, text: "{{1}}" }, // client name
          { type: "text" as const, text: "{{2}}" }, // class name
          { type: "text" as const, text: "{{3}}" }, // reason
        ],
      },
    ],
  },
};
