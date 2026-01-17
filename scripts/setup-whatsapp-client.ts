/**
 * Script para configurar WhatsApp para um cliente
 *
 * Uso:
 * npx ts-node scripts/setup-whatsapp-client.ts
 *
 * Ou configure via MongoDB diretamente:
 *
 * db.establishment_whatsapp_credentials.insertOne({
 *   establishmentId: "ID_DO_ESTABELECIMENTO",
 *   companyId: "ID_DO_ESTABELECIMENTO",
 *   provider: "cloud-api",
 *   phoneNumberId: "PHONE_NUMBER_ID_DO_META",
 *   accessToken: "SEU_ACCESS_TOKEN_GLOBAL",
 *   businessAccountId: "SEU_BUSINESS_ACCOUNT_ID",
 *   verifyToken: "flexiwell-verify-token",
 *   phoneNumber: "5511999999999",
 *   displayPhoneNumber: "+55 11 99999-9999",
 *   isConnected: true,
 *   connectionStatus: "active",
 *   botEnabled: true,
 *   botFeatures: {
 *     viewClasses: true,
 *     confirmAttendance: true,
 *     cancelClass: true,
 *     bookNewClass: true,
 *     automaticReminders: true
 *   },
 *   connectedAt: new Date(),
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * })
 */

import { MongoClient } from "mongodb";

interface WhatsAppSetup {
  establishmentId: string;
  phoneNumberId: string;  // Do Meta Business
  phoneNumber: string;    // Ex: "5511999999999"
  displayPhoneNumber: string; // Ex: "+55 11 99999-9999"
}

async function setupWhatsAppForClient(setup: WhatsAppSetup) {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI not set");
  }

  // Use your global access token (from your Meta Business account)
  const globalAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "flexiwell-verify-token";

  if (!globalAccessToken) {
    throw new Error("WHATSAPP_ACCESS_TOKEN not set");
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db();

    const credentials = {
      establishmentId: setup.establishmentId,
      companyId: setup.establishmentId,
      provider: "cloud-api",
      phoneNumberId: setup.phoneNumberId,
      accessToken: globalAccessToken,
      businessAccountId: businessAccountId,
      verifyToken: verifyToken,
      phoneNumber: setup.phoneNumber.replace(/\D/g, ""),
      displayPhoneNumber: setup.displayPhoneNumber,
      isConnected: true,
      connectionStatus: "active",
      botEnabled: true,
      botFeatures: {
        viewClasses: true,
        confirmAttendance: true,
        cancelClass: true,
        bookNewClass: true,
        automaticReminders: true,
      },
      connectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection("establishment_whatsapp_credentials")
      .updateOne(
        { establishmentId: setup.establishmentId },
        { $set: credentials },
        { upsert: true }
      );

    console.log("WhatsApp configured successfully!");
    console.log("Establishment:", setup.establishmentId);
    console.log("Phone:", setup.displayPhoneNumber);
    console.log("Result:", result.upsertedCount ? "Created" : "Updated");

    // Mark activation request as completed if exists
    await db.collection("whatsapp_activation_requests").updateOne(
      { establishmentId: setup.establishmentId, status: "pending" },
      { $set: { status: "completed", completedAt: new Date() } }
    );

  } finally {
    await client.close();
  }
}

// Example usage - uncomment and fill in details:
/*
setupWhatsAppForClient({
  establishmentId: "abc123",  // ID do estabelecimento no FlexiWell
  phoneNumberId: "123456789012345",  // Phone Number ID do Meta
  phoneNumber: "5511999999999",
  displayPhoneNumber: "+55 11 99999-9999",
}).catch(console.error);
*/

export { setupWhatsAppForClient };
