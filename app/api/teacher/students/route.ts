import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";
import { resolveStaffId } from "@/lib/auth/resolve-staff";
import type { Booking, Client } from "@/lib/db/schemas";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();
    const isAdmin = user.role === "admin";
    const teacherId = isAdmin ? null : await resolveStaffId(user.userId);

    // Admin sees all bookings; teacher sees own classes
    const bookingFilter: Record<string, unknown> = {};
    if (!isAdmin && teacherId) {
      bookingFilter.instructorId = teacherId;
    }
    const bookings = await db.collection<Booking>("bookings")
      .find(bookingFilter)
      .toArray();

    // Get unique client IDs
    const uniqueClientIds = [...new Set(bookings.map(b => b.clientId))];

    // Get client details
    const clients = await db.collection<Client>("clients")
      .find({
        _id: { $in: uniqueClientIds.map(id => {
          try {
            return new ObjectId(id);
          } catch {
            return null;
          }
        }).filter(Boolean) as ObjectId[] }
      })
      .toArray();

    // Get establishments/units
    const establishments = await db.collection("establishments")
      .find({ status: "active" })
      .toArray();

    // Calculate stats for each client
    const clientStats: Record<string, {
      bookings: Booking[];
      lastClass: Date | null;
      nextClass: string | null;
    }> = {};

    for (const booking of bookings) {
      if (!clientStats[booking.clientId]) {
        clientStats[booking.clientId] = {
          bookings: [],
          lastClass: null,
          nextClass: null
        };
      }
      clientStats[booking.clientId].bookings.push(booking);

      if (booking.status === "completed" && booking.scheduledDate) {
        const bookingDate = new Date(booking.scheduledDate);
        if (!clientStats[booking.clientId].lastClass ||
            bookingDate > clientStats[booking.clientId].lastClass!) {
          clientStats[booking.clientId].lastClass = bookingDate;
        }
      }
    }

    // Get upcoming classes for next class info
    const now = new Date();
    const upcomingFilter: Record<string, unknown> = {
      scheduledDate: { $gte: now },
      status: { $in: ["confirmed", "pending"] }
    };
    if (!isAdmin && teacherId) {
      upcomingFilter.instructorId = teacherId;
    }
    const upcomingBookings = await db.collection<Booking>("bookings")
      .find(upcomingFilter)
      .sort({ scheduledDate: 1 })
      .toArray();

    // Map upcoming bookings to clients
    for (const booking of upcomingBookings) {
      if (clientStats[booking.clientId] && !clientStats[booking.clientId].nextClass) {
        const classDate = new Date(booking.scheduledDate);
        const isToday = classDate.toDateString() === now.toDateString();
        const isTomorrow = classDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();

        let dateStr: string;
        if (isToday) {
          dateStr = "Today";
        } else if (isTomorrow) {
          dateStr = "Tomorrow";
        } else {
          dateStr = classDate.toLocaleDateString("en-US", { weekday: "short" });
        }

        clientStats[booking.clientId].nextClass =
          `${dateStr}, ${booking.startTime} - ${booking.className}`;
      }
    }

    // Group students by establishment
    const unitMap: Record<string, {
      id: string;
      name: string;
      address: string;
      students: unknown[];
    }> = {};

    // Create a default unit if no establishments
    if (establishments.length === 0) {
      unitMap["default"] = {
        id: "default",
        name: "FlexiWell Studio",
        address: "Main Location",
        students: []
      };
    } else {
      for (const est of establishments) {
        unitMap[est._id.toString()] = {
          id: est._id.toString(),
          name: est.name,
          address: est.address || "",
          students: []
        };
      }
    }

    // Format students
    for (const client of clients) {
      const clientId = client._id?.toString() || "";
      const stats = clientStats[clientId];
      if (!stats) continue;

      const initials = client.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

      // Determine status
      let status: "active" | "paused" | "expired" = "active";
      if (client.status === "inactive") {
        status = "paused";
      }
      if (client.plan.remainingClasses === 0 || new Date(client.plan.endDate) < now) {
        status = "expired";
      }

      // Calculate last active and days since last class
      let lastActive = "Never";
      let daysSinceLastClass: number | undefined;
      if (stats.lastClass) {
        const diff = Math.floor((now.getTime() - stats.lastClass.getTime()) / (1000 * 60 * 60));
        daysSinceLastClass = Math.floor(diff / 24);
        if (diff < 1) lastActive = "Just now";
        else if (diff < 24) lastActive = `${diff} hours ago`;
        else if (diff < 48) lastActive = "Yesterday";
        else lastActive = `${daysSinceLastClass} days ago`;
      }

      // Plan type
      const planTypes: Record<string, string> = {
        monthly: "Monthly",
        quarterly: "Quarterly",
        annual: "Annual",
        "drop-in": "Drop-in"
      };

      const student = {
        id: clientId,
        name: client.name,
        email: client.email,
        phone: client.phone || "",
        initials,
        plan: `${planTypes[client.plan.type] || client.plan.type} - ${client.plan.totalClasses} classes`,
        classesRemaining: client.plan.remainingClasses,
        classesTotal: client.plan.totalClasses,
        nextClass: stats.nextClass || undefined,
        status,
        joinedDate: client.createdAt
          ? new Date(client.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
          : "Unknown",
        lastActive,
        daysSinceLastClass
      };

      // Add to appropriate unit (for now, add to first or default)
      const unitKey = Object.keys(unitMap)[0];
      unitMap[unitKey].students.push(student);
    }

    const units = Object.values(unitMap).filter(u => u.students.length > 0);

    // If no students found in any unit, return empty with default unit
    if (units.length === 0) {
      return NextResponse.json({
        units: [{
          id: "default",
          name: "FlexiWell Studio",
          address: "Main Location",
          students: []
        }]
      });
    }

    return NextResponse.json({ units });
  } catch (error) {
    console.error("Teacher students error:", error);
    return NextResponse.json(
      { error: "Failed to load students" },
      { status: 500 }
    );
  }
}
