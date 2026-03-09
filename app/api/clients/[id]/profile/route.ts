import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

// GET /api/clients/[id]/profile - Get full client profile with bookings, payments, activity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const db = await getDatabase();
    const clientId = new ObjectId(id);

    const [client, bookings, payments, waitlistEntries] = await Promise.all([
      db.collection("clients").findOne({ _id: clientId }),
      db.collection("bookings")
        .find({ clientId: id })
        .sort({ scheduledDate: -1 })
        .limit(50)
        .toArray(),
      db.collection("payments")
        .find({ clientId: id })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray(),
      db.collection("waitlist")
        .find({ clientId: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray(),
    ]);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Compute stats from bookings
    const completedBookings = bookings.filter((b) => b.status === "completed").length;
    const noShowBookings = bookings.filter((b) => ["no-show", "noshow", "no_show"].includes(b.status)).length;
    const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;
    const totalPastBookings = completedBookings + noShowBookings + cancelledBookings;
    const attendanceRate = totalPastBookings > 0
      ? Math.round((completedBookings / totalPastBookings) * 1000) / 10
      : 0;

    const totalSpent = payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const upcomingBookings = bookings.filter(
      (b) => b.status === "confirmed" || b.status === "pending"
    );

    const nextClass = upcomingBookings.length > 0 ? upcomingBookings[upcomingBookings.length - 1] : null;

    return NextResponse.json({
      client,
      bookings,
      payments,
      waitlistEntries,
      stats: {
        totalBookings: bookings.length,
        completedBookings,
        noShowBookings,
        cancelledBookings,
        attendanceRate,
        totalSpent,
        upcomingCount: upcomingBookings.length,
        nextClass,
      },
    });
  } catch (error) {
    console.error("Error fetching client profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch client profile" },
      { status: 500 }
    );
  }
}
