import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Payment, Client, Class, Staff, Booking } from "@/lib/db/schemas";

// GET /api/reports - Get aggregated report data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "this_year";
    const reportType = searchParams.get("type") || "all";

    const db = await getDatabase();

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    switch (period) {
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "this_quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "this_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "all_time":
      default:
        startDate = new Date(2020, 0, 1); // Far past date
        break;
    }

    // Initialize response data
    const response: Record<string, unknown> = {};

    // Revenue Data
    if (reportType === "all" || reportType === "overview" || reportType === "revenue") {
      const revenueData = await getRevenueData(db, startDate, endDate);
      response.revenue = revenueData;
    }

    // Class Metrics
    if (reportType === "all" || reportType === "overview" || reportType === "classes") {
      const classMetrics = await getClassMetrics(db, startDate, endDate);
      response.classes = classMetrics;
    }

    // Instructor Metrics
    if (reportType === "all" || reportType === "instructors") {
      const instructorMetrics = await getInstructorMetrics(db, startDate, endDate);
      response.instructors = instructorMetrics;
    }

    // Client Metrics
    if (reportType === "all" || reportType === "overview" || reportType === "clients") {
      const clientMetrics = await getClientMetrics(db, startDate, endDate);
      response.clients = clientMetrics;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch report data" },
      { status: 500 }
    );
  }
}

async function getRevenueData(db: Awaited<ReturnType<typeof getDatabase>>, startDate: Date, endDate: Date) {
  // Get completed payments within date range
  const payments = await db
    .collection<Payment>("payments")
    .find({
      status: "completed",
      paidAt: { $gte: startDate, $lte: endDate },
    })
    .toArray();

  // Total revenue
  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  // Monthly breakdown
  const monthlyData = await db
    .collection<Payment>("payments")
    .aggregate([
      {
        $match: {
          status: "completed",
          paidAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paidAt" },
            month: { $month: "$paidAt" },
          },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])
    .toArray();

  // Get client counts by month
  const clientsByMonth = await db
    .collection<Client>("clients")
    .aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const clientsMap = new Map(
    clientsByMonth.map((c) => [`${c._id.year}-${c._id.month}`, c.count])
  );

  // Format monthly data
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthly = monthlyData.map((m) => ({
    month: monthNames[m._id.month - 1],
    year: m._id.year,
    revenue: m.revenue,
    clients: clientsMap.get(`${m._id.year}-${m._id.month}`) || 0,
  }));

  // Calculate growth (compare to previous period)
  const previousStartDate = new Date(startDate);
  const previousEndDate = new Date(endDate);
  const periodDiff = endDate.getTime() - startDate.getTime();
  previousStartDate.setTime(previousStartDate.getTime() - periodDiff);
  previousEndDate.setTime(previousEndDate.getTime() - periodDiff);

  const previousPayments = await db
    .collection<Payment>("payments")
    .find({
      status: "completed",
      paidAt: { $gte: previousStartDate, $lte: previousEndDate },
    })
    .toArray();

  const previousTotal = previousPayments.reduce((sum, p) => sum + p.amount, 0);
  const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

  return {
    total,
    growth: Math.round(growth * 10) / 10,
    monthly,
    paymentCount: payments.length,
  };
}

async function getClassMetrics(db: Awaited<ReturnType<typeof getDatabase>>, startDate: Date, endDate: Date) {
  // Get classes within date range
  const classes = await db
    .collection<Class>("classes")
    .find({
      scheduledDate: { $gte: startDate, $lte: endDate },
    })
    .toArray();

  const totalClasses = classes.length;
  const completedClasses = classes.filter((c) => c.status === "completed");
  const cancelledClasses = classes.filter((c) => c.status === "cancelled");

  // Calculate average attendance
  let totalEnrollment = 0;
  let totalCapacity = 0;
  completedClasses.forEach((c) => {
    const attendedCount = c.enrolledClients?.filter((e) => e.status === "confirmed").length || 0;
    totalEnrollment += attendedCount;
    totalCapacity += c.maxCapacity;
  });

  const avgAttendance = totalCapacity > 0 ? Math.round((totalEnrollment / totalCapacity) * 100) : 0;
  const cancelRate = totalClasses > 0 ? Math.round((cancelledClasses.length / totalClasses) * 1000) / 10 : 0;

  // Popular classes by type with revenue
  const classTypeMetrics = await db
    .collection<Class>("classes")
    .aggregate([
      {
        $match: {
          scheduledDate: { $gte: startDate, $lte: endDate },
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$title",
          sessions: { $sum: 1 },
          totalEnrollment: { $sum: "$currentEnrollment" },
          totalCapacity: { $sum: "$maxCapacity" },
        },
      },
      {
        $project: {
          name: "$_id",
          sessions: 1,
          avgAttendance: {
            $cond: {
              if: { $gt: ["$totalCapacity", 0] },
              then: { $round: [{ $multiply: [{ $divide: ["$totalEnrollment", "$totalCapacity"] }, 100] }, 0] },
              else: 0,
            },
          },
        },
      },
      { $sort: { sessions: -1 } },
      { $limit: 10 },
    ])
    .toArray();

  // Calculate revenue per class type (based on average class price)
  const popularClasses = classTypeMetrics.map((c) => ({
    name: c.name,
    sessions: c.sessions,
    avgAttendance: c.avgAttendance,
    revenue: c.sessions * 150, // Estimated average revenue per class
  }));

  return {
    totalClasses,
    completedClasses: completedClasses.length,
    cancelledClasses: cancelledClasses.length,
    avgAttendance,
    cancelRate,
    popularClasses,
  };
}

async function getInstructorMetrics(db: Awaited<ReturnType<typeof getDatabase>>, startDate: Date, endDate: Date) {
  // Get all active instructors (teachers)
  const instructors = await db
    .collection<Staff>("staff")
    .find({ role: "teacher", status: "active" })
    .toArray();

  // Get instructor class stats
  const instructorStats = await db
    .collection<Class>("classes")
    .aggregate([
      {
        $match: {
          scheduledDate: { $gte: startDate, $lte: endDate },
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$instructorId",
          instructorName: { $first: "$instructorName" },
          classes: { $sum: 1 },
          totalStudents: { $sum: "$currentEnrollment" },
        },
      },
      { $sort: { classes: -1 } },
    ])
    .toArray();

  // Get booking data for ratings (if available)
  const bookingStats = await db
    .collection<Booking>("bookings")
    .aggregate([
      {
        $match: {
          scheduledDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$instructorId",
          completedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          noShows: {
            $sum: { $cond: [{ $eq: ["$status", "no-show"] }, 1, 0] },
          },
        },
      },
    ])
    .toArray();

  const bookingMap = new Map(bookingStats.map((b) => [b._id, b]));

  // Combine data
  const metrics = instructorStats.map((s) => {
    const bookings = bookingMap.get(s._id);
    const completedBookings = bookings?.completedBookings || s.totalStudents;
    const noShows = bookings?.noShows || 0;

    // Calculate rating based on completion rate (simplified)
    const totalSessions = completedBookings + noShows;
    const rating = totalSessions > 0
      ? Math.min(5, Math.round(((completedBookings / totalSessions) * 5 + 4) / 2 * 10) / 10)
      : 4.5;

    return {
      id: s._id,
      name: s.instructorName,
      classes: s.classes,
      students: s.totalStudents,
      rating,
      revenue: s.classes * 200, // Estimated revenue per instructor
    };
  });

  // Add instructors with no classes in the period
  const instructorIdsWithClasses = new Set(metrics.map((m) => m.id));
  instructors.forEach((i) => {
    if (!instructorIdsWithClasses.has(i._id?.toString())) {
      metrics.push({
        id: i._id?.toString() || "",
        name: i.name,
        classes: 0,
        students: 0,
        rating: 4.5,
        revenue: 0,
      });
    }
  });

  // Summary stats
  const totalInstructors = metrics.length;
  const totalClassesTaught = metrics.reduce((sum, m) => sum + m.classes, 0);
  const avgRating = metrics.length > 0
    ? Math.round((metrics.reduce((sum, m) => sum + m.rating, 0) / metrics.length) * 100) / 100
    : 0;

  return {
    totalInstructors,
    totalClassesTaught,
    avgRating,
    satisfaction: Math.round(avgRating * 20), // Convert to percentage
    instructors: metrics,
  };
}

async function getClientMetrics(db: Awaited<ReturnType<typeof getDatabase>>, startDate: Date, endDate: Date) {
  // Get all clients
  const allClients = await db.collection<Client>("clients").find({}).toArray();
  const totalClients = allClients.length;
  const activeClients = allClients.filter((c) => c.status === "active").length;

  // New clients this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const newThisMonth = allClients.filter(
    (c) => c.createdAt && new Date(c.createdAt) >= monthStart
  ).length;

  // Plan distribution
  const planDistribution = await db
    .collection<Client>("clients")
    .aggregate([
      {
        $match: { status: "active" },
      },
      {
        $group: {
          _id: "$plan.type",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  // Format plan distribution with labels
  const planLabels: Record<string, string> = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    annual: "Annual",
    "drop-in": "Drop-in",
  };

  const formattedPlanDistribution = planDistribution.map((p) => ({
    plan: planLabels[p._id] || p._id,
    type: p._id,
    count: p.count,
    percentage: totalClients > 0 ? Math.round((p.count / activeClients) * 100) : 0,
  }));

  // Calculate churn rate (clients who became inactive in the period)
  const churnedClients = allClients.filter(
    (c) =>
      c.status === "inactive" &&
      c.updatedAt &&
      new Date(c.updatedAt) >= startDate &&
      new Date(c.updatedAt) <= endDate
  ).length;

  const churnRate = activeClients > 0
    ? Math.round((churnedClients / (activeClients + churnedClients)) * 1000) / 10
    : 0;

  const retention = 100 - churnRate;

  // Monthly client growth
  const monthlyGrowth = await db
    .collection<Client>("clients")
    .aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])
    .toArray();

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const clientGrowth = monthlyGrowth.map((m) => ({
    month: monthNames[m._id.month - 1],
    year: m._id.year,
    clients: m.count,
  }));

  return {
    totalClients,
    activeClients,
    inactiveClients: totalClients - activeClients,
    newThisMonth,
    churnRate,
    retention: Math.round(retention * 10) / 10,
    planDistribution: formattedPlanDistribution,
    clientGrowth,
  };
}
