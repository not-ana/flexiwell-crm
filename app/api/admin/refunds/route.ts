// GET /api/admin/refunds - List all refund requests
// POST /api/admin/refunds - Create a refund request (60-Day Guarantee)

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { RefundRequest } from "@/lib/db/schemas";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      db.collection<RefundRequest>("refund_requests")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<RefundRequest>("refund_requests").countDocuments(filter),
    ]);

    return NextResponse.json({
      refundRequests: requests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching refund requests:", error);
    return NextResponse.json({ error: "Failed to fetch refund requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reason, additionalDetails } = body;

    if (!userId || !reason) {
      return NextResponse.json(
        { error: "userId and reason are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get user info
    const user = await db.collection("users").findOne({ _id: new (await import("mongodb")).ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already has a pending refund request
    const existingRequest = await db.collection("refund_requests").findOne({
      userId,
      status: { $in: ["pending", "under_review"] },
    });
    if (existingRequest) {
      return NextResponse.json(
        { error: "A refund request is already pending for this user" },
        { status: 409 }
      );
    }

    // Calculate days into subscription
    const subscriptionStart = user.trialStartDate || user.createdAt;
    const daysSinceStart = Math.floor(
      (Date.now() - new Date(subscriptionStart).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check 60-day guarantee window
    const guaranteeType = daysSinceStart <= 60 ? "60_day_results" : "other";

    // Get baseline metrics (from subscription events or user data)
    const clientCount = await db.collection("clients").countDocuments({
      adminId: userId,
      deletedAt: { $exists: false },
    });

    const now = new Date();
    const refundRequest: Omit<RefundRequest, "_id"> = {
      userId,
      userName: user.name,
      userEmail: user.email,
      guaranteeType,
      subscriptionStartDate: new Date(subscriptionStart),
      requestDate: now,
      daysIntoSubscription: daysSinceStart,
      currentMetrics: {
        activeClients: clientCount,
      },
      reason,
      additionalDetails,
      totalPaid: 0, // Will be calculated from Stripe invoices during review
      refundAmount: 0,
      currency: "USD",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("refund_requests").insertOne(refundRequest);

    // Log subscription event
    await db.collection("subscription_events").insertOne({
      userId,
      type: "refund_issued",
      data: { reason, guaranteeType, daysIntoSubscription: daysSinceStart },
      createdAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        refundRequest: { ...refundRequest, _id: result.insertedId },
        isWithinGuarantee: guaranteeType === "60_day_results",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating refund request:", error);
    return NextResponse.json({ error: "Failed to create refund request" }, { status: 500 });
  }
}
