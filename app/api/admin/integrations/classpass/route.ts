import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireRoleFromCookie } from "@/lib/auth/middleware";

// POST /api/admin/integrations/classpass - Connect ClassPass
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireRoleFromCookie(["admin"]);
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { apiKey, venueId, webhookSecret } = await request.json();

    if (!apiKey || !venueId || !webhookSecret) {
      return NextResponse.json(
        { error: "API Key, Venue ID, and Webhook Secret are all required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Store credentials
    await db.collection("integration_credentials").updateOne(
      { provider: "classpass" },
      {
        $set: {
          provider: "classpass",
          apiKey,
          venueId,
          webhookSecret,
          isActive: true,
          updatedAt: new Date(),
          connectedBy: user.userId,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Update studio settings
    await db.collection("settings").updateOne(
      { type: "studio" },
      {
        $set: {
          "integrations.classpassConnected": true,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: "ClassPass connected successfully",
      connected: true,
    });
  } catch (error) {
    console.error("Error connecting ClassPass:", error);
    return NextResponse.json(
      { error: "Failed to connect ClassPass" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/integrations/classpass - Update ClassPass settings
export async function PATCH(request: NextRequest) {
  try {
    const { error } = await requireRoleFromCookie(["admin"]);
    if (error) return error;

    const { config } = await request.json();

    const db = await getDatabase();

    await db.collection("integration_credentials").updateOne(
      { provider: "classpass" },
      {
        $set: {
          config,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ message: "Settings saved" });
  } catch (error) {
    console.error("Error updating ClassPass settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/integrations/classpass - Disconnect ClassPass
export async function DELETE() {
  try {
    const { error } = await requireRoleFromCookie(["admin"]);
    if (error) return error;

    const db = await getDatabase();

    await db.collection("integration_credentials").deleteOne({
      provider: "classpass",
    });

    await db.collection("settings").updateOne(
      { type: "studio" },
      {
        $set: {
          "integrations.classpassConnected": false,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "ClassPass disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting ClassPass:", error);
    return NextResponse.json(
      { error: "Failed to disconnect ClassPass" },
      { status: 500 }
    );
  }
}