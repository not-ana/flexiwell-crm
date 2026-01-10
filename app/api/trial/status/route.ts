import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { verifyAccessToken } from "@/lib/auth/jwt";
import type { User } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

// GET /api/trial/status - Get current trial status
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or header
    const token =
      request.cookies.get("accessToken")?.value ||
      request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const user = await db.collection<User>("users").findOne({
      _id: new ObjectId(payload.userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Only admins have trials
    if (user.role !== "admin") {
      return NextResponse.json({
        hasTrial: false,
        message: "Trials are only available for studio owners",
      });
    }

    // Check if user has trial info
    if (!user.trialStartDate || !user.trialEndDate) {
      return NextResponse.json({
        hasTrial: false,
        subscriptionStatus: user.subscriptionStatus || "none",
      });
    }

    const now = new Date();
    const trialEnd = new Date(user.trialEndDate);
    const daysRemaining = Math.ceil(
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine trial status
    let trialStatus = user.trialStatus || "active";
    if (daysRemaining <= 0 && trialStatus === "active") {
      trialStatus = "expired";
      // Update in database
      await db.collection<User>("users").updateOne(
        { _id: user._id },
        {
          $set: {
            trialStatus: "expired",
            updatedAt: new Date(),
          },
        }
      );
    }

    return NextResponse.json({
      hasTrial: true,
      trialStatus,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      daysRemaining: Math.max(0, daysRemaining),
      isExpired: daysRemaining <= 0,
      isExpiringSoon: daysRemaining > 0 && daysRemaining <= 7,
      subscriptionStatus: user.subscriptionStatus || "trialing",
      planTier: user.planTier,
    });
  } catch (error) {
    console.error("Error getting trial status:", error);
    return NextResponse.json(
      { error: "Failed to get trial status" },
      { status: 500 }
    );
  }
}
