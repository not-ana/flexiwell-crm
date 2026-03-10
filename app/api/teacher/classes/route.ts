import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import { resolveStaffId } from "@/lib/auth/resolve-staff";
import type { Class, Booking, Establishment } from "@/lib/db/schemas";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const teacherId = await resolveStaffId(user.userId);

    // Get query params
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    // Build filter
    const filter: Record<string, unknown> = {
      instructorId: teacherId
    };

    if (startDate && endDate) {
      filter.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default: get classes from last month to next month
      const now = new Date();
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const oneMonthAhead = new Date(now);
      oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);
      filter.scheduledDate = {
        $gte: oneMonthAgo,
        $lte: oneMonthAhead
      };
    }

    if (status) {
      filter.status = status;
    }

    // Get classes
    const classes = await db.collection<Class>("classes")
      .find(filter)
      .sort({ scheduledDate: 1, startTime: 1 })
      .toArray();

    // Get bookings for each class to populate student list
    const classIds = classes.map(c => c._id?.toString()).filter(Boolean);
    const bookings = await db.collection<Booking>("bookings")
      .find({
        classId: { $in: classIds },
        status: { $in: ["confirmed", "completed", "pending"] }
      })
      .toArray();

    // Map bookings to classes
    const bookingsByClass: Record<string, Booking[]> = {};
    for (const booking of bookings) {
      if (!bookingsByClass[booking.classId]) {
        bookingsByClass[booking.classId] = [];
      }
      bookingsByClass[booking.classId].push(booking);
    }

    // Format classes for calendar view
    const typeColors: Record<string, string> = {
      yoga: "green",
      pilates: "purple",
      stretching: "orange",
      meditation: "blue",
      other: "gray"
    };

    const formattedClasses = classes.map(c => {
      const classId = c._id?.toString() || "";
      const classBookings = bookingsByClass[classId] || [];

      // Determine status based on date/time
      const now = new Date();
      const classDate = new Date(c.scheduledDate);
      const [startH, startM] = c.startTime.split(":").map(Number);
      classDate.setHours(startH, startM);
      const endDate = new Date(classDate);
      endDate.setMinutes(endDate.getMinutes() + c.duration);

      let displayStatus: string = c.status;
      if (c.status === "scheduled") {
        if (now >= classDate && now <= endDate) {
          displayStatus = "in-progress";
        } else if (now > endDate) {
          displayStatus = "completed";
        }
      }

      // Format students
      const students = classBookings.map(b => ({
        id: b.clientId,
        name: b.clientName,
        initials: b.clientName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
        attended: b.status === "completed"
      }));

      return {
        id: classId,
        title: c.title,
        type: c.type.charAt(0).toUpperCase() + c.type.slice(1),
        start: classDate.toISOString(),
        end: endDate.toISOString(),
        color: typeColors[c.type] || "gray",
        status: displayStatus,
        room: c.location || "TBD",
        establishmentId: c.establishmentId,
        capacity: c.maxCapacity,
        enrolled: c.currentEnrollment,
        students
      };
    });

    // Get establishment names for all classes
    const establishmentIds = [...new Set(formattedClasses.map(c => c.establishmentId).filter(Boolean))];
    const establishments = establishmentIds.length > 0
      ? await db.collection<Establishment>("establishments")
          .find({ _id: { $in: establishmentIds.map(id => new ObjectId(id as string)) } })
          .toArray()
      : [];
    const establishmentMap = new Map(establishments.map(e => [e._id?.toString(), e.name]));

    // Add unit name to each class
    const classesWithUnit = formattedClasses.map(c => ({
      ...c,
      unit: c.establishmentId ? establishmentMap.get(c.establishmentId) || "FlexiWell" : "FlexiWell"
    }));

    return NextResponse.json({ classes: classesWithUnit });
  } catch (error) {
    console.error("Teacher classes error:", error);
    return NextResponse.json(
      { error: "Failed to load classes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, type, scheduledDate, startTime, endTime, maxCapacity, location, description, establishmentId, roomId } = body;

    // Validate required fields
    if (!title || !type || !scheduledDate || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const staffId = await resolveStaffId(user.userId);

    // Get teacher's name
    const teacher = await db.collection("users").findOne({ _id: new ObjectId(user.userId) });
    const teacherName = teacher?.name || "Unknown Instructor";

    // Calculate duration
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const duration = (endH * 60 + endM) - (startH * 60 + startM);

    const newClass: Omit<Class, "_id"> = {
      title,
      description: description || "",
      type: type.toLowerCase(),
      instructorId: staffId,
      instructorName: teacherName,
      scheduledDate: new Date(scheduledDate),
      startTime,
      endTime,
      duration,
      maxCapacity: maxCapacity || 15,
      currentEnrollment: 0,
      enrolledClients: [],
      waitlist: [],
      status: "scheduled",
      location: location || "",
      roomId: roomId || undefined,
      establishmentId: establishmentId || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection<Class>("classes").insertOne(newClass);

    return NextResponse.json({
      success: true,
      class: {
        id: result.insertedId.toString(),
        ...newClass
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Create class error:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { classId, status, attendedStudents } = body;

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const staffId = await resolveStaffId(user.userId);

    // Verify teacher owns this class
    const existingClass = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
      instructorId: staffId
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: "Class not found or unauthorized" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status;
    }

    // Update class
    await db.collection<Class>("classes").updateOne(
      { _id: new ObjectId(classId) },
      { $set: updateData }
    );

    // If marking attendance, update bookings
    if (attendedStudents && Array.isArray(attendedStudents)) {
      // Mark attended students as completed
      await db.collection<Booking>("bookings").updateMany(
        {
          classId,
          clientId: { $in: attendedStudents }
        },
        { $set: { status: "completed", updatedAt: new Date() } }
      );

      // Mark non-attended students as no-show
      await db.collection<Booking>("bookings").updateMany(
        {
          classId,
          clientId: { $nin: attendedStudents },
          status: { $in: ["confirmed", "pending"] }
        },
        { $set: { status: "no-show", updatedAt: new Date() } }
      );

      // Update class status to completed
      await db.collection<Class>("classes").updateOne(
        { _id: new ObjectId(classId) },
        { $set: { status: "completed", updatedAt: new Date() } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update class error:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}
