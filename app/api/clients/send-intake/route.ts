import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";
import { generateSecureToken } from "@/lib/security";
import { notificationService } from "@/lib/services/notification.service";
import type { Client, HealthAssessmentToken } from "@/lib/db/schemas";
import type { NotificationChannel } from "@/lib/services/notification.service";

// POST /api/clients/send-intake - Create client + generate token + send intake form link
export async function POST(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin", "teacher"]);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      plan,
      channel = "whatsapp",
      expiresInDays = 7,
      establishmentId = "default",
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    if ((channel === "whatsapp" || channel === "sms") && !phone) {
      return NextResponse.json(
        { error: "Phone number is required for WhatsApp/SMS" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    // Check if client already exists
    const existingClient = await db.collection<Client>("clients").findOne({
      email: email.toLowerCase(),
    });

    let clientId: string;

    if (existingClient) {
      clientId = existingClient._id!.toString();
    } else {
      // Create client with pending status
      const newClient: Partial<Client> = {
        name,
        email: email.toLowerCase(),
        phone: phone || undefined,
        status: "pending",
        onboarding: {
          currentPhase: "health_assessment",
          welcomeEmailSent: false,
          healthAssessmentCompleted: false,
          intakeStatus: "not_sent",
          firstClassBooked: false,
          firstClassCompleted: false,
          weekOneCheckInSent: false,
          weekTwoGoalReviewSent: false,
        },
        createdAt: now,
        updatedAt: now,
      };

      const clientResult = await db.collection<Client>("clients").insertOne(newClient as Client);
      clientId = clientResult.insertedId.toString();
    }

    // Generate health assessment token
    const token = generateSecureToken(32);
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    const tokenDoc: HealthAssessmentToken = {
      token,
      clientId,
      clientEmail: email.toLowerCase(),
      clientName: name,
      establishmentId,
      createdBy: user?.userId || "",
      expiresAt,
      isUsed: false,
      createdAt: now,
    };

    await db.collection<HealthAssessmentToken>("health_assessment_tokens").insertOne(tokenDoc);

    // Update client intake status
    const { ObjectId } = await import("mongodb");
    await db.collection<Client>("clients").updateOne(
      { _id: new ObjectId(clientId) },
      {
        $set: {
          "onboarding.intakeStatus": "sent",
          "onboarding.intakeSentAt": now,
          "onboarding.intakeSentVia": channel,
          "onboarding.currentPhase": "health_assessment",
          updatedAt: now,
        },
      }
    );

    // Build public URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const formUrl = `${baseUrl}/health-assessment/${token}`;

    // Send notification
    let notifResult: { success: boolean; error?: string } = { success: false };
    try {
      notifResult = await notificationService.sendIntakeFormLink(
        clientId,
        formUrl,
        channel as NotificationChannel,
        expiresInDays
      );
    } catch (notifError: any) {
      console.error(`Failed to send intake form via ${channel}:`, notifError);
      const channelLabel = channel === "sms" ? "SMS (Twilio)" : "Email (SMTP)";
      return NextResponse.json({
        success: true,
        clientId,
        formUrl,
        notificationSent: false,
        warning: `Client created, but ${channelLabel} is not configured. Go to Settings to set it up, then resend the assessment form.`,
      }, { status: 201 });
    }

    if (!notifResult.success) {
      const channelLabel = channel === "sms" ? "SMS (Twilio)" : "Email (SMTP)";
      return NextResponse.json({
        success: true,
        clientId,
        formUrl,
        notificationSent: false,
        warning: `Client created, but failed to send via ${channelLabel}. Check your ${channelLabel} configuration in Settings.`,
      }, { status: 201 });
    }

    return NextResponse.json({
      success: true,
      clientId,
      formUrl,
      notificationSent: true,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating client with intake form:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create client and send intake form" },
      { status: 500 }
    );
  }
}
