import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/middleware";
import {
  getEstablishmentWhatsAppCredentials,
  saveEstablishmentWhatsAppCredentials,
  disconnectEstablishmentWhatsApp,
} from "@/lib/integrations/credentials";

// GET - Get WhatsApp credentials for the current establishment
export async function GET(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get establishmentId from query or user context
    const searchParams = request.nextUrl.searchParams;
    const establishmentId = searchParams.get("establishmentId") || user.userId;

    if (!establishmentId) {
      return NextResponse.json(
        { error: "Establishment ID is required" },
        { status: 400 }
      );
    }

    const credentials = await getEstablishmentWhatsAppCredentials(establishmentId);

    if (!credentials) {
      return NextResponse.json({
        connected: false,
        establishmentId,
      });
    }

    // Return credentials without sensitive tokens
    return NextResponse.json({
      connected: credentials.isConnected,
      establishmentId: credentials.establishmentId,
      provider: credentials.provider,
      phoneNumber: credentials.displayPhoneNumber || credentials.phoneNumber,
      phoneNumberId: credentials.phoneNumberId,
      connectionStatus: credentials.connectionStatus,
      qualityRating: credentials.qualityRating,
      botEnabled: credentials.botEnabled,
      botFeatures: credentials.botFeatures,
      botCommands: credentials.botCommands,
      botWelcomeMessage: credentials.botWelcomeMessage,
      connectedAt: credentials.connectedAt,
      lastVerifiedAt: credentials.lastVerifiedAt,
    });
  } catch (error) {
    console.error("Error fetching WhatsApp credentials:", error);
    return NextResponse.json(
      { error: "Failed to fetch WhatsApp credentials" },
      { status: 500 }
    );
  }
}

// POST - Save WhatsApp credentials for an establishment
export async function POST(request: NextRequest) {
  try {
    const { user, error } = requireRole(request, ["admin"]);
    if (error || !user) {
      return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      establishmentId,
      provider,
      phoneNumberId,
      accessToken,
      businessAccountId,
      verifyToken,
      phoneNumber,
      displayPhoneNumber,
      twilioAccountSid,
      twilioAuthToken,
      twilioPhoneNumber,
      botEnabled,
      botFeatures,
    } = body;

    // Use user's ID as establishmentId if not provided
    const targetEstablishmentId = establishmentId || user.userId;

    if (!targetEstablishmentId) {
      return NextResponse.json(
        { error: "Establishment ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields based on provider
    if (provider === "cloud-api") {
      if (!phoneNumberId || !accessToken) {
        return NextResponse.json(
          { error: "Phone Number ID and Access Token are required for Cloud API" },
          { status: 400 }
        );
      }
    } else if (provider === "twilio") {
      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        return NextResponse.json(
          { error: "Account SID, Auth Token, and Phone Number are required for Twilio" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid provider. Use 'cloud-api' or 'twilio'" },
        { status: 400 }
      );
    }

    // Prepare credentials object
    const credentials = {
      provider: provider as "cloud-api" | "twilio",
      phoneNumberId: provider === "cloud-api" ? phoneNumberId : undefined,
      accessToken: provider === "cloud-api" ? accessToken : undefined,
      businessAccountId: provider === "cloud-api" ? businessAccountId : undefined,
      verifyToken: provider === "cloud-api" ? (verifyToken || `flexiwell-${targetEstablishmentId}-${Date.now()}`) : undefined,
      twilioAccountSid: provider === "twilio" ? twilioAccountSid : undefined,
      twilioAuthToken: provider === "twilio" ? twilioAuthToken : undefined,
      twilioPhoneNumber: provider === "twilio" ? twilioPhoneNumber : undefined,
      phoneNumber: phoneNumber || twilioPhoneNumber || "",
      displayPhoneNumber: displayPhoneNumber || phoneNumber || twilioPhoneNumber || "",
      isConnected: true,
      connectionStatus: "active" as const,
      botEnabled: botEnabled ?? true,
      botFeatures: botFeatures || {
        viewClasses: true,
        confirmAttendance: true,
        cancelClass: true,
        bookNewClass: true,
        automaticReminders: true,
      },
      connectedAt: new Date(),
    };

    const success = await saveEstablishmentWhatsAppCredentials(
      targetEstablishmentId,
      credentials
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to save WhatsApp credentials" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp credentials saved successfully",
      establishmentId: targetEstablishmentId,
      verifyToken: credentials.verifyToken,
    });
  } catch (error) {
    console.error("Error saving WhatsApp credentials:", error);
    return NextResponse.json(
      { error: "Failed to save WhatsApp credentials" },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect WhatsApp for an establishment
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = requireRole(request, ["admin"]);
    if (error || !user) {
      return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const establishmentId = searchParams.get("establishmentId") || user.userId;

    if (!establishmentId) {
      return NextResponse.json(
        { error: "Establishment ID is required" },
        { status: 400 }
      );
    }

    const success = await disconnectEstablishmentWhatsApp(establishmentId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to disconnect WhatsApp or already disconnected" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting WhatsApp:", error);
    return NextResponse.json(
      { error: "Failed to disconnect WhatsApp" },
      { status: 500 }
    );
  }
}

// PATCH - Update bot settings for an establishment
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = requireRole(request, ["admin"]);
    if (error || !user) {
      return error || NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { establishmentId, botEnabled, botFeatures, botCommands, botWelcomeMessage } = body;

    const targetEstablishmentId = establishmentId || user.userId;

    if (!targetEstablishmentId) {
      return NextResponse.json(
        { error: "Establishment ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (typeof botEnabled === "boolean") {
      updateData.botEnabled = botEnabled;
    }
    if (botFeatures) {
      updateData.botFeatures = botFeatures;
    }
    if (botCommands) {
      updateData.botCommands = botCommands;
    }
    if (typeof botWelcomeMessage === "string") {
      updateData.botWelcomeMessage = botWelcomeMessage;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const success = await saveEstablishmentWhatsAppCredentials(
      targetEstablishmentId,
      updateData
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update WhatsApp settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating WhatsApp settings:", error);
    return NextResponse.json(
      { error: "Failed to update WhatsApp settings" },
      { status: 500 }
    );
  }
}
