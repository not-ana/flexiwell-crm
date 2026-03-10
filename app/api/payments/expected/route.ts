import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Client, Payment } from "@/lib/db/schemas";
import { requireAuthFromCookie } from "@/lib/auth/middleware";

function getExpectedAmountForPeriod(
  planType: string,
  planPrice: number,
  planStart: Date,
  planEnd: Date,
  periodStart: Date,
  periodEnd: Date
): number {
  // Non-recurring types excluded
  if (planType === "drop-in" || planType === "trial") return 0;

  // One-time types: full price if overlaps
  if (planType === "challenge") return planPrice;

  // Recurring: pro-rate by overlap
  const overlapStart = planStart > periodStart ? planStart : periodStart;
  const overlapEnd = planEnd < periodEnd ? planEnd : periodEnd;

  if (overlapEnd <= overlapStart) return 0;

  const overlapDays = (overlapEnd.getTime() - overlapStart.getTime()) / 86_400_000;
  const periodDays = (periodEnd.getTime() - periodStart.getTime()) / 86_400_000;

  // Monthly rate from plan price
  const cycleLengthMonths =
    planType === "annual" ? 12 : planType === "quarterly" ? 3 : 1; // monthly, premium, vip
  const monthlyRate = planPrice / cycleLengthMonths;

  // Estimate months of overlap
  const periodMonths = periodDays / 30.44;
  const overlapMonths = (overlapDays / periodDays) * periodMonths;

  return Math.round(monthlyRate * overlapMonths * 100) / 100;
}

// GET /api/payments/expected - Calculate expected revenue from active client plans
export async function GET(request: NextRequest) {
  const { user } = await requireAuthFromCookie();

  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "dateFrom and dateTo are required" },
        { status: 400 }
      );
    }

    const periodStart = new Date(dateFrom);
    const periodEnd = new Date(dateTo);

    const db = await getDatabase();

    const establishmentFilter = user?.establishmentId ? { establishmentId: user.establishmentId } : {};

    // Get active clients with plans that overlap the period
    const clients = await db
      .collection<Client>("clients")
      .find({
        ...establishmentFilter,
        status: "active",
        "plan.startDate": { $lte: periodEnd },
        "plan.endDate": { $gte: periodStart },
      })
      .project({
        _id: 1,
        name: 1,
        "plan.type": 1,
        "plan.price": 1,
        "plan.originalPrice": 1,
        "plan.discountType": 1,
        "plan.discountValue": 1,
        "plan.startDate": 1,
        "plan.endDate": 1,
      })
      .toArray();

    // Calculate expected revenue per client
    const clientExpectations = clients
      .map((client) => {
        const expectedAmount = getExpectedAmountForPeriod(
          client.plan.type,
          client.plan.price,
          new Date(client.plan.startDate),
          new Date(client.plan.endDate),
          periodStart,
          periodEnd
        );
        return {
          clientId: client._id!.toString(),
          clientName: client.name,
          expectedAmount,
          planType: client.plan.type,
        };
      })
      .filter((c) => c.expectedAmount > 0);

    const expectedRevenue = clientExpectations.reduce(
      (sum, c) => sum + c.expectedAmount,
      0
    );

    // Get completed payments in the period to find who already paid
    const completedPayments = await db
      .collection<Payment>("payments")
      .find({
        ...establishmentFilter,
        status: "completed",
        createdAt: { $gte: periodStart, $lte: periodEnd },
      })
      .project({ clientId: 1, amount: 1 })
      .toArray();

    const collectedRevenue = completedPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    // Build set of client IDs who have paid
    const paidClientIds = new Set(completedPayments.map((p) => p.clientId));

    const unpaidClients = clientExpectations.filter(
      (c) => !paidClientIds.has(c.clientId)
    );

    const outstandingRevenue = Math.max(0, expectedRevenue - collectedRevenue);

    return NextResponse.json({
      expectedRevenue: Math.round(expectedRevenue * 100) / 100,
      collectedRevenue: Math.round(collectedRevenue * 100) / 100,
      outstandingRevenue: Math.round(outstandingRevenue * 100) / 100,
      activeRecurringClients: clientExpectations.length,
      unpaidClients,
    });
  } catch (error) {
    console.error("Error calculating expected revenue:", error);
    return NextResponse.json(
      { error: "Failed to calculate expected revenue" },
      { status: 500 }
    );
  }
}
