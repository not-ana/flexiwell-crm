import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { Staff, Booking, Class } from "@/lib/db/schemas";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

async function getUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const teacherId = user.userId;

    // Get teacher/staff data
    let teacher: Staff | null = null;
    if (ObjectId.isValid(teacherId)) {
      teacher = await db.collection<Staff>("staff").findOne({
        _id: new ObjectId(teacherId),
      });
    }

    // If not found by ID, try by email
    if (!teacher) {
      teacher = await db.collection<Staff>("staff").findOne({
        email: user.email,
      });
    }

    if (!teacher) {
      // Return default profile if not found
      return NextResponse.json({
        user: {
          name: user.email.split("@")[0],
          email: user.email,
          initials: user.email.substring(0, 2).toUpperCase(),
          location: "Brasil",
          locationFlag: "🇧🇷",
          phone: "",
          role: "Instructor",
          specialties: [],
          about: "",
        },
        stats: {
          totalStudents: 0,
          classesThisWeek: 0,
          avgRating: 0,
          yearsExperience: 0,
        },
        upcomingClasses: [],
      });
    }

    // Calculate stats
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Get classes this week
    const classesThisWeek = await db.collection<Class>("classes")
      .countDocuments({
        instructorId: teacherId,
        scheduledDate: { $gte: weekStart, $lt: weekEnd },
      });

    // Get unique students count
    const bookings = await db.collection<Booking>("bookings")
      .find({ instructorId: teacherId })
      .toArray();
    const uniqueStudents = new Set(bookings.map(b => b.clientId));

    // Get upcoming classes
    const upcomingClassesDocs = await db.collection<Class>("classes")
      .find({
        instructorId: teacherId,
        scheduledDate: { $gte: now },
        status: { $ne: "cancelled" },
      })
      .sort({ scheduledDate: 1, startTime: 1 })
      .limit(5)
      .toArray();

    // Format upcoming classes
    const upcomingClasses = upcomingClassesDocs.map(c => {
      const classDate = new Date(c.scheduledDate);
      const isToday = classDate.toDateString() === now.toDateString();
      const isTomorrow = classDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();

      let dateLabel: string;
      if (isToday) dateLabel = "Today";
      else if (isTomorrow) dateLabel = "Tomorrow";
      else dateLabel = classDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

      return {
        id: c._id?.toString() || "",
        title: c.title,
        time: `${c.startTime} - ${c.endTime}`,
        date: dateLabel,
        students: c.currentEnrollment,
        maxStudents: c.maxCapacity,
      };
    });

    // Calculate years of experience (from createdAt)
    const yearsExp = teacher.createdAt
      ? Math.floor((now.getTime() - new Date(teacher.createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 1;

    return NextResponse.json({
      user: {
        name: teacher.name,
        email: teacher.email,
        avatar: teacher.avatar,
        initials: teacher.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
        location: "Brasil",
        locationFlag: "🇧🇷",
        phone: teacher.phone || "",
        role: teacher.role === "teacher" ? "Instructor" : teacher.role.charAt(0).toUpperCase() + teacher.role.slice(1),
        specialties: teacher.specialties || [],
        about: teacher.bio || "",
      },
      stats: {
        totalStudents: uniqueStudents.size,
        classesThisWeek,
        avgRating: 4.9, // TODO: Implement ratings system
        yearsExperience: Math.max(yearsExp, 1),
      },
      upcomingClasses,
    });
  } catch (error) {
    console.error("Teacher profile error:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
