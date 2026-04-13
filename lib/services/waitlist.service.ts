// Waitlist Automation Service
// Handles auto-processing when spots open up:
//   1. Finds the highest-priority waiting entry for a class
//   2. Auto-confirms direct clients if setting is enabled
//   3. Notifies others with a 30-minute confirmation window
//   4. Expires stale notifications and promotes the next person

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { calculatePriority, type ClientSource } from "@/lib/config/waitlist";
import { notificationService } from "@/lib/services/notification.service";

interface WaitlistEntry {
  _id: ObjectId;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientSource: ClientSource;
  classId: string;
  className: string;
  priority: number;
  status: "waiting" | "notified" | "confirmed" | "expired" | "removed";
  notifiedAt?: Date;
  notificationExpiresAt?: Date;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  establishmentId?: string;
}

interface WaitlistSettings {
  autoConfirmDirect: boolean;
  notifyViaSMS: boolean;
  notifyViaEmail: boolean;
}

/**
 * Process waitlist when a spot opens in a class.
 * Call this when a booking is cancelled or a class capacity increases.
 */
export async function processSpotOpened(
  classId: string,
  className: string,
  classDate?: string,
  classTime?: string
): Promise<{ action: "confirmed" | "notified" | "none"; entry?: WaitlistEntry }> {
  const db = await getDatabase();

  // Get the next waiting entry (highest priority first)
  const nextEntry = await db.collection<WaitlistEntry>("waitlist")
    .find({ classId, status: "waiting" })
    .sort({ priority: -1, createdAt: 1 })
    .limit(1)
    .toArray();

  if (nextEntry.length === 0) {
    return { action: "none" };
  }

  const entry = nextEntry[0];

  // Load waitlist settings for this establishment
  const settings = await getWaitlistSettings(entry.establishmentId || "");

  // Auto-confirm direct clients if enabled
  if (settings.autoConfirmDirect && (entry.clientSource === "direct" || entry.clientSource === "package")) {
    const now = new Date();
    await db.collection<WaitlistEntry>("waitlist").updateOne(
      { _id: entry._id },
      {
        $set: {
          status: "confirmed",
          confirmedAt: now,
          updatedAt: now,
        },
      }
    );

    // Create booking for the client
    await db.collection("bookings").insertOne({
      clientId: entry.clientId,
      clientName: entry.clientName,
      classId: entry.classId,
      className: entry.className,
      status: "confirmed",
      source: "waitlist_auto",
      createdAt: now,
      updatedAt: now,
    });

    // Notify them they got the spot
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    if (settings.notifyViaSMS && entry.clientPhone) {
      await notificationService.send({
        type: "waitlist_spot_available",
        clientId: entry.clientId,
        channels: "sms",
        data: {
          clientId: entry.clientId,
          className: entry.className,
          date: classDate || "",
          startTime: classTime || "",
          confirmUrl: `${baseUrl}/dashboard/classes`,
        },
      });
    }

    // Log activity
    await db.collection("activities").insertOne({
      type: "system",
      action: "waitlist_auto_confirmed",
      description: `Auto-confirmed ${entry.clientName} for ${entry.className} (direct client priority)`,
      metadata: { clientId: entry.clientId, classId, source: entry.clientSource },
      createdAt: now,
    });

    return { action: "confirmed", entry };
  }

  // Otherwise, notify them and give 30 minutes to confirm
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

  await db.collection<WaitlistEntry>("waitlist").updateOne(
    { _id: entry._id },
    {
      $set: {
        status: "notified",
        notifiedAt: now,
        notificationExpiresAt: expiresAt,
        updatedAt: now,
      },
    },
  );

  // Send notification
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const confirmUrl = `${baseUrl}/dashboard/classes/book?confirm=${entry._id.toString()}`;

  if (settings.notifyViaSMS && entry.clientPhone) {
    await notificationService.send({
      type: "waitlist_spot_available",
      clientId: entry.clientId,
      channels: "sms",
      data: {
        clientId: entry.clientId,
        className: entry.className,
        date: classDate || "",
        startTime: classTime || "",
        confirmUrl,
      },
    });
  }

  if (settings.notifyViaEmail) {
    await notificationService.send({
      type: "waitlist_spot_available",
      clientId: entry.clientId,
      channels: "email",
      data: {
        clientId: entry.clientId,
        className: entry.className,
        date: classDate || "",
        startTime: classTime || "",
        confirmUrl,
      },
    });
  }

  // Log notification
  await db.collection("waitlist_notifications").insertOne({
    waitlistEntryId: entry._id.toString(),
    clientId: entry.clientId,
    clientName: entry.clientName,
    classId,
    className: entry.className,
    classDate: classDate ? new Date(classDate) : new Date(),
    classTime: classTime || "",
    spotsAvailable: 1,
    status: "sent",
    sentAt: now,
    expiresAt,
    notificationChannel: settings.notifyViaSMS ? "sms" : "email",
    createdAt: now,
  });

  return { action: "notified", entry };
}

/**
 * Expire stale waitlist notifications and promote the next person.
 * Call this from a cron job (every 5 minutes) or before processing new spots.
 */
export async function expireStaleNotifications(): Promise<{ expired: number; promoted: number }> {
  const db = await getDatabase();
  const now = new Date();

  // Find all notified entries past their expiration
  const staleEntries = await db.collection<WaitlistEntry>("waitlist").find({
    status: "notified",
    notificationExpiresAt: { $lte: now },
  }).toArray();

  let expired = 0;
  let promoted = 0;

  for (const entry of staleEntries) {
    // Expire this entry
    await db.collection<WaitlistEntry>("waitlist").updateOne(
      { _id: entry._id },
      { $set: { status: "expired", updatedAt: now } }
    );
    expired++;

    // Send expired notification
    if (entry.clientPhone) {
      await notificationService.send({
        type: "waitlist_spot_available",
        clientId: entry.clientId,
        channels: "sms",
        data: {
          clientId: entry.clientId,
          className: entry.className,
          date: "",
          startTime: "",
          confirmUrl: "",
        },
      });
    }

    // Promote the next person in line
    const result = await processSpotOpened(entry.classId, entry.className);
    if (result.action !== "none") {
      promoted++;
    }
  }

  return { expired, promoted };
}

async function getWaitlistSettings(establishmentId: string): Promise<WaitlistSettings> {
  const db = await getDatabase();
  const settings = await db.collection("establishment_settings").findOne({
    establishmentId,
    type: "waitlist",
  });

  return {
    autoConfirmDirect: settings?.autoConfirmDirect ?? false,
    notifyViaSMS: settings?.notifyViaSMS ?? true,
    notifyViaEmail: settings?.notifyViaEmail ?? true,
  };
}
