import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { Class, Booking, Client, WaitlistEntry, Payment, SupportTicket } from "@/lib/db/schemas";
import { EmailService } from "@/lib/email";

// AI Function Executor
// This handles all function calls from the AI Support system

// Unified result type for all AI functions
type AIFunctionResult = {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
};

export async function POST(req: NextRequest) {
  try {
    const { functionName, args } = await req.json();

    if (!functionName) {
      return NextResponse.json(
        { error: "functionName is required" },
        { status: 400 }
      );
    }

    const result = await executeAIFunction(functionName, args || {});
    return NextResponse.json(result);
  } catch (error) {
    console.error("Function execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute function" },
      { status: 500 }
    );
  }
}

async function executeAIFunction(
  functionName: string,
  args: Record<string, unknown>
): Promise<AIFunctionResult> {
  switch (functionName) {
    case "check_available_classes":
      return await checkAvailableClasses(
        args.date as string,
        args.modality as string | undefined
      );

    case "book_class":
      return await bookClass(args.classId as string, args.clientId as string);

    case "cancel_booking":
      return await cancelBooking(args.bookingId as string);

    case "check_waitlist_status":
      return await checkWaitlistStatus(
        args.clientId as string,
        args.classId as string | undefined
      );

    case "get_client_schedule":
      return await getClientSchedule(
        args.clientId as string,
        (args.days as number) || 7
      );

    case "get_payment_status":
      return await getPaymentStatus(args.clientId as string);

    case "recommend_class":
      return await recommendClass(
        args.clientId as string,
        args.experienceLevel as string | undefined,
        args.goals as string[] | undefined
      );

    case "escalate_to_human":
      return await escalateToHuman(
        args.sessionId as string,
        args.reason as string,
        args.priority as string,
        args.clientId as string
      );

    default:
      return {
        success: false,
        message: `Unknown function: ${functionName}`,
        error: "FUNCTION_NOT_FOUND",
      };
  }
}

// Function implementations - Connected to real database
async function checkAvailableClasses(
  date: string,
  modality?: string
): Promise<AIFunctionResult> {
  try {
    const db = await getDatabase();

    // Parse the date to create a range for the day
    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Build query
    const query: Record<string, unknown> = {
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: "scheduled",
    };

    // Add modality/type filter if provided
    if (modality) {
      query.type = modality.toLowerCase();
    }

    // Query classes from database
    const classes = await db.collection<Class>("classes")
      .find(query)
      .sort({ startTime: 1 })
      .toArray();

    // Transform to response format
    const formattedClasses = classes.map((cls) => ({
      id: cls._id?.toString(),
      name: cls.title,
      date: date,
      time: cls.startTime,
      duration: cls.duration,
      instructor: cls.instructorName,
      instructorId: cls.instructorId,
      modality: cls.type,
      capacity: cls.maxCapacity,
      booked: cls.currentEnrollment,
      spotsAvailable: cls.maxCapacity - cls.currentEnrollment,
      location: cls.location || "Main Studio",
      price: 0, // Included in plan
      level: cls.description?.toLowerCase().includes("beginner") ? "beginner" :
             cls.description?.toLowerCase().includes("advanced") ? "advanced" : "intermediate",
      waitlistCount: cls.waitlist?.length || 0,
    }));

    if (formattedClasses.length === 0) {
      return {
        success: true,
        message: `No classes found on ${date}${modality ? ` for ${modality}` : ""}. Would you like to check another date?`,
        data: [],
      };
    }

    return {
      success: true,
      message: `Found ${formattedClasses.length} classes on ${date}`,
      data: formattedClasses,
    };
  } catch (error) {
    console.error("checkAvailableClasses error:", error);
    return {
      success: false,
      message: "Failed to fetch available classes",
      error: "DATABASE_ERROR",
    };
  }
}

async function bookClass(
  classId: string,
  clientId: string
): Promise<AIFunctionResult> {
  try {
    const db = await getDatabase();

    // Validate ObjectIds
    if (!ObjectId.isValid(classId) || !ObjectId.isValid(clientId)) {
      return {
        success: false,
        message: "Invalid class or client ID provided",
        error: "INVALID_ID",
      };
    }

    // 1. Get the class
    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classDoc) {
      return {
        success: false,
        message: "Class not found. Please check the class ID and try again.",
        error: "CLASS_NOT_FOUND",
      };
    }

    // 2. Get the client
    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(clientId),
    });

    if (!client) {
      return {
        success: false,
        message: "Client not found. Please verify your account.",
        error: "CLIENT_NOT_FOUND",
      };
    }

    // 3. Check if class has capacity
    if (classDoc.currentEnrollment >= classDoc.maxCapacity) {
      // Offer to add to waitlist
      return {
        success: false,
        message: `Sorry, ${classDoc.title} is fully booked. Would you like me to add you to the waitlist?`,
        error: "CLASS_FULL",
        data: {
          waitlistAvailable: true,
          currentWaitlistSize: classDoc.waitlist?.length || 0,
        },
      };
    }

    // 4. Check if client has remaining classes
    if (client.plan.remainingClasses <= 0) {
      return {
        success: false,
        message: "You don't have any remaining classes in your plan. Would you like information about upgrading your plan?",
        error: "NO_CREDITS",
      };
    }

    // 5. Check if client already booked this class
    const existingBooking = await db.collection<Booking>("bookings").findOne({
      clientId: clientId,
      classId: classId,
      status: { $in: ["confirmed", "pending"] },
    });

    if (existingBooking) {
      return {
        success: false,
        message: `You already have a booking for ${classDoc.title} on this date.`,
        error: "ALREADY_BOOKED",
      };
    }

    // 6. Check for schedule conflicts
    const conflictingBooking = await db.collection<Booking>("bookings").findOne({
      clientId: clientId,
      scheduledDate: classDoc.scheduledDate,
      startTime: classDoc.startTime,
      status: { $in: ["confirmed", "pending"] },
    });

    if (conflictingBooking) {
      return {
        success: false,
        message: `You have a schedule conflict with ${conflictingBooking.className} at the same time.`,
        error: "SCHEDULE_CONFLICT",
        data: { conflictingClass: conflictingBooking.className },
      };
    }

    const now = new Date();

    // 7. Create booking record
    const booking: Booking = {
      clientId: clientId,
      clientName: client.name,
      classId: classId,
      className: classDoc.title,
      instructorId: classDoc.instructorId,
      instructorName: classDoc.instructorName,
      scheduledDate: classDoc.scheduledDate,
      startTime: classDoc.startTime,
      endTime: classDoc.endTime,
      status: "confirmed",
      source: "bot",
      createdAt: now,
      updatedAt: now,
    };

    const bookingResult = await db.collection<Booking>("bookings").insertOne(booking);

    // 8. Update class enrollment
    await db.collection<Class>("classes").updateOne(
      { _id: new ObjectId(classId) },
      {
        $inc: { currentEnrollment: 1 },
        $push: {
          enrolledClients: {
            clientId: clientId,
            clientName: client.name,
            status: "confirmed",
            enrolledAt: now,
          },
        },
        $set: { updatedAt: now },
      }
    );

    // 9. Update client's remaining classes
    await db.collection<Client>("clients").updateOne(
      { _id: new ObjectId(clientId) },
      {
        $inc: {
          "plan.usedClasses": 1,
          "plan.remainingClasses": -1,
        },
        $set: { updatedAt: now },
      }
    );

    // 10. Send confirmation email
    if (client.email) {
      try {
        await EmailService.sendBookingConfirmation(client.email, {
          clientName: client.name,
          className: classDoc.title,
          instructorName: classDoc.instructorName,
          date: classDoc.scheduledDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
          time: classDoc.startTime,
          location: classDoc.location || "Main Studio",
        });
      } catch (emailError) {
        console.error("Failed to send booking confirmation email:", emailError);
      }
    }

    return {
      success: true,
      message: `Successfully booked ${classDoc.title} on ${classDoc.scheduledDate.toLocaleDateString()} at ${classDoc.startTime}. Confirmation sent to your email.`,
      data: {
        bookingId: bookingResult.insertedId.toString(),
        className: classDoc.title,
        date: classDoc.scheduledDate.toISOString().split("T")[0],
        time: classDoc.startTime,
        instructor: classDoc.instructorName,
        location: classDoc.location || "Main Studio",
        remainingClasses: client.plan.remainingClasses - 1,
      },
    };
  } catch (error) {
    console.error("bookClass error:", error);
    return {
      success: false,
      message: "Failed to book class. Please try again or contact support if the issue persists.",
      error: "BOOKING_FAILED",
    };
  }
}

async function cancelBooking(
  bookingId: string
): Promise<AIFunctionResult> {
  try {
    const db = await getDatabase();

    if (!ObjectId.isValid(bookingId)) {
      return {
        success: false,
        message: "Invalid booking ID provided",
        error: "INVALID_ID",
      };
    }

    // 1. Get the booking
    const booking = await db.collection<Booking>("bookings").findOne({
      _id: new ObjectId(bookingId),
    });

    if (!booking) {
      return {
        success: false,
        message: "Booking not found. Please verify the booking ID.",
        error: "BOOKING_NOT_FOUND",
      };
    }

    if (booking.status === "cancelled") {
      return {
        success: false,
        message: "This booking has already been cancelled.",
        error: "ALREADY_CANCELLED",
      };
    }

    if (booking.status === "completed") {
      return {
        success: false,
        message: "Cannot cancel a completed class.",
        error: "CLASS_COMPLETED",
      };
    }

    // 2. Check cancellation policy (24h notice)
    const classDate = new Date(booking.scheduledDate);
    const now = new Date();
    const hoursUntilClass = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let creditRestored = true;
    let message = "";

    if (hoursUntilClass < 24) {
      creditRestored = false;
      message = "Note: Cancellation is within 24 hours of the class, so your credit will not be restored. ";
    }

    // 3. Update booking status
    await db.collection<Booking>("bookings").updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: "cancelled",
          updatedAt: now,
        },
      }
    );

    // 4. Update class enrollment
    await db.collection<Class>("classes").updateOne(
      { _id: new ObjectId(booking.classId) },
      {
        $inc: { currentEnrollment: -1 },
        $pull: { enrolledClients: { clientId: booking.clientId } },
        $set: { updatedAt: now },
      }
    );

    // 5. Restore client's credit if cancellation policy allows
    if (creditRestored) {
      await db.collection<Client>("clients").updateOne(
        { _id: new ObjectId(booking.clientId) },
        {
          $inc: {
            "plan.usedClasses": -1,
            "plan.remainingClasses": 1,
          },
          $set: { updatedAt: now },
        }
      );
    }

    // 6. Check waitlist and notify next person
    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(booking.classId),
    });

    if (classDoc && classDoc.waitlist && classDoc.waitlist.length > 0) {
      const nextInLine = classDoc.waitlist[0];
      const waitlistClient = await db.collection<Client>("clients").findOne({
        _id: new ObjectId(nextInLine.clientId),
      });

      if (waitlistClient && waitlistClient.email) {
        try {
          await EmailService.sendWaitlistNotification(waitlistClient.email, {
            clientName: waitlistClient.name,
            className: classDoc.title,
            date: classDoc.scheduledDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
            time: classDoc.startTime,
            spotsAvailable: 1,
            expiresAt: "2 hours",
            bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/book/${classDoc._id}`,
          });
        } catch (emailError) {
          console.error("Failed to send waitlist notification:", emailError);
        }
      }
    }

    // 7. Send cancellation email
    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(booking.clientId),
    });

    if (client && client.email) {
      try {
        await EmailService.sendBookingCancellation(client.email, {
          clientName: client.name,
          className: booking.className,
          date: booking.scheduledDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
          time: booking.startTime,
        });
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
      }
    }

    return {
      success: true,
      message: message + `Booking for ${booking.className} has been cancelled successfully.${creditRestored ? " Your class credit has been restored." : ""}`,
      data: {
        bookingId,
        cancelledAt: now.toISOString(),
        creditRestored,
        className: booking.className,
      },
    };
  } catch (error) {
    console.error("cancelBooking error:", error);
    return {
      success: false,
      message: "Failed to cancel booking. Please contact support.",
      error: "CANCELLATION_FAILED",
    };
  }
}

async function checkWaitlistStatus(
  clientId: string,
  classId?: string
): Promise<AIFunctionResult> {
  try {
    const db = await getDatabase();

    if (!ObjectId.isValid(clientId)) {
      return {
        success: false,
        message: "Invalid client ID provided",
        error: "INVALID_ID",
      };
    }

    // Build query
    const query: Record<string, unknown> = {
      clientId: clientId,
      status: "waiting",
    };

    if (classId && ObjectId.isValid(classId)) {
      query.preferredClassId = classId;
    }

    // Query waitlist entries
    const waitlistEntries = await db.collection<WaitlistEntry>("waitlist")
      .find(query)
      .sort({ priorityScore: -1, createdAt: 1 })
      .toArray();

    if (waitlistEntries.length === 0) {
      if (classId) {
        return {
          success: true,
          message: "You are not on the waitlist for this class.",
          data: null,
        };
      }
      return {
        success: true,
        message: "You are not currently on any waitlists.",
        data: [],
      };
    }

    // Calculate positions for each entry
    const formattedEntries = await Promise.all(
      waitlistEntries.map(async (entry) => {
        // Get position in queue for this class
        let position = 1;
        if (entry.preferredClassId) {
          const higherPriorityCount = await db.collection<WaitlistEntry>("waitlist").countDocuments({
            preferredClassId: entry.preferredClassId,
            status: "waiting",
            $or: [
              { priorityScore: { $gt: entry.priorityScore } },
              { priorityScore: entry.priorityScore, createdAt: { $lt: entry.createdAt } },
            ],
          });
          position = higherPriorityCount + 1;
        }

        return {
          id: entry._id?.toString(),
          classId: entry.preferredClassId,
          className: entry.preferredClassName || "Any available class",
          position,
          priority: entry.priorityScore > 80 ? "high" : entry.priorityScore > 50 ? "medium" : "normal",
          priorityScore: entry.priorityScore,
          addedAt: entry.createdAt.toISOString(),
          requestType: entry.requestType,
          preferredDays: entry.preferredDays,
          preferredTimeSlots: entry.preferredTimeSlots,
          notificationEnabled: true,
        };
      })
    );

    if (classId && formattedEntries.length === 1) {
      const entry = formattedEntries[0];
      return {
        success: true,
        message: `You are #${entry.position} in the waitlist for ${entry.className}. You'll be notified when a spot opens up.`,
        data: entry,
      };
    }

    return {
      success: true,
      message: `You are on ${formattedEntries.length} waitlist(s)`,
      data: formattedEntries,
    };
  } catch (error) {
    console.error("checkWaitlistStatus error:", error);
    return {
      success: false,
      message: "Failed to check waitlist status",
      error: "DATABASE_ERROR",
    };
  }
}

async function getClientSchedule(
  clientId: string,
  days: number
): Promise<AIFunctionResult> {
  try {
    const db = await getDatabase();

    if (!ObjectId.isValid(clientId)) {
      return {
        success: false,
        message: "Invalid client ID provided",
        error: "INVALID_ID",
      };
    }

    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Query upcoming bookings
    const bookings = await db.collection<Booking>("bookings")
      .find({
        clientId: clientId,
        scheduledDate: { $gte: now, $lte: futureDate },
        status: { $in: ["confirmed", "pending"] },
      })
      .sort({ scheduledDate: 1, startTime: 1 })
      .toArray();

    if (bookings.length === 0) {
      return {
        success: true,
        message: `You have no upcoming classes in the next ${days} days. Would you like me to help you book a class?`,
        data: [],
      };
    }

    // Get class details for location info
    const classIds = bookings.map((b) => new ObjectId(b.classId));
    const classes = await db.collection<Class>("classes")
      .find({ _id: { $in: classIds } })
      .toArray();

    const classMap = new Map(classes.map((c) => [c._id?.toString(), c]));

    const formattedSchedule = bookings.map((booking) => {
      const classDoc = classMap.get(booking.classId);
      return {
        bookingId: booking._id?.toString(),
        className: booking.className,
        date: booking.scheduledDate.toISOString().split("T")[0],
        time: booking.startTime,
        endTime: booking.endTime,
        duration: classDoc?.duration || 60,
        instructor: booking.instructorName,
        location: classDoc?.location || "Main Studio",
        status: booking.status,
      };
    });

    return {
      success: true,
      message: `You have ${formattedSchedule.length} upcoming class${formattedSchedule.length > 1 ? "es" : ""} in the next ${days} days`,
      data: formattedSchedule,
    };
  } catch (error) {
    console.error("getClientSchedule error:", error);
    return {
      success: false,
      message: "Failed to fetch schedule",
      error: "DATABASE_ERROR",
    };
  }
}

async function getPaymentStatus(
  clientId: string
): Promise<AIFunctionResult> {
  try {
    const db = await getDatabase();

    if (!ObjectId.isValid(clientId)) {
      return {
        success: false,
        message: "Invalid client ID provided",
        error: "INVALID_ID",
      };
    }

    // Get client info
    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(clientId),
    });

    if (!client) {
      return {
        success: false,
        message: "Client not found",
        error: "CLIENT_NOT_FOUND",
      };
    }

    // Get last payment
    const lastPayment = await db.collection<Payment>("payments")
      .findOne(
        { clientId: clientId, status: "completed" },
        { sort: { paidAt: -1 } }
      );

    // Calculate plan status
    const now = new Date();
    const planEndDate = new Date(client.plan.endDate);
    const daysRemaining = Math.ceil((planEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let accountStatus: "active" | "expiring_soon" | "expired" = "active";
    if (daysRemaining <= 0) {
      accountStatus = "expired";
    } else if (daysRemaining <= 7) {
      accountStatus = "expiring_soon";
    }

    const paymentData = {
      currentPlan: client.plan.type.charAt(0).toUpperCase() + client.plan.type.slice(1) + " Plan",
      status: accountStatus,
      planStartDate: client.plan.startDate,
      planEndDate: client.plan.endDate,
      daysRemaining: Math.max(0, daysRemaining),
      nextBillingDate: planEndDate.toISOString().split("T")[0],
      amount: client.plan.price,
      lastPayment: lastPayment ? {
        date: lastPayment.paidAt?.toISOString().split("T")[0] || lastPayment.createdAt.toISOString().split("T")[0],
        amount: lastPayment.amount,
        status: lastPayment.status,
        method: lastPayment.paymentMethod,
      } : null,
      creditsRemaining: client.plan.remainingClasses,
      creditsTotal: client.plan.totalClasses,
      creditsUsed: client.plan.usedClasses,
    };

    let message = "";
    if (accountStatus === "expired") {
      message = "Your plan has expired. Would you like information about renewing?";
    } else if (accountStatus === "expiring_soon") {
      message = `Your plan expires in ${daysRemaining} days. You have ${paymentData.creditsRemaining} classes remaining.`;
    } else {
      message = `Your account is in good standing. You have ${paymentData.creditsRemaining} of ${paymentData.creditsTotal} classes remaining. Plan renews on ${paymentData.nextBillingDate}.`;
    }

    return {
      success: true,
      message,
      data: paymentData,
    };
  } catch (error) {
    console.error("getPaymentStatus error:", error);
    return {
      success: false,
      message: "Failed to fetch payment information",
      error: "DATABASE_ERROR",
    };
  }
}

async function recommendClass(
  clientId: string,
  experienceLevel?: string,
  goals?: string[]
): Promise<AIFunctionResult> {
  try {
    const db = await getDatabase();

    if (!ObjectId.isValid(clientId)) {
      return {
        success: false,
        message: "Invalid client ID provided",
        error: "INVALID_ID",
      };
    }

    // Get client info and preferences
    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(clientId),
    });

    if (!client) {
      return {
        success: false,
        message: "Client not found",
        error: "CLIENT_NOT_FOUND",
      };
    }

    // Get client's booking history to understand preferences
    const pastBookings = await db.collection<Booking>("bookings")
      .find({ clientId: clientId, status: { $in: ["completed", "confirmed"] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    // Analyze what classes they've taken most
    const classTypeCounts: Record<string, number> = {};
    const instructorCounts: Record<string, { count: number; name: string }> = {};

    for (const booking of pastBookings) {
      // Get class type from className
      const classDoc = await db.collection<Class>("classes").findOne({ _id: new ObjectId(booking.classId) });
      if (classDoc) {
        classTypeCounts[classDoc.type] = (classTypeCounts[classDoc.type] || 0) + 1;
      }

      if (!instructorCounts[booking.instructorId]) {
        instructorCounts[booking.instructorId] = { count: 0, name: booking.instructorName };
      }
      instructorCounts[booking.instructorId].count++;
    }

    // Get favorite class type and instructor
    const favoriteType = Object.entries(classTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const favoriteInstructor = Object.entries(instructorCounts).sort((a, b) => b[1].count - a[1].count)[0];

    // Get upcoming classes that match preferences
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const recommendedClasses = await db.collection<Class>("classes")
      .find({
        scheduledDate: { $gte: now, $lte: nextWeek },
        status: "scheduled",
        $expr: { $lt: ["$currentEnrollment", "$maxCapacity"] },
      })
      .sort({ scheduledDate: 1 })
      .limit(10)
      .toArray();

    // Score and rank classes
    const scoredClasses = recommendedClasses.map((cls) => {
      let score = 50; // Base score
      let reasons: string[] = [];

      // Boost if matches favorite type
      if (favoriteType && cls.type === favoriteType) {
        score += 20;
        reasons.push(`You've enjoyed ${cls.type} classes before`);
      }

      // Boost if matches preferred instructor
      if (client.preferences?.preferredInstructors?.includes(cls.instructorId)) {
        score += 15;
        reasons.push(`${cls.instructorName} is one of your preferred instructors`);
      }

      // Boost if matches favorite instructor from history
      if (favoriteInstructor && cls.instructorId === favoriteInstructor[0]) {
        score += 10;
        reasons.push(`You've had great classes with ${cls.instructorName}`);
      }

      // Boost based on availability (more spots = easier to book)
      const spotsLeft = cls.maxCapacity - cls.currentEnrollment;
      if (spotsLeft > 3) {
        score += 5;
        reasons.push("Good availability");
      }

      // Consider experience level
      const level = cls.description?.toLowerCase();
      if (experienceLevel === "beginner" && level?.includes("beginner")) {
        score += 15;
        reasons.push("Perfect for beginners");
      } else if (experienceLevel === "advanced" && level?.includes("advanced")) {
        score += 15;
        reasons.push("Challenging class for advanced practitioners");
      }

      // Consider goals
      if (goals && goals.length > 0) {
        if (goals.includes("flexibility") && (cls.type === "yoga" || cls.type === "stretching")) {
          score += 10;
          reasons.push("Great for improving flexibility");
        }
        if (goals.includes("strength") && cls.type === "pilates") {
          score += 10;
          reasons.push("Excellent for building core strength");
        }
        if (goals.includes("relaxation") && (cls.type === "meditation" || cls.type === "yoga")) {
          score += 10;
          reasons.push("Perfect for relaxation and stress relief");
        }
      }

      return {
        classId: cls._id?.toString(),
        className: cls.title,
        type: cls.type,
        matchScore: Math.min(100, score),
        reason: reasons.length > 0 ? reasons.join(". ") : "Based on class availability and timing.",
        instructor: cls.instructorName,
        date: cls.scheduledDate.toISOString().split("T")[0],
        time: cls.startTime,
        spotsAvailable: spotsLeft,
        location: cls.location || "Main Studio",
      };
    });

    // Sort by score and take top 3
    const topRecommendations = scoredClasses
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);

    if (topRecommendations.length === 0) {
      return {
        success: true,
        message: "No classes available for the next week. Would you like me to check a different time period?",
        data: [],
      };
    }

    return {
      success: true,
      message: "Here are my top recommendations based on your preferences and history:",
      data: topRecommendations,
    };
  } catch (error) {
    console.error("recommendClass error:", error);
    return {
      success: false,
      message: "Failed to generate recommendations",
      error: "RECOMMENDATION_ERROR",
    };
  }
}

async function escalateToHuman(
  sessionId: string,
  reason: string,
  priority: string,
  clientId?: string
): Promise<AIFunctionResult> {
  try {
    const db = await getDatabase();
    const now = new Date();

    // Get client info if available
    let clientName = "Unknown Client";
    let clientEmail = "";

    if (clientId && ObjectId.isValid(clientId)) {
      const client = await db.collection<Client>("clients").findOne({
        _id: new ObjectId(clientId),
      });
      if (client) {
        clientName = client.name;
        clientEmail = client.email;
      }
    }

    // Create support ticket
    const ticket: SupportTicket = {
      clientId: clientId || sessionId,
      clientName,
      clientEmail,
      subject: `AI Escalation: ${reason.slice(0, 100)}`,
      category: "other",
      priority: (priority as "low" | "medium" | "high" | "urgent") || "medium",
      status: "open",
      messages: [
        {
          id: `msg_${Date.now()}`,
          from: "AI Assistant",
          content: `This conversation was escalated by the AI assistant.\n\nReason: ${reason}\n\nSession ID: ${sessionId}`,
          isAdmin: false,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<SupportTicket>("supportTickets").insertOne(ticket);

    // Determine estimated response time based on priority
    let estimatedResponseTime = "1-2 hours";
    if (priority === "urgent") {
      estimatedResponseTime = "15 minutes";
    } else if (priority === "high") {
      estimatedResponseTime = "30 minutes";
    }

    return {
      success: true,
      message: `I've escalated your request to our support team. A human agent will be with you shortly (typically within ${estimatedResponseTime}). Your ticket number is #${result.insertedId.toString().slice(-6).toUpperCase()}.`,
      data: {
        ticketId: result.insertedId.toString(),
        ticketNumber: result.insertedId.toString().slice(-6).toUpperCase(),
        sessionId,
        reason,
        priority,
        status: "open",
        createdAt: now.toISOString(),
        estimatedResponseTime,
      },
    };
  } catch (error) {
    console.error("escalateToHuman error:", error);
    return {
      success: false,
      message: "Failed to escalate to human agent. Please try calling our support line directly.",
      error: "ESCALATION_FAILED",
    };
  }
}

// GET endpoint for available functions
export async function GET() {
  return NextResponse.json({
    availableFunctions: [
      {
        name: "check_available_classes",
        description: "Get list of available classes for a specific date",
        params: ["date", "modality?"],
      },
      {
        name: "book_class",
        description: "Book a class for a client",
        params: ["classId", "clientId"],
      },
      {
        name: "cancel_booking",
        description: "Cancel an existing booking",
        params: ["bookingId"],
      },
      {
        name: "check_waitlist_status",
        description: "Check waitlist position for a client",
        params: ["clientId", "classId?"],
      },
      {
        name: "get_client_schedule",
        description: "Get upcoming schedule for a client",
        params: ["clientId", "days?"],
      },
      {
        name: "get_payment_status",
        description: "Get payment and billing information",
        params: ["clientId"],
      },
      {
        name: "recommend_class",
        description: "Get AI-powered class recommendations",
        params: ["clientId", "experienceLevel?", "goals?"],
      },
      {
        name: "escalate_to_human",
        description: "Escalate conversation to human support",
        params: ["sessionId", "reason", "priority", "clientId?"],
      },
    ],
  });
}
