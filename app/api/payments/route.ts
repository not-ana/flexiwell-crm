import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Payment } from "@/lib/db/schemas";

// GET /api/payments - List all payments with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const type = searchParams.get("type");
    const paymentMethod = searchParams.get("paymentMethod");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = await getDatabase();

    // Build filter query
    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (clientId) {
      filter.clientId = clientId;
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    if (paymentMethod && paymentMethod !== "all") {
      filter.paymentMethod = paymentMethod;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(dateFrom);
      }
      if (dateTo) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(dateTo);
      }
    }

    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [payments, total, stats] = await Promise.all([
      db
        .collection<Payment>("payments")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection<Payment>("payments").countDocuments(filter),
      db
        .collection<Payment>("payments")
        .aggregate([
          { $match: filter },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              total: { $sum: "$amount" },
            },
          },
        ])
        .toArray(),
    ]);

    // Calculate stats
    const statsMap = stats.reduce(
      (acc, s) => {
        acc[s._id] = { count: s.count, total: s.total };
        return acc;
      },
      {} as Record<string, { count: number; total: number }>
    );

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        pending: statsMap.pending || { count: 0, total: 0 },
        completed: statsMap.completed || { count: 0, total: 0 },
        failed: statsMap.failed || { count: 0, total: 0 },
        refunded: statsMap.refunded || { count: 0, total: 0 },
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      clientName,
      amount,
      currency,
      type,
      planDetails,
      paymentMethod,
      transactionId,
      status,
    } = body;

    // Validation
    if (!clientId || !clientName || !amount || !type || !paymentMethod) {
      return NextResponse.json(
        { error: "Client ID, name, amount, type, and payment method are required" },
        { status: 400 }
      );
    }

    const validTypes = ["subscription", "drop-in", "package"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const validMethods = ["credit_card", "pix", "bank_transfer", "cash"];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: `Invalid payment method. Must be one of: ${validMethods.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const validStatuses = ["pending", "completed"];
    const paymentStatus = status && validStatuses.includes(status) ? status : "pending";

    const newPayment: Omit<Payment, "_id"> = {
      clientId,
      clientName,
      amount,
      currency: currency || "USD",
      type,
      planDetails: planDetails || undefined,
      status: paymentStatus,
      paymentMethod,
      transactionId: transactionId || undefined,
      createdAt: new Date(),
      ...(paymentStatus === "completed" && { paidAt: new Date() }),
    };

    const result = await db.collection<Payment>("payments").insertOne(newPayment);

    return NextResponse.json(
      {
        success: true,
        payment: {
          _id: result.insertedId,
          ...newPayment,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
