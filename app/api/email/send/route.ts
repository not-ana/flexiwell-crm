import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
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
} from "@/lib/email/templates";

type EmailType =
  | "booking_confirmation"
  | "booking_cancellation"
  | "class_reminder"
  | "payment_confirmation"
  | "waitlist_notification"
  | "welcome"
  | "password_reset"
  | "support_update"
  | "plan_expiration";

// POST /api/email/send - Send an email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, to, data } = body;

    if (!type || !to || !data) {
      return NextResponse.json(
        { error: "Type, recipient (to), and data are required" },
        { status: 400 }
      );
    }

    // Generate email content based on type
    let subject: string;
    let html: string;

    switch (type as EmailType) {
      case "booking_confirmation":
        subject = `Booking Confirmed: ${data.className}`;
        html = bookingConfirmationTemplate(data);
        break;

      case "booking_cancellation":
        subject = `Booking Cancelled: ${data.className}`;
        html = bookingCancellationTemplate(data);
        break;

      case "class_reminder":
        subject = `Reminder: ${data.className} Tomorrow`;
        html = classReminderTemplate(data);
        break;

      case "payment_confirmation":
        subject = "Payment Received - Thank You!";
        html = paymentConfirmationTemplate(data);
        break;

      case "waitlist_notification":
        subject = `Spot Available: ${data.className}`;
        html = waitlistNotificationTemplate(data);
        break;

      case "welcome":
        subject = `Welcome to ${data.studioName || "FlexiWell"}!`;
        html = welcomeEmailTemplate(data);
        break;

      case "password_reset":
        subject = "Reset Your Password";
        html = passwordResetTemplate(data);
        break;

      case "support_update":
        subject = `Support Ticket #${data.ticketId} - ${data.status.replace("_", " ").toUpperCase()}`;
        html = supportTicketUpdateTemplate(data);
        break;

      case "plan_expiration":
        subject = `Your Plan Expires in ${data.daysRemaining} Days`;
        html = planExpirationReminderTemplate(data);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 }
        );
    }

    // Send the email
    const result = await sendEmail({
      to,
      subject,
      html,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.id,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
