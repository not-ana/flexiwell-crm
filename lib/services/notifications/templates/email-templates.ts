// Email Templates - SRP: Only template definitions
import type { NotificationData } from "../../interfaces";

type EmailTemplate = (data: NotificationData) => { subject: string; html: string };

// Base email wrapper for consistent styling
const emailWrapper = (title: string, bgColor: string, content: string, studioName: string) => `
  <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: ${bgColor}; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
    </div>
    <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
      ${content}
      <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; text-align: center;">
        ${studioName} • See you soon! 💜
      </p>
    </div>
  </div>
`;

const infoBox = (items: string[], borderColor: string) => `
  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
    ${items.map((item) => `<p style="margin: 5px 0; color: #64748b;">${item}</p>`).join("")}
  </div>
`;

const button = (text: string, url: string, color: string) => `
  <div style="text-align: center; margin-top: 30px;">
    <a href="${url}" style="background: ${color}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      ${text}
    </a>
  </div>
`;

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  booking_confirmation: (data) => ({
    subject: `✅ Class Confirmed - ${data.className}`,
    html: emailWrapper(
      "Class Confirmed! 🎉",
      "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Your class has been booked successfully!</p>
        ${infoBox(
          [
            `📚 <strong>Class:</strong> ${data.className}`,
            `📅 <strong>Date:</strong> ${data.date}`,
            `⏰ <strong>Time:</strong> ${data.startTime} - ${data.endTime}`,
            `👩‍🏫 <strong>Instructor:</strong> ${data.instructorName}`,
            ...(data.roomName ? [`🏠 <strong>Room:</strong> ${data.roomName}`] : []),
          ],
          "#7c3aed"
        )}
        <p style="font-size: 14px; color: #64748b;">
          Remember: cancellations must be made at least 12 hours in advance for a credit refund.
        </p>
        ${button("View My Bookings", data.dashboardUrl as string, "#7c3aed")}
      `,
      data.studioName as string
    ),
  }),

  booking_cancellation: (data) => ({
    subject: `❌ Booking Cancelled - ${data.className}`,
    html: emailWrapper(
      "Booking Cancelled",
      "#ef4444",
      `
        <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Your booking has been cancelled.</p>
        ${infoBox(
          [
            `📚 <strong>Class:</strong> ${data.className}`,
            `📅 <strong>Date:</strong> ${data.date}`,
            `⏰ <strong>Time:</strong> ${data.startTime}`,
            ...(data.reason ? [`📝 <strong>Reason:</strong> ${data.reason}`] : []),
          ],
          "#ef4444"
        )}
        ${
          data.creditRefunded
            ? `<p style="font-size: 14px; color: #22c55e; background: #f0fdf4; padding: 10px; border-radius: 8px;">
                ✅ Credit has been refunded to your plan.
              </p>`
            : `<p style="font-size: 14px; color: #ef4444; background: #fef2f2; padding: 10px; border-radius: 8px;">
                ⚠️ Late cancellation - credit not refunded.
              </p>`
        }
        ${button("Book Another Class", data.bookingUrl as string, "#7c3aed")}
      `,
      data.studioName as string
    ),
  }),

  booking_reminder: (data) => ({
    subject: `⏰ Reminder: Your class is ${data.timeUntil}`,
    html: emailWrapper(
      "Class Reminder ⏰",
      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Your class is <strong>${data.timeUntil}</strong>!</p>
        ${infoBox(
          [
            `📚 <strong>Class:</strong> ${data.className}`,
            `📅 <strong>Date:</strong> ${data.date}`,
            `⏰ <strong>Time:</strong> ${data.startTime} - ${data.endTime}`,
            `👩‍🏫 <strong>Instructor:</strong> ${data.instructorName}`,
          ],
          "#3b82f6"
        )}
        <p style="font-size: 14px; color: #64748b; text-align: center;">
          Don't forget your water bottle! 💧
        </p>
      `,
      data.studioName as string
    ),
  }),

  waitlist_spot_available: (data) => ({
    subject: `🎉 Spot Available! - ${data.className}`,
    html: emailWrapper(
      "Spot Available! 🎉",
      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">A spot just opened up in the class you were waitlisted for!</p>
        ${infoBox(
          [
            `📚 <strong>Class:</strong> ${data.className}`,
            `📅 <strong>Date:</strong> ${data.date}`,
            `⏰ <strong>Time:</strong> ${data.startTime}`,
          ],
          "#10b981"
        )}
        <p style="font-size: 14px; color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 8px; text-align: center;">
          ⏳ You have <strong>30 minutes</strong> to confirm your spot!
        </p>
        ${button("Confirm My Spot", data.confirmUrl as string, "#10b981")}
      `,
      data.studioName as string
    ),
  }),

  plan_expiring: (data) => ({
    subject: `⚠️ Your plan expires in ${data.daysUntilExpiry} days`,
    html: emailWrapper(
      "Plan Expiring ⚠️",
      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Your plan <strong>${data.planName}</strong> expires in <strong>${data.daysUntilExpiry} days</strong>.</p>
        ${infoBox(
          [
            `📋 <strong>Plan:</strong> ${data.planName}`,
            `📅 <strong>Expires on:</strong> ${data.expiryDate}`,
            `🎯 <strong>Remaining classes:</strong> ${data.remainingClasses}`,
          ],
          "#f59e0b"
        )}
        <p style="font-size: 14px; color: #64748b;">
          Renew now and don't miss your favorite classes!
        </p>
        ${button("Renew Plan", data.renewUrl as string, "#f59e0b")}
      `,
      data.studioName as string
    ),
  }),

  welcome: (data) => ({
    subject: `🎉 Welcome to ${data.studioName}!`,
    html: emailWrapper(
      "Welcome! 🎉",
      "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">We're so happy to welcome you!</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #7c3aed; margin-top: 0;">Next steps:</h3>
          <p style="margin: 10px 0; color: #64748b;">1️⃣ Access the client portal to see available classes</p>
          <p style="margin: 10px 0; color: #64748b;">2️⃣ Book your first class</p>
          <p style="margin: 10px 0; color: #64748b;">3️⃣ Don't forget to wear comfortable clothes!</p>
        </div>
        ${
          data.planName
            ? `<div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #22c55e;">
                  ✅ Plan activated: <strong>${data.planName}</strong> - ${data.totalClasses} classes
                </p>
              </div>`
            : ""
        }
        ${button("Access Portal", data.dashboardUrl as string, "#7c3aed")}
        <p style="font-size: 14px; color: #64748b; margin-top: 30px; text-align: center;">
          If you have any questions, we're here to help! 💜
        </p>
      `,
      data.studioName as string
    ),
  }),

  class_cancelled: (data) => ({
    subject: `⚠️ Class Cancelled - ${data.className}`,
    html: emailWrapper(
      "Class Cancelled ⚠️",
      "#ef4444",
      `
        <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Unfortunately, the following class has been cancelled:</p>
        ${infoBox(
          [
            `📚 <strong>Class:</strong> ${data.className}`,
            `📅 <strong>Date:</strong> ${data.date}`,
            `⏰ <strong>Time:</strong> ${data.startTime}`,
            ...(data.reason ? [`📝 <strong>Reason:</strong> ${data.reason}`] : []),
          ],
          "#ef4444"
        )}
        <p style="font-size: 14px; color: #22c55e; background: #f0fdf4; padding: 12px; border-radius: 8px;">
          ✅ Credit has been refunded to your plan automatically.
        </p>
        ${button("Book Another Class", data.bookingUrl as string, "#7c3aed")}
        <p style="font-size: 14px; color: #64748b; margin-top: 20px; text-align: center;">
          We apologize for the inconvenience.
        </p>
      `,
      data.studioName as string
    ),
  }),

  payment_confirmation: (data) => ({
    subject: `✅ Payment Confirmed - ${data.planName}`,
    html: emailWrapper(
      "Payment Confirmed! ✅",
      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Your payment has been processed successfully!</p>
        ${infoBox(
          [
            `📋 <strong>Plan:</strong> ${data.planName}`,
            `💰 <strong>Amount:</strong> ${data.amount}`,
            `💳 <strong>Method:</strong> ${data.paymentMethod}`,
            `🎯 <strong>Classes added:</strong> ${data.classesAdded}`,
          ],
          "#10b981"
        )}
        ${button("Book Classes", data.dashboardUrl as string, "#10b981")}
      `,
      data.studioName as string
    ),
  }),

  intake_form: (data) => ({
    subject: `Complete Your Health Assessment - ${data.studioName}`,
    html: emailWrapper(
      "Health Assessment",
      "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
        <p style="font-size: 16px; color: #334155;">Please complete your health assessment form before your first class. This helps us provide safe, personalized instruction.</p>
        ${button("Complete Health Assessment", data.formUrl as string, "#7c3aed")}
        <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 20px;">
          This link expires in ${data.expiresInDays} days.
        </p>
      `,
      data.studioName as string
    ),
  }),

  custom: (data) => ({
    subject: (data.subject as string) || "Message from Studio",
    html: emailWrapper(
      data.studioName as string,
      "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
      `
        <p style="font-size: 16px; color: #334155;">Hi <strong>${data.clientName}</strong>,</p>
        <div style="font-size: 16px; color: #334155; white-space: pre-wrap;">${data.message}</div>
      `,
      data.studioName as string
    ),
  }),
};
