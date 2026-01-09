import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import type { Booking, Class } from "@/lib/db/schemas";

// GET - Fetch client's scheduled classes
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();

    // Get client's bookings
    const bookings = await db.collection<Booking>("bookings")
      .find({
        clientId: user.userId,
        status: { $in: ["confirmed", "pending", "completed", "cancelled"] },
      })
      .sort({ scheduledDate: 1 })
      .limit(100)
      .toArray();

    // Get class IDs to fetch class types
    const classIds = [...new Set(bookings.map(b => b.classId))];
    const validClassIds = classIds.filter(id => ObjectId.isValid(id));

    // Fetch classes to get their types
    const classes = await db.collection<Class>("classes")
      .find({ _id: { $in: validClassIds.map(id => new ObjectId(id)) } })
      .toArray();

    // Create a map of classId -> classType
    const classTypeMap: Record<string, string> = {};
    classes.forEach(c => {
      classTypeMap[c._id?.toString() || ""] = c.type || "other";
    });

    // Map bookings to calendar events
    const colorMap: Record<string, "purple" | "gray" | "pink" | "orange" | "green" | "blue" | "red"> = {
      yoga: "purple",
      pilates: "pink",
      stretching: "green",
      meditation: "blue",
      other: "gray",
    };

    const events = bookings.map((booking) => {
      // Parse date and time
      const date = new Date(booking.scheduledDate);
      const [startHour, startMin] = (booking.startTime || "09:00").split(":").map(Number);
      const [endHour, endMin] = (booking.endTime || "10:00").split(":").map(Number);

      const start = new Date(date);
      start.setHours(startHour, startMin, 0, 0);

      const end = new Date(date);
      end.setHours(endHour, endMin, 0, 0);

      // Get class type from the classTypeMap
      const classType = classTypeMap[booking.classId] || "other";

      return {
        id: booking._id?.toString() || "",
        title: booking.className,
        instructor: booking.instructorName,
        start: start.toISOString(),
        end: end.toISOString(),
        color: colorMap[classType.toLowerCase()] || "gray",
        status: booking.status as "scheduled" | "completed" | "cancelled",
      };
    });

    return NextResponse.json({
      events,
    });
  } catch (error) {
    console.error("Dashboard classes API error:", error);
    return NextResponse.json(
      { error: "Failed to load classes" },
      { status: 500 }
    );
  }
}
