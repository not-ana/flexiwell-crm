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

    const db = await getDatabase();

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousEndDate = startDate;
      previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
      previousEndDate = startDate;
      previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
    } else {
      // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      previousEndDate = startDate;
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    // Run all queries in parallel
    const [
      // Current period stats
      totalClients,
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
      // Staff performance
      staffList,
      // Today's classes
      todayClasses,
      // Class types distribution
      classTypeDistribution,
    ] = await Promise.all([
      // Total clients
      db.collection("clients").countDocuments(),
      // Active clients
      db.collection("clients").countDocuments({ status: "active" }),
      // New clients this period
      db.collection("clients").countDocuments({
        createdAt: { $gte: startDate },
      }),
      // Total classes this period
      db.collection("classes").countDocuments({
        scheduledDate: { $gte: startDate },
      }),
      // Completed bookings this period
      db.collection("bookings").countDocuments({
        status: "completed",
        scheduledDate: { $gte: startDate },
      }),
      // Total revenue this period
      db.collection("payments").aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: startDate },
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
      }),
      // Previous period classes
      db.collection("classes").countDocuments({
        scheduledDate: { $gte: previousStartDate, $lt: previousEndDate },
      }),
      // Previous period revenue
      db.collection("payments").aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: previousStartDate, $lt: previousEndDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]).toArray(),
      // Recent activity (last 10)
      db.collection("bookings")
        .find()
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),
      // Staff list with their class counts
      db.collection("staff")
        .find({ status: "active" })
        .limit(10)
        .toArray(),
      // Today's classes
      db.collection("classes")
        .find({
          scheduledDate: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        })
        .sort({ startTime: 1 })
        .limit(10)
        .toArray(),
      // Class type distribution
      db.collection("classes").aggregate([
        {
          $match: {
            scheduledDate: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]).toArray(),
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

    // Format staff performance - Optimized with single aggregation query
    // Get all staff IDs for the aggregation
    const staffIds = staffList.map((staff: any) => staff._id.toString());

    // Single aggregation to get all staff metrics at once
    const staffMetrics = await db.collection("bookings").aggregate([
      {
        $match: {
          instructorId: { $in: staffIds },
          scheduledDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$instructorId",
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          clientsServed: {
            $addToSet: {
              $cond: [
                { $in: ["$status", ["completed", "confirmed"]] },
                "$clientId",
                null
              ]
            }
          }
        }
      }
    ]).toArray();

    // Get classes count for all staff in one query
    const classMetrics = await db.collection("classes").aggregate([
      {
        $match: {
          instructorId: { $in: staffIds },
          scheduledDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$instructorId",
          classCount: { $sum: 1 }
        }
      }
    ]).toArray();

    // Create lookup maps for O(1) access
    const metricsMap = new Map(staffMetrics.map(m => [m._id, m]));
    const classCountMap = new Map(classMetrics.map(c => [c._id, c.classCount]));

    // Format staff performance with pre-computed metrics
    const staffPerformance = staffList.map((staff: any) => {
      const staffId = staff._id.toString();
      const metrics = metricsMap.get(staffId);
      const classCount = classCountMap.get(staffId) || 0;

      // Calculate stats from aggregated data
      const totalBookings = metrics?.totalBookings || 0;
      const completedBookings = metrics?.completedBookings || 0;
      const clientsServed = metrics?.clientsServed?.filter((c: any) => c !== null).length || 0;
      const attendance = totalBookings > 0
        ? Math.round((completedBookings / totalBookings) * 100)
        : 0;

      return {
        id: staffId,
        name: staff.name,
        role: staff.role,
        initials: staff.name.split(" ").map((n: string) => n[0]).join("").toUpperCase(),
        avatar: staff.avatar,
        stats: {
          classesThisMonth: classCount,
          clientsServed,
          attendance,
        },
        trend: classCount > 10 ? "up" : classCount > 5 ? "stable" : "down",
      };
    });

    // Format today's classes
    const formattedClasses = todayClasses.map((cls: any) => ({
      id: cls._id.toString(),
      name: cls.title,
      time: cls.startTime,
      instructor: cls.instructorName,
      enrolled: cls.currentEnrollment || 0,
      capacity: cls.maxCapacity || 10,
    }));

    // Format class type distribution
    const classTypes = classTypeDistribution.map((type: any) => ({
      name: type._id ? type._id.charAt(0).toUpperCase() + type._id.slice(1) : "Other",
      value: type.count,
    }));

    // Calculate percentages for pie chart
    const totalClassCount = classTypes.reduce((sum: number, t: any) => sum + t.value, 0);
    const classTypesWithPercent = classTypes.map((type: any, index: number) => ({
      ...type,
      value: totalClassCount > 0 ? Math.round((type.value / totalClassCount) * 100) : 0,
      color: ["#6938EF", "#8870E9", "#5925DC", "#BDB4FE"][index % 4],
    }));

    // Calculate previous period attendance for change comparison
    const previousBookingsInPeriod = await db.collection("bookings").countDocuments({
      scheduledDate: { $gte: previousStartDate, $lt: previousEndDate },
    });
    const previousCompletedBookings = await db.collection("bookings").countDocuments({
      status: "completed",
      scheduledDate: { $gte: previousStartDate, $lt: previousEndDate },
    });
    const previousAttendanceRate = previousBookingsInPeriod > 0
      ? (previousCompletedBookings / previousBookingsInPeriod) * 100
      : 0;
    const currentAttendanceNum = parseFloat(attendanceRate);
    const attendanceChange = previousAttendanceRate > 0
      ? (currentAttendanceNum - previousAttendanceRate).toFixed(1)
      : "0";

    // Get monthly revenue data for chart (last 12 months)
    const monthlyRevenueData = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const lastYearMonthStart = new Date(now.getFullYear() - 1, now.getMonth() - i, 1);
      const lastYearMonthEnd = new Date(now.getFullYear() - 1, now.getMonth() - i + 1, 0);

      const [currentMonthRevenue, lastYearMonthRevenue] = await Promise.all([
        db.collection("payments").aggregate([
          { $match: { status: "completed", createdAt: { $gte: monthStart, $lte: monthEnd } } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray(),
        db.collection("payments").aggregate([
          { $match: { status: "completed", createdAt: { $gte: lastYearMonthStart, $lte: lastYearMonthEnd } } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray()
      ]);

      monthlyRevenueData.push({
        month: monthStart.toLocaleString("en-US", { month: "short" }),
        revenue: currentMonthRevenue[0]?.total || 0,
        lastYear: lastYearMonthRevenue[0]?.total || 0,
      });
    }

    // Get weekly attendance data for chart (last 8 weeks)
    const weeklyAttendanceData = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const [weekBookings, weekCompleted] = await Promise.all([
        db.collection("bookings").countDocuments({
          scheduledDate: { $gte: weekStart, $lt: weekEnd }
        }),
        db.collection("bookings").countDocuments({
          status: "completed",
          scheduledDate: { $gte: weekStart, $lt: weekEnd }
        })
      ]);

      const weekRate = weekBookings > 0 ? Math.round((weekCompleted / weekBookings) * 100) : 0;
      weeklyAttendanceData.push({
        week: `W${8 - i}`,
        rate: weekRate,
      });
    }

    // Calculate retention rate
    // Retention = clients who had bookings in both previous and current period / clients in previous period
    const previousPeriodClients = await db.collection("bookings").aggregate([
      {
        $match: {
          scheduledDate: { $gte: previousStartDate, $lt: previousEndDate }
        }
      },
      {
        $group: { _id: "$clientId" }
      }
    ]).toArray();
    const previousClientIds = previousPeriodClients.map(c => c._id);

    let retentionRate = 0;
    if (previousClientIds.length > 0) {
      const returningClients = await db.collection("bookings").aggregate([
        {
          $match: {
            clientId: { $in: previousClientIds },
            scheduledDate: { $gte: startDate }
          }
        },
        {
          $group: { _id: "$clientId" }
        },
        {
          $count: "count"
        }
      ]).toArray();
      const returningCount = returningClients[0]?.count || 0;
      retentionRate = Math.round((returningCount / previousClientIds.length) * 100);
    }

    return NextResponse.json({
      stats: {
        revenue: currentRevenue,
        revenueChange: `${parseFloat(revenueChange) >= 0 ? "+" : ""}${revenueChange}%`,
        clients: activeClients,
        clientsChange: `${clientsChange >= 0 ? "+" : ""}${clientsChange}`,
        classes: totalClasses,
        classesChange: `${parseFloat(classesChange) >= 0 ? "+" : ""}${classesChange}%`,
        attendance: `${attendanceRate}%`,
        attendanceChange: `${parseFloat(attendanceChange) >= 0 ? "+" : ""}${attendanceChange}%`,
      },
      recentActivity: formattedActivity,
      staffPerformance,
      todayClasses: formattedClasses,
      classTypeDistribution: classTypesWithPercent.length > 0 ? classTypesWithPercent : [
        { name: "Pilates", value: 45, color: "#6938EF" },
        { name: "Yoga", value: 25, color: "#8870E9" },
        { name: "Reformer", value: 20, color: "#5925DC" },
        { name: "Stretch", value: 10, color: "#BDB4FE" },
      ],
      monthlyHighlights: {
        newClients,
        retentionRate,
        revenueGrowth: revenueChange,
      },
      revenueData: monthlyRevenueData,
      attendanceData: weeklyAttendanceData,
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
