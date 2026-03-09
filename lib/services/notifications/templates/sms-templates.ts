// SMS Templates - SRP: Only template definitions
// SMS templates are concise due to character limits and cost per message
import type { NotificationData } from "../../interfaces";

type SMSTemplate = (data: NotificationData) => string;

export const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  booking_confirmation: (data) =>
    `Class Confirmed!\n` +
    `${data.className}\n` +
    `${data.date} at ${data.startTime}\n` +
    `Instructor: ${data.instructorName}\n` +
    `Cancel up to 12h before.`,

  booking_cancellation: (data) =>
    `Booking Cancelled\n` +
    `${data.className}\n` +
    `${data.date} - ${data.startTime}\n` +
    (data.reason ? `Reason: ${data.reason}\n` : "") +
    (data.creditRefunded ? "Credit refunded." : "Credit not refunded."),

  booking_reminder: (data) =>
    `Reminder: Your class is ${data.timeUntil}!\n` +
    `${data.className}\n` +
    `${data.startTime} - ${data.endTime}\n` +
    `Instructor: ${data.instructorName}`,

  waitlist_spot_available: (data) =>
    `Spot available!\n` +
    `${data.className}\n` +
    `${data.date} - ${data.startTime}\n` +
    `You have 30 min to confirm!\n` +
    `${data.confirmUrl}`,

  plan_expiring: (data) =>
    `Your plan ${data.planName} expires in ${data.daysUntilExpiry} days.\n` +
    `Remaining classes: ${data.remainingClasses}\n` +
    `Renew: ${data.renewUrl}`,

  welcome: (data) =>
    `Welcome to ${data.studioName}!\n` +
    `Hi ${data.clientName}!\n` +
    (data.planName
      ? `Plan activated: ${data.planName} - ${data.totalClasses} classes\n`
      : "") +
    `Book now: ${data.dashboardUrl}`,

  class_cancelled: (data) =>
    `Class Cancelled\n` +
    `${data.className}\n` +
    `${data.date} - ${data.startTime}\n` +
    (data.reason ? `${data.reason}\n` : "") +
    `Credit refunded. Book another: ${data.bookingUrl}`,

  payment_confirmation: (data) =>
    `Payment Confirmed!\n` +
    `Plan: ${data.planName}\n` +
    `Amount: ${data.amount}\n` +
    `Classes: ${data.classesAdded}\n` +
    `Book now: ${data.dashboardUrl}`,

  intake_form: (data) =>
    `${data.studioName}: Please complete your health assessment.\n` +
    `${data.formUrl}\n` +
    `Expires in ${data.expiresInDays} days.`,

  custom: (data) => data.message as string,
};
