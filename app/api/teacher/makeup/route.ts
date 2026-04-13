import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireRoleFromCookie } from "@/lib/auth/middleware";
import type { WaitlistEntry, Class, Booking, Client } from "@/lib/db/schemas";
import { EmailService } from "@/lib/email";

// GET /api/teacher/makeup - Get makeup requests for a teacher
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireRoleFromCookie(["admin", "teacher"]);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");
    const status = searchParams.get("status") || "waiting";

    const db = await getDatabase();

    // Build query
    const query: Record<string, unknown> = {
      requestType: "reschedule",
    };

    if (status !== "all") {
      query.status = status;
    }

    // If teacherId provided, filter by their classes
    if (teacherId) {
      // Get all class IDs taught by this teacher
      const teacherClasses = await db.collection<Class>("classes")
        .find({ instructorId: teacherId })
        .project({ _id: 1 })
        .toArray();

      const classIds = teacherClasses.map((c) => c._id?.toString());
      query.originalClassId = { $in: classIds };
    }

    const makeupRequests = await db.collection<WaitlistEntry>("waitlist")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Format response
    const formattedRequests = makeupRequests.map((request) => ({
      id: request._id?.toString(),
      studentName: request.clientName,
      studentId: request.clientId,
      originalClass: request.originalClassName,
      originalDate: request.originalDate,
      reason: request.reason,
      status: request.status,
      scheduledDate: request.confirmedDate,
      scheduledClassName: request.confirmedClassName,
      createdAt: request.createdAt,
    }));

    return NextResponse.json({
      total: formattedRequests.length,
      requests: formattedRequests,
    });
  } catch (error) {
    console.error("Error fetching makeup requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch makeup requests" },
      { status: 500 }
    );
  }
}

// POST /api/teacher/makeup - Schedule a makeup class
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireRoleFromCookie(["admin", "teacher"]);
    if (error) return error;

    const body = await request.json();
    const { requestId, classId, action } = body;

    if (!requestId || !ObjectId.isValid(requestId)) {
      return NextResponse.json(
        { error: "Valid request ID is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    // Get the makeup request
    const makeupRequest = await db.collection<WaitlistEntry>("waitlist").findOne({
      _id: new ObjectId(requestId),
    });

    if (!makeupRequest) {
      return NextResponse.json(
        { error: "Makeup request not found" },
        { status: 404 }
      );
    }

    if (action === "schedule" && classId) {
      // Schedule the makeup in a specific class
      if (!ObjectId.isValid(classId)) {
        return NextResponse.json(
          { error: "Valid class ID is required" },
          { status: 400 }
        );
      }

      const classDoc = await db.collection<Class>("classes").findOne({
        _id: new ObjectId(classId),
      });

      if (!classDoc) {
        return NextResponse.json(
          { error: "Class not found" },
          { status: 404 }
        );
      }

      // Check capacity
      if (classDoc.currentEnrollment >= classDoc.maxCapacity) {
        return NextResponse.json(
          { error: "Selected class is at full capacity" },
          { status: 400 }
        );
      }

      // Get client info
      const client = await db.collection<Client>("clients").findOne({
        _id: new ObjectId(makeupRequest.clientId),
      });

      // Create booking for makeup class
      const booking: Booking = {
        clientId: makeupRequest.clientId,
        clientName: makeupRequest.clientName,
        classId,
        className: classDoc.title,
        instructorId: classDoc.instructorId,
        instructorName: classDoc.instructorName,
        scheduledDate: classDoc.scheduledDate,
        startTime: classDoc.startTime,
        endTime: classDoc.endTime,
        status: "confirmed",
        source: "admin",
        createdAt: now,
        updatedAt: now,
      };

      await db.collection<Booking>("bookings").insertOne(booking);

      // Update class enrollment
      await db.collection<Class>("classes").updateOne(
        { _id: new ObjectId(classId) },
        {
          $inc: { currentEnrollment: 1 },
          $push: {
            enrolledClients: {
              clientId: makeupRequest.clientId,
              clientName: makeupRequest.clientName,
              status: "confirmed",
              enrolledAt: now,
            },
          },
          $set: { updatedAt: now },
        }
      );

      // Update makeup request status
      await db.collection<WaitlistEntry>("waitlist").updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            status: "confirmed",
            confirmedClassId: classId,
            confirmedClassName: classDoc.title,
            confirmedDate: classDoc.scheduledDate,
            updatedAt: now,
          },
        }
      );

      // Send notification email to client
      if (client && client.email) {
        try {
          await EmailService.sendBookingConfirmation(client.email, {
            clientName: client.name,
            className: classDoc.title + " (Makeup Class)",
            instructorName: classDoc.instructorName,
            date: classDoc.scheduledDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
            time: classDoc.startTime,
            location: classDoc.location || "Main Studio",
          });
        } catch (emailError) {
          console.error("Failed to send makeup confirmation email:", emailError);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Makeup class scheduled for ${makeupRequest.clientName} in ${classDoc.title}`,
        data: {
          className: classDoc.title,
          date: classDoc.scheduledDate,
          time: classDoc.startTime,
        },
      });
    } else if (action === "decline") {
      // Decline the makeup request
      await db.collection<WaitlistEntry>("waitlist").updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            status: "declined",
            declinedAt: now,
            declineReason: body.reason || "Request declined by instructor",
            updatedAt: now,
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: "Makeup request declined",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'schedule' or 'decline'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing makeup request:", error);
    return NextResponse.json(
      { error: "Failed to process makeup request" },
      { status: 500 }
    );
  }
}
