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
    const monthParam = searchParams.get("month"); // 0-indexed month
    const weekRefParam = searchParams.get("weekRef"); // ISO date for week reference
    const establishmentId = searchParams.get("establishmentId") || user?.establishmentId;

    const db = await getDatabase();

    const establishmentFilter = establishmentId ? { establishmentId } : {};

    const now = new Date();
    const selectedYear = yearParam ? parseInt(yearParam) : now.getFullYear();
    const selectedMonth = monthParam !== null ? parseInt(monthParam) : now.getMonth();
    const isCurrentYear = selectedYear === now.getFullYear();
    const isCurrentMonth = isCurrentYear && selectedMonth === now.getMonth();

    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;
    let endDate: Date;

    if (period === "week") {
      // Use weekRef to determine which week to show
      const ref = weekRefParam ? new Date(weekRefParam) : now;
      const dayOfWeek = ref.getDay();
      const monday = new Date(ref);
      monday.setDate(ref.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 7);

      const isCurrentWeek = now >= monday && now < sunday;
      startDate = monday;
      endDate = isCurrentWeek ? now : sunday;
      previousEndDate = monday;
      previousStartDate = new Date(monday.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "year") {
      startDate = new Date(selectedYear, 0, 1);
      endDate = isCurrentYear ? now : new Date(selectedYear + 1, 0, 1);
      previousEndDate = startDate;
      previousStartDate = new Date(selectedYear - 1, 0, 1);
    } else {
      // month - use the specific month passed from the frontend
      startDate = new Date(selectedYear, selectedMonth, 1);
      endDate = isCurrentMonth ? now : new Date(selectedYear, selectedMonth + 1, 1);
      previousEndDate = startDate;
      previousStartDate = new Date(selectedYear, selectedMonth - 1, 1);
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
      // Waitlist spots generated (all statuses)
      waitlistSpotsGenerated,
      // Previous period no-shows & bookings for comparison
      previousNoShows,
      previousBookings,
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
      // Recent activity: bookings, new clients, payments (last 5 each, merged later)
      Promise.all([
        db.collection("bookings")
          .find(establishmentFilter)
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray(),
        db.collection("clients")
          .find(establishmentFilter)
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray(),
        db.collection("payments")
          .find(establishmentFilter)
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray(),
      ]),
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
      // All waitlist entries generated this period
      db.collection("waitlist").countDocuments({
        createdAt: { $gte: startDate },
        ...establishmentFilter,
      }),
      // Previous period no-shows
      db.collection("bookings").countDocuments({
        status: { $in: ["no-show", "noshow", "no_show"] },
        scheduledDate: { $gte: previousStartDate, $lt: previousEndDate },
        ...establishmentFilter,
      }),
      // Previous period total bookings
      db.collection("bookings").countDocuments({
        scheduledDate: { $gte: previousStartDate, $lt: previousEndDate },
        ...establishmentFilter,
      }),
    ]);

    // Build trend data (last 6 periods relative to selected period)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendPromises = [];
    for (let i = 5; i >= 0; i--) {
      let trendStart: Date;
      let trendEnd: Date;
      let label: string;

      if (period === "week") {
        trendStart = new Date(endDate.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        trendEnd = new Date(endDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        label = `W-${i}`;
      } else if (period === "year") {
        const y = selectedYear - i;
        trendStart = new Date(y, 0, 1);
        trendEnd = new Date(y + 1, 0, 1);
        label = `${y}`;
      } else {
        const d = new Date(selectedYear, selectedMonth - i, 1);
        trendStart = d;
        trendEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        label = monthNames[d.getMonth()];
      }

      trendPromises.push(
        Promise.all([
          db.collection("payments").aggregate([
            { $match: { status: "completed", createdAt: { $gte: trendStart, $lt: trendEnd }, ...establishmentFilter } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]).toArray(),
          db.collection("clients").countDocuments({ status: "active", createdAt: { $lte: trendEnd }, ...establishmentFilter }),
        ]).then(([rev, clients]) => ({ label, revenue: rev[0]?.total || 0, clients }))
      );
    }
    const trend = await Promise.all(trendPromises);

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

    // Format recent activity from multiple sources
    const [recentBookings, recentClients, recentPayments] = recentActivity as [any[], any[], any[]];

    const activityItems: Array<{ action: string; name: string; time: Date; type: string }> = [];

    for (const booking of recentBookings) {
      activityItems.push({
        action: booking.status === "completed" ? "Class completed" :
                booking.status === "cancelled" ? "Booking cancelled" :
                booking.status === "no-show" ? "No-show" : "New booking",
        name: booking.className || "Class",
        time: new Date(booking.createdAt),
        type: booking.status === "completed" ? "class" :
              booking.status === "cancelled" || booking.status === "no-show" ? "cancel" : "booking",
      });
    }

    for (const client of recentClients) {
      activityItems.push({
        action: "New client joined",
        name: client.name || `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Client",
        time: new Date(client.createdAt),
        type: "client",
      });
    }

    for (const payment of recentPayments) {
      activityItems.push({
        action: payment.status === "failed" ? "Payment failed" :
                payment.status === "refunded" ? "Payment refunded" : "Payment received",
        name: payment.clientName || payment.description || "Payment",
        time: new Date(payment.createdAt),
        type: "payment",
      });
    }

    // Sort by time descending, take top 8
    activityItems.sort((a, b) => b.time.getTime() - a.time.getTime());
    const formattedActivity = activityItems.slice(0, 8).map((item, index) => ({
      id: index + 1,
      action: item.action,
      name: item.name,
      time: getRelativeTime(item.time),
      type: item.type,
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

    // Previous period attendance & no-show rates
    const previousAttendanceRate = previousBookings > 0
      ? (((previousBookings - previousNoShows) / previousBookings) * 100).toFixed(1)
      : "0";
    const previousNoShowRate = previousBookings > 0
      ? ((previousNoShows / previousBookings) * 100).toFixed(1)
      : "0";

    // Waitlist fill rate
    const waitlistFillRate = waitlistSpotsGenerated > 0
      ? Math.round((waitlistFills / waitlistSpotsGenerated) * 100)
      : 0;

    return NextResponse.json({
      stats: {
        revenue: currentRevenue,
        revenueChange: `${parseFloat(revenueChange) >= 0 ? "+" : ""}${revenueChange}%`,
        clients: activeClients,
        clientsChange: `${clientsChange >= 0 ? "+" : ""}${clientsChange}`,
        classes: totalClasses,
        classesChange: `${parseFloat(classesChange) >= 0 ? "+" : ""}${classesChange}%`,
        attendance: `${attendanceRate}%`,
        previousAttendance: `${previousAttendanceRate}%`,
        noShowRate: `${noShowRate}%`,
        previousNoShowRate: `${previousNoShowRate}%`,
        noShows,
        waitlistFills,
        waitlistSpotsGenerated,
        waitlistFillRate,
        revenueRecovered,
      },
      recentActivity: formattedActivity,
      todayClasses: formattedClasses,
      trend,
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
