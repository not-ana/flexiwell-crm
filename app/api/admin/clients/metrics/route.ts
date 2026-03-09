import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";

// GET /api/admin/clients/metrics - Hormozi LTV & Churn Metrics
export async function GET(request: NextRequest) {
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const db = await getDatabase();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      totalClients,
      activeClients,
      activeClientsLastMonth,
      totalRevenueResult,
      clientLifespanResult,
      monthlyRevenueResult,
      atRiskClients,
      recentChurned,
      upgradesThisMonth,
      totalClientsWithPlanChange,
      previousChurned,
      activeClientsTwoMonthsAgo,
    ] = await Promise.all([
      // Total clients ever
      db.collection("clients").countDocuments({}),
      // Currently active clients
      db.collection("clients").countDocuments({ status: "active" }),
      // Active clients 30 days ago (for churn calc)
      db.collection("clients").countDocuments({
        status: "active",
        createdAt: { $lt: thirtyDaysAgo },
      }),
      // Total lifetime revenue
      db.collection("payments").aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),
      // Average client lifespan (months between first and last booking)
      db.collection("bookings").aggregate([
        { $match: { status: { $in: ["completed", "confirmed"] } } },
        {
          $group: {
            _id: "$clientId",
            firstBooking: { $min: "$createdAt" },
            lastBooking: { $max: "$createdAt" },
          },
        },
        {
          $project: {
            lifespanMs: { $subtract: ["$lastBooking", "$firstBooking"] },
          },
        },
        {
          $group: {
            _id: null,
            avgLifespanMs: { $avg: "$lifespanMs" },
            count: { $sum: 1 },
          },
        },
      ]).toArray(),
      // Monthly revenue (last 30 days)
      db.collection("payments").aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray(),
      // At-risk clients (no activity in 14-30 days)
      db.collection("clients").countDocuments({
        status: "active",
        $or: [
          { lifecycleStage: "at_risk" },
          { "healthScore.overall": { $lt: 40 } },
          { updatedAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo } },
        ],
      }),
      // Clients churned this month (went inactive in last 30 days)
      db.collection("clients").countDocuments({
        status: "inactive",
        updatedAt: { $gte: thirtyDaysAgo },
      }),
      // Plan upgrades this month
      db.collection("clients").countDocuments({
        "upgradeHistory.date": { $gte: thirtyDaysAgo },
      }),
      // Total clients who have had a plan change
      db.collection("clients").countDocuments({
        upgradeHistory: { $exists: true, $not: { $size: 0 } },
      }),
      // Previous period churned (60-90 days ago) for churn comparison
      db.collection("clients").countDocuments({
        status: "inactive",
        updatedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
      }),
      // Active clients 60 days ago (for previous churn calc)
      db.collection("clients").countDocuments({
        status: "active",
        createdAt: { $lt: sixtyDaysAgo },
      }),
    ]);

    // Calculate metrics
    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;

    // Average LTV = total revenue / total clients who have ever been active
    const avgLTV = totalClients > 0 ? totalRevenue / totalClients : 0;

    // Average client lifespan in months
    const avgLifespanMs = clientLifespanResult[0]?.avgLifespanMs || 0;
    const avgLifespanMonths = avgLifespanMs / (1000 * 60 * 60 * 24 * 30.44); // ms to months

    // Monthly churn rate = clients lost / clients at start of month
    const monthlyChurnRate = activeClientsLastMonth > 0
      ? (recentChurned / activeClientsLastMonth) * 100
      : 0;

    // Revenue per client per month
    const revenuePerClientPerMonth = activeClients > 0
      ? monthlyRevenue / activeClients
      : 0;

    // Upgrade conversion rate
    const upgradeConversionRate = totalClients > 0
      ? (totalClientsWithPlanChange / totalClients) * 100
      : 0;

    // Previous monthly churn rate
    const previousMonthlyChurnRate = activeClientsTwoMonthsAgo > 0
      ? (previousChurned / activeClientsTwoMonthsAgo) * 100
      : 0;

    return NextResponse.json({
      avgLTV: Math.round(avgLTV * 100) / 100,
      avgLifespanMonths: Math.round(avgLifespanMonths * 10) / 10,
      monthlyChurnRate: Math.round(monthlyChurnRate * 10) / 10,
      previousMonthlyChurnRate: Math.round(previousMonthlyChurnRate * 10) / 10,
      revenuePerClientPerMonth: Math.round(revenuePerClientPerMonth * 100) / 100,
      atRiskCount: atRiskClients,
      churnedThisMonth: recentChurned,
      upgradeConversionRate: Math.round(upgradeConversionRate * 10) / 10,
    });
  } catch (error) {
    console.error("Error fetching client metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch client metrics" },
      { status: 500 }
    );
  }
}
