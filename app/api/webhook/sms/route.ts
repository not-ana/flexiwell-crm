import { NextRequest, NextResponse } from "next/server";
import { WhatsAppBotHandler } from "@/lib/whatsapp/bot-handler";
import { TwilioSMSService, initializeSMSService } from "@/lib/sms/twilio-sms-service";
import { IncomingMessage } from "@/lib/whatsapp/types";

// Initialize Twilio SMS service config
function getTwilioSMSConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    // Use dedicated SMS number or fall back to WhatsApp number
    phoneNumber: process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_PHONE_NUMBER || "",
  };
}

// Twilio sends webhooks as form-urlencoded
export async function POST(request: NextRequest) {
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
    // The bot handler is channel-agnostic
    const incomingMessage: IncomingMessage = {
      from,
      id: messageSid,
      timestamp: new Date().toISOString(),
      type: "text",
      text: { body: messageBody },
    };

    // Get establishment ID from phone number mapping
    const establishmentId = await getEstablishmentByPhone(body.To?.replace("+", "") || "");

    if (!establishmentId) {
      console.error("No establishment found for SMS phone number");
      return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    }

    // Initialize bot handler (reuses WhatsApp bot logic)
    const botHandler = new WhatsAppBotHandler(establishmentId, "pro");

    // Process message - same logic as WhatsApp
    const response = await botHandler.handleMessage(incomingMessage);

    // Send response via Twilio SMS
    const twilioConfig = getTwilioSMSConfig();
    if (twilioConfig.accountSid && twilioConfig.authToken && twilioConfig.phoneNumber) {
      const smsService = initializeSMSService(twilioConfig);

      if ("type" in response && response.type === "button") {
        // Convert button response to SMS format
        const header = response.header?.text;
        const bodyText = response.body.text;
        const options = response.action?.buttons?.map((btn: { reply: { id: string; title: string } }) => ({
          id: btn.reply.id,
          title: btn.reply.title,
        })) || [];
        const footer = response.footer?.text;

        await smsService.sendInteractiveMessage(from, header, bodyText, options, footer);
      } else if ("body" in response && typeof response.body === "string") {
        await smsService.sendTextMessage(from, response.body);
      }
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to get establishment by Twilio phone number
async function getEstablishmentByPhone(phoneNumber: string): Promise<string | null> {
  // In production, query database
  // SELECT establishment_id FROM sms_configs WHERE twilio_number = ?

  // Mock: return default establishment
  return "default-establishment";
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Twilio SMS Webhook",
    timestamp: new Date().toISOString(),
  });
}
