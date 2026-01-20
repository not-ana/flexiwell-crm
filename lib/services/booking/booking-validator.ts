// Booking Validator - SRP: Only handles booking validation rules
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import type { IBookingValidator, BookingValidationResult } from "../interfaces";
import type { Class, Client } from "@/lib/db/schemas";

export interface ValidationContext {
  classDoc: Class;
  client: Client;
  useCredit: boolean;
}

export class BookingValidator implements IBookingValidator {
  async validate(clientId: string, classId: string): Promise<BookingValidationResult> {
    const db = await getDatabase();

    // Get class details
    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classDoc) {
      return { isValid: false, error: "Aula não encontrada", errorCode: "CLASS_NOT_FOUND" };
    }

    // Get client details
    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(clientId),
    });

    if (!client) {
      return { isValid: false, error: "Cliente não encontrado", errorCode: "CLIENT_NOT_FOUND" };
    }

    return this.validateWithContext({ classDoc, client, useCredit: true });
  }

  validateWithContext(context: ValidationContext): BookingValidationResult {
    const { classDoc, client, useCredit } = context;

    // Check class status
    const classStatusResult = this.validateClassStatus(classDoc);
    if (!classStatusResult.isValid) return classStatusResult;

    // Check if class is in the past
    const classTimeResult = this.validateClassTime(classDoc);
    if (!classTimeResult.isValid) return classTimeResult;

    // Check client status
    const clientStatusResult = this.validateClientStatus(client);
    if (!clientStatusResult.isValid) return clientStatusResult;

    // Check class capacity
    const capacityResult = this.validateCapacity(classDoc);
    if (!capacityResult.isValid) return capacityResult;

    // Check credits if using plan
    if (useCredit) {
      const creditsResult = this.validateCredits(client);
      if (!creditsResult.isValid) return creditsResult;
    }

    return { isValid: true };
  }

  validateClassStatus(classDoc: Class): BookingValidationResult {
    if (classDoc.status === "cancelled") {
      return { isValid: false, error: "Esta aula foi cancelada", errorCode: "CLASS_CANCELLED" };
    }

    if (classDoc.status === "completed") {
      return { isValid: false, error: "Esta aula já foi realizada", errorCode: "CLASS_COMPLETED" };
    }

    return { isValid: true };
  }

  validateClassTime(classDoc: Class): BookingValidationResult {
    const classDateTime = new Date(classDoc.scheduledDate);
    const [hours, minutes] = classDoc.startTime.split(":").map(Number);
    classDateTime.setHours(hours, minutes, 0, 0);

    if (classDateTime < new Date()) {
      return { isValid: false, error: "Não é possível agendar aulas no passado", errorCode: "CLASS_IN_PAST" };
    }

    return { isValid: true };
  }

  validateClientStatus(client: Client): BookingValidationResult {
    if (client.status !== "active") {
      return {
        isValid: false,
        error: "Cliente inativo. Por favor, regularize sua situação.",
        errorCode: "CLIENT_INACTIVE",
      };
    }

    return { isValid: true };
  }

  validateCapacity(classDoc: Class): BookingValidationResult {
    if (classDoc.currentEnrollment >= classDoc.maxCapacity) {
      return {
        isValid: false,
        error: "Aula lotada. Deseja entrar na lista de espera?",
        errorCode: "CLASS_FULL",
      };
    }

    return { isValid: true };
  }

  validateCredits(client: Client): BookingValidationResult {
    if (client.plan.remainingClasses <= 0) {
      return {
        isValid: false,
        error: "Você não possui aulas disponíveis no seu plano",
        errorCode: "NO_CREDITS",
      };
    }

    if (new Date(client.plan.endDate) < new Date()) {
      return {
        isValid: false,
        error: "Seu plano expirou. Por favor, renove para continuar agendando.",
        errorCode: "PLAN_EXPIRED",
      };
    }

    return { isValid: true };
  }

  // Validate cancellation policy
  validateCancellation(
    scheduledDate: Date,
    startTime: string,
    cancelledBy: "client" | "admin" | "system"
  ): { canCancel: boolean; shouldRefundCredit: boolean } {
    const classDateTime = new Date(scheduledDate);
    const [hours, minutes] = startTime.split(":").map(Number);
    classDateTime.setHours(hours, minutes, 0, 0);

    const hoursUntilClass = (classDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    // Refund if: 12+ hours before class OR cancelled by admin/system
    const shouldRefundCredit = hoursUntilClass >= 12 || cancelledBy !== "client";

    return {
      canCancel: true,
      shouldRefundCredit,
    };
  }
}

// Factory function
export function createBookingValidator(): IBookingValidator {
  return new BookingValidator();
}

// Singleton instance
export const bookingValidator = new BookingValidator();
