import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { Payment, Client } from "@/lib/db/schemas";
import { EmailService } from "@/lib/email";

// POST /api/payments/reminders - Send payment reminders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIds, type } = body;

    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: "paymentIds array is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as { paymentId: string; error: string }[],
    };

    for (const paymentId of paymentIds) {
      try {
        if (!ObjectId.isValid(paymentId)) {
          results.failed++;
          results.errors.push({ paymentId, error: "Invalid payment ID" });
          continue;
        }

        // Get payment info
        const payment = await db.collection<Payment>("payments").findOne({
          _id: new ObjectId(paymentId),
        });

        if (!payment) {
          results.failed++;
          results.errors.push({ paymentId, error: "Payment not found" });
          continue;
        }

        // Get client info
        const client = await db.collection<Client>("clients").findOne({
          _id: new ObjectId(payment.clientId),
        });

        if (!client || !client.email) {
          results.failed++;
          results.errors.push({ paymentId, error: "Client email not found" });
          continue;
        }

        // Calculate due date (30 days for subscription, 7 for others)
        const createdAt = new Date(payment.createdAt);
        const daysToAdd = payment.type === "subscription" ? 30 : 7;
        const dueDate = new Date(createdAt);
        dueDate.setDate(dueDate.getDate() + daysToAdd);

        // Determine reminder type
        const now = new Date();
        const isOverdue = dueDate < now;
        const daysOverdue = isOverdue
          ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        // Send appropriate email
        if (isOverdue) {
          // Send overdue payment notification
          await EmailService.sendPaymentFailedNotification(client.email, {
            clientName: client.name,
            amount: payment.amount,
            currency: payment.currency || "USD",
            failureReason: `Your payment is ${daysOverdue} days overdue. Please update your payment method.`,
            updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://flexiwell.com"}/dashboard/subscription`,
          });
        } else {
          // Send upcoming payment reminder
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          await EmailService.sendUpcomingInvoiceNotification(client.email, {
            clientName: client.name,
            amount: payment.amount,
            currency: payment.currency || "USD",
            chargeDate: dueDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            planName: payment.planDetails?.type || "Subscription",
          });
        }

        // Log reminder sent
        await db.collection("reminderLogs").insertOne({
          paymentId,
          clientId: payment.clientId,
          clientEmail: client.email,
          type: isOverdue ? "overdue" : "upcoming",
          sentAt: new Date(),
        });

        results.sent++;
      } catch (error) {
        console.error(`Error sending reminder for payment ${paymentId}:`, error);
        results.failed++;
        results.errors.push({ paymentId, error: "Failed to send email" });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reminders sent: ${results.sent}. Failed: ${results.failed}.`,
      results,
    });
  } catch (error) {
    console.error("Error sending payment reminders:", error);
    return NextResponse.json(
      { error: "Failed to send payment reminders" },
      { status: 500 }
    );
  }
}

// GET /api/payments/reminders - Get reminder history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");
    const clientId = searchParams.get("clientId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();

    const filter: Record<string, unknown> = {};
    if (paymentId) filter.paymentId = paymentId;
    if (clientId) filter.clientId = clientId;

    const logs = await db.collection("reminderLogs")
      .find(filter)
      .sort({ sentAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      logs,
      total: logs.length,
    });
  } catch (error) {
    console.error("Error fetching reminder logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminder logs" },
      { status: 500 }
    );
  }
}
