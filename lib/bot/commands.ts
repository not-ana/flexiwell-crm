// Bot Command Handlers for FlexiWell

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
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
      text: "You need to be registered to view your classes. Please contact our support team to register.",
      buttons: [{ text: "Contact Support", payload: "SUPPORT" }],
    };
  }

  const db = await getDatabase();
  const client = await db.collection<Client>("clients").findOne({ _id: new ObjectId(session.clientId) });

  if (!client) {
    return { text: "We couldn't find your registration. Please contact support." };
  }

  const { remainingClasses, totalClasses, usedClasses } = client.plan;
  const endDate = new Date(client.plan.endDate).toLocaleDateString("en-US");

  return {
    text: `📊 *Your Classes*\n\n` +
      `✅ Classes completed: ${usedClasses}\n` +
      `📅 Classes remaining: ${remainingClasses}\n` +
      `📦 Plan total: ${totalClasses}\n\n` +
      `Your plan is valid until: ${endDate}`,
    quickReplies: ["View schedule", "Book class", "Contact support"],
  };
}

// Command: List upcoming classes
export async function handleUpcomingClasses(session: BotSession): Promise<CommandResponse> {
  if (!session.clientId) {
    return {
      text: "You need to be registered to view your scheduled classes.",
      buttons: [{ text: "Contact Support", payload: "SUPPORT" }],
    };
  }

  const db = await getDatabase();
  const now = new Date();

  const bookings = await db.collection<Booking>("bookings")
    .find({
      clientId: session.clientId!,
      scheduledDate: { $gte: now },
      status: "confirmed",
    })
    .sort({ scheduledDate: 1 })
    .limit(5)
    .toArray();

  if (bookings.length === 0) {
    return {
      text: "You don't have any classes scheduled. Would you like to book one?",
      buttons: [
        { text: "View available classes", payload: "AVAILABLE_CLASSES" },
        { text: "Back to menu", payload: "MENU" },
      ],
    };
  }

  let message = "📅 *Your Upcoming Classes*\n\n";
  bookings.forEach((booking, index) => {
    const date = new Date(booking.scheduledDate).toLocaleDateString("en-US");
    message += `${index + 1}. *${booking.className}*\n`;
    message += `   📆 ${date} at ${booking.startTime}\n`;
    message += `   👩‍🏫 Instructor: ${booking.instructorName}\n\n`;
  });

  return {
    text: message,
    buttons: [
      { text: "Cancel class", payload: "CANCEL_CLASS" },
      { text: "Reschedule", payload: "RESCHEDULE_CLASS" },
      { text: "Main menu", payload: "MENU" },
    ],
  };
}

// Command: List available classes
export async function handleAvailableClasses(_session: BotSession): Promise<CommandResponse> {
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
      text: "No classes available in the next 7 days. Please check again later.",
      quickReplies: ["Main menu", "Contact support"],
    };
  }

  let message = "🧘 *Available Classes*\n\n";
  classes.forEach((cls, index) => {
    const date = new Date(cls.scheduledDate).toLocaleDateString("en-US");
    const spotsLeft = cls.maxCapacity - cls.currentEnrollment;
    message += `${index + 1}. *${cls.title}*\n`;
    message += `   📆 ${date} at ${cls.startTime}\n`;
    message += `   👩‍🏫 Instructor: ${cls.instructorName}\n`;
    message += `   🎟️ ${spotsLeft} spots left\n\n`;
  });

  message += "Type the number of the class you want to book.";

  return {
    text: message,
    buttons: [{ text: "Back to menu", payload: "MENU" }],
  };
}

// Command: Book a class
export async function handleBookClass(session: BotSession, classIndex: number): Promise<CommandResponse> {
  if (!session.clientId) {
    return {
      text: "You need to be registered to book classes.",
      buttons: [{ text: "Contact Support", payload: "SUPPORT" }],
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
    return { text: "Invalid class number. Please try again." };
  }

  const selectedClass = classes[classIndex - 1];
  const client = await db.collection<Client>("clients").findOne({ _id: new ObjectId(session.clientId) });

  if (!client) {
    return { text: "Error fetching your data. Please try again." };
  }

  // Check if client has remaining classes
  if (client.plan.remainingClasses <= 0) {
    return {
      text: "You don't have any classes left in your current plan. Please contact us to renew.",
      buttons: [{ text: "Contact Support", payload: "SUPPORT" }],
    };
  }

  // Check if already enrolled
  const existingBooking = await db.collection<Booking>("bookings").findOne({
    clientId: session.clientId!,
    classId: selectedClass._id!.toString(),
    status: "confirmed",
  });

  if (existingBooking) {
    return { text: "You're already enrolled in this class." };
  }

  // Create booking
  const booking: Omit<Booking, "_id"> = {
    clientId: session.clientId!,
    clientName: client.name,
    classId: selectedClass._id!.toString(),
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

  await db.collection("bookings").insertOne(booking);

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
  await db.collection("clients").updateOne(
    { _id: new ObjectId(session.clientId) },
    {
      $inc: { "plan.usedClasses": 1, "plan.remainingClasses": -1 },
    }
  );

  const date = new Date(selectedClass.scheduledDate).toLocaleDateString("en-US");

  return {
    text: `✅ *Class Booked Successfully!*\n\n` +
      `📌 ${selectedClass.title}\n` +
      `📆 ${date} at ${selectedClass.startTime}\n` +
      `👩‍🏫 Instructor: ${selectedClass.instructorName}\n\n` +
      `You have ${client.plan.remainingClasses - 1} classes remaining.`,
    quickReplies: ["View my classes", "Main menu"],
  };
}

// Command: Cancel a class
export async function handleCancelClass(session: BotSession, bookingId: string): Promise<CommandResponse> {
  if (!session.clientId) {
    return { text: "You need to be registered to cancel classes." };
  }

  const db = await getDatabase();
  const booking = await db.collection<Booking>("bookings").findOne({
    _id: new ObjectId(bookingId),
    clientId: session.clientId!,
    status: "confirmed",
  });

  if (!booking) {
    return { text: "Booking not found or already cancelled." };
  }

  // Check cancellation policy (e.g., 24h before)
  const classDate = new Date(booking.scheduledDate);
  const now = new Date();
  const hoursUntilClass = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilClass < 24) {
    return {
      text: "⚠️ Cancellations must be made at least 24 hours in advance.\n\n" +
        "Would you like to request an exception? An administrator will review your request.",
      buttons: [
        { text: "Request exception", payload: `REQUEST_CANCEL_${bookingId}` },
        { text: "Back", payload: "MY_CLASSES" },
      ],
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
      $pull: { enrolledClients: { clientId: session.clientId } as unknown },
    } as Record<string, unknown>
  );

  // Restore client's class credit
  await db.collection("clients").updateOne(
    { _id: new ObjectId(session.clientId) },
    {
      $inc: { "plan.usedClasses": -1, "plan.remainingClasses": 1 },
    }
  );

  return {
    text: `✅ Class cancelled successfully!\n\n` +
      `Your class credit has been restored to your plan.`,
    quickReplies: ["View my classes", "Book new class", "Main menu"],
  };
}

// Command: View instructor schedule
export async function handleInstructorSchedule(_session: BotSession, instructorName: string): Promise<CommandResponse> {
  const db = await getDatabase();
  const instructor = await db.collection("staff").findOne({
    name: { $regex: instructorName, $options: "i" },
    role: "teacher",
    status: "active",
  });

  if (!instructor) {
    return { text: "Instructor not found. Please check the name and try again." };
  }

  if (!instructor.schedule || instructor.schedule.length === 0) {
    return { text: `${instructor.name} has no available schedule at the moment.` };
  }

  const days: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  let message = `👩‍🏫 *${instructor.name}'s Schedule*\n\n`;
  instructor.schedule.forEach((day: { day: string; slots: { start: string; end: string }[] }) => {
    message += `*${days[day.day]}*\n`;
    day.slots.forEach((slot: { start: string; end: string }) => {
      message += `  ⏰ ${slot.start} - ${slot.end}\n`;
    });
    message += "\n";
  });

  return {
    text: message,
    quickReplies: ["View available classes", "Main menu"],
  };
}

// Command: Main menu
export function handleMainMenu(): CommandResponse {
  return {
    text: `👋 *Welcome to FlexiWell!*\n\nHow can I help you today?`,
    buttons: [
      { text: "📊 My remaining classes", payload: "REMAINING_CLASSES" },
      { text: "📅 My scheduled classes", payload: "MY_CLASSES" },
      { text: "🧘 View available classes", payload: "AVAILABLE_CLASSES" },
      { text: "❌ Cancel class", payload: "CANCEL_CLASS" },
      { text: "💬 Contact support", payload: "SUPPORT" },
    ],
  };
}

// Command: Help
export function handleHelp(): CommandResponse {
  return {
    text: `ℹ️ *Available Commands*\n\n` +
      `📊 *"my classes"* or *"how many classes"* - View remaining classes\n` +
      `📅 *"schedule"* or *"upcoming classes"* - View your scheduled classes\n` +
      `🧘 *"book"* or *"available"* - View available classes\n` +
      `❌ *"cancel"* - Cancel a class\n` +
      `👩‍🏫 *"schedule [name]"* - View instructor schedule\n` +
      `💬 *"support"* or *"help"* - Contact support\n` +
      `🏠 *"menu"* - Return to main menu`,
    quickReplies: ["Main menu"],
  };
}

// Intent detection
export function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy)/.test(lowerMessage)) {
    return "GREETING";
  }

  // Remaining classes
  if (/how\s*many\s*(classes)?|remaining|left|balance|credits?/.test(lowerMessage)) {
    return "REMAINING_CLASSES";
  }

  // My classes / Schedule
  if (/my\s*class|schedule|upcoming|booked|scheduled/.test(lowerMessage)) {
    return "MY_CLASSES";
  }

  // Available classes / Book
  if (/available|book|reserve|sign\s*up|want\s*(a\s*)?class/.test(lowerMessage)) {
    return "AVAILABLE_CLASSES";
  }

  // Cancel
  if (/cancel|drop|can'?t\s*(make|attend)|unbook/.test(lowerMessage)) {
    return "CANCEL_CLASS";
  }

  // Reschedule
  if (/reschedule|change\s*(date|time)|move\s*(my\s*)?(class)?/.test(lowerMessage)) {
    return "RESCHEDULE";
  }

  // Instructor schedule
  if (/instructor|teacher|coach|when\s*(does|is)\s*(the\s*)?(instructor|teacher)/.test(lowerMessage)) {
    return "INSTRUCTOR_SCHEDULE";
  }

  // Support
  if (/support|help\s*me|problem|issue|complaint|speak\s*(to|with)\s*(someone|human)/.test(lowerMessage)) {
    return "SUPPORT";
  }

  // Menu
  if (/menu|home|start|back/.test(lowerMessage)) {
    return "MENU";
  }

  // Help
  if (/^(help|commands|\?)$/.test(lowerMessage)) {
    return "HELP";
  }

  // Number (for class selection)
  if (/^\d+$/.test(lowerMessage)) {
    return "NUMBER_INPUT";
  }

  return "UNKNOWN";
}
