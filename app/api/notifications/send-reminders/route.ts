import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { notificationService } from "@/lib/services/notification.service";
import type { Booking } from "@/lib/db/schemas";

// POST /api/notifications/send-reminders
// This endpoint can be called by a cron job to send class reminders
// Example: Call this every hour to send reminders for classes starting in 24h and 2h
export async function POST(request: NextRequest) {
  try {
    // Verify API key for cron security (optional)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const now = new Date();

    // Time windows for reminders
    const windows = [
      { hoursAhead: 24, label: "tomorrow" },
      { hoursAhead: 2, label: "in 2 hours" },
    ];

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const window of windows) {
      const targetTime = new Date(now.getTime() + window.hoursAhead * 60 * 60 * 1000);
      const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000); // 30 min before
      const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000); // 30 min after

      // Find bookings within this time window that haven't received this reminder
      const bookings = await db
        .collection<Booking>("bookings")
        .find({
          status: "confirmed",
          scheduledDate: {
            $gte: new Date(windowStart.toDateString()),
            $lte: new Date(windowEnd.toDateString()),
          },
          [`reminderSent_${window.hoursAhead}h`]: { $ne: true },
        })
        .toArray();

      for (const booking of bookings) {
        // Check if the class time matches
        const [hours, minutes] = booking.startTime.split(":").map(Number);
        const classDateTime = new Date(booking.scheduledDate);
        classDateTime.setHours(hours, minutes, 0, 0);

        const hoursDiff = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Check if within the window (e.g., 23.5h to 24.5h for 24h reminder)
        if (Math.abs(hoursDiff - window.hoursAhead) <= 0.5) {
          results.processed++;

          try {
            const result = await notificationService.sendBookingReminder(
              booking,
              window.label
            );

            if (result.success) {
              results.sent++;

              // Mark reminder as sent
              await db.collection<Booking>("bookings").updateOne(
                { _id: booking._id },
                {
                  $set: {
                    [`reminderSent_${window.hoursAhead}h`]: true,
                    updatedAt: new Date(),
                  },
                }
              );
            } else {
              results.failed++;
              results.errors.push(
                `Failed to send reminder to ${booking.clientName}: ${result.error}`
              );
            }
          } catch (error) {
            results.failed++;
            results.errors.push(
              `Error sending reminder to ${booking.clientName}: ${(error as Error).message}`
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - Health check for cron monitoring
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "reminder-notifications",
    timestamp: new Date().toISOString(),
  });
}
