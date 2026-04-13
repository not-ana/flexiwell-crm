import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireRoleFromCookie } from "@/lib/auth/middleware";
import type { Client, Booking, Class } from "@/lib/db/schemas";

// POST /api/teacher/walk-in - Add a walk-in student to a class
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireRoleFromCookie(["admin", "teacher"]);
    if (error) return error;

    const body = await request.json();
    const { name, email, phone, classId } = body;

    if (!name || !classId) {
      return NextResponse.json(
        { error: "Name and class ID are required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(classId)) {
      return NextResponse.json(
        { error: "Invalid class ID" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    // 1. Get the class
    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classDoc) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // 2. Check capacity
    if (classDoc.currentEnrollment >= classDoc.maxCapacity) {
      return NextResponse.json(
        { error: "Class is at full capacity" },
        { status: 400 }
      );
    }

    let clientId: string;
    let clientName = name;

    // 3. Check if client exists by email, or create new one
    if (email) {
      const existingClient = await db.collection<Client>("clients").findOne({
        email: email.toLowerCase(),
      });

      if (existingClient) {
        clientId = existingClient._id!.toString();
        clientName = existingClient.name;
      } else {
        // Create a new client with walk-in status
        const newClient: Client = {
          name,
          email: email.toLowerCase(),
          phone: phone || "",
          plan: {
            type: "drop-in",
            totalClasses: 1,
            usedClasses: 1,
            remainingClasses: 0,
            startDate: now,
            endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            price: 50, // Default drop-in price
          },
          status: "pending",
          preferences: {
            notifications: {
              email: true,
              whatsapp: false,
              instagram: false,
              sms: false,
            },
          },
          createdAt: now,
          updatedAt: now,
        };

        const clientResult = await db.collection<Client>("clients").insertOne(newClient);
        clientId = clientResult.insertedId.toString();
      }
    } else {
      // Guest walk-in without email - create temporary client
      const guestClient: Client = {
        name,
        email: `walkin_${Date.now()}@guest.local`,
        phone: phone || "",
        plan: {
          type: "drop-in",
          totalClasses: 1,
          usedClasses: 1,
          remainingClasses: 0,
          startDate: now,
          endDate: now,
          price: 50,
        },
        status: "pending",
        preferences: {
          notifications: {
            email: false,
            whatsapp: false,
            instagram: false,
            sms: false,
          },
        },
        createdAt: now,
        updatedAt: now,
      };

      const clientResult = await db.collection<Client>("clients").insertOne(guestClient);
      clientId = clientResult.insertedId.toString();
    }

    // 4. Create booking
    const booking: Booking = {
      clientId,
      clientName,
      classId,
      className: classDoc.title,
      instructorId: classDoc.instructorId,
      instructorName: classDoc.instructorName,
      scheduledDate: classDoc.scheduledDate,
      startTime: classDoc.startTime,
      endTime: classDoc.endTime,
      status: "confirmed",
      source: "admin", // walk-in is added by staff
      createdAt: now,
      updatedAt: now,
    };

    const bookingResult = await db.collection<Booking>("bookings").insertOne(booking);

    // 5. Update class enrollment
    await db.collection<Class>("classes").updateOne(
      { _id: new ObjectId(classId) },
      {
        $inc: { currentEnrollment: 1 },
        $push: {
          enrolledClients: {
            clientId,
            clientName,
            status: "confirmed",
            enrolledAt: now,
          },
        },
        $set: { updatedAt: now },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Walk-in student "${name}" added to ${classDoc.title}`,
      data: {
        clientId,
        bookingId: bookingResult.insertedId.toString(),
        className: classDoc.title,
        classTime: classDoc.startTime,
      },
    });
  } catch (error) {
    console.error("Error adding walk-in student:", error);
    return NextResponse.json(
      { error: "Failed to add walk-in student" },
      { status: 500 }
    );
  }
}
