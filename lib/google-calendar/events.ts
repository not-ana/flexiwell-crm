// Google Calendar Events Service
// CRUD operations for calendar events

import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { getClientAccessToken, isCalendarConnected } from "./oauth";
import type {
  GoogleCalendarEvent,
  GoogleEventResponse,
  CalendarSyncResult,
  BookingEventData,
} from "./types";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

/**
 * Create a calendar event for a booking
 */
export async function createBookingEvent(
  clientId: string,
  bookingData: BookingEventData
): Promise<CalendarSyncResult> {
  // Check if calendar is connected
  const connected = await isCalendarConnected(clientId);
  if (!connected) {
    return { success: false, error: "Google Calendar not connected" };
  }

  // Get valid access token
  const accessToken = await getClientAccessToken(clientId);
  if (!accessToken) {
    return { success: false, error: "Could not get valid access token" };
  }

  // Build the event
  const event = buildCalendarEvent(bookingData);

  try {
    const response = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to create event");
    }

    const data: GoogleEventResponse = await response.json();

    // Log the sync
    await logCalendarSync(clientId, bookingData.bookingId, data.id, "create", "success");

    // Update booking with Google event ID
    await updateBookingWithEventId(bookingData.bookingId, data.id);

    return { success: true, eventId: data.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logCalendarSync(clientId, bookingData.bookingId, "", "create", "failed", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Update a calendar event for a rescheduled booking
 */
export async function updateBookingEvent(
  clientId: string,
  eventId: string,
  bookingData: BookingEventData
): Promise<CalendarSyncResult> {
  const accessToken = await getClientAccessToken(clientId);
  if (!accessToken) {
    return { success: false, error: "Could not get valid access token" };
  }

  const event = buildCalendarEvent(bookingData);

  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to update event");
    }

    await logCalendarSync(clientId, bookingData.bookingId, eventId, "update", "success");
    return { success: true, eventId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logCalendarSync(clientId, bookingData.bookingId, eventId, "update", "failed", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete a calendar event for a cancelled booking
 */
export async function deleteBookingEvent(
  clientId: string,
  bookingId: string,
  eventId: string
): Promise<CalendarSyncResult> {
  const accessToken = await getClientAccessToken(clientId);
  if (!accessToken) {
    return { success: false, error: "Could not get valid access token" };
  }

  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // 404 is OK - event already deleted
    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to delete event");
    }

    await logCalendarSync(clientId, bookingId, eventId, "delete", "success");
    return { success: true, eventId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logCalendarSync(clientId, bookingId, eventId, "delete", "failed", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Build a Google Calendar event from booking data
 */
function buildCalendarEvent(bookingData: BookingEventData): GoogleCalendarEvent {
  // Parse times
  const [startHour, startMin] = bookingData.startTime.split(":").map(Number);
  const [endHour, endMin] = bookingData.endTime.split(":").map(Number);

  // Create Date objects
  const startDateTime = new Date(bookingData.scheduledDate);
  startDateTime.setHours(startHour, startMin, 0, 0);

  const endDateTime = new Date(bookingData.scheduledDate);
  endDateTime.setHours(endHour, endMin, 0, 0);

  // Get timezone from environment or default to America/Sao_Paulo
  const timeZone = process.env.TZ || "America/Sao_Paulo";

  // Build description
  const descriptionParts = [
    `Instructor: ${bookingData.instructorName}`,
  ];

  if (bookingData.classDescription) {
    descriptionParts.push("", bookingData.classDescription);
  }

  if (bookingData.studioName) {
    descriptionParts.push("", `Studio: ${bookingData.studioName}`);
  }

  descriptionParts.push(
    "",
    "---",
    "Booked via FlexiWell"
  );

  const event: GoogleCalendarEvent = {
    summary: bookingData.className,
    description: descriptionParts.join("\n"),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 }, // 1 hour before
        { method: "popup", minutes: 30 }, // 30 minutes before
      ],
    },
    extendedProperties: {
      private: {
        flexiwellBookingId: bookingData.bookingId,
        source: "flexiwell-crm",
      },
    },
  };

  // Add location if available
  if (bookingData.location || bookingData.studioAddress) {
    event.location = bookingData.location || bookingData.studioAddress;
  }

  return event;
}

/**
 * Update booking with Google Calendar event ID
 */
async function updateBookingWithEventId(bookingId: string, eventId: string): Promise<void> {
  const db = await getDatabase();

  await db.collection("bookings").updateOne(
    { _id: new ObjectId(bookingId) },
    {
      $set: {
        googleCalendarEventId: eventId,
        googleCalendarSynced: true,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Log calendar sync activity
 */
async function logCalendarSync(
  clientId: string,
  bookingId: string,
  eventId: string,
  action: "create" | "update" | "delete",
  status: "success" | "failed",
  errorMessage?: string
): Promise<void> {
  const db = await getDatabase();

  await db.collection("calendar_sync_logs").insertOne({
    clientId,
    bookingId,
    googleEventId: eventId,
    action,
    status,
    errorMessage,
    retries: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Update client's last sync time on success
  if (status === "success") {
    await db.collection("clients").updateOne(
      { _id: new ObjectId(clientId) },
      {
        $set: {
          "integrations.googleCalendar.lastSyncAt": new Date(),
        },
      }
    );
  }
}

/**
 * Sync a booking to Google Calendar (fire-and-forget)
 */
export async function syncBookingToCalendar(
  clientId: string,
  bookingData: BookingEventData
): Promise<void> {
  // Don't await - fire and forget
  createBookingEvent(clientId, bookingData).catch((error) => {
    console.error("Failed to sync booking to Google Calendar:", error);
  });
}

/**
 * Remove booking from Google Calendar (fire-and-forget)
 */
export async function removeBookingFromCalendar(
  clientId: string,
  bookingId: string,
  eventId: string
): Promise<void> {
  // Don't await - fire and forget
  deleteBookingEvent(clientId, bookingId, eventId).catch((error) => {
    console.error("Failed to remove booking from Google Calendar:", error);
  });
}

/**
 * Get booking data from database for calendar sync
 */
export async function getBookingEventData(bookingId: string): Promise<BookingEventData | null> {
  const db = await getDatabase();

  const booking = await db.collection("bookings").findOne({
    _id: new ObjectId(bookingId),
  });

  if (!booking) {
    return null;
  }

  // Get class details
  const classDoc = await db.collection("classes").findOne({
    _id: new ObjectId(booking.classId),
  });

  // Get studio settings for location
  const settings = await db.collection("studio_settings").findOne({});

  return {
    bookingId: booking._id.toString(),
    className: booking.className,
    classDescription: classDoc?.description,
    instructorName: booking.instructorName,
    scheduledDate: new Date(booking.scheduledDate),
    startTime: booking.startTime,
    endTime: booking.endTime,
    location: classDoc?.location,
    studioName: settings?.general?.studioName,
    studioAddress: settings?.general?.address,
  };
}
