// WhatsApp Bot Handler - Core logic for handling conversations
// Now integrated with MongoDB database

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { Client, Class, Booking, BotSession, EstablishmentWhatsAppCredentials, BotMenuCommand } from "@/lib/db/schemas";
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

// Default bot commands when none are configured
const DEFAULT_BOT_COMMANDS: BotMenuCommand[] = [
  { id: "1", trigger: "1", label: "📅 My Classes", action: "MY_BOOKINGS", enabled: true, order: 1 },
  { id: "2", trigger: "2", label: "📖 Book Class", action: "BOOK_CLASS", enabled: true, order: 2 },
  { id: "3", trigger: "3", label: "❌ Cancel", action: "CANCEL_BOOKING", enabled: true, order: 3 },
  { id: "4", trigger: "4", label: "💬 Support", action: "CONTACT_SUPPORT", enabled: true, order: 4 },
];

export class WhatsAppBotHandler {
  private establishmentId: string;
  private planFeatures: WhatsAppPlanFeatures;
  private customCommands: BotMenuCommand[] | null = null;
  private welcomeMessage: string | null = null;

  constructor(establishmentId: string, plan: string = "pro") {
    this.establishmentId = establishmentId;
    this.planFeatures = WHATSAPP_PLANS[plan] || WHATSAPP_PLANS.starter;
  }

  // Load custom bot configuration for this establishment
  private async loadBotConfig(): Promise<void> {
    if (this.customCommands !== null) return; // Already loaded

    const db = await getDatabase();
    const credentials = await db.collection<EstablishmentWhatsAppCredentials>(
      "establishment_whatsapp_credentials"
    ).findOne({ establishmentId: this.establishmentId });

    if (credentials?.botCommands && credentials.botCommands.length > 0) {
      this.customCommands = credentials.botCommands;
    } else {
      this.customCommands = DEFAULT_BOT_COMMANDS;
    }

    this.welcomeMessage = credentials?.botWelcomeMessage || null;
  }

  // Get enabled commands sorted by order
  private getEnabledCommands(): BotMenuCommand[] {
    const commands = this.customCommands || DEFAULT_BOT_COMMANDS;
    return commands
      .filter(cmd => cmd.enabled)
      .sort((a, b) => a.order - b.order);
  }

  async handleMessage(message: IncomingMessage): Promise<InteractiveContent | { body: string }> {
    // Load custom bot configuration
    await this.loadBotConfig();

    const phoneNumber = message.from;
    const client = await this.getClientByPhone(phoneNumber);

    if (!client) {
      return {
        body: "Hi! I couldn't find your registration. Please contact the front desk to link your WhatsApp to your account.",
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
    if (lowerText === "menu" || lowerText === "home" || lowerText === "hi" || lowerText === "hello" || lowerText === "oi" || lowerText === "olá") {
      await this.updateStateFlow(state.phoneNumber, "main_menu");
      return this.getMainMenu(client);
    }

    if (lowerText === "help" || lowerText === "ajuda") {
      return this.handleHelp();
    }

    // Check if input matches a custom command trigger
    const enabledCommands = this.getEnabledCommands();
    const matchedCommand = enabledCommands.find(cmd => cmd.trigger === lowerText);
    if (matchedCommand) {
      return this.executeCommandAction(matchedCommand, state, client);
    }

    // Handle number input for class selection during flows
    const num = parseInt(lowerText);
    if (!isNaN(num) && num > 0) {
      if (state.currentFlow === "confirm_class") {
        return this.processConfirmClass(num, state, client);
      } else if (state.currentFlow === "cancel_class") {
        return this.processCancelClass(num, state, client);
      } else if (state.currentFlow === "book_class") {
        return this.processBookClass(num, state, client);
      }

      // Check if number matches a menu command
      const numCommand = enabledCommands.find(cmd => cmd.trigger === String(num));
      if (numCommand) {
        return this.executeCommandAction(numCommand, state, client);
      }
    }

    // Natural language intents (fallback)
    if (/book|available|want\s*(a\s*)?class|schedule|agendar|marcar/.test(lowerText)) {
      await this.updateStateFlow(state.phoneNumber, "book_class");
      return this.getAvailableClasses(client);
    }

    if (/cancel|drop|unbook|cancelar/.test(lowerText)) {
      await this.updateStateFlow(state.phoneNumber, "cancel_class");
      return this.getClassSelectionForCancel(client);
    }

    if (/confirm|attendance|confirmar|presença/.test(lowerText)) {
      await this.updateStateFlow(state.phoneNumber, "confirm_class");
      return this.getClassSelectionForConfirm(client);
    }

    if (/how\s*many\s*classes|remaining|left|balance|quantas|restantes|créditos/.test(lowerText)) {
      return this.handleViewPlan(client);
    }

    if (/classes|my classes|aulas|minhas aulas/.test(lowerText)) {
      return this.handleViewClasses(client);
    }

    // Default: show menu
    return this.getMainMenu(client);
  }

  // Execute action based on custom command
  private async executeCommandAction(
    command: BotMenuCommand,
    state: ConversationState,
    client: ClientData
  ): Promise<InteractiveContent | { body: string }> {
    switch (command.action) {
      case "VIEW_CLASSES":
        await this.updateStateFlow(state.phoneNumber, "book_class");
        return this.getAvailableClasses(client);

      case "BOOK_CLASS":
        if (!this.planFeatures.bookNewClass) {
          return { body: "This feature is not available in your current plan." };
        }
        await this.updateStateFlow(state.phoneNumber, "book_class");
        return this.getAvailableClasses(client);

      case "MY_BOOKINGS":
        return this.handleViewClasses(client);

      case "CANCEL_BOOKING":
        if (!this.planFeatures.cancelClass) {
          return { body: "This feature is not available in your current plan." };
        }
        await this.updateStateFlow(state.phoneNumber, "cancel_class");
        return this.getClassSelectionForCancel(client);

      case "REMAINING_CREDITS":
        return this.handleViewPlan(client);

      case "CONTACT_SUPPORT":
        await this.updateStateFlow(state.phoneNumber, "talk_to_human");
        await this.flagForHumanHandoff(state.phoneNumber);
        return { body: "A support agent will respond shortly. Our business hours are Monday to Friday, 8am to 8pm." };

      case "CUSTOM_MESSAGE":
        return { body: command.customMessage || "Message not configured." };

      default:
        return this.getMainMenu(client);
    }
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
          return { body: "This feature is not available in your current plan." };
        }
        await this.updateStateFlow(state.phoneNumber, "confirm_class");
        return this.getClassSelectionForConfirm(client);

      case "cancel_class":
        if (!this.planFeatures.cancelClass) {
          return { body: "This feature is not available in your current plan." };
        }
        await this.updateStateFlow(state.phoneNumber, "cancel_class");
        return this.getClassSelectionForCancel(client);

      case "book_class":
        if (!this.planFeatures.bookNewClass) {
          return { body: "WhatsApp booking is not available in your plan." };
        }
        await this.updateStateFlow(state.phoneNumber, "book_class");
        return this.getAvailableClasses(client);

      case "view_plan":
        return this.handleViewPlan(client);

      case "talk_human":
        await this.updateStateFlow(state.phoneNumber, "talk_to_human");
        await this.flagForHumanHandoff(state.phoneNumber);
        return { body: "A support agent will respond shortly. Our business hours are Monday to Friday, 8am to 8pm." };

      case "back_menu":
        await this.updateStateFlow(state.phoneNumber, "main_menu");
        return this.getMainMenu(client);

      default:
        // Handle custom command buttons
        if (replyId.startsWith("custom_")) {
          const commandId = replyId.replace("custom_", "");
          const enabledCommands = this.getEnabledCommands();
          const command = enabledCommands.find(cmd => cmd.id === commandId);
          if (command) {
            return this.executeCommandAction(command, state, client);
          }
        }

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
    const enabledCommands = this.getEnabledCommands();

    // Build buttons from custom commands (WhatsApp supports max 3 buttons)
    const buttons: Array<{ type: "reply"; reply: { id: string; title: string } }> = [];

    enabledCommands.slice(0, 3).forEach(cmd => {
      buttons.push({
        type: "reply",
        reply: {
          id: `custom_${cmd.id}`,
          title: cmd.label.slice(0, 20), // WhatsApp button title max 20 chars
        },
      });
    });

    // Build welcome message
    const defaultWelcome = `Hi ${client.name}! How can I help?\n\n${
      pendingClasses > 0
        ? `You have ${pendingClasses} class(es) pending confirmation.`
        : "All your classes are confirmed!"
    }\n\nClasses remaining: ${client.classesRemaining}`;

    const welcomeText = this.welcomeMessage
      ? this.welcomeMessage.replace("{name}", client.name).replace("{remaining}", String(client.classesRemaining))
      : defaultWelcome;

    // If there are more than 3 commands, show them as text options
    let menuText = welcomeText;
    if (enabledCommands.length > 3) {
      menuText += "\n\nOr type a number:\n";
      enabledCommands.forEach(cmd => {
        menuText += `${cmd.trigger}. ${cmd.label}\n`;
      });
    }

    return {
      type: "button",
      header: { type: "text", text: "FlexiWell" },
      body: { text: menuText },
      footer: { text: "Type 'menu' at any time to return" },
      action: { buttons },
    };
  }

  private async handleViewClasses(client: ClientData): Promise<InteractiveContent> {
    // Refresh client data
    const freshClient = await this.getClientByPhone(client.phone);
    if (!freshClient) {
      return {
        type: "button",
        body: { text: "Error fetching your classes." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Back" } }],
        },
      };
    }

    if (freshClient.upcomingClasses.length === 0) {
      return {
        type: "button",
        body: { text: "You don't have any classes scheduled.\n\nWould you like to book one?" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "book_class", title: "Book Class" } },
            { type: "reply", reply: { id: "back_menu", title: "Back" } },
          ],
        },
      };
    }

    const classesText = freshClient.upcomingClasses
      .map((c, i) => `${i + 1}. ${c.name}\n   ${c.date} at ${c.time}\n   Instructor: ${c.instructor}\n   ${c.confirmed ? "Confirmed" : "Pending"}`)
      .join("\n\n");

    const buttons: Array<{ type: "reply"; reply: { id: string; title: string } }> = [];

    const pendingClasses = freshClient.upcomingClasses.filter(c => !c.confirmed);
    if (pendingClasses.length > 0 && this.planFeatures.confirmClass) {
      buttons.push({ type: "reply", reply: { id: "confirm_class", title: "Confirm" } });
    }

    if (this.planFeatures.cancelClass) {
      buttons.push({ type: "reply", reply: { id: "cancel_class", title: "Cancel" } });
    }

    buttons.push({ type: "reply", reply: { id: "back_menu", title: "Menu" } });

    return {
      type: "button",
      header: { type: "text", text: "Your Upcoming Classes" },
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
        body: { text: "No classes available in the next 7 days." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Back" } }],
        },
      };
    }

    let message = "Available classes:\n\n";
    classes.forEach((cls, index) => {
      const date = new Date(cls.scheduledDate).toLocaleDateString("en-US");
      const spotsLeft = cls.maxCapacity - cls.currentEnrollment;
      message += `${index + 1}. ${cls.title}\n`;
      message += `   ${date} at ${cls.startTime}\n`;
      message += `   Instructor: ${cls.instructorName}\n`;
      message += `   ${spotsLeft} spots left\n\n`;
    });

    message += "Type the number of the class to book.";

    // Store class IDs in session for later reference
    const classIds = classes.map(c => c._id?.toString() || "");
    await this.storeFlowData(client.phone, { availableClassIds: classIds });

    return {
      type: "button",
      body: { text: message },
      action: {
        buttons: [{ type: "reply", reply: { id: "back_menu", title: "Back" } }],
      },
    };
  }

  private getClassSelectionForConfirm(client: ClientData): InteractiveContent {
    const pendingClasses = client.upcomingClasses.filter(c => !c.confirmed);

    if (pendingClasses.length === 0) {
      return {
        type: "button",
        body: { text: "All your classes are already confirmed!" },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Menu" } }],
        },
      };
    }

    let message = "Which class would you like to confirm?\n\n";
    pendingClasses.forEach((c, i) => {
      message += `${i + 1}. ${c.name}\n   ${c.date} at ${c.time}\n\n`;
    });
    message += "Type the class number.";

    return {
      type: "button",
      body: { text: message },
      action: {
        buttons: [{ type: "reply", reply: { id: "back_menu", title: "Back" } }],
      },
    };
  }

  private getClassSelectionForCancel(client: ClientData): InteractiveContent {
    if (client.upcomingClasses.length === 0) {
      return {
        type: "button",
        body: { text: "You don't have any classes to cancel." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Menu" } }],
        },
      };
    }

    let message = "Cancellations with less than 24h notice may be charged.\n\nWhich class would you like to cancel?\n\n";
    client.upcomingClasses.forEach((c, i) => {
      message += `${i + 1}. ${c.name}\n   ${c.date} at ${c.time}\n\n`;
    });
    message += "Type the class number.";

    return {
      type: "button",
      body: { text: message },
      action: {
        buttons: [{ type: "reply", reply: { id: "back_menu", title: "Back" } }],
      },
    };
  }

  private async processConfirmClass(
    num: number,
    _state: ConversationState,
    client: ClientData
  ): Promise<InteractiveContent | { body: string }> {
    const pendingClasses = client.upcomingClasses.filter(c => !c.confirmed);

    if (num < 1 || num > pendingClasses.length) {
      return { body: "Invalid number. Please try again." };
    }

    const selectedClass = pendingClasses[num - 1];
    return this.confirmClass(selectedClass.id, client);
  }

  private async processCancelClass(
    num: number,
    _state: ConversationState,
    client: ClientData
  ): Promise<InteractiveContent | { body: string }> {
    if (num < 1 || num > client.upcomingClasses.length) {
      return { body: "Invalid number. Please try again." };
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
      return { body: "Invalid number. Please try again." };
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
        body: { text: "Class not found." },
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

    const date = new Date(booking.scheduledDate).toLocaleDateString("en-US");

    return {
      type: "button",
      header: { type: "text", text: "Attendance Confirmed!" },
      body: {
        text: `Your attendance has been confirmed:\n\n${booking.className}\n${date} at ${booking.startTime}\nInstructor: ${booking.instructorName}\n\nSee you there!`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "view_classes", title: "View Classes" } },
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
        body: { text: "Class not found." },
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
          text: `Cancellations must be made at least 24 hours in advance.\n\nThere are only ${Math.round(hoursUntilClass)} hours until your class.\n\nWould you like to speak with an agent?`,
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "talk_human", title: "Talk to Agent" } },
            { type: "reply", reply: { id: "back_menu", title: "Back" } },
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
      header: { type: "text", text: "Class Cancelled" },
      body: {
        text: `Your class has been cancelled:\n\n${booking.className}\n\nYour class credit has been restored to your plan.`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "book_class", title: "Book New" } },
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
          text: "You don't have any classes left in your current plan. Please contact us to renew.",
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: "talk_human", title: "Talk to Agent" } },
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
        body: { text: "Class not found." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Menu" } }],
        },
      };
    }

    // Check capacity
    if (classInfo.currentEnrollment >= classInfo.maxCapacity) {
      return {
        type: "button",
        body: { text: "This class is full. Would you like to join the waitlist?" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "talk_human", title: "Waitlist" } },
            { type: "reply", reply: { id: "back_menu", title: "Back" } },
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
        body: { text: "You're already enrolled in this class." },
        action: {
          buttons: [{ type: "reply", reply: { id: "back_menu", title: "Menu" } }],
        },
      };
    }

    // Get full client info
    await db.collection<Client>("clients").findOne({
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

    const date = new Date(classInfo.scheduledDate).toLocaleDateString("en-US");

    return {
      type: "button",
      header: { type: "text", text: "Class Booked!" },
      body: {
        text: `Your class has been booked successfully!\n\n${classInfo.title}\n${date} at ${classInfo.startTime}\nInstructor: ${classInfo.instructorName}\n\nYou have ${client.classesRemaining - 1} classes remaining.`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "view_classes", title: "View Classes" } },
          { type: "reply", reply: { id: "back_menu", title: "Menu" } },
        ],
      },
    };
  }

  private handleViewPlan(client: ClientData): InteractiveContent {
    return {
      type: "button",
      header: { type: "text", text: "Your Plan" },
      body: {
        text: `*${client.planName}*\n\nClasses remaining: *${client.classesRemaining}*\n\nFor more details or to change your plan, contact our team.`,
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
      header: { type: "text", text: "Help" },
      body: {
        text: `Available commands:\n\n` +
          `*"menu"* - Main menu\n` +
          `*"classes"* - View your classes\n` +
          `*"book"* - Book a new class\n` +
          `*"cancel"* - Cancel a class\n` +
          `*"confirm"* - Confirm attendance\n` +
          `*"plan"* - View your plan\n` +
          `*"help"* - This message`,
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
      date: new Date(b.scheduledDate).toLocaleDateString("en-US"),
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
    language: { code: "en_US" },
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
    language: { code: "en_US" },
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
    language: { code: "en_US" },
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
    language: { code: "en_US" },
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
