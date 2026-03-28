import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import type { Booking, Client } from "@/lib/db/schemas";
import { requireRole } from "@/lib/auth";

function parseStatus(raw: string): Booking["status"] {
  const s = raw.toLowerCase().trim();
  if (s === "completed" || s === "signed in" || s === "presente") return "completed";
  if (s === "no show" || s === "no-show" || s === "ausente") return "no-show";
  if (s.includes("cancel") || s === "cancelado") return "cancelled";
  return "completed"; // default for historical data
}

// POST /api/bookings/import - Import class visit history from CSV
export async function POST(request: NextRequest) {
  const { user, error: authError } = requireRole(request, ["admin"]);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { bookingsData } = body;

    if (!Array.isArray(bookingsData) || bookingsData.length === 0) {
      return NextResponse.json(
        { error: "bookingsData array is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; email: string; error: string }[],
    };

    // Look up all unique emails to find matching clients
    const emails = [...new Set(bookingsData.map((r: Record<string, string>) => r.client_email?.toLowerCase().trim()).filter(Boolean))];

    const emailQuery: Record<string, unknown> = { email: { $in: emails } };
    if (user?.establishmentId) {
      emailQuery.establishmentId = user.establishmentId;
    }

    const clients = await db.collection<Client>("clients")
      .find(emailQuery, { projection: { _id: 1, email: 1, name: 1 } })
      .toArray();

    const clientMap = new Map(clients.map(c => [c.email.toLowerCase(), { id: c._id!.toString(), name: c.name }]));

    const bookingsToInsert: Booking[] = [];

    for (let i = 0; i < bookingsData.length; i++) {
      const row = bookingsData[i];
      const rowNum = i + 1;
      const email = row.client_email?.toLowerCase().trim();

      if (!email) {
        results.failed++;
        results.errors.push({ row: rowNum, email: "missing", error: "Client email is required" });
        continue;
      }

      if (!row.class_title?.trim()) {
        results.failed++;
        results.errors.push({ row: rowNum, email, error: "Class name is required" });
        continue;
      }

      const client = clientMap.get(email);
      if (!client) {
        results.failed++;
        results.errors.push({ row: rowNum, email, error: "No matching client found" });
        continue;
      }

      const classDate = row.date ? new Date(row.date) : null;
      if (!classDate || isNaN(classDate.getTime())) {
        results.failed++;
        results.errors.push({ row: rowNum, email, error: "Invalid or missing date" });
        continue;
      }

      const booking: Booking = {
        clientId: client.id,
        clientName: client.name,
        classId: "",
        className: row.class_title.trim(),
        instructorId: "",
        instructorName: row.instructor?.trim() || "",
        scheduledDate: classDate,
        startTime: row.time?.trim() || "00:00",
        endTime: row.end_time?.trim() || "",
        status: parseStatus(row.status || "Completed"),
        source: "mindbody-import",
        ...(user?.establishmentId ? { establishmentId: user.establishmentId } : {}),
        createdAt: now,
        updatedAt: now,
      };

      bookingsToInsert.push(booking);
    }

    if (bookingsToInsert.length > 0) {
      const insertResult = await db.collection<Booking>("bookings").insertMany(bookingsToInsert);
      results.success = insertResult.insertedCount;

      // Update client stats: lastClassDate, usedClasses
      const clientBookings = new Map<string, { lastDate: Date; count: number }>();
      for (const b of bookingsToInsert) {
        if (b.status !== "completed") continue;
        const existing = clientBookings.get(b.clientId);
        if (!existing || b.scheduledDate > existing.lastDate) {
          clientBookings.set(b.clientId, {
            lastDate: b.scheduledDate,
            count: (existing?.count || 0) + 1,
          });
        } else {
          existing.count++;
        }
      }

      // Bulk update clients with class stats
      const { ObjectId } = await import("mongodb");
      const bulkOps = [...clientBookings.entries()].map(([clientId, stats]) => ({
        updateOne: {
          filter: { _id: new ObjectId(clientId) },
          update: {
            $set: { lastClassDate: stats.lastDate, updatedAt: now },
            $inc: { "plan.usedClasses": stats.count },
          },
        },
      }));

      if (bulkOps.length > 0) {
        await db.collection<Client>("clients").bulkWrite(bulkOps);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.success} class visits. ${results.failed} skipped.`,
    });
  } catch (error) {
    console.error("Error importing bookings:", error);
    const message = error instanceof Error ? error.message : "Failed to import class history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
