// Add-ons preferences API Route
// Stores add-on activation status in database (for users without Stripe subscriptions)
// GET /api/admin/addons - Get active add-ons
// POST /api/admin/addons - Activate an add-on
// DELETE /api/admin/addons - Deactivate an add-on

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";

// Get active add-ons from database
export async function GET() {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const userDoc = await db.collection("users").findOne({ email: user.email });

    // Return active add-ons stored in user document
    const activeAddOns = userDoc?.activeAddOns || [];

    return NextResponse.json({
      activeAddOns,
      planTier: userDoc?.planTier || null,
    });
  } catch (error) {
    console.error("Get addons error:", error);
    return NextResponse.json(
      { error: "Failed to get add-ons" },
      { status: 500 }
    );
  }
}

// Activate an add-on (store in database)
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { addOnId } = await request.json();

    if (!addOnId) {
      return NextResponse.json(
        { error: "Missing addOnId" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Add add-on to user's activeAddOns array
    await db.collection("users").updateOne(
      { email: user.email },
      {
        $addToSet: { activeAddOns: addOnId },
        $set: { updatedAt: new Date() },
      }
    );

    // Log the activation
    await db.collection("addonEvents").insertOne({
      userId: user.userId,
      event: "addon_activated",
      addOnId,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Add-on activated successfully",
    });
  } catch (error) {
    console.error("Activate addon error:", error);
    return NextResponse.json(
      { error: "Failed to activate add-on" },
      { status: 500 }
    );
  }
}

// Deactivate an add-on (remove from database)
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { addOnId } = await request.json();

    if (!addOnId) {
      return NextResponse.json(
        { error: "Missing addOnId" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Remove add-on from user's activeAddOns array
     
    await db.collection("users").updateOne(
      { email: user.email },
      {
        $pull: { activeAddOns: addOnId },
        $set: { updatedAt: new Date() },
      } as any
    );

    // Log the deactivation
    await db.collection("addonEvents").insertOne({
      userId: user.userId,
      event: "addon_deactivated",
      addOnId,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Add-on deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate addon error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate add-on" },
      { status: 500 }
    );
  }
}
