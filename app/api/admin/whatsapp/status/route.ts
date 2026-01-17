import { NextResponse } from "next/server";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import { getWhatsAppCredentials } from "@/lib/integrations/credentials";

// GET - Check WhatsApp connection status (uses env vars automatically)
export async function GET() {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const credentials = await getWhatsAppCredentials();

    if (!credentials) {
      return NextResponse.json({
        connected: false,
        message: "WhatsApp not configured",
      });
    }

    // Test the connection by making a simple API call
    if (credentials.provider === "cloud-api") {
      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}?fields=verified_name,quality_rating`,
          {
            headers: {
              Authorization: `Bearer ${credentials.accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            connected: true,
            provider: "cloud-api",
            phoneNumber: data.verified_name || "WhatsApp Business",
            qualityRating: data.quality_rating || "unknown",
          });
        } else {
          const errorData = await response.json();
          return NextResponse.json({
            connected: false,
            error: errorData.error?.message || "Failed to connect to WhatsApp API",
          });
        }
      } catch {
        return NextResponse.json({
          connected: false,
          error: "Failed to verify WhatsApp connection",
        });
      }
    }

    // Twilio provider
    return NextResponse.json({
      connected: true,
      provider: "twilio",
      phoneNumber: (credentials as { phoneNumber?: string }).phoneNumber || "Unknown",
    });
  } catch (error) {
    console.error("WhatsApp status error:", error);
    return NextResponse.json(
      { error: "Failed to check WhatsApp status" },
      { status: 500 }
    );
  }
}
