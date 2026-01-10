import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import type { Client, Booking, Staff } from "@/lib/db/schemas";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();

    // Get user data first (for OAuth users who might not have a client record yet)
    const userRecord = await db.collection("users").findOne({
      _id: new ObjectId(user.userId),
    });

    // Get client data
    let client: Client | null = null;

    // First try by clientId from user record
    if (userRecord?.clientId && ObjectId.isValid(userRecord.clientId)) {
      client = await db.collection<Client>("clients").findOne({
        _id: new ObjectId(userRecord.clientId),
      });
    }

    // If not found, try by user ID
    if (!client && ObjectId.isValid(user.userId)) {
      client = await db.collection<Client>("clients").findOne({
        _id: new ObjectId(user.userId),
      });
    }

    // If still not found, try by email
    if (!client) {
      client = await db.collection<Client>("clients").findOne({
        email: user.email,
      });
    }

    // If still no client record, create one for OAuth users
    if (!client && userRecord) {
      const now = new Date();
      const oneMonthLater = new Date(now);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

      const newClient: Omit<Client, "_id"> = {
        name: userRecord.name || user.name || user.email.split("@")[0],
        email: user.email.toLowerCase(),
        phone: userRecord.phone || "",
        avatar: userRecord.avatar,
        plan: {
          type: "monthly",
          totalClasses: 0,
          usedClasses: 0,
          remainingClasses: 0,
          startDate: now,
          endDate: oneMonthLater,
          price: 0,
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

      const insertResult = await db.collection<Client>("clients").insertOne(newClient as Client);
      client = { ...newClient, _id: insertResult.insertedId } as Client;

      // Link client to user
      await db.collection("users").updateOne(
        { _id: new ObjectId(user.userId) },
        { $set: { clientId: insertResult.insertedId.toString() } }
      );
    }

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Sync client data with user record (for OAuth users)
    if (userRecord && client._id) {
      const clientUpdates: Record<string, unknown> = {};

      // Update name if user has a better name (from OAuth)
      if (userRecord.name && (!client.name || client.name === client.email.split("@")[0])) {
        clientUpdates.name = userRecord.name;
      }

      // Update avatar from user record
      if (userRecord.avatar && !client.avatar) {
        clientUpdates.avatar = userRecord.avatar;
      }

      if (Object.keys(clientUpdates).length > 0) {
        clientUpdates.updatedAt = new Date();
        await db.collection("clients").updateOne(
          { _id: client._id },
          { $set: clientUpdates }
        );
        // Update local client object for response
        if (clientUpdates.name) client.name = clientUpdates.name as string;
        if (clientUpdates.avatar) client.avatar = clientUpdates.avatar as string;
      }
    }

    // Get upcoming bookings
    const now = new Date();
    const bookings = await db.collection<Booking>("bookings")
      .find({
        clientId: client._id?.toString(),
        scheduledDate: { $gte: now },
        status: { $in: ["confirmed", "pending"] },
      })
      .sort({ scheduledDate: 1 })
      .limit(10)
      .toArray();

    // Format bookings as scheduled classes
    const scheduledClasses = bookings.map((booking) => {
      const date = new Date(booking.scheduledDate);
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      return {
        id: booking._id?.toString() || "",
        title: booking.className,
        instructor: booking.instructorName,
        date: `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
        dayOfWeek: dayNames[date.getDay()],
        time: `${booking.startTime} - ${booking.endTime}`,
        location: "FlexiWell", // Default location
        status: booking.status as "confirmed" | "pending" | "completed",
      };
    });

    // Get instructor info (from first booking or default)
    let currentInstructor = null;
    if (bookings.length > 0) {
      const firstBooking = bookings[0];
      if (ObjectId.isValid(firstBooking.instructorId)) {
        const instructor = await db.collection<Staff>("staff").findOne({
          _id: new ObjectId(firstBooking.instructorId),
        });
        if (instructor) {
          currentInstructor = {
            id: instructor._id?.toString() || "",
            name: instructor.name,
            initials: instructor.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
            specialties: instructor.specialties || [],
            nextAvailable: "Available on request",
          };
        }
      }
    }

    // Map plan type to display name
    const planTypeNames: Record<string, string> = {
      "monthly": "Plano Mensal",
      "quarterly": "Plano Trimestral",
      "annual": "Plano Anual",
      "drop-in": "Avulso",
    };

    const response = {
      user: {
        name: client.name,
        avatar: client.avatar,
        initials: client.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
        location: "Brasil",
        locationFlag: "\u{1f1e7}\u{1f1f7}",
        email: client.email,
        phone: client.phone || "",
        plan: `${planTypeNames[client.plan.type] || client.plan.type} - ${client.plan.totalClasses} aulas`,
        classesRemaining: client.plan.remainingClasses,
        classesUsed: client.plan.usedClasses,
      },
      scheduledClasses,
      currentInstructor,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "Failed to load profile data" },
      { status: 500 }
    );
  }
}
