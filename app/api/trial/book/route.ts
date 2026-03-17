import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import type { Client, Booking, Class, Payment, StudioSettings } from "@/lib/db/schemas";

// POST /api/trial/book - Book a trial or drop-in class (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, classId, bookingType, paymentMethod, price: clientPrice } = body;

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim() || !classId) {
      return NextResponse.json(
        { error: "All fields are required: firstName, lastName, email, phone, classId" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(classId)) {
      return NextResponse.json(
        { error: "Invalid class ID" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const isTrial = bookingType === "trial";
    const db = await getDatabase();
    const now = new Date();
    const name = `${firstName.trim()} ${lastName.trim()}`;

    // Load studio settings for server-side price validation
    const settings = await db.collection<StudioSettings>("settings").findOne({});
    const trialConfig = settings?.trialBooking;
    const currency = settings?.general?.currency || "USD";

    // Server-side price (never trust client price)
    const serverPrice = isTrial
      ? (trialConfig?.trialPrice ?? 0)
      : (trialConfig?.dropInPrice ?? 35);

    // Validate payment method against accepted methods
    const acceptedMethods = trialConfig?.acceptedPaymentMethods ?? ["card", "cash"];
    const resolvedPaymentMethod = serverPrice > 0 && paymentMethod
      ? (acceptedMethods.includes(paymentMethod) ? paymentMethod : acceptedMethods[0])
      : undefined;

    // Check if booking type is enabled
    if (isTrial && trialConfig && !trialConfig.trialEnabled) {
      return NextResponse.json(
        { error: "Trial classes are not currently available." },
        { status: 400 }
      );
    }
    if (!isTrial && trialConfig && !trialConfig.dropInEnabled) {
      return NextResponse.json(
        { error: "Drop-in classes are not currently available." },
        { status: 400 }
      );
    }

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
        { error: "Sorry, this class is full. Please choose another time." },
        { status: 400 }
      );
    }

    // 3. Check if client already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existingClient = await db.collection<Client>("clients").findOne({
      email: normalizedEmail,
    });

    let clientId: string;
    const maxTrials = trialConfig?.maxTrialsPerClient ?? 1;

    if (existingClient) {
      // Check if they've exceeded max trials
      if (isTrial) {
        const trialCount = await db.collection<Booking>("bookings").countDocuments({
          clientId: existingClient._id!.toString(),
          source: "trial",
        });

        if (trialCount >= maxTrials) {
          return NextResponse.json(
            { error: "You've already used your free trial. Choose 'Drop-in' instead, or check out our plans for the best value!" },
            { status: 400 }
          );
        }
      }

      clientId = existingClient._id!.toString();

      // Update phone if provided and different
      if (phone && phone !== existingClient.phone) {
        await db.collection<Client>("clients").updateOne(
          { _id: existingClient._id },
          { $set: { phone, updatedAt: now } }
        );
      }
    } else {
      // Create new client
      const newClient: Client = {
        name,
        email: normalizedEmail,
        phone: phone.trim(),
        plan: {
          type: "drop-in",
          totalClasses: 1,
          usedClasses: 1,
          remainingClasses: 0,
          startDate: now,
          endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          price: serverPrice,
        },
        status: "active",
        preferences: {
          notifications: {
            email: true,
            whatsapp: false,
            instagram: false,
            sms: true,
          },
        },
        createdAt: now,
        updatedAt: now,
      };

      const clientResult = await db.collection<Client>("clients").insertOne(newClient);
      clientId = clientResult.insertedId.toString();
    }

    // 4. Check for duplicate booking (same client, same class)
    const existingBooking = await db.collection<Booking>("bookings").findOne({
      clientId,
      classId,
      status: { $ne: "cancelled" },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "You're already booked for this class!" },
        { status: 400 }
      );
    }

    // 5. Create booking
    const booking: Booking = {
      clientId,
      clientName: name,
      classId,
      className: classDoc.title,
      instructorId: classDoc.instructorId,
      instructorName: classDoc.instructorName,
      scheduledDate: classDoc.scheduledDate,
      startTime: classDoc.startTime,
      endTime: classDoc.endTime,
      status: "confirmed",
      source: isTrial ? "trial" : "direct",
      createdAt: now,
      updatedAt: now,
    };

    const bookingResult = await db.collection<Booking>("bookings").insertOne(booking);

    // 6. Update class enrollment
    await db.collection<Class>("classes").updateOne(
      { _id: new ObjectId(classId) },
      {
        $inc: { currentEnrollment: 1 },
        $push: {
          enrolledClients: {
            clientId,
            clientName: name,
            status: "confirmed",
            enrolledAt: now,
          },
        },
        $set: { updatedAt: now },
      }
    );

    // 7. Create payment record if there's a charge
    if (serverPrice > 0 && resolvedPaymentMethod) {
      const isCashAtStudio = resolvedPaymentMethod === "cash" && !trialConfig?.requirePaymentUpfront;

      const payment: Payment = {
        clientId,
        clientName: name,
        amount: serverPrice,
        currency,
        type: "drop-in",
        status: isCashAtStudio ? "pending" : "completed",
        paymentMethod: resolvedPaymentMethod === "card" ? "credit_card" : resolvedPaymentMethod,
        createdAt: now,
        ...(isCashAtStudio ? {} : { paidAt: now }),
      };

      await db.collection<Payment>("payments").insertOne(payment);
    }

    // 8. Log activity for post-class follow-up SMS
    await db.collection("activities").insertOne({
      type: isTrial ? "trial_booked" : "drop_in_booked",
      clientId,
      clientName: name,
      clientEmail: normalizedEmail,
      clientPhone: phone.trim(),
      classId,
      className: classDoc.title,
      classDate: classDoc.scheduledDate,
      classTime: classDoc.startTime,
      bookingId: bookingResult.insertedId.toString(),
      paymentMethod: resolvedPaymentMethod,
      price: serverPrice,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      bookingId: bookingResult.insertedId.toString(),
      message: isTrial
        ? `Trial class booked! See you at ${classDoc.title}.`
        : `Drop-in booked for ${classDoc.title}.`,
    });
  } catch (error) {
    console.error("Error booking trial/drop-in:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
