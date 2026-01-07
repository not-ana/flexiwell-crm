// Email module - centralized email sending for FlexiWell CRM
export { sendEmail, sendBatchEmails, type EmailOptions, type EmailResult } from "./resend";
export * from "./templates";

import { sendEmail } from "./resend";
import {
  bookingConfirmationTemplate,
  bookingCancellationTemplate,
  classReminderTemplate,
  paymentConfirmationTemplate,
  waitlistNotificationTemplate,
  welcomeEmailTemplate,
  passwordResetTemplate,
  supportTicketUpdateTemplate,
  planExpirationReminderTemplate,
  trialEndingTemplate,
  paymentFailedTemplate,
  upcomingInvoiceTemplate,
} from "./templates";

// Convenience functions for common email types
export const EmailService = {
  // Send booking confirmation email
  async sendBookingConfirmation(
    to: string,
    data: {
      clientName: string;
      className: string;
      instructorName: string;
      date: string;
      time: string;
      location?: string;
      studioName?: string;
    }
  ) {
    return sendEmail({
      to,
      subject: `Booking Confirmed: ${data.className}`,
      html: bookingConfirmationTemplate(data),
    });
  },

  // Send booking cancellation email
  async sendBookingCancellation(
    to: string,
    data: {
      clientName: string;
      className: string;
      date: string;
      time: string;
      reason?: string;
      studioName?: string;
    }
  ) {
    return sendEmail({
      to,
      subject: `Booking Cancelled: ${data.className}`,
      html: bookingCancellationTemplate(data),
    });
  },

  // Send class reminder (24h before)
  async sendClassReminder(
    to: string,
    data: {
      clientName: string;
      className: string;
      instructorName: string;
      date: string;
      time: string;
      location?: string;
      studioName?: string;
    }
  ) {
    return sendEmail({
      to,
      subject: `Reminder: ${data.className} Tomorrow`,
      html: classReminderTemplate(data),
    });
  },

  // Send payment confirmation
  async sendPaymentConfirmation(
    to: string,
    data: {
      clientName: string;
      amount: number;
      currency: string;
      planName?: string;
      transactionId?: string;
      date: string;
      studioName?: string;
    }
  ) {
    return sendEmail({
      to,
      subject: "Payment Received - Thank You!",
      html: paymentConfirmationTemplate(data),
    });
  },

  // Send waitlist notification
  async sendWaitlistNotification(
    to: string,
    data: {
      clientName: string;
      className: string;
      date: string;
      time: string;
      spotsAvailable: number;
      expiresAt: string;
      bookingUrl?: string;
      studioName?: string;
    }
  ) {
    return sendEmail({
      to,
      subject: `Spot Available: ${data.className}`,
      html: waitlistNotificationTemplate(data),
    });
  },

  // Send welcome email to new clients
  async sendWelcomeEmail(
    to: string,
    data: {
      clientName: string;
      email: string;
      temporaryPassword?: string;
      loginUrl?: string;
      studioName?: string;
    }
  ) {
    return sendEmail({
      to,
      subject: `Welcome to ${data.studioName || "FlexiWell"}!`,
      html: welcomeEmailTemplate(data),
    });
  },

  // Send password reset email
  async sendPasswordReset(
    to: string,
    data: {
      clientName: string;
      resetUrl: string;
      expiresIn: string;
      studioName?: string;
    }
  ) {
    return sendEmail({
      to,
      subject: "Reset Your Password",
      html: passwordResetTemplate(data),
    });
  },

  // Send support ticket update
  async sendSupportUpdate(
    to: string,
    data: {
      clientName: string;
      ticketId: string;
      subject: string;
      status: string;
      message?: string;
      studioName?: string;
    }
  ) {
    return sendEmail({
      to,
      subject: `Support Ticket #${data.ticketId} - ${data.status.replace("_", " ").toUpperCase()}`,
      html: supportTicketUpdateTemplate(data),
    });
  },

  // Send plan expiration reminder
  async sendPlanExpirationReminder(
    to: string,
    data: {
      clientName: string;
      planName: string;
      expirationDate: string;
      daysRemaining: number;
      renewalUrl?: string;
      studioName?: string;
    }
  ) {
    return sendEmail({
      to,
      subject: `Your Plan Expires in ${data.daysRemaining} Days`,
      html: planExpirationReminderTemplate(data),
    });
  },

  // Send trial ending notification
  async sendTrialEndingNotification(
    to: string,
    data: {
      clientName: string;
      trialEndDate: string;
      daysRemaining: number;
      planName?: string;
      upgradeUrl?: string;
      studioName?: string;
    }
  ) {
    return sendEmail({
      to,
      subject: `Your Trial Ends in ${data.daysRemaining} Days`,
      html: trialEndingTemplate(data),
    });
  },

  // Send payment failed notification
  async sendPaymentFailedNotification(
    to: string,
    data: {
      clientName: string;
      amount: number;
      currency: string;
      failureReason?: string;
      retryDate?: string;
      updatePaymentUrl?: string;
      studioName?: string;
    }
  ) {
    return sendEmail({
      to,
      subject: "Action Required: Payment Failed",
      html: paymentFailedTemplate(data),
    });
  },

  // Send upcoming invoice notification
  async sendUpcomingInvoiceNotification(
    to: string,
    data: {
      clientName: string;
      amount: number;
      currency: string;
      chargeDate: string;
      planName?: string;
      studioName?: string;
    }
  ) {
    return sendEmail({
      to,
      subject: "Upcoming Payment Reminder",
      html: upcomingInvoiceTemplate(data),
    });
  },
};
