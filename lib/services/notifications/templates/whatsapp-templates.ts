// WhatsApp Templates - SRP: Only template definitions
import type { NotificationData } from "../../interfaces";

type WhatsAppTemplate = (data: NotificationData) => string;

export const WHATSAPP_TEMPLATES: Record<string, WhatsAppTemplate> = {
  booking_confirmation: (data) =>
    `✅ *Class Confirmed!*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `📚 Class: ${data.className}\n` +
    `📅 Date: ${data.date}\n` +
    `⏰ Time: ${data.startTime} - ${data.endTime}\n` +
    `👩‍🏫 Instructor: ${data.instructorName}\n\n` +
    `_Cancellations: up to 12 hours before for a refund._`,

  booking_cancellation: (data) =>
    `❌ *Booking Cancelled*\n\n` +
    `Hi ${data.clientName},\n\n` +
    `📚 Class: ${data.className}\n` +
    `📅 Date: ${data.date}\n` +
    `⏰ Time: ${data.startTime}\n` +
    (data.reason ? `📝 Reason: ${data.reason}\n\n` : "\n") +
    (data.creditRefunded
      ? "✅ Credit refunded."
      : "⚠️ Credit not refunded (deadline passed)."),

  booking_reminder: (data) =>
    `⏰ *Class Reminder*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `Your class is *${data.timeUntil}*!\n\n` +
    `📚 ${data.className}\n` +
    `⏰ ${data.startTime} - ${data.endTime}\n` +
    `👩‍🏫 ${data.instructorName}\n\n` +
    `💧 Don't forget your water bottle!`,

  waitlist_spot_available: (data) =>
    `🎉 *Spot Available!*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `A spot just opened up:\n` +
    `📚 ${data.className}\n` +
    `📅 ${data.date}\n` +
    `⏰ ${data.startTime}\n\n` +
    `⚠️ *You have 30 minutes to confirm!*\n\n` +
    `Confirm your spot: ${data.confirmUrl}`,

  plan_expiring: (data) =>
    `⚠️ *Plan Expiring*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `Your plan *${data.planName}* expires in *${data.daysUntilExpiry} days*.\n\n` +
    `🎯 Remaining classes: ${data.remainingClasses}\n\n` +
    `Renew now: ${data.renewUrl}`,

  welcome: (data) =>
    `🎉 *Welcome to ${data.studioName}!*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `We're thrilled to have you with us! 💜\n\n` +
    (data.planName
      ? `✅ Plan activated: *${data.planName}* - ${data.totalClasses} classes\n\n`
      : "") +
    `Access the portal to book: ${data.dashboardUrl}`,

  class_cancelled: (data) =>
    `⚠️ *Class Cancelled*\n\n` +
    `Hi ${data.clientName},\n\n` +
    `The following class has been cancelled:\n` +
    `📚 ${data.className}\n` +
    `📅 ${data.date}\n` +
    `⏰ ${data.startTime}\n` +
    (data.reason ? `📝 ${data.reason}\n\n` : "\n") +
    `✅ Credit refunded automatically.\n\n` +
    `Book another class: ${data.bookingUrl}`,

  payment_confirmation: (data) =>
    `✅ *Payment Confirmed!*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `📋 Plan: ${data.planName}\n` +
    `💰 Amount: ${data.amount}\n` +
    `🎯 Classes: ${data.classesAdded}\n\n` +
    `Let's book! ${data.dashboardUrl}`,

  intake_form: (data) =>
    `📋 *Health Assessment*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `${data.studioName} needs you to complete a health assessment form before your first class.\n\n` +
    `This helps us provide safe, personalized instruction.\n\n` +
    `📝 Complete here: ${data.formUrl}\n\n` +
    `_Link expires in ${data.expiresInDays} days._`,

  custom: (data) => data.message as string,
};
