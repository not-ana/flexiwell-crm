import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import type { Class, Booking, Staff, Review } from "@/lib/db/schemas";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const teacherId = user.userId;

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get teacher's classes for today
    const todayClasses = await db.collection<Class>("classes")
      .find({
        instructorId: teacherId,
        scheduledDate: { $gte: today, $lt: tomorrow }
      })
      .sort({ startTime: 1 })
      .toArray();

    // Get upcoming classes (next 7 days excluding today)
    const upcomingClasses = await db.collection<Class>("classes")
      .find({
        instructorId: teacherId,
        scheduledDate: { $gte: tomorrow, $lt: weekEnd },
        status: "scheduled"
      })
      .sort({ scheduledDate: 1, startTime: 1 })
      .limit(10)
      .toArray();

    // Get this month's bookings for stats
    const monthBookings = await db.collection<Booking>("bookings")
      .find({
        instructorId: teacherId,
        scheduledDate: { $gte: monthStart }
      })
      .toArray();

    // Get completed classes this month
    const completedClasses = await db.collection<Class>("classes")
      .countDocuments({
        instructorId: teacherId,
        scheduledDate: { $gte: monthStart },
        status: "completed"
      });

    const totalClassesMonth = await db.collection<Class>("classes")
      .countDocuments({
        instructorId: teacherId,
        scheduledDate: { $gte: monthStart }
      });

    // Calculate stats
    const completedBookings = monthBookings.filter(b => b.status === "completed");
    const totalAttended = completedBookings.length;
    const totalBooked = monthBookings.filter(b => b.status !== "cancelled").length;
    const avgAttendance = totalBooked > 0 ? Math.round((totalAttended / totalBooked) * 100) : 0;

    // Get unique students served
    const uniqueStudents = new Set(monthBookings.map(b => b.clientId));

    // Calculate teaching hours
    const teachingMinutes = await db.collection<Class>("classes")
      .aggregate([
        {
          $match: {
            instructorId: teacherId,
            scheduledDate: { $gte: monthStart },
            status: "completed"
          }
        },
        {
          $group: {
            _id: null,
            totalMinutes: { $sum: "$duration" }
          }
        }
      ])
      .toArray();
    const hoursTeaching = Math.round((teachingMinutes[0]?.totalMinutes || 0) / 60);

    // Get pending makeup requests (from waitlist with type reschedule)
    const makeupRequests = await db.collection("waitlist")
      .find({
        type: { $in: ["reschedule", "makeup"] },
        status: "pending"
      })
      .toArray();

    // Filter makeup requests related to this teacher's classes
    const teacherClassIds = todayClasses.map(c => c._id?.toString());
    const pendingMakeups = makeupRequests.filter(r =>
      teacherClassIds.includes(r.classId) || r.instructorId === teacherId
    );

    // Get weekly class data
    const weeklyData = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayClasses = await db.collection<Class>("classes")
        .find({
          instructorId: teacherId,
          scheduledDate: { $gte: dayStart, $lt: dayEnd }
        })
        .toArray();

      const dayStudents = dayClasses.reduce((sum, c) => sum + c.currentEnrollment, 0);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      weeklyData.push({
        day: days[i],
        classes: dayClasses.length,
        students: dayStudents
      });
    }

    // Get class type distribution
    const classTypeAgg = await db.collection<Class>("classes")
      .aggregate([
        {
          $match: {
            instructorId: teacherId,
            scheduledDate: { $gte: monthStart }
          }
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();

    const typeColors: Record<string, string> = {
      yoga: "#7C3AED",
      pilates: "#8B5CF6",
      stretching: "#A78BFA",
      meditation: "#C4B5FD",
      other: "#DDD6FE"
    };

    const totalTypeCount = classTypeAgg.reduce((sum, t) => sum + t.count, 0);
    const classTypeData = classTypeAgg.map(t => ({
      name: t._id.charAt(0).toUpperCase() + t._id.slice(1),
      value: totalTypeCount > 0 ? Math.round((t.count / totalTypeCount) * 100) : 0,
      color: typeColors[t._id] || "#DDD6FE"
    }));

    // Get student attendance data (students from recent classes)
    const recentBookings = await db.collection<Booking>("bookings")
      .find({
        instructorId: teacherId,
        scheduledDate: { $gte: monthStart }
      })
      .toArray();

    const studentStats: Record<string, {
      name: string;
      attended: number;
      total: number;
      lastClass: Date | null;
      needsMakeup: boolean;
    }> = {};

    for (const booking of recentBookings) {
      if (!studentStats[booking.clientId]) {
        studentStats[booking.clientId] = {
          name: booking.clientName,
          attended: 0,
          total: 0,
          lastClass: null,
          needsMakeup: false
        };
      }
      studentStats[booking.clientId].total++;
      if (booking.status === "completed") {
        studentStats[booking.clientId].attended++;
        if (!studentStats[booking.clientId].lastClass ||
            booking.scheduledDate > studentStats[booking.clientId].lastClass!) {
          studentStats[booking.clientId].lastClass = booking.scheduledDate;
        }
      }
      if (booking.status === "no-show" || booking.status === "cancelled") {
        studentStats[booking.clientId].needsMakeup = true;
      }
    }

    const studentAttendance = Object.entries(studentStats)
      .map(([id, data]) => {
        const initials = data.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        let lastClassText = "Never";
        if (data.lastClass) {
          const diff = Math.floor((today.getTime() - data.lastClass.getTime()) / (1000 * 60 * 60 * 24));
          if (diff === 0) lastClassText = "Today";
          else if (diff === 1) lastClassText = "Yesterday";
          else lastClassText = `${diff} days ago`;
        }
        return {
          id,
          name: data.name,
          initials,
          classesAttended: data.attended,
          totalClasses: data.total,
          lastClass: lastClassText,
          needsMakeup: data.needsMakeup
        };
      })
      .sort((a, b) => b.totalClasses - a.totalClasses)
      .slice(0, 10);

    // Format today's schedule
    const todaySchedule = todayClasses.map(c => {
      const now = new Date();
      const classStart = new Date(c.scheduledDate);
      const [startH, startM] = c.startTime.split(":").map(Number);
      classStart.setHours(startH, startM);
      const classEnd = new Date(classStart);
      classEnd.setMinutes(classEnd.getMinutes() + c.duration);

      let status: "completed" | "in-progress" | "upcoming" = "upcoming";
      if (c.status === "completed") status = "completed";
      else if (now >= classStart && now <= classEnd) status = "in-progress";
      else if (now > classEnd) status = "completed";

      return {
        id: c._id?.toString() || "",
        name: c.title,
        time: `${c.startTime} - ${c.endTime}`,
        status,
        students: c.currentEnrollment,
        room: c.location || "TBD"
      };
    });

    // Format upcoming classes
    const formattedUpcoming = upcomingClasses.map(c => {
      const classDate = new Date(c.scheduledDate);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const isNextDay = classDate.getDate() === tomorrow.getDate();
      const timeStr = isNextDay
        ? `Tomorrow, ${c.startTime}`
        : `${dayNames[classDate.getDay()]}, ${c.startTime}`;

      return {
        id: c._id?.toString() || "",
        name: c.title,
        time: timeStr,
        duration: `${c.duration}min`,
        students: c.currentEnrollment,
        maxStudents: c.maxCapacity,
        room: c.location || "TBD"
      };
    });

    // Format makeup requests
    const formattedMakeups = pendingMakeups.slice(0, 5).map(r => ({
      id: r._id?.toString() || "",
      studentName: r.clientName || "Unknown",
      studentInitials: (r.clientName || "UN").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
      originalClass: r.className || "Class",
      originalDate: r.originalDate ? new Date(r.originalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A",
      requestedDate: r.preferredDate ? new Date(r.preferredDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : undefined,
      status: r.status as "pending" | "scheduled" | "completed"
    }));

    // Get teacher's rating from staff collection
    const teacher = await db.collection<Staff>("staff").findOne({
      $or: [
        { _id: new ObjectId(teacherId) },
        { email: user.email }
      ]
    });

    // Get recent reviews for this teacher
    const recentReviews = await db.collection<Review>("reviews")
      .find({
        staffId: teacherId,
        status: "approved"
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    const formattedReviews = recentReviews.map(r => ({
      id: r._id?.toString() || "",
      clientName: r.clientName,
      rating: r.rating,
      comment: r.comment,
      className: r.className,
      createdAt: r.createdAt,
      response: r.response,
    }));

    const response = {
      stats: {
        classesCompleted: completedClasses,
        totalClasses: totalClassesMonth,
        studentsServed: uniqueStudents.size,
        avgAttendance,
        hoursTeaching,
        makeupPending: pendingMakeups.length,
      },
      rating: teacher?.rating || {
        average: 0,
        totalReviews: 0,
        breakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 },
      },
      recentReviews: formattedReviews,
      todaySchedule,
      upcomingClasses: formattedUpcoming,
      makeupRequests: formattedMakeups,
      weeklyClassData: weeklyData,
      classTypeData,
      studentAttendance,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
