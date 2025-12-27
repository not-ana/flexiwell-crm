import { NextRequest, NextResponse } from "next/server";
import { WhatsAppBotHandler } from "@/lib/whatsapp/bot-handler";
import { TwilioWhatsAppService, initializeTwilioService } from "@/lib/whatsapp/twilio-service";
import { IncomingMessage } from "@/lib/whatsapp/types";

// Initialize Twilio service (in production, use env vars)
function getTwilioConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || "",
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
      const config = getTwilioConfig();
      const url = request.url;

      const isValid = TwilioWhatsAppService.validateWebhookSignature(
        config.authToken,
        twilioSignature,
        url,
        body
      );

      if (!isValid) {
        console.error("Invalid Twilio signature");
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Parse incoming message
    const from = body.From?.replace("whatsapp:", "").replace("+", "") || "";
    const messageBody = body.Body || "";
    const messageSid = body.MessageSid || "";
    const profileName = body.ProfileName || "";

    console.log(`WhatsApp message from ${from}: ${messageBody}`);

    // Create incoming message format
    const incomingMessage: IncomingMessage = {
      from,
      id: messageSid,
      timestamp: new Date().toISOString(),
      type: "text",
      text: { body: messageBody },
    };

    // Get establishment ID from phone number mapping (in production, query database)
    const establishmentId = await getEstablishmentByPhone(body.To?.replace("whatsapp:", "").replace("+", "") || "");

    if (!establishmentId) {
      console.error("No establishment found for phone number");
      return NextResponse.json({ error: "Establishment not found" }, { status: 404 });
    }

    // Initialize bot handler
    const botHandler = new WhatsAppBotHandler(establishmentId, "pro");

    // Process message
    const response = await botHandler.handleMessage(incomingMessage);

    // Send response via Twilio
    const twilioConfig = getTwilioConfig();
    if (twilioConfig.accountSid && twilioConfig.authToken) {
      const twilioService = initializeTwilioService(twilioConfig);

      if ("type" in response && response.type === "button") {
        await twilioService.sendInteractiveMessage(from, response);
      } else if ("body" in response && typeof response.body === "string") {
        await twilioService.sendTextMessage(from, response.body);
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
    console.error("Twilio webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to get establishment by Twilio phone number
async function getEstablishmentByPhone(phoneNumber: string): Promise<string | null> {
  // In production, query database
  // SELECT establishment_id FROM whatsapp_configs WHERE twilio_number = ?

  // Mock: return default establishment
  return "default-establishment";
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Twilio WhatsApp Webhook",
    timestamp: new Date().toISOString(),
  });
}
