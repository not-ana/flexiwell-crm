import { NextRequest, NextResponse } from "next/server";
import { WhatsAppBotHandler } from "@/lib/whatsapp/bot-handler";
import { TwilioSMSService, initializeSMSService } from "@/lib/sms/twilio-sms-service";
import { getDatabase } from "@/lib/db/mongodb";
import type { IncomingMessage, InteractiveContent } from "@/lib/whatsapp/types";
import type { EstablishmentWhatsAppCredentials } from "@/lib/db/schemas";
import { SMS_BOT_ENABLED, smsBotDisabledResponse } from "@/lib/features/sms-bot";

// Initialize Twilio SMS service config
function getTwilioSMSConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    // Use dedicated SMS number or fall back to WhatsApp number
    phoneNumber: process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_PHONE_NUMBER || "",
  };
}

/**
 * Convert an interactive bot response (with buttons) to plain SMS text
 */
function formatResponseForSMS(response: InteractiveContent | { body: string }): string {
  // Simple text response
  if (!("type" in response)) {
    return response.body;
  }

  // Interactive response - convert to numbered text
  let message = "";

  if (response.header?.text) {
    message += `${response.header.text}\n\n`;
  }

  message += response.body.text;

  // Convert buttons to numbered options
  const action = response.action as {
    buttons?: Array<{ reply: { id: string; title: string } }>;
  } | undefined;

  if (action?.buttons && action.buttons.length > 0) {
    message += "\n\n";
    action.buttons.forEach((btn, index) => {
      message += `${index + 1}. ${btn.reply.title}\n`;
    });
    message += "\nReply with the number of your choice.";
  }

  if (response.footer?.text) {
    message += `\n\n${response.footer.text}`;
  }

  // Strip WhatsApp markdown (*bold*) for SMS
  message = message.replace(/\*/g, "");

  return message;
}

// Twilio sends webhooks as form-urlencoded
export async function POST(request: NextRequest) {
  if (!SMS_BOT_ENABLED) return smsBotDisabledResponse();
  try {
    const formData = await request.formData();
    const body: Record<string, string> = {};

    formData.forEach((value, key) => {
      body[key] = value.toString();
    });

    // Validate webhook signature in production
    const twilioSignature = request.headers.get("X-Twilio-Signature");
    if (process.env.NODE_ENV === "production" && twilioSignature) {
      const config = getTwilioSMSConfig();
      const url = request.url;

      const isValid = TwilioSMSService.validateWebhookSignature(
        config.authToken,
        twilioSignature,
        url,
        body
      );

      if (!isValid) {
        console.error("Invalid Twilio SMS signature");
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Parse incoming SMS message
    const from = body.From?.replace("+", "") || "";
    const messageBody = body.Body || "";
    const messageSid = body.MessageSid || "";

    console.log(`SMS message from ${from}: ${messageBody}`);

    // Create incoming message format (same as WhatsApp)
    const incomingMessage: IncomingMessage = {
      from,
      id: messageSid,
      timestamp: new Date().toISOString(),
      type: "text",
      text: { body: messageBody },
    };

    // Get establishment ID from phone number mapping
    const toNumber = body.To?.replace("+", "") || "";
    const establishmentId = await getEstablishmentByPhone(toNumber);

    if (!establishmentId) {
      console.error(`No establishment found for SMS number: ${toNumber}`);
      // Return TwiML so Twilio doesn't retry
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { status: 200, headers: { "Content-Type": "text/xml" } }
      );
    }

    // Initialize bot handler with SMS channel
    const botHandler = new WhatsAppBotHandler(establishmentId, "pro", "sms");

    // Process message through bot
    const response = await botHandler.handleMessage(incomingMessage);

    // Send response via Twilio SMS
    const twilioConfig = getTwilioSMSConfig();
    if (twilioConfig.accountSid && twilioConfig.authToken && twilioConfig.phoneNumber) {
      const smsService = initializeSMSService(twilioConfig);
      const smsText = formatResponseForSMS(response);
      await smsService.sendTextMessage(from, smsText);
    }

    // Return TwiML empty response (Twilio expects this)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (error) {
    console.error("SMS webhook error:", error);
    // Always return TwiML to prevent Twilio retries
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { "Content-Type": "text/xml" } }
    );
  }
}

/**
 * Look up establishment by the Twilio phone number receiving the SMS.
 * Checks establishment_whatsapp_credentials (which also stores SMS/Twilio config)
 * and falls back to TWILIO_SMS_NUMBER env match → first active establishment.
 */
async function getEstablishmentByPhone(phoneNumber: string): Promise<string | null> {
  const db = await getDatabase();
  const normalized = phoneNumber.replace(/\D/g, "");

  // 1. Check whatsapp credentials collection (also stores Twilio phone numbers)
  const credential = await db
    .collection<EstablishmentWhatsAppCredentials>("establishment_whatsapp_credentials")
    .findOne({
      $or: [
        { phoneNumber: normalized },
        { phoneNumber: `+${normalized}` },
        { twilioPhoneNumber: `+${normalized}` },
        { twilioPhoneNumber: normalized },
      ],
      isConnected: true,
    });

  if (credential) {
    return credential.establishmentId;
  }

  // 2. If the incoming number matches our env config, use the first active establishment
  const envNumber = (process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_PHONE_NUMBER || "")
    .replace(/\D/g, "");

  if (envNumber && normalized === envNumber) {
    const establishment = await db.collection("establishments").findOne(
      { status: { $ne: "inactive" } },
      { projection: { _id: 1 } }
    );
    return establishment?._id?.toString() || null;
  }

  return null;
}

// Health check endpoint
export async function GET() {
  if (!SMS_BOT_ENABLED) return smsBotDisabledResponse();
  return NextResponse.json({
    status: "ok",
    service: "Twilio SMS Webhook",
    timestamp: new Date().toISOString(),
  });
}
