import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import clientPromise from "@/lib/db/mongodb";

// POST - Request WhatsApp activation for an establishment
export async function POST(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const establishmentId = user.userId;
    const mongoClient = await clientPromise;
    if (!mongoClient) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
    const db = mongoClient.db();

    // Check if request already exists
    const existingRequest = await db
      .collection("whatsapp_activation_requests")
      .findOne({
        establishmentId,
        status: { $in: ["pending", "in_progress"] },
      });

    if (existingRequest) {
      return NextResponse.json({
        success: true,
        message: "Activation request already pending",
        requestId: existingRequest._id.toString(),
      });
    }

    // Get establishment info for the email
    const establishment = await db
      .collection("establishments")
      .findOne({ _id: establishmentId as unknown as import("mongodb").ObjectId });

    // Create activation request
    const result = await db.collection("whatsapp_activation_requests").insertOne({
      establishmentId,
      establishmentName: establishment?.name || "Unknown",
      userEmail: user.email || "",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send notification email to admin (ana@flexiwell.net)
    // Using a simple fetch to a mail service or internal endpoint
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.flexiwell.net";
      await fetch(`${baseUrl}/api/notifications/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "ana@flexiwell.net",
          subject: `WhatsApp Activation Request - ${establishment?.name || establishmentId}`,
          html: `
            <h2>New WhatsApp Activation Request</h2>
            <p><strong>Establishment:</strong> ${establishment?.name || "Unknown"}</p>
            <p><strong>ID:</strong> ${establishmentId}</p>
            <p><strong>Email:</strong> ${user.email || "N/A"}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <br/>
            <p>Please configure WhatsApp for this establishment in the Meta Business dashboard.</p>
          `,
        }),
      });
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error("Failed to send notification email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Activation request submitted successfully",
      requestId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Error requesting WhatsApp activation:", error);
    return NextResponse.json(
      { error: "Failed to submit activation request" },
      { status: 500 }
    );
  }
}

// GET - Check activation request status
export async function GET(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    if (error || !user) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const establishmentId = user.userId;
    const mongoClient = await clientPromise;
    if (!mongoClient) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
    const db = mongoClient.db();

    const activationRequest = await db
      .collection("whatsapp_activation_requests")
      .findOne({
        establishmentId,
        status: { $in: ["pending", "in_progress"] },
      });

    return NextResponse.json({
      hasPendingRequest: !!activationRequest,
      status: activationRequest?.status || null,
      requestedAt: activationRequest?.createdAt || null,
    });
  } catch (error) {
    console.error("Error checking activation request:", error);
    return NextResponse.json(
      { error: "Failed to check activation status" },
      { status: 500 }
    );
  }
}
