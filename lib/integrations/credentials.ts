import { getDatabase } from "@/lib/db/mongodb";
import type {
  WhatsAppCredentials,
  TwilioCredentials,
  CloudApiCredentials,
  WhatsAppProvider,
} from "@/lib/whatsapp/types";
import type { EstablishmentWhatsAppCredentials } from "@/lib/db/schemas";

// Re-export for convenience
export type { WhatsAppCredentials, TwilioCredentials, CloudApiCredentials };

// Collection name for per-establishment WhatsApp credentials
const WHATSAPP_CREDENTIALS_COLLECTION = "establishment_whatsapp_credentials";

// Legacy interface for backwards compatibility
interface LegacyWhatsAppCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface StripeCredentials {
  secretKey: string;
  publishableKey: string;
  webhookSecret?: string;
}

interface InstagramCredentials {
  accessToken: string;
  pageId: string;
  appId?: string;
}

interface GoogleCalendarCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken?: string;
}

interface MailchimpCredentials {
  apiKey: string;
  listId?: string;
}

interface ZapierCredentials {
  webhookUrl: string;
}

interface WellhubCredentials {
  bearerToken: string;
  gymId: string;
  webhookSecret: string;
}

interface TotalPassCredentials {
  apiKey: string;
  partnerId: string;
  webhookSecret: string;
}

interface ClassPassCredentials {
  apiKey: string;
  venueId: string;
  webhookSecret: string;
}

// Get WhatsApp credentials from database (supports Twilio and Cloud API)
export async function getWhatsAppCredentials(): Promise<WhatsAppCredentials | null> {
  try {
    const db = await getDatabase();
    const settings = await db.collection("integration_credentials").findOne({});

    // Check for Cloud API credentials first (new format)
    if (settings?.whatsapp?.provider === "cloud-api" && settings?.whatsapp?.phoneNumberId) {
      return {
        provider: "cloud-api",
        phoneNumberId: settings.whatsapp.phoneNumberId,
        accessToken: settings.whatsapp.accessToken,
        businessAccountId: settings.whatsapp.businessAccountId,
        verifyToken: settings.whatsapp.verifyToken,
      } as CloudApiCredentials;
    }

    // Check for Twilio credentials (legacy format)
    if (settings?.whatsapp?.accountSid) {
      return {
        provider: "twilio",
        accountSid: settings.whatsapp.accountSid,
        authToken: settings.whatsapp.authToken,
        phoneNumber: settings.whatsapp.phoneNumber,
      } as TwilioCredentials;
    }

    // Fallback to environment variables for Cloud API
    if (process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN) {
      return {
        provider: "cloud-api",
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
      } as CloudApiCredentials;
    }

    return null;
  } catch (error) {
    console.error("Error fetching WhatsApp credentials:", error);
    return null;
  }
}

// Get WhatsApp provider type
export async function getWhatsAppProvider(): Promise<WhatsAppProvider | null> {
  const credentials = await getWhatsAppCredentials();
  return credentials?.provider || null;
}

// Get legacy Twilio credentials (for backwards compatibility)
export async function getTwilioCredentials(): Promise<LegacyWhatsAppCredentials | null> {
  const credentials = await getWhatsAppCredentials();
  if (credentials?.provider === "twilio") {
    const twilioCreds = credentials as TwilioCredentials;
    return {
      accountSid: twilioCreds.accountSid,
      authToken: twilioCreds.authToken,
      phoneNumber: twilioCreds.phoneNumber,
    };
  }
  return null;
}

// Get Cloud API credentials
export async function getCloudApiCredentials(): Promise<CloudApiCredentials | null> {
  const credentials = await getWhatsAppCredentials();
  if (credentials?.provider === "cloud-api") {
    return credentials as CloudApiCredentials;
  }
  return null;
}

// Get Stripe credentials from database (falls back to env for platform-level config)
export async function getStripeCredentials(): Promise<StripeCredentials | null> {
  try {
    // First check database for tenant-specific credentials
    const db = await getDatabase();
    const settings = await db.collection("integration_credentials").findOne({});

    if (settings?.stripe?.secretKey) {
      return {
        secretKey: settings.stripe.secretKey,
        publishableKey: settings.stripe.publishableKey,
        webhookSecret: settings.stripe.webhookSecret,
      };
    }

    // Fallback to environment variables (platform-level)
    if (process.env.STRIPE_SECRET_KEY) {
      return {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching Stripe credentials:", error);
    return null;
  }
}

// Get Instagram credentials from database
export async function getInstagramCredentials(): Promise<InstagramCredentials | null> {
  try {
    const db = await getDatabase();
    const settings = await db.collection("integration_credentials").findOne({});

    if (!settings?.instagram?.accessToken) {
      return null;
    }

    return {
      accessToken: settings.instagram.accessToken,
      pageId: settings.instagram.pageId,
      appId: settings.instagram.appId,
    };
  } catch (error) {
    console.error("Error fetching Instagram credentials:", error);
    return null;
  }
}

// Get Google Calendar credentials from database
export async function getGoogleCalendarCredentials(): Promise<GoogleCalendarCredentials | null> {
  try {
    const db = await getDatabase();
    const settings = await db.collection("integration_credentials").findOne({});

    if (!settings?.googleCalendar?.clientId) {
      return null;
    }

    return {
      clientId: settings.googleCalendar.clientId,
      clientSecret: settings.googleCalendar.clientSecret,
      refreshToken: settings.googleCalendar.refreshToken,
    };
  } catch (error) {
    console.error("Error fetching Google Calendar credentials:", error);
    return null;
  }
}

// Get Mailchimp credentials from database
export async function getMailchimpCredentials(): Promise<MailchimpCredentials | null> {
  try {
    const db = await getDatabase();
    const settings = await db.collection("integration_credentials").findOne({});

    if (!settings?.mailchimp?.apiKey) {
      return null;
    }

    return {
      apiKey: settings.mailchimp.apiKey,
      listId: settings.mailchimp.listId,
    };
  } catch (error) {
    console.error("Error fetching Mailchimp credentials:", error);
    return null;
  }
}

// Get Zapier credentials from database
export async function getZapierCredentials(): Promise<ZapierCredentials | null> {
  try {
    const db = await getDatabase();
    const settings = await db.collection("integration_credentials").findOne({});

    if (!settings?.zapier?.webhookUrl) {
      return null;
    }

    return {
      webhookUrl: settings.zapier.webhookUrl,
    };
  } catch (error) {
    console.error("Error fetching Zapier credentials:", error);
    return null;
  }
}

// Get Wellhub credentials from database (with env fallback)
export async function getWellhubCredentials(): Promise<WellhubCredentials | null> {
  try {
    // First check database for tenant-specific credentials
    const db = await getDatabase();
    const settings = await db.collection("integration_credentials").findOne({});

    // Check provider-based document
    const providerCreds = await db.collection("integration_credentials").findOne({ provider: "wellhub" });
    if (providerCreds?.bearerToken) {
      return {
        bearerToken: providerCreds.bearerToken,
        gymId: providerCreds.gymId,
        webhookSecret: providerCreds.webhookSecret || "",
      };
    }

    if (settings?.wellhub?.bearerToken) {
      return {
        bearerToken: settings.wellhub.bearerToken,
        gymId: settings.wellhub.gymId,
        webhookSecret: settings.wellhub.webhookSecret,
      };
    }

    // Fallback to environment variables
    if (process.env.WELLHUB_BEARER_TOKEN) {
      return {
        bearerToken: process.env.WELLHUB_BEARER_TOKEN,
        gymId: process.env.WELLHUB_GYM_ID || "",
        webhookSecret: process.env.WELLHUB_WEBHOOK_SECRET || "",
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching Wellhub credentials:", error);
    return null;
  }
}

// Get TotalPass credentials from database (with env fallback)
export async function getTotalPassCredentials(): Promise<TotalPassCredentials | null> {
  try {
    const db = await getDatabase();

    // Check provider-based document
    const providerCreds = await db.collection("integration_credentials").findOne({ provider: "totalpass" });
    if (providerCreds?.apiKey) {
      return {
        apiKey: providerCreds.apiKey,
        partnerId: providerCreds.partnerId,
        webhookSecret: providerCreds.webhookSecret || "",
      };
    }

    // Check settings document
    const settings = await db.collection("integration_credentials").findOne({});
    if (settings?.totalpass?.apiKey) {
      return {
        apiKey: settings.totalpass.apiKey,
        partnerId: settings.totalpass.partnerId,
        webhookSecret: settings.totalpass.webhookSecret || "",
      };
    }

    // Fallback to environment variables
    if (process.env.TOTALPASS_API_KEY) {
      return {
        apiKey: process.env.TOTALPASS_API_KEY,
        partnerId: process.env.TOTALPASS_PARTNER_ID || "",
        webhookSecret: process.env.TOTALPASS_WEBHOOK_SECRET || "",
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching TotalPass credentials:", error);
    return null;
  }
}

// Get ClassPass credentials from database (with env fallback)
export async function getClassPassCredentials(): Promise<ClassPassCredentials | null> {
  try {
    const db = await getDatabase();

    // Check provider-based document
    const providerCreds = await db.collection("integration_credentials").findOne({ provider: "classpass" });
    if (providerCreds?.apiKey) {
      return {
        apiKey: providerCreds.apiKey,
        venueId: providerCreds.venueId,
        webhookSecret: providerCreds.webhookSecret || "",
      };
    }

    // Check settings document
    const settings = await db.collection("integration_credentials").findOne({});
    if (settings?.classpass?.apiKey) {
      return {
        apiKey: settings.classpass.apiKey,
        venueId: settings.classpass.venueId,
        webhookSecret: settings.classpass.webhookSecret || "",
      };
    }

    // Fallback to environment variables
    if (process.env.CLASSPASS_API_KEY) {
      return {
        apiKey: process.env.CLASSPASS_API_KEY,
        venueId: process.env.CLASSPASS_VENUE_ID || "",
        webhookSecret: process.env.CLASSPASS_WEBHOOK_SECRET || "",
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching ClassPass credentials:", error);
    return null;
  }
}

// Check if an integration is connected
export async function isIntegrationConnected(integrationId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const settings = await db.collection("integration_credentials").findOne({});

    // Check for provider-based document
    const providerCreds = await db.collection("integration_credentials").findOne({ provider: integrationId });

    switch (integrationId) {
      case "stripe":
        return !!settings?.stripe?.secretKey || !!process.env.STRIPE_SECRET_KEY;
      case "whatsapp":
        // Support both Twilio (accountSid) and Cloud API (phoneNumberId)
        return !!(
          settings?.whatsapp?.accountSid ||
          settings?.whatsapp?.phoneNumberId ||
          process.env.WHATSAPP_PHONE_NUMBER_ID
        );
      case "instagram":
        return !!settings?.instagram?.accessToken;
      case "google_calendar":
        return !!settings?.googleCalendar?.refreshToken || !!process.env.GOOGLE_CALENDAR_CLIENT_ID;
      case "mailchimp":
        return !!settings?.mailchimp?.apiKey;
      case "zapier":
        return !!settings?.zapier?.webhookUrl;
      case "wellhub":
        return !!providerCreds?.bearerToken || !!settings?.wellhub?.bearerToken || !!process.env.WELLHUB_BEARER_TOKEN;
      case "totalpass":
        return !!providerCreds?.apiKey || !!settings?.totalpass?.apiKey || !!process.env.TOTALPASS_API_KEY;
      case "classpass":
        return !!providerCreds?.apiKey || !!settings?.classpass?.apiKey || !!process.env.CLASSPASS_API_KEY;
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking integration status:", error);
    return false;
  }
}

// ============================================================================
// Per-Establishment WhatsApp Credentials (Multi-tenant)
// ============================================================================

/**
 * Get WhatsApp credentials for a specific establishment
 */
export async function getEstablishmentWhatsAppCredentials(
  establishmentId: string
): Promise<EstablishmentWhatsAppCredentials | null> {
  try {
    const db = await getDatabase();
    const credentials = await db
      .collection<EstablishmentWhatsAppCredentials>(WHATSAPP_CREDENTIALS_COLLECTION)
      .findOne({ establishmentId, isConnected: true });

    return credentials;
  } catch (error) {
    console.error("Error fetching establishment WhatsApp credentials:", error);
    return null;
  }
}

/**
 * Get WhatsApp credentials by phone number ID (for webhook routing)
 * Used when a message comes in to identify which establishment it belongs to
 */
export async function getEstablishmentByPhoneNumberId(
  phoneNumberId: string
): Promise<EstablishmentWhatsAppCredentials | null> {
  try {
    const db = await getDatabase();
    const credentials = await db
      .collection<EstablishmentWhatsAppCredentials>(WHATSAPP_CREDENTIALS_COLLECTION)
      .findOne({ phoneNumberId, isConnected: true });

    return credentials;
  } catch (error) {
    console.error("Error fetching establishment by phone number ID:", error);
    return null;
  }
}

/**
 * Get WhatsApp credentials by normalized phone number (for webhook routing)
 */
export async function getEstablishmentByPhoneNumber(
  phoneNumber: string
): Promise<EstablishmentWhatsAppCredentials | null> {
  try {
    // Normalize phone number (remove non-digits)
    const normalizedPhone = phoneNumber.replace(/\D/g, "");

    const db = await getDatabase();
    const credentials = await db
      .collection<EstablishmentWhatsAppCredentials>(WHATSAPP_CREDENTIALS_COLLECTION)
      .findOne({ phoneNumber: normalizedPhone, isConnected: true });

    return credentials;
  } catch (error) {
    console.error("Error fetching establishment by phone number:", error);
    return null;
  }
}

/**
 * Save or update WhatsApp credentials for an establishment
 */
export async function saveEstablishmentWhatsAppCredentials(
  establishmentId: string,
  credentials: Partial<EstablishmentWhatsAppCredentials>
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const now = new Date();

    // Normalize phone number if provided
    let normalizedPhone = credentials.phoneNumber;
    if (normalizedPhone) {
      normalizedPhone = normalizedPhone.replace(/\D/g, "");
    }

    const updateDoc = {
      ...credentials,
      establishmentId,
      companyId: establishmentId, // For backwards compatibility
      phoneNumber: normalizedPhone || "",
      updatedAt: now,
    };

    const result = await db
      .collection<EstablishmentWhatsAppCredentials>(WHATSAPP_CREDENTIALS_COLLECTION)
      .updateOne(
        { establishmentId },
        {
          $set: updateDoc,
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );

    return result.acknowledged;
  } catch (error) {
    console.error("Error saving establishment WhatsApp credentials:", error);
    return false;
  }
}

/**
 * Disconnect WhatsApp for an establishment
 */
export async function disconnectEstablishmentWhatsApp(
  establishmentId: string
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db
      .collection<EstablishmentWhatsAppCredentials>(WHATSAPP_CREDENTIALS_COLLECTION)
      .updateOne(
        { establishmentId },
        {
          $set: {
            isConnected: false,
            connectionStatus: "disconnected" as const,
            updatedAt: new Date(),
          },
        }
      );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Error disconnecting establishment WhatsApp:", error);
    return false;
  }
}

/**
 * Check if an establishment has WhatsApp connected
 */
export async function isEstablishmentWhatsAppConnected(
  establishmentId: string
): Promise<boolean> {
  const credentials = await getEstablishmentWhatsAppCredentials(establishmentId);
  return credentials?.isConnected === true;
}

/**
 * Get all establishments with WhatsApp connected (for admin overview)
 */
export async function getAllConnectedWhatsAppEstablishments(): Promise<
  EstablishmentWhatsAppCredentials[]
> {
  try {
    const db = await getDatabase();
    const credentials = await db
      .collection<EstablishmentWhatsAppCredentials>(WHATSAPP_CREDENTIALS_COLLECTION)
      .find({ isConnected: true })
      .toArray();

    return credentials;
  } catch (error) {
    console.error("Error fetching all connected WhatsApp establishments:", error);
    return [];
  }
}
