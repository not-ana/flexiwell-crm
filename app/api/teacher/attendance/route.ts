import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { Booking, Class, WaitlistEntry } from "@/lib/db/schemas";

// GET /api/teacher/attendance - Get attendance for a class
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json(
        { error: "Valid class ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get the class
    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classDoc) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // Get all bookings for this class
    const bookings = await db.collection<Booking>("bookings")
      .find({
        classId,
        status: { $in: ["confirmed", "pending", "completed", "no-show"] },
      })
      .toArray();

    const attendance = bookings.map((booking) => ({
      bookingId: booking._id?.toString(),
      clientId: booking.clientId,
      clientName: booking.clientName,
      status: booking.status,
      checkedIn: booking.status === "completed",
      noShow: booking.status === "no-show",
    }));

    return NextResponse.json({
      classId,
      className: classDoc.title,
      classTime: classDoc.startTime,
      totalEnrolled: attendance.length,
      checkedIn: attendance.filter((a) => a.checkedIn).length,
      attendance,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/attendance - Mark attendance for students
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, attendanceData } = body;

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json(
        { error: "Valid class ID is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(attendanceData)) {
      return NextResponse.json(
        { error: "attendanceData array is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();
    const results = { updated: 0, noShows: 0, present: 0 };

    for (const record of attendanceData) {
      const { bookingId, status } = record; // status: "completed" | "no-show"

      if (!ObjectId.isValid(bookingId)) continue;

      const newStatus = status === "present" ? "completed" : "no-show";

      await db.collection<Booking>("bookings").updateOne(
        { _id: new ObjectId(bookingId) },
        {
          $set: {
            status: newStatus,
            updatedAt: now,
          },
        }
      );

      results.updated++;
      if (newStatus === "completed") {
        results.present++;
      } else {
        results.noShows++;

        // Create makeup request for no-shows
        const booking = await db.collection<Booking>("bookings").findOne({
          _id: new ObjectId(bookingId),
        });

        if (booking) {
          // Check if makeup request already exists
          const existingRequest = await db.collection<WaitlistEntry>("waitlist").findOne({
            clientId: booking.clientId,
            originalBookingId: bookingId,
          });

          if (!existingRequest) {
            const makeupRequest: WaitlistEntry = {
              clientId: booking.clientId,
              clientName: booking.clientName,
              clientEmail: "", // Will be filled from client record if needed
              requestType: "reschedule",
              reason: "No-show - automatic makeup request",
              isUrgent: false,
              originalBookingId: bookingId,
              originalClassId: booking.classId,
              originalClassName: booking.className,
              originalDate: booking.scheduledDate,
              priorityScore: 50, // Default priority
              priorityBreakdown: {
                planTypePoints: 0,
                waitingTimePoints: 0,
                attendancePoints: 0,
                vipPoints: 0,
                cancelledByStudioPoints: 0,
                urgentReasonPoints: 0,
              },
              status: "waiting",
              createdAt: now,
              updatedAt: now,
            };

            await db.collection<WaitlistEntry>("waitlist").insertOne(makeupRequest);
          }
        }
      }
    }

    // Update class status if all attendance is marked
    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (classDoc) {
      const allBookings = await db.collection<Booking>("bookings").countDocuments({
        classId,
        status: { $in: ["confirmed", "pending"] },
      });

      // If no more pending bookings, mark class as completed
      if (allBookings === 0) {
        await db.collection<Class>("classes").updateOne(
          { _id: new ObjectId(classId) },
          {
            $set: {
              status: "completed",
              updatedAt: now,
            },
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Attendance marked for ${results.updated} students. ${results.present} present, ${results.noShows} no-shows.`,
      results,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return NextResponse.json(
      { error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}
