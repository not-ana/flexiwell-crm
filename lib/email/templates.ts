// Email templates for FlexiWell CRM

const BASE_STYLES = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f5; }
  .container { max-width: 600px; margin: 0 auto; background: white; }
  .header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 32px 24px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
  .content { padding: 32px 24px; }
  .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
  .button:hover { background: #6d28d9; }
  .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; }
  .info-box { background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; }
  .highlight { color: #7c3aed; font-weight: 600; }
  h2 { color: #111827; margin-top: 0; }
  p { margin: 12px 0; }
`;

const wrapTemplate = (content: string, studioName: string = "FlexiWell") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${studioName}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${studioName}</h1>
    </div>
    ${content}
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${studioName}. All rights reserved.</p>
      <p>If you have any questions, please contact us.</p>
    </div>
  </div>
</body>
</html>
`;

// Booking confirmation email
export function bookingConfirmationTemplate(data: {
  clientName: string;
  className: string;
  instructorName: string;
  date: string;
  time: string;
  location?: string;
  studioName?: string;
}): string {
  const content = `
    <div class="content">
      <h2>Booking Confirmed!</h2>
      <p>Hi ${data.clientName},</p>
      <p>Your booking has been confirmed. Here are the details:</p>

      <div class="info-box">
        <p><strong>Class:</strong> ${data.className}</p>
        <p><strong>Instructor:</strong> ${data.instructorName}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ""}
      </div>

      <p>Please arrive 10 minutes before your class starts.</p>
      <p>See you soon!</p>
    </div>
  `;
  return wrapTemplate(content, data.studioName);
}

// Booking cancellation email
export function bookingCancellationTemplate(data: {
  clientName: string;
  className: string;
  date: string;
  time: string;
  reason?: string;
  studioName?: string;
}): string {
  const content = `
    <div class="content">
      <h2>Booking Cancelled</h2>
      <p>Hi ${data.clientName},</p>
      <p>Your booking has been cancelled as requested.</p>

      <div class="info-box">
        <p><strong>Class:</strong> ${data.className}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
      </div>

      <p>If you'd like to book another class, please visit our website or contact us.</p>
    </div>
  `;
  return wrapTemplate(content, data.studioName);
}

// Class reminder email (24h before)
export function classReminderTemplate(data: {
  clientName: string;
  className: string;
  instructorName: string;
  date: string;
  time: string;
  location?: string;
  studioName?: string;
}): string {
  const content = `
    <div class="content">
      <h2>Class Reminder</h2>
      <p>Hi ${data.clientName},</p>
      <p>This is a friendly reminder that your class is coming up tomorrow!</p>

      <div class="info-box">
        <p><strong>Class:</strong> ${data.className}</p>
        <p><strong>Instructor:</strong> ${data.instructorName}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ""}
      </div>

      <p>Remember to bring:</p>
      <ul>
        <li>Comfortable clothing</li>
        <li>Water bottle</li>
        <li>Towel (optional)</li>
      </ul>

      <p>See you tomorrow!</p>
    </div>
  `;
  return wrapTemplate(content, data.studioName);
}

// Payment confirmation email
export function paymentConfirmationTemplate(data: {
  clientName: string;
  amount: number;
  currency: string;
  planName?: string;
  transactionId?: string;
  date: string;
  studioName?: string;
}): string {
  const currencySymbol = data.currency === "BRL" ? "R$" : data.currency === "EUR" ? "€" : "$";
  const content = `
    <div class="content">
      <h2>Payment Received</h2>
      <p>Hi ${data.clientName},</p>
      <p>Thank you! Your payment has been received successfully.</p>

      <div class="info-box">
        <p><strong>Amount:</strong> ${currencySymbol} ${data.amount.toFixed(2)}</p>
        ${data.planName ? `<p><strong>Plan:</strong> ${data.planName}</p>` : ""}
        <p><strong>Date:</strong> ${data.date}</p>
        ${data.transactionId ? `<p><strong>Transaction ID:</strong> ${data.transactionId}</p>` : ""}
      </div>

      <p>If you have any questions about your payment, please don't hesitate to contact us.</p>
    </div>
  `;
  return wrapTemplate(content, data.studioName);
}

// Waitlist notification email
export function waitlistNotificationTemplate(data: {
  clientName: string;
  className: string;
  date: string;
  time: string;
  spotsAvailable: number;
  expiresAt: string;
  bookingUrl?: string;
  studioName?: string;
}): string {
  const content = `
    <div class="content">
      <h2>Spot Available!</h2>
      <p>Hi ${data.clientName},</p>
      <p>Great news! A spot has opened up in a class you were waiting for.</p>

      <div class="info-box">
        <p><strong>Class:</strong> ${data.className}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        <p><strong>Spots Available:</strong> ${data.spotsAvailable}</p>
      </div>

      <p style="color: #dc2626;"><strong>Important:</strong> This offer expires at ${data.expiresAt}. Please respond quickly to secure your spot!</p>

      ${data.bookingUrl ? `<a href="${data.bookingUrl}" class="button">Book Now</a>` : ""}

      <p>If you're no longer interested, no action is needed and your spot on the waitlist will be released to the next person.</p>
    </div>
  `;
  return wrapTemplate(content, data.studioName);
}

// Welcome email for new clients
export function welcomeEmailTemplate(data: {
  clientName: string;
  email: string;
  temporaryPassword?: string;
  loginUrl?: string;
  studioName?: string;
}): string {
  const content = `
    <div class="content">
      <h2>Welcome to ${data.studioName || "FlexiWell"}!</h2>
      <p>Hi ${data.clientName},</p>
      <p>We're excited to have you join us! Your account has been created successfully.</p>

      <div class="info-box">
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.temporaryPassword ? `<p><strong>Temporary Password:</strong> ${data.temporaryPassword}</p>` : ""}
      </div>

      ${data.temporaryPassword ? "<p>Please change your password after your first login for security.</p>" : ""}

      ${data.loginUrl ? `<a href="${data.loginUrl}" class="button">Log In to Your Account</a>` : ""}

      <p>What you can do:</p>
      <ul>
        <li>Browse and book classes</li>
        <li>View your schedule</li>
        <li>Track your progress</li>
        <li>Manage your membership</li>
      </ul>

      <p>If you have any questions, we're here to help!</p>
    </div>
  `;
  return wrapTemplate(content, data.studioName);
}

// Password reset email
export function passwordResetTemplate(data: {
  clientName: string;
  resetUrl: string;
  expiresIn: string;
  studioName?: string;
}): string {
  const content = `
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>Hi ${data.clientName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>

      <a href="${data.resetUrl}" class="button">Reset Password</a>

      <p>This link will expire in ${data.expiresIn}.</p>

      <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
  `;
  return wrapTemplate(content, data.studioName);
}

// Support ticket update email
export function supportTicketUpdateTemplate(data: {
  clientName: string;
  ticketId: string;
  subject: string;
  status: string;
  message?: string;
  studioName?: string;
}): string {
  const statusColors: Record<string, string> = {
    open: "#3b82f6",
    in_progress: "#f59e0b",
    resolved: "#10b981",
    closed: "#6b7280",
  };
  const statusColor = statusColors[data.status] || "#6b7280";

  const content = `
    <div class="content">
      <h2>Support Ticket Update</h2>
      <p>Hi ${data.clientName},</p>
      <p>There's an update on your support ticket.</p>

      <div class="info-box">
        <p><strong>Ticket ID:</strong> #${data.ticketId}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${data.status.replace("_", " ").toUpperCase()}</span></p>
      </div>

      ${data.message ? `
        <div style="background: #f9fafb; padding: 16px; border-left: 4px solid #7c3aed; margin: 16px 0;">
          <p style="margin: 0;"><strong>Message from support:</strong></p>
          <p style="margin: 8px 0 0 0;">${data.message}</p>
        </div>
      ` : ""}

      <p>If you need further assistance, please reply to this email or contact our support team.</p>
    </div>
  `;
  return wrapTemplate(content, data.studioName);
}

// Plan expiration reminder
export function planExpirationReminderTemplate(data: {
  clientName: string;
  planName: string;
  expirationDate: string;
  daysRemaining: number;
  renewalUrl?: string;
  studioName?: string;
}): string {
  const content = `
    <div class="content">
      <h2>Plan Expiring Soon</h2>
      <p>Hi ${data.clientName},</p>
      <p>Just a heads up - your membership plan is expiring soon!</p>

      <div class="info-box">
        <p><strong>Plan:</strong> ${data.planName}</p>
        <p><strong>Expires:</strong> ${data.expirationDate}</p>
        <p><strong>Days Remaining:</strong> <span class="highlight">${data.daysRemaining} days</span></p>
      </div>

      <p>Don't miss out on your classes! Renew now to continue enjoying all the benefits of your membership.</p>

      ${data.renewalUrl ? `<a href="${data.renewalUrl}" class="button">Renew Now</a>` : ""}

      <p>If you have any questions about your membership, please contact us.</p>
    </div>
  `;
  return wrapTemplate(content, data.studioName);
}

// Trial ending reminder email
export function trialEndingTemplate(data: {
  clientName: string;
  trialEndDate: string;
  daysRemaining: number;
  planName?: string;
  upgradeUrl?: string;
  studioName?: string;
}): string {
  const content = `
    <div class="content">
      <h2>Your Trial is Ending Soon</h2>
      <p>Hi ${data.clientName},</p>
      <p>Thank you for trying our service! Your free trial is coming to an end.</p>

      <div class="info-box">
        <p><strong>Trial Ends:</strong> ${data.trialEndDate}</p>
        <p><strong>Days Remaining:</strong> <span class="highlight">${data.daysRemaining} days</span></p>
        ${data.planName ? `<p><strong>Current Plan:</strong> ${data.planName}</p>` : ""}
      </div>

      <p>To continue enjoying all the benefits and features, please add your payment method before your trial ends.</p>

      ${data.upgradeUrl ? `<a href="${data.upgradeUrl}" class="button">Continue My Subscription</a>` : ""}

      <p>If you have any questions or need assistance, we're here to help!</p>
    </div>
  `;
  return wrapTemplate(content, data.studioName);
}

// Payment failed email
export function paymentFailedTemplate(data: {
  clientName: string;
  amount: number;
  currency: string;
  failureReason?: string;
  retryDate?: string;
  updatePaymentUrl?: string;
  studioName?: string;
}): string {
  const currencySymbol = data.currency === "BRL" ? "R$" : data.currency === "EUR" ? "€" : "$";
  const content = `
    <div class="content">
      <h2>Payment Failed</h2>
      <p>Hi ${data.clientName},</p>
      <p>We were unable to process your payment. Don't worry - this happens sometimes and is usually easy to fix.</p>

      <div class="info-box" style="border-left: 4px solid #ef4444;">
        <p><strong>Amount:</strong> ${currencySymbol}${data.amount.toFixed(2)}</p>
        ${data.failureReason ? `<p><strong>Reason:</strong> ${data.failureReason}</p>` : ""}
        ${data.retryDate ? `<p><strong>Next Retry:</strong> ${data.retryDate}</p>` : ""}
      </div>

      <p>To avoid service interruption, please update your payment method:</p>

      ${data.updatePaymentUrl ? `<a href="${data.updatePaymentUrl}" class="button">Update Payment Method</a>` : ""}

      <p>If you believe this is a mistake or need assistance, please contact our support team.</p>
    </div>
  `;
  return wrapTemplate(content, data.studioName);
}

// Upcoming invoice notification email
export function upcomingInvoiceTemplate(data: {
  clientName: string;
  amount: number;
  currency: string;
  chargeDate: string;
  planName?: string;
  studioName?: string;
}): string {
  const currencySymbol = data.currency === "BRL" ? "R$" : data.currency === "EUR" ? "€" : "$";
  const content = `
    <div class="content">
      <h2>Upcoming Payment Reminder</h2>
      <p>Hi ${data.clientName},</p>
      <p>This is a friendly reminder that your subscription will be renewed soon.</p>

      <div class="info-box">
        ${data.planName ? `<p><strong>Plan:</strong> ${data.planName}</p>` : ""}
        <p><strong>Amount:</strong> ${currencySymbol}${data.amount.toFixed(2)}</p>
        <p><strong>Charge Date:</strong> ${data.chargeDate}</p>
      </div>

      <p>Your payment method on file will be charged automatically. If you need to make any changes, please update your payment information before the charge date.</p>

      <p>Thank you for being a valued member!</p>
    </div>
  `;
  return wrapTemplate(content, data.studioName);
}
