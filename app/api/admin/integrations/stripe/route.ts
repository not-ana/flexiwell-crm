import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getDatabase } from "@/lib/db/mongodb";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

async function getUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

// POST /api/admin/integrations/stripe - Connect Stripe
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { publishableKey, secretKey } = await request.json();

    if (!publishableKey || !secretKey) {
      return NextResponse.json(
        { error: "Both publishable and secret keys are required" },
        { status: 400 }
      );
    }

    // Validate key formats
    if (!publishableKey.startsWith("pk_")) {
      return NextResponse.json(
        { error: "Invalid publishable key format. Should start with 'pk_'" },
        { status: 400 }
      );
    }

    if (!secretKey.startsWith("sk_")) {
      return NextResponse.json(
        { error: "Invalid secret key format. Should start with 'sk_'" },
        { status: 400 }
      );
    }

    // Test the keys by making a simple API call
    try {
      const testResponse = await fetch("https://api.stripe.com/v1/balance", {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });

      if (!testResponse.ok) {
        return NextResponse.json(
          { error: "Invalid Stripe credentials. Please check your keys." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Could not verify Stripe credentials" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Store credentials (encrypted in production)
    await db.collection("integration_credentials").updateOne(
      { provider: "stripe" },
      {
        $set: {
          provider: "stripe",
          publishableKey,
          secretKey, // In production, encrypt this
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
          "integrations.stripeConnected": true,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: "Stripe connected successfully",
      connected: true,
    });
  } catch (error) {
    console.error("Error connecting Stripe:", error);
    return NextResponse.json(
      { error: "Failed to connect Stripe" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/integrations/stripe - Disconnect Stripe
export async function DELETE() {
  try {
    const user = await getUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const db = await getDatabase();

    // Remove credentials
    await db.collection("integration_credentials").deleteOne({
      provider: "stripe",
    });

    // Update studio settings
    await db.collection("settings").updateOne(
      { type: "studio" },
      {
        $set: {
          "integrations.stripeConnected": false,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "Stripe disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Stripe:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Stripe" },
      { status: 500 }
    );
  }
}
