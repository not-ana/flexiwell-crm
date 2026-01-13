// Conflict Checker - SRP: Only handles booking conflict detection
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import type { IConflictChecker, ConflictCheckResult } from "../interfaces";
import type { Booking, Class } from "@/lib/db/schemas";

export class ConflictChecker implements IConflictChecker {
  async checkConflicts(clientId: string, classId: string): Promise<ConflictCheckResult> {
    const db = await getDatabase();

    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classDoc) {
      return { hasConflict: true, conflictType: "capacity", conflictDetails: "Aula não encontrada" };
    }

    // Check for duplicate booking
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
      };
    }

    // Check for time conflict
    const timeConflict = await this.checkTimeConflict(clientId, classDoc);
    if (timeConflict.hasConflict) {
      return timeConflict;
    }

    // Check capacity
    if (classDoc.currentEnrollment >= classDoc.maxCapacity) {
      return {
        hasConflict: true,
        conflictType: "capacity",
        conflictDetails: "Aula lotada",
      };
    }

    return { hasConflict: false };
  }

  private async checkTimeConflict(clientId: string, classDoc: Class): Promise<ConflictCheckResult> {
    const db = await getDatabase();

    const classDate = new Date(classDoc.scheduledDate);
    const startOfDay = new Date(classDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(classDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sameDayBookings = await db
      .collection<Booking>("bookings")
      .find({
        clientId,
        scheduledDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ["confirmed", "pending"] },
      })
      .toArray();

    for (const existingBooking of sameDayBookings) {
      if (
        this.hasTimeOverlap(
          classDoc.startTime,
          classDoc.endTime,
          existingBooking.startTime,
          existingBooking.endTime
        )
      ) {
        return {
          hasConflict: true,
          conflictType: "time",
          conflictDetails: `Você já possui um agendamento às ${existingBooking.startTime} (${existingBooking.className})`,
        };
      }
    }

    return { hasConflict: false };
  }

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
}

// Factory function
export function createConflictChecker(): IConflictChecker {
  return new ConflictChecker();
}
