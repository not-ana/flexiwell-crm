import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Payment } from "@/lib/db/schemas";
import { ObjectId } from "mongodb";

interface DeletedPayment extends Payment {
  deletedAt: Date;
}

// GET /api/payments/deleted - List deleted payments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();

    const deletedPayments = await db
      .collection<DeletedPayment>("deleted_payments")
      .find({})
      .sort({ deletedAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      payments: deletedPayments,
      total: deletedPayments.length,
    });
  } catch (error) {
    console.error("Error fetching deleted payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch deleted payments" },
      { status: 500 }
    );
  }
}

// POST /api/payments/deleted - Restore a deleted payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId || !ObjectId.isValid(paymentId)) {
      return NextResponse.json(
        { error: "Valid payment ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Find the deleted payment
    const deletedPayment = await db
      .collection<DeletedPayment>("deleted_payments")
      .findOne({ _id: new ObjectId(paymentId) });

    if (!deletedPayment) {
      return NextResponse.json(
        { error: "Deleted payment not found" },
        { status: 404 }
      );
    }

    // Remove deletedAt field and restore to payments collection
    const { deletedAt, ...paymentData } = deletedPayment;

    await db.collection<Payment>("payments").insertOne(paymentData as Payment);

    // Remove from deleted_payments
    await db.collection("deleted_payments").deleteOne({
      _id: new ObjectId(paymentId),
    });

    return NextResponse.json({
      success: true,
      message: "Payment restored successfully",
      payment: paymentData,
    });
  } catch (error) {
    console.error("Error restoring payment:", error);
    return NextResponse.json(
      { error: "Failed to restore payment" },
      { status: 500 }
    );
  }
}
