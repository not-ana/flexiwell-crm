import { NextResponse } from "next/server";

// GET - Check WhatsApp connection status (uses env vars directly)
export async function GET() {
  try {
    // Read directly from environment variables
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    // Debug: check if env vars exist
    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({
        connected: false,
        message: "WhatsApp not configured",
        debug: {
          hasPhoneNumberId: !!phoneNumberId,
          hasAccessToken: !!accessToken,
        },
      });
    }

    // Test the connection by making a simple API call to Meta
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}?fields=verified_name,quality_rating`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        return NextResponse.json({
          connected: true,
          provider: "cloud-api",
          phoneNumber: data.verified_name || "WhatsApp Business",
          qualityRating: data.quality_rating || "unknown",
        });
      } else {
        return NextResponse.json({
          connected: false,
          error: data.error?.message || "Failed to connect to WhatsApp API",
          errorCode: data.error?.code,
        });
      }
    } catch (fetchError) {
      return NextResponse.json({
        connected: false,
        error: "Failed to verify WhatsApp connection",
        details: String(fetchError),
      });
    }
  } catch (error) {
    console.error("WhatsApp status error:", error);
    return NextResponse.json({
      connected: false,
      error: "Failed to check WhatsApp status",
      details: String(error),
    });
  }
}
