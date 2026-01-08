// Booking Service - Complete booking logic with conflict detection and notifications
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { notificationService } from "@/lib/services/notification.service";
import { syncBookingToCalendar, removeBookingFromCalendar, getBookingEventData } from "@/lib/google-calendar/events";
import { updateClassAvailability } from "@/lib/wellhub/classes";
import type { Booking, Class, Client, Activity } from "@/lib/db/schemas";

export interface CreateBookingParams {
  clientId: string;
  classId: string;
  source?: "web" | "bot" | "admin";
  useCredit?: boolean; // Whether to deduct from plan credits
}

export interface BookingResult {
  success: boolean;
  booking?: Booking;
  error?: string;
  errorCode?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictType?: "time" | "duplicate" | "capacity" | "credits" | "plan_expired";
  conflictDetails?: string;
  existingBooking?: Booking;
}

export class BookingService {

  // Create a new booking with all validations
  async createBooking(params: CreateBookingParams): Promise<BookingResult> {
    const db = await getDatabase();
    const { clientId, classId, source = "web", useCredit = true } = params;

    try {
      // 1. Get class details
      const classDoc = await db.collection<Class>("classes").findOne({
        _id: new ObjectId(classId),
      });

      if (!classDoc) {
        return { success: false, error: "Aula não encontrada", errorCode: "CLASS_NOT_FOUND" };
      }

      // 2. Check if class is still open for booking
      if (classDoc.status === "cancelled") {
        return { success: false, error: "Esta aula foi cancelada", errorCode: "CLASS_CANCELLED" };
      }

      if (classDoc.status === "completed") {
        return { success: false, error: "Esta aula já foi realizada", errorCode: "CLASS_COMPLETED" };
      }

      // 3. Check if class is in the past
      const classDateTime = new Date(classDoc.scheduledDate);
      const [hours, minutes] = classDoc.startTime.split(":").map(Number);
      classDateTime.setHours(hours, minutes, 0, 0);

      if (classDateTime < new Date()) {
        return { success: false, error: "Não é possível agendar aulas no passado", errorCode: "CLASS_IN_PAST" };
      }

      // 4. Get client details
      const client = await db.collection<Client>("clients").findOne({
        _id: new ObjectId(clientId),
      });

      if (!client) {
        return { success: false, error: "Cliente não encontrado", errorCode: "CLIENT_NOT_FOUND" };
      }

      // 5. Check client status
      if (client.status !== "active") {
        return { success: false, error: "Cliente inativo. Por favor, regularize sua situação.", errorCode: "CLIENT_INACTIVE" };
      }

      // 6. Check for conflicts
      const conflictCheck = await this.checkConflicts(clientId, classDoc);
      if (conflictCheck.hasConflict) {
        return {
          success: false,
          error: conflictCheck.conflictDetails || "Conflito detectado",
          errorCode: conflictCheck.conflictType?.toUpperCase()
        };
      }

      // 7. Check class capacity
      if (classDoc.currentEnrollment >= classDoc.maxCapacity) {
        return {
          success: false,
          error: "Aula lotada. Deseja entrar na lista de espera?",
          errorCode: "CLASS_FULL"
        };
      }

      // 8. Check client credits if using plan
      if (useCredit) {
        if (client.plan.remainingClasses <= 0) {
          return {
            success: false,
            error: "Você não possui aulas disponíveis no seu plano",
            errorCode: "NO_CREDITS"
          };
        }

        if (new Date(client.plan.endDate) < new Date()) {
          return {
            success: false,
            error: "Seu plano expirou. Por favor, renove para continuar agendando.",
            errorCode: "PLAN_EXPIRED"
          };
        }
      }

      // 9. Create the booking
      const newBooking: Omit<Booking, "_id"> = {
        clientId,
        clientName: client.name,
        classId,
        className: classDoc.title,
        instructorId: classDoc.instructorId,
        instructorName: classDoc.instructorName,
        scheduledDate: classDoc.scheduledDate,
        startTime: classDoc.startTime,
        endTime: classDoc.endTime,
        status: "confirmed",
        source,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const bookingResult = await db.collection<Booking>("bookings").insertOne(newBooking);

      // 10. Update class enrollment
      await db.collection<Class>("classes").updateOne(
        { _id: new ObjectId(classId) },
        {
          $inc: { currentEnrollment: 1 },
          $push: {
            enrolledClients: {
              clientId,
              clientName: client.name,
              status: "confirmed",
              enrolledAt: new Date(),
            },
          },
          $set: { updatedAt: new Date() },
        }
      );

      // 11. Deduct credit from client plan if applicable
      if (useCredit) {
        await db.collection<Client>("clients").updateOne(
          { _id: new ObjectId(clientId) },
          {
            $inc: {
              "plan.usedClasses": 1,
              "plan.remainingClasses": -1,
            },
            $set: { updatedAt: new Date() },
          }
        );
      }

      // 12. Log activity
      await this.logActivity({
        type: "booking",
        action: "create",
        description: `${client.name} agendou ${classDoc.title} para ${new Date(classDoc.scheduledDate).toLocaleDateString("pt-BR")} às ${classDoc.startTime}`,
        entityId: bookingResult.insertedId.toString(),
        entityType: "booking",
        userId: clientId,
        userName: client.name,
      });

      const booking: Booking = {
        _id: bookingResult.insertedId,
        ...newBooking,
      };

      // 13. Send confirmation notification (async, don't wait)
      notificationService.sendBookingConfirmation(booking, classDoc).catch((err) => {
        console.error("Error sending booking confirmation:", err);
      });

      // 14. Sync to Google Calendar if client has it connected (async, fire-and-forget)
      this.syncToGoogleCalendar(booking._id!.toString(), clientId).catch((err) => {
        console.error("Error syncing to Google Calendar:", err);
      });

      // 15. Update Wellhub availability if class is synced (async, fire-and-forget)
      this.updateWellhubAvailability(classId).catch((err) => {
        console.error("Error updating Wellhub availability:", err);
      });

      return { success: true, booking };

    } catch (error) {
      console.error("Error creating booking:", error);
      return { success: false, error: "Erro ao criar agendamento", errorCode: "INTERNAL_ERROR" };
    }
  }

  // Check for booking conflicts
  async checkConflicts(clientId: string, classDoc: Class): Promise<ConflictCheckResult> {
    const db = await getDatabase();

    // Check for duplicate booking (same client, same class)
    const duplicateBooking = await db.collection<Booking>("bookings").findOne({
      clientId,
      classId: classDoc._id?.toString(),
      status: { $in: ["confirmed", "pending"] },
    });

    if (duplicateBooking) {
      return {
        hasConflict: true,
        conflictType: "duplicate",
        conflictDetails: "Você já possui um agendamento para esta aula",
        existingBooking: duplicateBooking,
      };
    }

    // Check for time conflict (same time, different class)
    const classDate = new Date(classDoc.scheduledDate);
    const startOfDay = new Date(classDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(classDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sameDayBookings = await db.collection<Booking>("bookings").find({
      clientId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["confirmed", "pending"] },
    }).toArray();

    for (const existingBooking of sameDayBookings) {
      if (this.hasTimeOverlap(
        classDoc.startTime,
        classDoc.endTime,
        existingBooking.startTime,
        existingBooking.endTime
      )) {
        return {
          hasConflict: true,
          conflictType: "time",
          conflictDetails: `Você já possui um agendamento às ${existingBooking.startTime} (${existingBooking.className})`,
          existingBooking,
        };
      }
    }

    return { hasConflict: false };
  }

  // Check if two time ranges overlap
  private hasTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    return s1 < e2 && s2 < e1;
  }

  // Cancel a booking
  async cancelBooking(bookingId: string, cancelledBy: "client" | "admin" | "system", reason?: string): Promise<BookingResult> {
    const db = await getDatabase();

    try {
      const booking = await db.collection<Booking>("bookings").findOne({
        _id: new ObjectId(bookingId),
      });

      if (!booking) {
        return { success: false, error: "Agendamento não encontrado", errorCode: "BOOKING_NOT_FOUND" };
      }

      if (booking.status === "cancelled") {
        return { success: false, error: "Este agendamento já foi cancelado", errorCode: "ALREADY_CANCELLED" };
      }

      if (booking.status === "completed") {
        return { success: false, error: "Não é possível cancelar uma aula já realizada", errorCode: "ALREADY_COMPLETED" };
      }

      // Check cancellation policy (e.g., 12 hours before)
      const classDateTime = new Date(booking.scheduledDate);
      const [hours, minutes] = booking.startTime.split(":").map(Number);
      classDateTime.setHours(hours, minutes, 0, 0);

      const hoursUntilClass = (classDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
      const shouldRefundCredit = hoursUntilClass >= 12 || cancelledBy !== "client";

      // Update booking status
      await db.collection<Booking>("bookings").updateOne(
        { _id: new ObjectId(bookingId) },
        {
          $set: {
            status: "cancelled",
            updatedAt: new Date(),
          },
        }
      );

      // Update class enrollment
      await db.collection<Class>("classes").updateOne(
        { _id: new ObjectId(booking.classId) },
        {
          $inc: { currentEnrollment: -1 },
          $set: {
            "enrolledClients.$[elem].status": "cancelled",
            updatedAt: new Date(),
          },
        },
        {
          arrayFilters: [{ "elem.clientId": booking.clientId }],
        }
      );

      // Refund credit if within policy
      if (shouldRefundCredit) {
        await db.collection<Client>("clients").updateOne(
          { _id: new ObjectId(booking.clientId) },
          {
            $inc: {
              "plan.usedClasses": -1,
              "plan.remainingClasses": 1,
            },
            $set: { updatedAt: new Date() },
          }
        );
      }

      // Log activity
      await this.logActivity({
        type: "cancel",
        action: "cancel_booking",
        description: `Agendamento de ${booking.clientName} para ${booking.className} foi cancelado${reason ? `: ${reason}` : ""}`,
        entityId: bookingId,
        entityType: "booking",
        metadata: {
          cancelledBy,
          reason,
          creditRefunded: shouldRefundCredit,
        },
      });

      // Notify waitlist if there are people waiting
      await this.notifyWaitlistForClass(booking.classId);

      // Send cancellation notification (async, don't wait)
      notificationService.sendBookingCancellation(booking, shouldRefundCredit, reason).catch((err) => {
        console.error("Error sending cancellation notification:", err);
      });

      // Remove from Google Calendar if synced (async, fire-and-forget)
      if (booking.googleCalendarEventId) {
        removeBookingFromCalendar(
          booking.clientId,
          bookingId,
          booking.googleCalendarEventId
        ).catch((err) => {
          console.error("Error removing from Google Calendar:", err);
        });
      }

      // Update Wellhub availability (async, fire-and-forget)
      this.updateWellhubAvailability(booking.classId).catch((err) => {
        console.error("Error updating Wellhub availability:", err);
      });

      return {
        success: true,
        booking: { ...booking, status: "cancelled" }
      };

    } catch (error) {
      console.error("Error cancelling booking:", error);
      return { success: false, error: "Erro ao cancelar agendamento", errorCode: "INTERNAL_ERROR" };
    }
  }

  // Get available classes for booking
  async getAvailableClasses(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    type?: string;
    instructorId?: string;
    hasAvailability?: boolean;
  }) {
    const db = await getDatabase();

    const query: Record<string, unknown> = {
      status: "scheduled",
      scheduledDate: { $gte: new Date() },
    };

    if (filters?.dateFrom) {
      query.scheduledDate = { ...(query.scheduledDate as object), $gte: filters.dateFrom };
    }

    if (filters?.dateTo) {
      query.scheduledDate = { ...(query.scheduledDate as object), $lte: filters.dateTo };
    }

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.instructorId) {
      query.instructorId = filters.instructorId;
    }

    const classes = await db.collection<Class>("classes")
      .find(query)
      .sort({ scheduledDate: 1, startTime: 1 })
      .toArray();

    // Filter by availability if requested
    if (filters?.hasAvailability) {
      return classes.filter(c => c.currentEnrollment < c.maxCapacity);
    }

    return classes.map(c => ({
      ...c,
      availableSpots: c.maxCapacity - c.currentEnrollment,
      isFull: c.currentEnrollment >= c.maxCapacity,
    }));
  }

  // Get client's bookings
  async getClientBookings(clientId: string, status?: string) {
    const db = await getDatabase();

    const query: Record<string, unknown> = { clientId };

    if (status && status !== "all") {
      query.status = status;
    }

    return db.collection<Booking>("bookings")
      .find(query)
      .sort({ scheduledDate: -1, startTime: -1 })
      .toArray();
  }

  // Add client to waitlist
  async addToWaitlist(clientId: string, classId: string): Promise<{ success: boolean; position?: number; error?: string }> {
    const db = await getDatabase();

    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classDoc) {
      return { success: false, error: "Aula não encontrada" };
    }

    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(clientId),
    });

    if (!client) {
      return { success: false, error: "Cliente não encontrado" };
    }

    // Check if already in waitlist
    const alreadyInWaitlist = classDoc.waitlist?.some(w => w.clientId === clientId);
    if (alreadyInWaitlist) {
      return { success: false, error: "Você já está na lista de espera desta aula" };
    }

    // Check if already enrolled
    const alreadyEnrolled = classDoc.enrolledClients?.some(
      e => e.clientId === clientId && e.status === "confirmed"
    );
    if (alreadyEnrolled) {
      return { success: false, error: "Você já está inscrito nesta aula" };
    }

    await db.collection<Class>("classes").updateOne(
      { _id: new ObjectId(classId) },
      {
        $push: {
          waitlist: {
            clientId,
            clientName: client.name,
            addedAt: new Date(),
          },
        },
        $set: { updatedAt: new Date() },
      }
    );

    const position = (classDoc.waitlist?.length || 0) + 1;

    return { success: true, position };
  }

  // Notify waitlist when spot opens
  private async notifyWaitlistForClass(classId: string) {
    const db = await getDatabase();

    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classDoc || !classDoc.waitlist || classDoc.waitlist.length === 0) {
      return;
    }

    // If there's available space now, notify first person in waitlist
    if (classDoc.currentEnrollment < classDoc.maxCapacity) {
      const firstInLine = classDoc.waitlist[0];
      const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/classes/book?confirm=${classDoc._id}`;

      // Send notification via email/WhatsApp
      notificationService.sendWaitlistSpotAvailable(
        firstInLine.clientId,
        classDoc,
        confirmUrl
      ).catch((err) => {
        console.error("Error sending waitlist notification:", err);
      });

      // Create notification record for tracking
      await db.collection("notifications").insertOne({
        type: "waitlist_spot_available",
        clientId: firstInLine.clientId,
        clientName: firstInLine.clientName,
        classId: classDoc._id?.toString(),
        className: classDoc.title,
        classDate: classDoc.scheduledDate,
        classTime: classDoc.startTime,
        status: "pending",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours to respond
      });
    }
  }

  // Log activity
  private async logActivity(activity: Omit<Activity, "_id" | "createdAt">) {
    const db = await getDatabase();
    await db.collection<Activity>("activities").insertOne({
      ...activity,
      createdAt: new Date(),
    });
  }

  // Mark attendance
  async markAttendance(bookingId: string, attended: boolean, markedBy: string): Promise<BookingResult> {
    const db = await getDatabase();

    const booking = await db.collection<Booking>("bookings").findOne({
      _id: new ObjectId(bookingId),
    });

    if (!booking) {
      return { success: false, error: "Agendamento não encontrado", errorCode: "BOOKING_NOT_FOUND" };
    }

    const newStatus = attended ? "completed" : "no-show";

    await db.collection<Booking>("bookings").updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date(),
        },
      }
    );

    // Update enrolled client status in class
    await db.collection<Class>("classes").updateOne(
      { _id: new ObjectId(booking.classId) },
      {
        $set: {
          "enrolledClients.$[elem].status": newStatus,
          updatedAt: new Date(),
        },
      },
      {
        arrayFilters: [{ "elem.clientId": booking.clientId }],
      }
    );

    // If no-show, potentially handle credit (depends on policy)
    // For now, we don't refund no-shows

    await this.logActivity({
      type: "booking",
      action: attended ? "mark_attended" : "mark_no_show",
      description: `${booking.clientName} ${attended ? "compareceu" : "não compareceu"} à aula ${booking.className}`,
      entityId: bookingId,
      entityType: "booking",
      userId: markedBy,
    });

    return { success: true, booking: { ...booking, status: newStatus } };
  }

  // Sync booking to Google Calendar
  private async syncToGoogleCalendar(bookingId: string, clientId: string): Promise<void> {
    const db = await getDatabase();

    // Check if client has Google Calendar connected
    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(clientId),
    });

    if (!client?.integrations?.googleCalendar?.syncEnabled) {
      return; // Calendar not connected or sync disabled
    }

    // Get booking event data
    const eventData = await getBookingEventData(bookingId);
    if (!eventData) {
      console.error("Could not get booking data for calendar sync");
      return;
    }

    // Sync to calendar (fire-and-forget handled by the function)
    syncBookingToCalendar(clientId, eventData);
  }

  // Update Wellhub class availability
  private async updateWellhubAvailability(classId: string): Promise<void> {
    const db = await getDatabase();

    // Check if class is synced to Wellhub
    const classDoc = await db.collection("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classDoc?.wellhubClassId || !classDoc?.wellhubSyncEnabled) {
      return; // Class not synced to Wellhub
    }

    // Update availability (fire-and-forget)
    updateClassAvailability(classId).catch((err) => {
      console.error("Failed to update Wellhub availability:", err);
    });
  }
}

export const bookingService = new BookingService();
