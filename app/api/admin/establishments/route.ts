import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import clientPromise from "@/lib/db/mongodb";
import type { Establishment } from "@/lib/db/schemas";

// GET - List establishments for the current admin
export async function GET(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mongoClient = await clientPromise;
    if (!mongoClient) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
    const db = mongoClient.db();

    // Find establishments where user is owner or admin
    const establishments = await db
      .collection<Establishment>("establishments")
      .find({
        $or: [
          { ownerId: user.userId },
          { adminIds: user.userId },
        ],
        isActive: true,
      })
      .project({
        _id: 1,
        name: 1,
        location: 1,
        address: 1,
        phone: 1,
      })
      .toArray();

    // If no establishments found, return the user's own "virtual" establishment
    // This maintains backwards compatibility with the current model
    if (establishments.length === 0) {
      return NextResponse.json({
        establishments: [
          {
            _id: user.userId,
            name: "My Studio",
            location: "",
            isDefault: true,
          },
        ],
        hasMultiple: false,
      });
    }

    return NextResponse.json({
      establishments: establishments.map((est) => ({
        _id: est._id?.toString(),
        name: est.name,
        location: est.location,
        address: est.address,
        phone: est.phone,
      })),
      hasMultiple: establishments.length > 1,
    });
  } catch (error) {
    console.error("Error fetching establishments:", error);
    return NextResponse.json(
      { error: "Failed to fetch establishments" },
      { status: 500 }
    );
  }
}
