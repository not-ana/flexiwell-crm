import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireRoleFromCookie } from "@/lib/auth/middleware";

// GET /api/admin/payments/export - Export payments as CSV or JSON
export async function GET(request: NextRequest) {
  try {
    // Require admin role for export
    const { error } = await requireRoleFromCookie(["admin"]);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    // Validate format
    if (format !== "csv" && format !== "json") {
      return NextResponse.json(
        { error: "Invalid format. Use 'csv' or 'json'" },
        { status: 400 }
      );
    }

    // Validate dates if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      return NextResponse.json(
        { error: "Invalid startDate format" },
        { status: 400 }
      );
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return NextResponse.json(
        { error: "Invalid endDate format" },
        { status: 400 }
      );
    }

    // Validate date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return NextResponse.json(
          { error: "startDate cannot be after endDate" },
          { status: 400 }
        );
      }
    }

    // Validate status if provided
    const validStatuses = ["all", "paid", "pending", "overdue", "failed", "refunded"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Use one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Build query
    const query: Record<string, unknown> = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        (query.date as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        (query.date as Record<string, Date>).$lte = new Date(endDate);
      }
    }

    if (status && status !== "all") {
      query.status = status;
    }

    // Fetch payments
    const payments = await db
      .collection("payments")
      .find(query)
      .sort({ date: -1 })
      .limit(1000)
      .toArray();

    if (format === "csv") {
      // Generate CSV
      const headers = ["ID", "Date", "Client", "Amount", "Method", "Status", "Description"];
      const rows = payments.map((p) => [
        p._id?.toString() || "",
        new Date(p.date).toISOString().split("T")[0],
        p.clientName || p.client || "",
        p.amount?.toFixed(2) || "0.00",
        p.method || p.paymentMethod || "",
        p.status || "",
        (p.description || "").replace(/,/g, ";").replace(/"/g, '""'),
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="payments-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // Return JSON
    return NextResponse.json({
      success: true,
      count: payments.length,
      payments: payments.map((p) => ({
        id: p._id?.toString(),
        date: p.date,
        client: p.clientName || p.client,
        amount: p.amount,
        method: p.method || p.paymentMethod,
        status: p.status,
        description: p.description,
      })),
    });
  } catch (error) {
    console.error("Export payments error:", error);
    return NextResponse.json(
      { error: "Failed to export payments" },
      { status: 500 }
    );
  }
}
