import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import { resolveStaffId } from "@/lib/auth/resolve-staff";
import type { Class, Booking } from "@/lib/db/schemas";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const isAdmin = user.role === "admin";
    const teacherId = isAdmin ? null : await resolveStaffId(user.userId);

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build filter for waitlist requests
    const filter: Record<string, unknown> = {
      type: { $in: ["reschedule", "makeup", "cancelled_by_client"] }
    };
    if (user.establishmentId) {
      filter.establishmentId = user.establishmentId;
    }

    if (status) {
      filter.status = status;
    }

    // Get makeup/reschedule requests from waitlist
    const requests = await db.collection("waitlist")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Admin sees all requests; teacher sees only their classes
    let teacherRequests;
    if (isAdmin) {
      teacherRequests = requests;
    } else {
      const teacherClasses = await db.collection<Class>("classes")
        .find({ instructorId: teacherId! })
        .project({ _id: 1 })
        .toArray();
      const teacherClassIds = teacherClasses.map(c => c._id?.toString());

      teacherRequests = requests.filter(r =>
        teacherClassIds.includes(r.classId) ||
        r.instructorId === teacherId ||
        r.preferredInstructorId === teacherId
      );
    }

    // Also get no-show bookings that need makeup
    const noShowFilter: Record<string, unknown> = { status: "no-show" };
    if (!isAdmin && teacherId) {
      noShowFilter.instructorId = teacherId;
    }
    const noShowBookings = await db.collection<Booking>("bookings")
      .find(noShowFilter)
      .sort({ scheduledDate: -1 })
      .limit(20)
      .toArray();

    // Format requests
    const formattedRequests = teacherRequests.map(r => ({
      id: r._id?.toString() || "",
      studentName: r.clientName || "Unknown Student",
      studentInitials: (r.clientName || "UN").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
      originalClass: r.className || "Class",
      originalDate: r.originalDate
        ? new Date(r.originalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : r.createdAt
          ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "N/A",
      requestedDate: r.preferredDate
        ? new Date(r.preferredDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
        : undefined,
      status: r.status as "pending" | "scheduled" | "completed" | "cancelled",
      reason: r.reason || undefined,
      createdAt: r.createdAt
    }));

    // Add no-show bookings as makeup requests
    for (const booking of noShowBookings) {
      // Check if already in requests
      const exists = formattedRequests.some(r =>
        r.studentName === booking.clientName &&
        r.originalClass === booking.className
      );

      if (!exists) {
        formattedRequests.push({
          id: `noshow-${booking._id?.toString()}`,
          studentName: booking.clientName,
          studentInitials: booking.clientName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
          originalClass: booking.className,
          originalDate: new Date(booking.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          requestedDate: undefined,
          status: "pending",
          reason: "No-show",
          createdAt: booking.updatedAt || booking.createdAt
        });
      }
    }

    // Sort by date
    formattedRequests.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ requests: formattedRequests });
  } catch (error) {
    console.error("Teacher makeups error:", error);
    return NextResponse.json(
      { error: "Failed to load makeup requests" },
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
    const { requestId, action, scheduledDate, scheduledTime, classId } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Handle no-show booking makeup
    if (requestId.startsWith("noshow-")) {
      const bookingId = requestId.replace("noshow-", "");

      if (action === "schedule" && scheduledDate && classId) {
        // Create a new booking for the makeup class
        const originalBooking = await db.collection<Booking>("bookings").findOne({
          _id: new ObjectId(bookingId)
        });

        if (!originalBooking) {
          return NextResponse.json(
            { error: "Original booking not found" },
            { status: 404 }
          );
        }

        // Get the new class details
        const newClass = await db.collection<Class>("classes").findOne({
          _id: new ObjectId(classId)
        });

        if (!newClass) {
          return NextResponse.json(
            { error: "Target class not found" },
            { status: 404 }
          );
        }

        // Create makeup booking
        const makeupBooking: Omit<Booking, "_id"> = {
          clientId: originalBooking.clientId,
          clientName: originalBooking.clientName,
          classId,
          className: newClass.title,
          instructorId: newClass.instructorId,
          instructorName: newClass.instructorName,
          scheduledDate: new Date(scheduledDate),
          startTime: newClass.startTime,
          endTime: newClass.endTime,
          status: "confirmed",
          source: "admin",
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.collection<Booking>("bookings").insertOne(makeupBooking);

        // Update class enrollment
        await db.collection<Class>("classes").updateOne(
          { _id: new ObjectId(classId) },
          {
            $inc: { currentEnrollment: 1 },
            $push: {
              enrolledClients: {
                clientId: originalBooking.clientId,
                clientName: originalBooking.clientName,
                status: "confirmed",
                enrolledAt: new Date()
              }
            }
          }
        );

        return NextResponse.json({
          success: true,
          message: "Makeup class scheduled successfully"
        });
      }
    }

    // Handle regular waitlist request
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    };

    if (action === "approve" || action === "schedule") {
      updateData.status = "scheduled";
      if (scheduledDate) {
        updateData.preferredDate = new Date(scheduledDate);
      }
      if (classId) {
        updateData.assignedClassId = classId;
      }
    } else if (action === "reject" || action === "cancel") {
      updateData.status = "cancelled";
    } else if (action === "complete") {
      updateData.status = "completed";
    }

    await db.collection("waitlist").updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateData }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update makeup request error:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
