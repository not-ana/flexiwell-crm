import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth";

// GET /api/admin/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  // Require admin authentication
  const { user, error } = requireRole(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // week, month, year
    const yearParam = searchParams.get("year");
    const establishmentId = searchParams.get("establishmentId");

    const db = await getDatabase();

    // Build establishment filter for queries
    const establishmentFilter = establishmentId ? { establishmentId } : {};

    // Calculate date ranges based on selected year
    const now = new Date();
    const selectedYear = yearParam ? parseInt(yearParam) : now.getFullYear();
    const isCurrentYear = selectedYear === now.getFullYear();

    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;
    let endDate: Date;

    if (period === "week") {
      // For week, use current week if current year, otherwise last week of selected year
      if (isCurrentYear) {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
      } else {
        endDate = new Date(selectedYear, 11, 31);
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      previousEndDate = startDate;
      previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "year") {
      startDate = new Date(selectedYear, 0, 1);
      endDate = isCurrentYear ? now : new Date(selectedYear, 11, 31);
      previousEndDate = startDate;
      previousStartDate = new Date(selectedYear - 1, 0, 1);
    } else {
      // month - use current month if current year, otherwise December of selected year
      if (isCurrentYear) {
        startDate = new Date(selectedYear, now.getMonth(), 1);
        endDate = now;
        previousEndDate = startDate;
        previousStartDate = new Date(selectedYear, now.getMonth() - 1, 1);
      } else {
        startDate = new Date(selectedYear, 11, 1); // December of selected year
        endDate = new Date(selectedYear, 11, 31);
        previousEndDate = startDate;
        previousStartDate = new Date(selectedYear, 10, 1); // November
      }
    }

    // Run all queries in parallel
    const [
      // Current period stats
      , // totalClients (unused)
      activeClients,
      newClients,
      totalClasses,
      completedBookings,
      totalRevenue,
      // Previous period stats for comparison
      previousNewClients,
      previousClasses,
      previousRevenue,
      // Recent activity
      recentActivity,
      // Today's classes
      todayClasses,
      // Waitlist fills this period
      waitlistFills,
      // No-shows this period
      noShows,
    ] = await Promise.all([
      // Total clients
      db.collection("clients").countDocuments(establishmentFilter),
      // Active clients
      db.collection("clients").countDocuments({ status: "active", ...establishmentFilter }),
      // New clients this period
      db.collection("clients").countDocuments({
        createdAt: { $gte: startDate },
        ...establishmentFilter,
      }),
      // Total classes this period
      db.collection("classes").countDocuments({
        scheduledDate: { $gte: startDate },
        ...establishmentFilter,
      }),
      // Completed bookings this period
      db.collection("bookings").countDocuments({
        status: "completed",
        scheduledDate: { $gte: startDate },
        ...establishmentFilter,
      }),
      // Total revenue this period
      db.collection("payments").aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: startDate },
            ...establishmentFilter,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]).toArray(),
      // Previous period new clients
      db.collection("clients").countDocuments({
        createdAt: { $gte: previousStartDate, $lt: previousEndDate },
        ...establishmentFilter,
      }),
      // Previous period classes
      db.collection("classes").countDocuments({
        scheduledDate: { $gte: previousStartDate, $lt: previousEndDate },
        ...establishmentFilter,
      }),
      // Previous period revenue
      db.collection("payments").aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: previousStartDate, $lt: previousEndDate },
            ...establishmentFilter,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]).toArray(),
      // Recent activity (last 5)
      db.collection("bookings")
        .find(establishmentFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      // Upcoming classes (from today onwards)
      db.collection("classes")
        .find({
          scheduledDate: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
          ...establishmentFilter,
        })
        .sort({ scheduledDate: 1, startTime: 1 })
        .limit(5)
        .toArray(),
      // Waitlist fills (confirmed waitlist entries)
      db.collection("waitlist").countDocuments({
        status: "confirmed",
        updatedAt: { $gte: startDate },
        ...establishmentFilter,
      }),
      // No-shows
      db.collection("bookings").countDocuments({
        status: { $in: ["no-show", "noshow", "no_show"] },
        scheduledDate: { $gte: startDate },
        ...establishmentFilter,
      }),
    ]);

    // Calculate changes
    const currentRevenue = totalRevenue[0]?.total || 0;
    const prevRevenue = previousRevenue[0]?.total || 0;
    const revenueChange = prevRevenue > 0
      ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1)
      : "0";

    const clientsChange = newClients - previousNewClients;
    const classesChange = previousClasses > 0
      ? ((totalClasses - previousClasses) / previousClasses * 100).toFixed(1)
      : "0";

    // Calculate attendance rate
    const totalBookingsInPeriod = await db.collection("bookings").countDocuments({
      scheduledDate: { $gte: startDate },
      ...establishmentFilter,
    });
    const attendanceRate = totalBookingsInPeriod > 0
      ? ((completedBookings / totalBookingsInPeriod) * 100).toFixed(1)
      : "0";

    // Format recent activity
    const formattedActivity = recentActivity.map((booking: any, index: number) => ({
      id: index + 1,
      action: booking.status === "completed" ? "Class completed" :
              booking.status === "cancelled" ? "Booking cancelled" : "New booking",
      name: booking.className || "Class",
      time: getRelativeTime(booking.createdAt),
      type: booking.status === "completed" ? "class" :
            booking.status === "cancelled" ? "cancel" : "booking",
    }));

    // Format today's classes
    const formattedClasses = todayClasses.map((cls: any) => ({
      id: cls._id.toString(),
      name: cls.title,
      time: cls.startTime,
      instructor: cls.instructorName,
      enrolled: cls.currentEnrollment || 0,
      capacity: cls.maxCapacity || 10,
    }));

    // Calculate no-show rate
    const noShowRate = totalBookingsInPeriod > 0
      ? ((noShows / totalBookingsInPeriod) * 100).toFixed(1)
      : "0";

    // Estimate revenue recovered from waitlist fills (fills × avg class price)
    const avgClassPrice = totalClasses > 0 && currentRevenue > 0
      ? currentRevenue / totalClasses
      : 35; // Default avg price estimate
    const revenueRecovered = Math.round(waitlistFills * avgClassPrice);

    return NextResponse.json({
      stats: {
        revenue: currentRevenue,
        revenueChange: `${parseFloat(revenueChange) >= 0 ? "+" : ""}${revenueChange}%`,
        clients: activeClients,
        clientsChange: `${clientsChange >= 0 ? "+" : ""}${clientsChange}`,
        classes: totalClasses,
        classesChange: `${parseFloat(classesChange) >= 0 ? "+" : ""}${classesChange}%`,
        attendance: `${attendanceRate}%`,
        noShowRate: `${noShowRate}%`,
        noShows,
        waitlistFills,
        revenueRecovered,
      },
      recentActivity: formattedActivity,
      todayClasses: formattedClasses,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}
