// Intake Service - Auto-generate health assessment token and send to client
import { getDatabase } from "@/lib/db/mongodb";
import { generateSecureToken } from "@/lib/security";
import { notificationService, type NotificationChannel } from "@/lib/services/notification.service";
import type { HealthAssessmentToken } from "@/lib/db/schemas";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DEFAULT_EXPIRES_DAYS = 7;

/**
 * Get the studio's preferred notification channel from settings.
 * Falls back to "sms" (US market default).
 */
async function getStudioChannel(db: Awaited<ReturnType<typeof getDatabase>>): Promise<NotificationChannel> {
  const settings = await db.collection("settings").findOne({});
  const channel = settings?.primaryMessagingChannel;
  if (channel === "whatsapp") return "whatsapp";
  return "sms"; // US market default
}

/**
 * Generate a health assessment token and send the link to the client.
 * Sends via the studio's preferred channel (SMS or WhatsApp) + email.
 */
export async function sendIntakeForm(params: {
  clientId: string;
  clientName: string;
  clientEmail: string;
  createdBy: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  const { clientId, clientName, clientEmail, createdBy } = params;

  try {
    const db = await getDatabase();

    // Check if client already has a submitted health assessment
    const existingAssessment = await db.collection("health_assessments").findOne({
      clientId,
      status: { $in: ["submitted", "reviewed"] },
    });

    if (existingAssessment) {
      return { success: true }; // Already completed, no need to send
    }

    // Find establishment for this admin/teacher
    const establishment = await db.collection("establishments").findOne({
      $or: [
        { ownerId: createdBy },
        { staffIds: createdBy },
      ],
    });

    const establishmentId = establishment?._id?.toString() || "";

    // Get studio's preferred channel
    const channel = await getStudioChannel(db);

    // Check for existing unexpired token for this client
    const existingToken = await db.collection("health_assessment_tokens").findOne({
      clientId,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (existingToken) {
      // Token already exists and is valid, just re-send the notification
      const url = `${BASE_URL}/health-assessment/${existingToken.token}`;
      await notificationService.sendIntakeFormLink(clientId, url, channel, DEFAULT_EXPIRES_DAYS);
      return { success: true, url };
    }

    // Generate new token
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEFAULT_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
    const token = generateSecureToken(32);

    const tokenDoc: HealthAssessmentToken = {
      token,
      clientId,
      clientEmail,
      clientName,
      establishmentId,
      createdBy,
      expiresAt,
      isUsed: false,
      createdAt: now,
    };

    await db.collection<HealthAssessmentToken>("health_assessment_tokens").insertOne(tokenDoc);

    const url = `${BASE_URL}/health-assessment/${token}`;

    // Send via studio's preferred channel only — not all channels
    await notificationService.sendIntakeFormLink(clientId, url, channel, DEFAULT_EXPIRES_DAYS);

    return { success: true, url };
  } catch (error) {
    console.error("[Intake] Error sending intake form:", error);
    return { success: false, error: (error as Error).message };
  }
}
