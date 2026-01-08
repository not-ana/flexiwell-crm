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

// POST /api/admin/integrations/wellhub - Connect Wellhub
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { apiKey, gymId } = await request.json();

    if (!apiKey || !gymId) {
      return NextResponse.json(
        { error: "Both API Key and Gym ID are required" },
        { status: 400 }
      );
    }

    // In production, you would validate the credentials with Wellhub API
    // For now, we just store them

    const db = await getDatabase();

    // Store credentials
    await db.collection("integration_credentials").updateOne(
      { provider: "wellhub" },
      {
        $set: {
          provider: "wellhub",
          apiKey, // In production, encrypt this
          gymId,
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
          "integrations.wellhubConnected": true,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: "Wellhub connected successfully",
      connected: true,
    });
  } catch (error) {
    console.error("Error connecting Wellhub:", error);
    return NextResponse.json(
      { error: "Failed to connect Wellhub" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/integrations/wellhub - Disconnect Wellhub
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
      provider: "wellhub",
    });

    // Update studio settings
    await db.collection("settings").updateOne(
      { type: "studio" },
      {
        $set: {
          "integrations.wellhubConnected": false,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "Wellhub disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Wellhub:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Wellhub" },
      { status: 500 }
    );
  }
}
