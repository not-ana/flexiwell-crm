import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { AuthorizedClient, User } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// POST /api/company/check-authorization - Check if a client is pre-authorized
// Used during registration to verify if email/phone/cpf is in the authorized list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, identifierType } = body;

    if (!identifier || !identifierType) {
      return NextResponse.json(
        { error: "identifier and identifierType are required" },
        { status: 400 }
      );
    }

    if (!["email", "phone", "cpf"].includes(identifierType)) {
      return NextResponse.json(
        { error: "Invalid identifier type. Must be email, phone, or cpf" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Normalize identifier
    let normalizedIdentifier = identifier.trim();
    if (identifierType === "email") {
      normalizedIdentifier = normalizedIdentifier.toLowerCase();
    } else if (identifierType === "phone" || identifierType === "cpf") {
      normalizedIdentifier = normalizedIdentifier.replace(/\D/g, "");
    }

    // Find pre-authorization entry
    const authorizedClient = await db.collection<AuthorizedClient>("authorized_clients").findOne({
      identifier: normalizedIdentifier,
      identifierType,
      claimedBy: { $exists: false }, // Only unclaimed entries
    });

    if (!authorizedClient) {
      return NextResponse.json({
        authorized: false,
        message: "No pre-authorization found for this identifier",
      });
    }

    // Get company/studio info
    const admin = await db.collection<User>("users").findOne({
      _id: new ObjectId(authorizedClient.companyId),
    });

    // Get studio name from settings
    let studioName = admin?.name || "Studio";
    const settings = await db.collection("studio_settings").findOne({
      ownerId: authorizedClient.companyId,
    });
    if (settings?.general?.studioName) {
      studioName = settings.general.studioName;
    }

    return NextResponse.json({
      authorized: true,
      companyId: authorizedClient.companyId,
      companyName: studioName,
      preAuthorizedName: authorizedClient.name,
      authorizationId: authorizedClient._id?.toString(),
    });
  } catch (error) {
    console.error("Error checking authorization:", error);
    return NextResponse.json(
      { error: "Failed to check authorization" },
      { status: 500 }
    );
  }
}
