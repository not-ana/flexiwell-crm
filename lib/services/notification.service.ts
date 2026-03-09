// Notification Service - Email (Resend), WhatsApp (Twilio/Cloud API), and SMS (Twilio) notifications
import { Resend } from "resend";
import { getDatabase } from "@/lib/db/mongodb";
import { getWhatsAppCredentials } from "@/lib/integrations/credentials";
import type { TwilioCredentials, CloudApiCredentials } from "@/lib/whatsapp/types";
import { formatPhoneForWhatsApp } from "@/lib/utils/phone";
import { formatDateBR } from "@/lib/utils/date";
import type { Client, Booking, Class } from "@/lib/db/schemas";
import { SMS_TEMPLATES } from "@/lib/services/notifications/templates/sms-templates";

// ============================================
// Types
// ============================================

export type NotificationChannel = "email" | "whatsapp" | "sms" | "both" | "all";
export type NotificationType =
  | "booking_confirmation"
  | "booking_cancellation"
  | "booking_reminder"
  | "waitlist_spot_available"
  | "plan_expiring"
  | "plan_expired"
  | "payment_confirmation"
  | "payment_failed"
  | "welcome"
  | "class_cancelled"
  | "class_rescheduled"
  | "intake_form"
  | "custom";

interface NotificationResult {
  success: boolean;
  emailSent?: boolean;
  whatsappSent?: boolean;
  smsSent?: boolean;
  error?: string;
}

interface NotificationPayload {
  type: NotificationType;
  clientId: string;
  data: Record<string, unknown>;
  channels?: NotificationChannel;
}

interface NotificationRecord {
  _id?: string;
  type: NotificationType;
  channel: "email" | "whatsapp" | "sms";
  clientId: string;
  clientName: string;
  recipient: string; // email or phone
  subject?: string;
  content: string;
  status: "pending" | "sent" | "failed";
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}

// ============================================
// Email Templates
// ============================================

const EMAIL_TEMPLATES = {
  booking_confirmation: (data: Record<string, unknown>) => ({
    subject: `✅ Class Confirmed - ${data.className}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Class Confirmed! 🎉</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Your class has been booked successfully!</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
            <p style="margin: 5px 0; color: #64748b;">📚 <strong>Class:</strong> ${data.className}</p>
            <p style="margin: 5px 0; color: #64748b;">📅 <strong>Date:</strong> ${data.date}</p>
            <p style="margin: 5px 0; color: #64748b;">⏰ <strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
            <p style="margin: 5px 0; color: #64748b;">👩‍🏫 <strong>Instructor:</strong> ${data.instructorName}</p>
            ${data.roomName ? `<p style="margin: 5px 0; color: #64748b;">🏠 <strong>Room:</strong> ${data.roomName}</p>` : ""}
          </div>

          <p style="font-size: 14px; color: #64748b;">
            Remember: cancellations must be made at least 12 hours in advance for a credit refund.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.dashboardUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View My Bookings
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; text-align: center;">
            ${data.studioName} • See you soon! 💜
          </p>
        </div>
      </div>
    `,
  }),

  booking_cancellation: (data: Record<string, unknown>) => ({
    subject: `❌ Booking Cancelled - ${data.className}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ef4444; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Booking Cancelled</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Your booking has been cancelled.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 5px 0; color: #64748b;">📚 <strong>Class:</strong> ${data.className}</p>
            <p style="margin: 5px 0; color: #64748b;">📅 <strong>Date:</strong> ${data.date}</p>
            <p style="margin: 5px 0; color: #64748b;">⏰ <strong>Time:</strong> ${data.startTime}</p>
            ${data.reason ? `<p style="margin: 5px 0; color: #64748b;">📝 <strong>Reason:</strong> ${data.reason}</p>` : ""}
          </div>

          ${data.creditRefunded ? `
            <p style="font-size: 14px; color: #22c55e; background: #f0fdf4; padding: 10px; border-radius: 8px;">
              ✅ Credit has been refunded to your plan.
            </p>
          ` : `
            <p style="font-size: 14px; color: #ef4444; background: #fef2f2; padding: 10px; border-radius: 8px;">
              ⚠️ Late cancellation - credit not refunded.
            </p>
          `}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.bookingUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Book Another Class
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  booking_reminder: (data: Record<string, unknown>) => ({
    subject: `⏰ Reminder: Your class is ${data.timeUntil}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Class Reminder ⏰</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Your class is <strong>${data.timeUntil}</strong>!</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 5px 0; color: #64748b;">📚 <strong>Class:</strong> ${data.className}</p>
            <p style="margin: 5px 0; color: #64748b;">📅 <strong>Date:</strong> ${data.date}</p>
            <p style="margin: 5px 0; color: #64748b;">⏰ <strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
            <p style="margin: 5px 0; color: #64748b;">👩‍🏫 <strong>Instructor:</strong> ${data.instructorName}</p>
          </div>

          <p style="font-size: 14px; color: #64748b; text-align: center;">
            Don't forget your water bottle! 💧
          </p>
        </div>
      </div>
    `,
  }),

  waitlist_spot_available: (data: Record<string, unknown>) => ({
    subject: `🎉 Spot Available! - ${data.className}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Spot Available! 🎉</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">A spot just opened up in the class you were waiting for!</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0; color: #64748b;">📚 <strong>Class:</strong> ${data.className}</p>
            <p style="margin: 5px 0; color: #64748b;">📅 <strong>Date:</strong> ${data.date}</p>
            <p style="margin: 5px 0; color: #64748b;">⏰ <strong>Time:</strong> ${data.startTime}</p>
          </div>

          <p style="font-size: 14px; color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 8px; text-align: center;">
            ⏳ You have <strong>30 minutes</strong> to confirm your spot!
          </p>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${data.confirmUrl}" style="background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Confirm My Spot
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  plan_expiring: (data: Record<string, unknown>) => ({
    subject: `⚠️ Your plan expires in ${data.daysUntilExpiry} days`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Plan Expiring ⚠️</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Your plan <strong>${data.planName}</strong> expires in <strong>${data.daysUntilExpiry} days</strong>.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 5px 0; color: #64748b;">📋 <strong>Plan:</strong> ${data.planName}</p>
            <p style="margin: 5px 0; color: #64748b;">📅 <strong>Expires on:</strong> ${data.expiryDate}</p>
            <p style="margin: 5px 0; color: #64748b;">🎯 <strong>Remaining classes:</strong> ${data.remainingClasses}</p>
          </div>

          <p style="font-size: 14px; color: #64748b;">
            Renew now so you don't miss your favorite classes!
          </p>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${data.renewUrl}" style="background: #f59e0b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Renew Plan
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  welcome: (data: Record<string, unknown>) => ({
    subject: `🎉 Welcome to ${data.studioName}!`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome! 🎉</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${data.studioName}</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">We're thrilled to have you with us!</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #7c3aed; margin-top: 0;">Next steps:</h3>
            <p style="margin: 10px 0; color: #64748b;">1️⃣ Access the client portal to see available classes</p>
            <p style="margin: 10px 0; color: #64748b;">2️⃣ Book your first class</p>
            <p style="margin: 10px 0; color: #64748b;">3️⃣ Don't forget to bring comfortable clothes!</p>
          </div>

          ${data.planName ? `
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #22c55e;">
                ✅ Plan activated: <strong>${data.planName}</strong> - ${data.totalClasses} classes
              </p>
            </div>
          ` : ""}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.dashboardUrl}" style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Access Portal
            </a>
          </div>

          <p style="font-size: 14px; color: #64748b; margin-top: 30px; text-align: center;">
            If you have any questions, we're here to help! 💜
          </p>
        </div>
      </div>
    `,
  }),

  class_cancelled: (data: Record<string, unknown>) => ({
    subject: `⚠️ Booking Cancelled - ${data.className}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #ef4444; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Booking Cancelled ⚠️</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Unfortunately, the following class has been cancelled:</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 5px 0; color: #64748b;">📚 <strong>Class:</strong> ${data.className}</p>
            <p style="margin: 5px 0; color: #64748b;">📅 <strong>Date:</strong> ${data.date}</p>
            <p style="margin: 5px 0; color: #64748b;">⏰ <strong>Time:</strong> ${data.startTime}</p>
            ${data.reason ? `<p style="margin: 5px 0; color: #64748b;">📝 <strong>Reason:</strong> ${data.reason}</p>` : ""}
          </div>

          <p style="font-size: 14px; color: #22c55e; background: #f0fdf4; padding: 12px; border-radius: 8px;">
            ✅ Credit has been refunded to your plan automatically.
          </p>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${data.bookingUrl}" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Book Another Class
            </a>
          </div>

          <p style="font-size: 14px; color: #64748b; margin-top: 20px; text-align: center;">
            We apologize for the inconvenience.
          </p>
        </div>
      </div>
    `,
  }),

  payment_confirmation: (data: Record<string, unknown>) => ({
    subject: `✅ Payment Confirmed - ${data.planName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Payment Confirmed! ✅</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Your payment has been processed successfully!</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0; color: #64748b;">📋 <strong>Plan:</strong> ${data.planName}</p>
            <p style="margin: 5px 0; color: #64748b;">💰 <strong>Amount:</strong> ${data.amount}</p>
            <p style="margin: 5px 0; color: #64748b;">💳 <strong>Method:</strong> ${data.paymentMethod}</p>
            <p style="margin: 5px 0; color: #64748b;">🎯 <strong>Classes added:</strong> ${data.classesAdded}</p>
          </div>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${data.dashboardUrl}" style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Book Classes
            </a>
          </div>
        </div>
      </div>
    `,
  }),

  intake_form: (data: Record<string, unknown>) => ({
    subject: `Complete Your Health Assessment - ${data.studioName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Health Assessment</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${data.studioName}</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Please complete your health assessment form before your first class. This helps us provide safe, personalized instruction.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.formUrl}" style="background: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Complete Health Assessment
            </a>
          </div>

          <p style="font-size: 14px; color: #64748b; text-align: center;">
            This link expires in ${data.expiresInDays} days.
          </p>
        </div>
      </div>
    `,
  }),

  custom: (data: Record<string, unknown>) => ({
    subject: data.subject as string || "Message from Studio",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${data.studioName}</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
          <div style="font-size: 16px; color: #334155; white-space: pre-wrap;">${data.message}</div>
        </div>
      </div>
    `,
  }),
};

// ============================================
// WhatsApp Templates (Twilio format)
// ============================================

const WHATSAPP_TEMPLATES = {
  booking_confirmation: (data: Record<string, unknown>) =>
    `✅ *Class Confirmed!*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `📚 Class: ${data.className}\n` +
    `📅 Date: ${data.date}\n` +
    `⏰ Time: ${data.startTime} - ${data.endTime}\n` +
    `👩‍🏫 Instructor: ${data.instructorName}\n\n` +
    `_Cancellations: up to 12 hours before for a refund._`,

  booking_cancellation: (data: Record<string, unknown>) =>
    `❌ *Booking Cancelled*\n\n` +
    `Hi ${data.clientName},\n\n` +
    `📚 Class: ${data.className}\n` +
    `📅 Date: ${data.date}\n` +
    `⏰ Time: ${data.startTime}\n` +
    (data.reason ? `📝 Reason: ${data.reason}\n\n` : "\n") +
    (data.creditRefunded ? "✅ Credit refunded." : "⚠️ Credit not refunded (deadline passed)."),

  booking_reminder: (data: Record<string, unknown>) =>
    `⏰ *Class Reminder*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `Your class is *${data.timeUntil}*!\n\n` +
    `📚 ${data.className}\n` +
    `⏰ ${data.startTime} - ${data.endTime}\n` +
    `👩‍🏫 ${data.instructorName}\n\n` +
    `💧 Don't forget your water bottle!`,

  waitlist_spot_available: (data: Record<string, unknown>) =>
    `🎉 *Spot Available!*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `A spot just opened up:\n` +
    `📚 ${data.className}\n` +
    `📅 ${data.date}\n` +
    `⏰ ${data.startTime}\n\n` +
    `⚠️ *You have 30 minutes to confirm!*\n\n` +
    `Confirm your spot: ${data.confirmUrl}`,

  plan_expiring: (data: Record<string, unknown>) =>
    `⚠️ *Plan Expiring*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `Your plan *${data.planName}* expires in *${data.daysUntilExpiry} days*.\n\n` +
    `🎯 Remaining classes: ${data.remainingClasses}\n\n` +
    `Renew now: ${data.renewUrl}`,

  welcome: (data: Record<string, unknown>) =>
    `🎉 *Welcome to ${data.studioName}!*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `We're thrilled to have you with us! 💜\n\n` +
    (data.planName ? `✅ Plan activated: *${data.planName}* - ${data.totalClasses} classes\n\n` : "") +
    `Access the portal to book: ${data.dashboardUrl}`,

  class_cancelled: (data: Record<string, unknown>) =>
    `⚠️ *Class Cancelled*\n\n` +
    `Hi ${data.clientName},\n\n` +
    `The following class has been cancelled:\n` +
    `📚 ${data.className}\n` +
    `📅 ${data.date}\n` +
    `⏰ ${data.startTime}\n` +
    (data.reason ? `📝 ${data.reason}\n\n` : "\n") +
    `✅ Credit refunded automatically.\n\n` +
    `Book another class: ${data.bookingUrl}`,

  payment_confirmation: (data: Record<string, unknown>) =>
    `✅ *Payment Confirmed!*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `📋 Plan: ${data.planName}\n` +
    `💰 Amount: ${data.amount}\n` +
    `🎯 Classes: ${data.classesAdded}\n\n` +
    `Let's book! ${data.dashboardUrl}`,

  intake_form: (data: Record<string, unknown>) =>
    `📋 *Health Assessment*\n\n` +
    `Hi ${data.clientName}!\n\n` +
    `${data.studioName} needs you to complete a health assessment form before your first class.\n\n` +
    `This helps us provide safe, personalized instruction.\n\n` +
    `📝 Complete here: ${data.formUrl}\n\n` +
    `_Link expires in ${data.expiresInDays} days._`,

  custom: (data: Record<string, unknown>) =>
    data.message as string,
};

// ============================================
// Notification Service Class
// ============================================

export class NotificationService {
  private resend: Resend | null = null;
  private studioName = "FlexiWell Studio";
  private baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  // Main send method
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const { type, clientId, data, channels = "all" } = payload;
    const db = await getDatabase();

    // Get client details
    const client = await db.collection<Client>("clients").findOne({
      _id: { $toString: clientId } as unknown as Client["_id"],
    });

    if (!client) {
      // Try with ObjectId
      const { ObjectId } = await import("mongodb");
      const clientById = await db.collection<Client>("clients").findOne({
        _id: new ObjectId(clientId),
      });

      if (!clientById) {
        return { success: false, error: "Client not found" };
      }

      return this.sendToClient(type, clientById, data, channels);
    }

    return this.sendToClient(type, client, data, channels);
  }

  private async sendToClient(
    type: NotificationType,
    client: Client,
    data: Record<string, unknown>,
    channels: NotificationChannel
  ): Promise<NotificationResult> {
    const enrichedData = {
      ...data,
      clientName: client.name,
      studioName: this.studioName,
      dashboardUrl: `${this.baseUrl}/dashboard`,
      bookingUrl: `${this.baseUrl}/dashboard/classes/book`,
      renewUrl: `${this.baseUrl}/dashboard/plans`,
    };

    const results: NotificationResult = { success: true };

    // Send email
    if (channels === "email" || channels === "both" || channels === "all") {
      if (client.email) {
        const emailResult = await this.sendEmail(type, client.email, enrichedData);
        results.emailSent = emailResult.success;
        if (!emailResult.success) {
          results.error = emailResult.error;
        }
      }
    }

    // Send WhatsApp
    if (channels === "whatsapp" || channels === "both" || channels === "all") {
      if (client.phone) {
        const whatsappResult = await this.sendWhatsApp(type, client.phone, client._id?.toString() || "", enrichedData);
        results.whatsappSent = whatsappResult.success;
        if (!whatsappResult.success && !results.error) {
          results.error = whatsappResult.error;
        }
      }
    }

    // Send SMS
    if (channels === "sms" || channels === "all") {
      if (client.phone) {
        const smsResult = await this.sendSMS(type, client.phone, client._id?.toString() || "", enrichedData);
        results.smsSent = smsResult.success;
        if (!smsResult.success && !results.error) {
          results.error = smsResult.error;
        }
      }
    }

    // Update success status
    results.success = results.emailSent === true || results.whatsappSent === true || results.smsSent === true;

    return results;
  }

  // Send email via Resend
  private async sendEmail(
    type: NotificationType,
    email: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.resend) {
      console.log("[Email] Resend not configured, skipping email");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const templates = EMAIL_TEMPLATES as Record<string, ((data: Record<string, unknown>) => { subject: string; html: string }) | undefined>;
      const template = templates[type];
      if (!template) {
        return { success: false, error: `Template not found: ${type}` };
      }

      const { subject, html } = template(data);

      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

      const result = await this.resend.emails.send({
        from: `${this.studioName} <${fromEmail}>`,
        to: email,
        subject,
        html,
      });

      if (result.error) {
        console.error("[Email] Error sending:", result.error);
        await this.logNotification({
          type,
          channel: "email",
          clientId: data.clientId as string || "",
          clientName: data.clientName as string || "",
          recipient: email,
          subject,
          content: html,
          status: "failed",
          error: result.error.message,
          createdAt: new Date(),
        });
        return { success: false, error: result.error.message };
      }

      await this.logNotification({
        type,
        channel: "email",
        clientId: data.clientId as string || "",
        clientName: data.clientName as string || "",
        recipient: email,
        subject,
        content: html,
        status: "sent",
        sentAt: new Date(),
        createdAt: new Date(),
      });

      console.log(`[Email] Sent ${type} to ${email}`);
      return { success: true };

    } catch (error) {
      console.error("[Email] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Send WhatsApp via Twilio or Cloud API
  private async sendWhatsApp(
    type: NotificationType,
    phone: string,
    clientId: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    const credentials = await getWhatsAppCredentials();

    if (!credentials) {
      console.log("[WhatsApp] Credentials not configured, skipping");
      return { success: false, error: "WhatsApp service not configured" };
    }

    try {
      const templates = WHATSAPP_TEMPLATES as Record<string, ((data: Record<string, unknown>) => string) | undefined>;
      const template = templates[type];
      if (!template) {
        return { success: false, error: `Template not found: ${type}` };
      }

      const message = template(data);

      // Format phone number for WhatsApp
      const formattedPhone = formatPhoneForWhatsApp(phone);

      let response: Response;
      let result: Record<string, unknown>;

      if (credentials.provider === "cloud-api") {
        // Send via Cloud API
        const creds = credentials as CloudApiCredentials;
        const normalizedPhone = formattedPhone.replace(/\D/g, "");

        response = await fetch(
          `https://graph.facebook.com/v22.0/${creds.phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${creds.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: normalizedPhone,
              type: "text",
              text: { body: message },
            }),
          }
        );

        result = await response.json() as Record<string, unknown>;
      } else {
        // Send via Twilio
        const creds = credentials as TwilioCredentials;
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`;

        const body = new URLSearchParams({
          From: `whatsapp:${creds.phoneNumber}`,
          To: `whatsapp:${formattedPhone}`,
          Body: message,
        });

        response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });

        result = await response.json() as Record<string, unknown>;
      }

      if (!response.ok) {
        const errorMsg = (result.error as Record<string, unknown>)?.message || result.message || "Failed to send";
        console.error("[WhatsApp] Error sending:", result);
        await this.logNotification({
          type,
          channel: "whatsapp",
          clientId,
          clientName: data.clientName as string || "",
          recipient: formattedPhone,
          content: message,
          status: "failed",
          error: errorMsg as string,
          createdAt: new Date(),
        });
        return { success: false, error: errorMsg as string };
      }

      await this.logNotification({
        type,
        channel: "whatsapp",
        clientId,
        clientName: data.clientName as string || "",
        recipient: formattedPhone,
        content: message,
        status: "sent",
        sentAt: new Date(),
        createdAt: new Date(),
      });

      console.log(`[WhatsApp] Sent ${type} to ${formattedPhone}`);
      return { success: true };

    } catch (error) {
      console.error("[WhatsApp] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  }


  // Send SMS via Twilio
  private async sendSMS(
    type: NotificationType,
    phone: string,
    clientId: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean; error?: string }> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const smsNumber = process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !smsNumber) {
      console.log("[SMS] Twilio SMS not configured, skipping");
      return { success: false, error: "SMS service not configured" };
    }

    try {
      const template = SMS_TEMPLATES[type as keyof typeof SMS_TEMPLATES];
      if (!template) {
        return { success: false, error: `SMS template not found: ${type}` };
      }

      const message = template(data as Parameters<typeof template>[0]);

      // Format phone to E.164 (US-first)
      const cleaned = phone.replace(/\D/g, "");
      let formattedPhone: string;
      if (cleaned.startsWith("1") && cleaned.length === 11) {
        formattedPhone = `+${cleaned}`; // US number with country code
      } else if (cleaned.length === 10) {
        formattedPhone = `+1${cleaned}`; // US number without country code
      } else if (cleaned.length >= 12) {
        formattedPhone = `+${cleaned}`; // International with country code
      } else {
        formattedPhone = `+1${cleaned}`; // Default to US
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const body = new URLSearchParams({
        To: formattedPhone,
        From: smsNumber,
        Body: message,
      });

      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const result = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        const errorMsg = (result.message as string) || "Failed to send SMS";
        console.error("[SMS] Error sending:", result);
        await this.logNotification({
          type,
          channel: "sms",
          clientId,
          clientName: data.clientName as string || "",
          recipient: formattedPhone,
          content: message,
          status: "failed",
          error: errorMsg,
          createdAt: new Date(),
        });
        return { success: false, error: errorMsg };
      }

      await this.logNotification({
        type,
        channel: "sms",
        clientId,
        clientName: data.clientName as string || "",
        recipient: formattedPhone,
        content: message,
        status: "sent",
        sentAt: new Date(),
        createdAt: new Date(),
      });

      console.log(`[SMS] Sent ${type} to ${formattedPhone}`);
      return { success: true };
    } catch (error) {
      console.error("[SMS] Error:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Log notification to database
  private async logNotification(notification: NotificationRecord): Promise<void> {
    try {
      const db = await getDatabase();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...notificationData } = notification;
      await db.collection("notification_logs").insertOne(notificationData);
    } catch (error) {
      console.error("[Notification] Error logging:", error);
    }
  }

  // ============================================
  // Convenience Methods
  // ============================================

  async sendBookingConfirmation(booking: Booking, classDoc: Class): Promise<NotificationResult> {
    return this.send({
      type: "booking_confirmation",
      clientId: booking.clientId,
      data: {
        clientId: booking.clientId,
        className: classDoc.title,
        date: formatDateBR(classDoc.scheduledDate),
        startTime: classDoc.startTime,
        endTime: classDoc.endTime,
        instructorName: classDoc.instructorName,
        roomName: classDoc.location || "",
      },
    });
  }

  async sendBookingCancellation(
    booking: Booking,
    creditRefunded: boolean,
    reason?: string
  ): Promise<NotificationResult> {
    return this.send({
      type: "booking_cancellation",
      clientId: booking.clientId,
      data: {
        clientId: booking.clientId,
        className: booking.className,
        date: formatDateBR(booking.scheduledDate),
        startTime: booking.startTime,
        reason,
        creditRefunded,
      },
    });
  }

  async sendBookingReminder(
    booking: Booking,
    timeUntil: string
  ): Promise<NotificationResult> {
    return this.send({
      type: "booking_reminder",
      clientId: booking.clientId,
      data: {
        clientId: booking.clientId,
        className: booking.className,
        date: formatDateBR(booking.scheduledDate),
        startTime: booking.startTime,
        endTime: booking.endTime,
        instructorName: booking.instructorName,
        timeUntil,
      },
    });
  }

  async sendWaitlistSpotAvailable(
    clientId: string,
    classDoc: Class,
    confirmUrl: string
  ): Promise<NotificationResult> {
    return this.send({
      type: "waitlist_spot_available",
      clientId,
      data: {
        clientId,
        className: classDoc.title,
        date: formatDateBR(classDoc.scheduledDate),
        startTime: classDoc.startTime,
        confirmUrl,
      },
    });
  }

  async sendWelcome(client: Client, planName?: string, totalClasses?: number): Promise<NotificationResult> {
    return this.send({
      type: "welcome",
      clientId: client._id?.toString() || "",
      data: {
        clientId: client._id?.toString(),
        planName,
        totalClasses,
      },
    });
  }

  async sendClassCancelled(
    classDoc: Class,
    enrolledClientIds: string[],
    reason?: string
  ): Promise<{ total: number; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const clientId of enrolledClientIds) {
      const result = await this.send({
        type: "class_cancelled",
        clientId,
        data: {
          clientId,
          className: classDoc.title,
          date: formatDateBR(classDoc.scheduledDate),
          startTime: classDoc.startTime,
          reason,
        },
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { total: enrolledClientIds.length, sent, failed };
  }

  async sendPaymentConfirmation(
    clientId: string,
    planName: string,
    amount: string,
    paymentMethod: string,
    classesAdded: number
  ): Promise<NotificationResult> {
    return this.send({
      type: "payment_confirmation",
      clientId,
      data: {
        clientId,
        planName,
        amount,
        paymentMethod,
        classesAdded,
      },
    });
  }

  async sendPlanExpiring(
    client: Client,
    daysUntilExpiry: number
  ): Promise<NotificationResult> {
    return this.send({
      type: "plan_expiring",
      clientId: client._id?.toString() || "",
      data: {
        clientId: client._id?.toString(),
        planName: client.plan.type,
        daysUntilExpiry,
        expiryDate: formatDateBR(client.plan.endDate),
        remainingClasses: client.plan.remainingClasses,
      },
    });
  }

  async sendIntakeFormLink(
    clientId: string,
    formUrl: string,
    channel: NotificationChannel = "email",
    expiresInDays: number = 7
  ): Promise<NotificationResult> {
    return this.send({
      type: "intake_form",
      clientId,
      data: {
        clientId,
        formUrl,
        expiresInDays,
      },
      channels: channel,
    });
  }

  async sendCustomMessage(
    clientId: string,
    subject: string,
    message: string,
    channels: NotificationChannel = "all"
  ): Promise<NotificationResult> {
    return this.send({
      type: "custom",
      clientId,
      data: {
        clientId,
        subject,
        message,
      },
      channels,
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
