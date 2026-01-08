import { getDatabase } from "@/lib/db/mongodb";

interface WhatsAppCredentials {
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

// Get WhatsApp (Twilio) credentials from database
export async function getWhatsAppCredentials(): Promise<WhatsAppCredentials | null> {
  try {
    const db = await getDatabase();
    const settings = await db.collection("integration_credentials").findOne({});

    if (!settings?.whatsapp?.accountSid) {
      return null;
    }

    return {
      accountSid: settings.whatsapp.accountSid,
      authToken: settings.whatsapp.authToken,
      phoneNumber: settings.whatsapp.phoneNumber,
    };
  } catch (error) {
    console.error("Error fetching WhatsApp credentials:", error);
    return null;
  }
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

// Check if an integration is connected
export async function isIntegrationConnected(integrationId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const settings = await db.collection("integration_credentials").findOne({});

    switch (integrationId) {
      case "stripe":
        return !!settings?.stripe?.secretKey || !!process.env.STRIPE_SECRET_KEY;
      case "whatsapp":
        return !!settings?.whatsapp?.accountSid;
      case "instagram":
        return !!settings?.instagram?.accessToken;
      case "google_calendar":
        return !!settings?.googleCalendar?.refreshToken || !!process.env.GOOGLE_CALENDAR_CLIENT_ID;
      case "mailchimp":
        return !!settings?.mailchimp?.apiKey;
      case "zapier":
        return !!settings?.zapier?.webhookUrl;
      case "wellhub":
        return !!settings?.wellhub?.bearerToken || !!process.env.WELLHUB_BEARER_TOKEN;
      default:
        return false;
    }
  } catch (error) {
    console.error("Error checking integration status:", error);
    return false;
  }
}
