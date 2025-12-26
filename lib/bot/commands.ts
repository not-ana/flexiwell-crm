// Bot Command Handlers for FlexiWell

import { getDatabase } from "@/lib/db/mongodb";
import type { Client, Class, Booking, BotSession } from "@/lib/db/schemas";

export type CommandResponse = {
  text: string;
  buttons?: { text: string; payload: string }[];
  quickReplies?: string[];
};

// Helper to get client info
async function getClientByPlatformId(platformUserId: string, platform: "whatsapp" | "instagram"): Promise<Client | null> {
  const db = await getDatabase();
  const field = platform === "whatsapp" ? "whatsappId" : "instagramId";
  return db.collection<Client>("clients").findOne({ [field]: platformUserId });
}

// Command: Check remaining classes
export async function handleRemainingClasses(session: BotSession): Promise<CommandResponse> {
  if (!session.clientId) {
    return {
      text: "Você precisa estar cadastrado para ver suas aulas. Por favor, entre em contato com nosso suporte para fazer seu cadastro.",
      buttons: [{ text: "Falar com Suporte", payload: "SUPPORT" }],
    };
  }

  const db = await getDatabase();
  const client = await db.collection<Client>("clients").findOne({ _id: session.clientId });

  if (!client) {
    return { text: "Não encontramos seu cadastro. Por favor, entre em contato com o suporte." };
  }

  const { remainingClasses, totalClasses, usedClasses } = client.plan;
  const endDate = new Date(client.plan.endDate).toLocaleDateString("pt-BR");

  return {
    text: `📊 *Suas aulas*\n\n` +
      `✅ Aulas realizadas: ${usedClasses}\n` +
      `📅 Aulas restantes: ${remainingClasses}\n` +
      `📦 Total do plano: ${totalClasses}\n\n` +
      `Seu plano é válido até: ${endDate}`,
    quickReplies: ["Ver agenda", "Agendar aula", "Falar com suporte"],
  };
}

// Command: List upcoming classes
export async function handleUpcomingClasses(session: BotSession): Promise<CommandResponse> {
  if (!session.clientId) {
    return {
      text: "Você precisa estar cadastrado para ver suas aulas agendadas.",
      buttons: [{ text: "Falar com Suporte", payload: "SUPPORT" }],
    };
  }

  const db = await getDatabase();
  const now = new Date();

  const bookings = await db.collection<Booking>("bookings")
    .find({
      clientId: session.clientId,
      scheduledDate: { $gte: now },
      status: "confirmed",
    })
    .sort({ scheduledDate: 1 })
    .limit(5)
    .toArray();

  if (bookings.length === 0) {
    return {
      text: "Você não tem aulas agendadas no momento. Gostaria de agendar uma?",
      buttons: [
        { text: "Ver aulas disponíveis", payload: "AVAILABLE_CLASSES" },
        { text: "Voltar ao menu", payload: "MENU" },
      ],
    };
  }

  let message = "📅 *Suas próximas aulas*\n\n";
  bookings.forEach((booking, index) => {
    const date = new Date(booking.scheduledDate).toLocaleDateString("pt-BR");
    message += `${index + 1}. *${booking.className}*\n`;
    message += `   📆 ${date} às ${booking.startTime}\n`;
    message += `   👩‍🏫 Prof. ${booking.instructorName}\n\n`;
  });

  return {
    text: message,
    buttons: [
      { text: "Cancelar aula", payload: "CANCEL_CLASS" },
      { text: "Reagendar", payload: "RESCHEDULE_CLASS" },
      { text: "Menu principal", payload: "MENU" },
    ],
  };
}

// Command: List available classes
export async function handleAvailableClasses(session: BotSession): Promise<CommandResponse> {
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
    .limit(10)
    .toArray();

  if (classes.length === 0) {
    return {
      text: "Não há aulas disponíveis nos próximos 7 dias. Por favor, verifique novamente mais tarde.",
      quickReplies: ["Menu principal", "Falar com suporte"],
    };
  }

  let message = "🧘 *Aulas disponíveis*\n\n";
  classes.forEach((cls, index) => {
    const date = new Date(cls.scheduledDate).toLocaleDateString("pt-BR");
    const spotsLeft = cls.maxCapacity - cls.currentEnrollment;
    message += `${index + 1}. *${cls.title}*\n`;
    message += `   📆 ${date} às ${cls.startTime}\n`;
    message += `   👩‍🏫 Prof. ${cls.instructorName}\n`;
    message += `   🎟️ ${spotsLeft} vagas\n\n`;
  });

  message += "Digite o número da aula que deseja agendar.";

  return {
    text: message,
    buttons: [{ text: "Voltar ao menu", payload: "MENU" }],
  };
}

// Command: Book a class
export async function handleBookClass(session: BotSession, classIndex: number): Promise<CommandResponse> {
  if (!session.clientId) {
    return {
      text: "Você precisa estar cadastrado para agendar aulas.",
      buttons: [{ text: "Falar com Suporte", payload: "SUPPORT" }],
    };
  }

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
    .limit(10)
    .toArray();

  if (classIndex < 1 || classIndex > classes.length) {
    return { text: "Número de aula inválido. Por favor, tente novamente." };
  }

  const selectedClass = classes[classIndex - 1];
  const client = await db.collection<Client>("clients").findOne({ _id: session.clientId });

  if (!client) {
    return { text: "Erro ao buscar seus dados. Tente novamente." };
  }

  // Check if client has remaining classes
  if (client.plan.remainingClasses <= 0) {
    return {
      text: "Você não tem mais aulas disponíveis no seu plano atual. Entre em contato para renovar.",
      buttons: [{ text: "Falar com Suporte", payload: "SUPPORT" }],
    };
  }

  // Check if already enrolled
  const existingBooking = await db.collection<Booking>("bookings").findOne({
    clientId: session.clientId,
    classId: selectedClass._id,
    status: "confirmed",
  });

  if (existingBooking) {
    return { text: "Você já está inscrito nesta aula." };
  }

  // Create booking
  const booking: Booking = {
    clientId: session.clientId!,
    clientName: client.name,
    classId: selectedClass._id!,
    className: selectedClass.title,
    instructorId: selectedClass.instructorId,
    instructorName: selectedClass.instructorName,
    scheduledDate: selectedClass.scheduledDate,
    startTime: selectedClass.startTime,
    endTime: selectedClass.endTime,
    status: "confirmed",
    source: "bot",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection<Booking>("bookings").insertOne(booking);

  // Update class enrollment
  await db.collection<Class>("classes").updateOne(
    { _id: selectedClass._id },
    {
      $inc: { currentEnrollment: 1 },
      $push: {
        enrolledClients: {
          clientId: session.clientId,
          clientName: client.name,
          status: "confirmed",
          enrolledAt: new Date(),
        },
      },
    }
  );

  // Update client's remaining classes
  await db.collection<Client>("clients").updateOne(
    { _id: session.clientId },
    {
      $inc: { "plan.usedClasses": 1, "plan.remainingClasses": -1 },
    }
  );

  const date = new Date(selectedClass.scheduledDate).toLocaleDateString("pt-BR");

  return {
    text: `✅ *Aula agendada com sucesso!*\n\n` +
      `📌 ${selectedClass.title}\n` +
      `📆 ${date} às ${selectedClass.startTime}\n` +
      `👩‍🏫 Prof. ${selectedClass.instructorName}\n\n` +
      `Você tem ${client.plan.remainingClasses - 1} aulas restantes.`,
    quickReplies: ["Ver minhas aulas", "Menu principal"],
  };
}

// Command: Cancel a class
export async function handleCancelClass(session: BotSession, bookingId: string): Promise<CommandResponse> {
  if (!session.clientId) {
    return { text: "Você precisa estar cadastrado para cancelar aulas." };
  }

  const db = await getDatabase();
  const booking = await db.collection<Booking>("bookings").findOne({
    _id: bookingId,
    clientId: session.clientId,
    status: "confirmed",
  });

  if (!booking) {
    return { text: "Agendamento não encontrado ou já cancelado." };
  }

  // Check cancellation policy (e.g., 24h before)
  const classDate = new Date(booking.scheduledDate);
  const now = new Date();
  const hoursUntilClass = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilClass < 24) {
    return {
      text: "⚠️ Cancelamentos devem ser feitos com pelo menos 24 horas de antecedência.\n\n" +
        "Deseja solicitar uma exceção? Um administrador irá analisar seu pedido.",
      buttons: [
        { text: "Solicitar exceção", payload: `REQUEST_CANCEL_${bookingId}` },
        { text: "Voltar", payload: "MY_CLASSES" },
      ],
    };
  }

  // Cancel booking
  await db.collection<Booking>("bookings").updateOne(
    { _id: bookingId },
    { $set: { status: "cancelled", updatedAt: new Date() } }
  );

  // Update class enrollment
  await db.collection<Class>("classes").updateOne(
    { _id: booking.classId },
    {
      $inc: { currentEnrollment: -1 },
      $pull: { enrolledClients: { clientId: session.clientId } },
    }
  );

  // Restore client's class credit
  await db.collection<Client>("clients").updateOne(
    { _id: session.clientId },
    {
      $inc: { "plan.usedClasses": -1, "plan.remainingClasses": 1 },
    }
  );

  return {
    text: `✅ Aula cancelada com sucesso!\n\n` +
      `Sua aula foi restaurada ao seu pacote.`,
    quickReplies: ["Ver minhas aulas", "Agendar nova aula", "Menu principal"],
  };
}

// Command: View instructor schedule
export async function handleInstructorSchedule(session: BotSession, instructorName: string): Promise<CommandResponse> {
  const db = await getDatabase();
  const instructor = await db.collection("staff").findOne({
    name: { $regex: instructorName, $options: "i" },
    role: "teacher",
    status: "active",
  });

  if (!instructor) {
    return { text: "Instrutor não encontrado. Por favor, verifique o nome e tente novamente." };
  }

  if (!instructor.schedule || instructor.schedule.length === 0) {
    return { text: `${instructor.name} não tem horários disponíveis no momento.` };
  }

  const days: Record<string, string> = {
    monday: "Segunda",
    tuesday: "Terça",
    wednesday: "Quarta",
    thursday: "Quinta",
    friday: "Sexta",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  let message = `👩‍🏫 *Horários de ${instructor.name}*\n\n`;
  instructor.schedule.forEach((day: { day: string; slots: { start: string; end: string }[] }) => {
    message += `*${days[day.day]}*\n`;
    day.slots.forEach((slot: { start: string; end: string }) => {
      message += `  ⏰ ${slot.start} - ${slot.end}\n`;
    });
    message += "\n";
  });

  return {
    text: message,
    quickReplies: ["Ver aulas disponíveis", "Menu principal"],
  };
}

// Command: Main menu
export function handleMainMenu(): CommandResponse {
  return {
    text: `👋 *Bem-vindo ao FlexiWell!*\n\nComo posso ajudar você hoje?`,
    buttons: [
      { text: "📊 Minhas aulas restantes", payload: "REMAINING_CLASSES" },
      { text: "📅 Minhas aulas agendadas", payload: "MY_CLASSES" },
      { text: "🧘 Ver aulas disponíveis", payload: "AVAILABLE_CLASSES" },
      { text: "❌ Cancelar aula", payload: "CANCEL_CLASS" },
      { text: "💬 Falar com suporte", payload: "SUPPORT" },
    ],
  };
}

// Command: Help
export function handleHelp(): CommandResponse {
  return {
    text: `ℹ️ *Comandos disponíveis*\n\n` +
      `📊 *"minhas aulas"* ou *"quantas aulas"* - Ver aulas restantes\n` +
      `📅 *"agenda"* ou *"próximas aulas"* - Ver suas aulas agendadas\n` +
      `🧘 *"agendar"* ou *"disponíveis"* - Ver aulas disponíveis\n` +
      `❌ *"cancelar"* - Cancelar uma aula\n` +
      `👩‍🏫 *"horário [nome]"* - Ver horário de um instrutor\n` +
      `💬 *"suporte"* ou *"ajuda"* - Falar com suporte\n` +
      `🏠 *"menu"* - Voltar ao menu principal`,
    quickReplies: ["Menu principal"],
  };
}

// Intent detection
export function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase().trim();

  // Greetings
  if (/^(oi|olá|ola|hey|eai|e aí|bom dia|boa tarde|boa noite|hello|hi)/.test(lowerMessage)) {
    return "GREETING";
  }

  // Remaining classes
  if (/quantas?\s*(aulas?)?|restante|sobrando|falta|saldo/.test(lowerMessage)) {
    return "REMAINING_CLASSES";
  }

  // My classes / Schedule
  if (/minha[s]?\s*aula|agenda|próxima|proxima|agendad[oa]|marcad[oa]/.test(lowerMessage)) {
    return "MY_CLASSES";
  }

  // Available classes / Book
  if (/disponíve[il]|disponive[il]|agendar|marcar|reservar|quero\s*aula/.test(lowerMessage)) {
    return "AVAILABLE_CLASSES";
  }

  // Cancel
  if (/cancelar|desmarcar|desistir|não\s*posso|nao\s*posso/.test(lowerMessage)) {
    return "CANCEL_CLASS";
  }

  // Reschedule
  if (/remarcar|reagendar|trocar\s*(dia|hora|horário)/.test(lowerMessage)) {
    return "RESCHEDULE";
  }

  // Instructor schedule
  if (/horário|horario|agenda\s*d[aeo]|quando\s*[oa]\s*prof/.test(lowerMessage)) {
    return "INSTRUCTOR_SCHEDULE";
  }

  // Support
  if (/suporte|ajuda|problema|reclamação|reclamacao|falar\s*com\s*alguém/.test(lowerMessage)) {
    return "SUPPORT";
  }

  // Menu
  if (/menu|início|inicio|voltar/.test(lowerMessage)) {
    return "MENU";
  }

  // Help
  if (/^(ajuda|help|comandos|\?)$/.test(lowerMessage)) {
    return "HELP";
  }

  // Number (for class selection)
  if (/^\d+$/.test(lowerMessage)) {
    return "NUMBER_INPUT";
  }

  return "UNKNOWN";
}
