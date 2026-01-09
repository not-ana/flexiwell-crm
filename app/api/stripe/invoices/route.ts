// Stripe Invoices API Route
// GET /api/stripe/invoices - Get invoice history

import { NextRequest, NextResponse } from "next/server";
import { getInvoiceHistory } from "@/lib/stripe/server";
import { getDatabase as getDb } from "@/lib/db/mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    // Get limit from query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);

    // Require authenticated user
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get user's Stripe info
    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ email: user.email });

    if (!userDoc?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Get invoice history
    const invoices = await getInvoiceHistory(userDoc.stripeCustomerId, limit);

    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount_paid / 100,
      amountDue: invoice.amount_due / 100,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      date: invoice.created,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
      pdfUrl: invoice.invoice_pdf,
      hostedUrl: invoice.hosted_invoice_url,
      description: invoice.description || `Invoice #${invoice.number}`,
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      hasMore: invoices.length === limit,
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    return NextResponse.json(
      { error: "Failed to get invoices" },
      { status: 500 }
    );
  }
}
