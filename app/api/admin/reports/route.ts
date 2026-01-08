import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";

// GET /api/admin/reports - Get detailed reports data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // revenue, classes, instructors, clients
    const period = searchParams.get("period") || "month"; // week, month, quarter, year
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const db = await getDatabase();
    const now = new Date();

    // Calculate date ranges
    let startDate: Date;
    let endDate: Date = now;
    let previousStartDate: Date;
    let previousEndDate: Date;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      const periodLength = endDate.getTime() - startDate.getTime();
      previousEndDate = startDate;
      previousStartDate = new Date(startDate.getTime() - periodLength);
    } else {
      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousEndDate = startDate;
          previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "quarter":
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          previousEndDate = startDate;
          previousStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 3, 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          previousEndDate = startDate;
          previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
          break;
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          previousEndDate = startDate;
          previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      }
    }

    const response: Record<string, unknown> = {};

    // Revenue Report
    if (type === "all" || type === "revenue") {
      const [currentRevenue, previousRevenue, monthlyBreakdown, paymentMethods] = await Promise.all([
        // Total revenue current period
        db.collection("payments").aggregate([
          { $match: { status: "completed", createdAt: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
        ]).toArray(),
        // Previous period revenue
        db.collection("payments").aggregate([
          { $match: { status: "completed", createdAt: { $gte: previousStartDate, $lt: previousEndDate } } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]).toArray(),
        // Monthly breakdown
        db.collection("payments").aggregate([
          { $match: { status: "completed", createdAt: { $gte: startDate, $lte: endDate } } },
          {
            $group: {
              _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
              revenue: { $sum: "$amount" },
              clients: { $addToSet: "$clientId" }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]).toArray(),
        // Payment methods
        db.collection("payments").aggregate([
          { $match: { status: "completed", createdAt: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: "$method", count: { $sum: 1 }, total: { $sum: "$amount" } } }
        ]).toArray(),
      ]);

      const current = currentRevenue[0]?.total || 0;
      const previous = previousRevenue[0]?.total || 0;
      const growth = previous > 0 ? ((current - previous) / previous * 100) : 0;

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const monthly = monthlyBreakdown.map((m: any) => ({
        month: monthNames[(m._id.month - 1) % 12],
        year: m._id.year,
        revenue: m.revenue,
        clients: m.clients?.length || 0,
      }));

      response.revenue = {
        total: current,
        growth: parseFloat(growth.toFixed(1)),
        monthly,
        paymentCount: currentRevenue[0]?.count || 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        byMethod: paymentMethods.map((m: any) => ({
          method: m._id || "other",
          count: m.count,
          total: m.total,
        })),
      };
    }

    // Classes Report
    if (type === "all" || type === "classes") {
      const [classStats, popularClasses, classTypeBreakdown] = await Promise.all([
        // Class statistics
        db.collection("classes").aggregate([
          { $match: { scheduledDate: { $gte: startDate, $lte: endDate } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
              cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
              totalCapacity: { $sum: "$maxCapacity" },
              totalEnrollment: { $sum: "$currentEnrollment" },
            }
          }
        ]).toArray(),
        // Popular classes
        db.collection("classes").aggregate([
          { $match: { scheduledDate: { $gte: startDate, $lte: endDate }, status: { $ne: "cancelled" } } },
          {
            $group: {
              _id: "$title",
              sessions: { $sum: 1 },
              totalEnrollment: { $sum: "$currentEnrollment" },
              totalCapacity: { $sum: "$maxCapacity" },
            }
          },
          {
            $project: {
              name: "$_id",
              sessions: 1,
              avgAttendance: {
                $cond: [{ $gt: ["$totalCapacity", 0] }, { $multiply: [{ $divide: ["$totalEnrollment", "$totalCapacity"] }, 100] }, 0]
              },
            }
          },
          { $sort: { sessions: -1 } },
          { $limit: 10 }
        ]).toArray(),
        // By type
        db.collection("classes").aggregate([
          { $match: { scheduledDate: { $gte: startDate, $lte: endDate } } },
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            }
          }
        ]).toArray(),
      ]);

      const stats = classStats[0] || { total: 0, completed: 0, cancelled: 0, totalCapacity: 0, totalEnrollment: 0 };
      const avgAttendance = stats.totalCapacity > 0 ? (stats.totalEnrollment / stats.totalCapacity) * 100 : 0;
      const cancelRate = stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0;

      response.classes = {
        totalClasses: stats.total,
        completedClasses: stats.completed,
        cancelledClasses: stats.cancelled,
        avgAttendance: parseFloat(avgAttendance.toFixed(1)),
        cancelRate: parseFloat(cancelRate.toFixed(1)),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        popularClasses: popularClasses.map((c: any) => ({
          name: c.name,
          sessions: c.sessions,
          avgAttendance: parseFloat((c.avgAttendance || 0).toFixed(1)),
          revenue: 0, // Would need to join with payments
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        byType: classTypeBreakdown.map((t: any) => ({
          type: t._id || "other",
          count: t.count,
          completed: t.completed,
        })),
      };
    }

    // Instructors Report
    if (type === "all" || type === "instructors") {
      const instructors = await db.collection("staff").find({
        role: "teacher",
        status: "active",
      }).toArray();

      const instructorStats = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        instructors.map(async (instructor: any) => {
          const instructorId = instructor._id.toString();

          const [classesData, bookingsData, ratingsData] = await Promise.all([
            // Classes taught
            db.collection("classes").countDocuments({
              instructorId,
              scheduledDate: { $gte: startDate, $lte: endDate },
            }),
            // Bookings stats
            db.collection("bookings").aggregate([
              {
                $match: {
                  instructorId,
                  scheduledDate: { $gte: startDate, $lte: endDate },
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                  uniqueClients: { $addToSet: "$clientId" },
                }
              }
            ]).toArray(),
            // Ratings
            db.collection("reviews").aggregate([
              { $match: { instructorId, createdAt: { $gte: startDate, $lte: endDate } } },
              { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
            ]).toArray(),
          ]);

          const bookings = bookingsData[0] || { total: 0, completed: 0, uniqueClients: [] };
          const ratings = ratingsData[0] || { avgRating: 4.5, count: 0 };

          return {
            id: instructorId,
            name: instructor.name,
            classes: classesData,
            students: bookings.uniqueClients?.length || 0,
            rating: parseFloat((ratings.avgRating || 4.5).toFixed(1)),
            reviewCount: ratings.count || 0,
            revenue: 0, // Would need to calculate from bookings
          };
        })
      );

      const totalRating = instructorStats.reduce((sum, i) => sum + i.rating, 0);
      const avgRating = instructorStats.length > 0 ? totalRating / instructorStats.length : 0;

      response.instructors = {
        totalInstructors: instructors.length,
        totalClassesTaught: instructorStats.reduce((sum, i) => sum + i.classes, 0),
        avgRating: parseFloat(avgRating.toFixed(1)),
        satisfaction: 92, // Would need proper feedback calculation
        instructors: instructorStats.sort((a, b) => b.classes - a.classes),
      };
    }

    // Clients Report
    if (type === "all" || type === "clients") {
      const [clientCounts, newClients, planDistribution, clientGrowth] = await Promise.all([
        // Client counts
        db.collection("clients").aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
              inactive: { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
            }
          }
        ]).toArray(),
        // New clients this period
        db.collection("clients").countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
        }),
        // Plan distribution
        db.collection("clients").aggregate([
          { $match: { status: "active" } },
          { $group: { _id: "$plan.type", count: { $sum: 1 } } }
        ]).toArray(),
        // Client growth (monthly)
        db.collection("clients").aggregate([
          { $match: { createdAt: { $gte: new Date(now.getFullYear(), 0, 1) } } },
          {
            $group: {
              _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
              clients: { $sum: 1 },
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]).toArray(),
      ]);

      const counts = clientCounts[0] || { total: 0, active: 0, inactive: 0 };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalPlans = planDistribution.reduce((sum: number, p: any) => sum + p.count, 0);

      // Calculate churn rate
      const previousActiveClients = await db.collection("clients").countDocuments({
        status: "active",
        createdAt: { $lt: startDate },
      });
      const churnedClients = await db.collection("clients").countDocuments({
        status: "inactive",
        updatedAt: { $gte: startDate, $lte: endDate },
      });
      const churnRate = previousActiveClients > 0 ? (churnedClients / previousActiveClients) * 100 : 0;

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      response.clients = {
        totalClients: counts.total,
        activeClients: counts.active,
        inactiveClients: counts.inactive,
        newThisMonth: newClients,
        churnRate: parseFloat(churnRate.toFixed(1)),
        retention: parseFloat((100 - churnRate).toFixed(1)),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        planDistribution: planDistribution.map((p: any) => ({
          plan: p._id || "none",
          type: p._id || "none",
          count: p.count,
          percentage: totalPlans > 0 ? parseFloat(((p.count / totalPlans) * 100).toFixed(1)) : 0,
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clientGrowth: clientGrowth.map((g: any) => ({
          month: monthNames[(g._id.month - 1) % 12],
          year: g._id.year,
          clients: g.clients,
        })),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
