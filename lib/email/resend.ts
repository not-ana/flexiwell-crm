import { Resend } from "resend";

// Lazy initialization of Resend client to avoid build-time errors
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

// Default from email (should be configured in environment)
const DEFAULT_FROM = process.env.EMAIL_FROM || "FlexiWell <noreply@flexiwell.com>";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// Send a single email
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const { to, subject, html, text, from, replyTo } = options;

    const { data, error } = await getResend().emails.send({
      from: from || DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || stripHtml(html),
      replyTo,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

// Send batch emails (up to 100)
export async function sendBatchEmails(
  emails: Array<{
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
  }>
): Promise<{ success: boolean; results: EmailResult[] }> {
  try {
    const emailPromises = emails.map((email) =>
      sendEmail({
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      })
    );

    const results = await Promise.all(emailPromises);
    const allSuccessful = results.every((r) => r.success);

    return {
      success: allSuccessful,
      results,
    };
  } catch (error) {
    console.error("Error sending batch emails:", error);
    return {
      success: false,
      results: [
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to send batch emails",
        },
      ],
    };
  }
}

// Helper to strip HTML tags for text version
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
