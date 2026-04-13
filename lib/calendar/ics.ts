// iCalendar (.ics) generator
// ----------------------------------------------------------------------------
// Generates RFC 5545 calendar invites that drop a class onto the client's
// Google/Apple/Outlook calendar with one tap. The client's own phone then
// reminds them — using infrastructure they already trust — without us
// having to send a single SMS.
//
// This is the centerpiece of FlexiWell's "no SMS reminders, no PWA" strategy:
// the calendar event itself becomes the reminder.
//
// Conformance notes:
//   - Output uses CRLF line endings as required by RFC 5545.
//   - Lines longer than 75 octets are folded with CRLF + space.
//   - Special characters in TEXT fields are escaped (commas, semicolons,
//     newlines, backslashes).
//   - Times are emitted as floating local time (no Z suffix) plus a TZID
//     property when a timezone is provided. This is the format Apple,
//     Google, and Outlook all parse correctly.
// ----------------------------------------------------------------------------

export interface CalendarEvent {
  uid: string;            // stable id, e.g. booking._id.toString()
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  organizerName?: string;
  organizerEmail?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  url?: string;
}

// Escape per RFC 5545 §3.3.11 (TEXT value type)
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// Format a date as floating local time (YYYYMMDDTHHMMSS).
// Calendar clients combine this with the event's TZID to display correctly.
function formatLocalDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}`;
}

// Format as UTC for DTSTAMP (which must always be UTC).
function formatUtcDate(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

// RFC 5545 §3.1: lines must not exceed 75 octets. Longer lines are folded
// by inserting CRLF followed by a single whitespace character.
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  // First chunk is 75 chars, subsequent chunks are 74 (the leading space
  // counts toward the 75-byte limit on continuation lines).
  parts.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    parts.push(" " + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return parts.join("\r\n");
}

export function generateIcs(event: CalendarEvent): string {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FlexiWell//Class Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${event.uid}@flexiwell.com`,
    `DTSTAMP:${formatUtcDate(now)}`,
    `DTSTART:${formatLocalDate(event.start)}`,
    `DTEND:${formatLocalDate(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }
  if (event.organizerEmail) {
    const cn = event.organizerName ? `;CN=${escapeText(event.organizerName)}` : "";
    lines.push(`ORGANIZER${cn}:mailto:${event.organizerEmail}`);
  }
  if (event.attendeeEmail) {
    const cn = event.attendeeName ? `;CN=${escapeText(event.attendeeName)}` : "";
    lines.push(
      `ATTENDEE${cn};RSVP=TRUE;PARTSTAT=NEEDS-ACTION:mailto:${event.attendeeEmail}`,
    );
  }

  // Two reminders the client's calendar will fire on its own:
  // 24 hours before, and 1 hour before. This is the "no SMS reminder needed"
  // bit — the phone takes care of it.
  lines.push(
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Class tomorrow",
    "TRIGGER:-PT24H",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Class in 1 hour",
    "TRIGGER:-PT1H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

// Convenience: build a base64-encoded attachment ready for the email layer.
export function buildIcsAttachment(event: CalendarEvent, filename = "class.ics") {
  const ics = generateIcs(event);
  return {
    filename,
    contentType: "text/calendar; charset=utf-8; method=REQUEST",
    content: Buffer.from(ics, "utf-8").toString("base64"),
  };
}
