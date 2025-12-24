"use client";

import { useState } from "react";
import { SlotInfo } from "react-big-calendar";
import { BigCalendar } from "@/components/calendar";
import type { CalendarEvent } from "@/components/calendar/BigCalendar";
import "@/components/calendar/calendar.css";

// TODO: Replace with real data from API/database
const mockEvents: CalendarEvent[] = [
  // Week 1 - December overflow
  { id: "1", title: "Monday standup", start: new Date(2024, 11, 30, 9, 0), end: new Date(2024, 11, 30, 9, 30), color: "gray" },
  { id: "2", title: "Coffee with Alex", start: new Date(2024, 11, 30, 11, 30), end: new Date(2024, 11, 30, 12, 0), color: "pink" },
  { id: "3", title: "Marketing meeting", start: new Date(2024, 11, 30, 14, 30), end: new Date(2024, 11, 30, 15, 30), color: "pink" },
  { id: "4", title: "Product design", start: new Date(2024, 11, 31, 10, 30), end: new Date(2024, 11, 31, 11, 30), color: "purple" },

  // Week 1 - January
  { id: "5", title: "One-on-one", start: new Date(2025, 0, 2, 10, 0), end: new Date(2025, 0, 2, 11, 0), color: "orange" },
  { id: "6", title: "All-hands", start: new Date(2025, 0, 2, 16, 0), end: new Date(2025, 0, 2, 17, 0), color: "gray" },
  { id: "7", title: "Dinner with team", start: new Date(2025, 0, 2, 18, 30), end: new Date(2025, 0, 2, 20, 0), color: "green" },
  { id: "8", title: "Friday standup", start: new Date(2025, 0, 3, 9, 0), end: new Date(2025, 0, 3, 9, 30), color: "gray" },
  { id: "9", title: "House inspection", start: new Date(2025, 0, 4, 10, 30), end: new Date(2025, 0, 4, 11, 30), color: "green" },

  // Week 2
  { id: "10", title: "Monday standup", start: new Date(2025, 0, 6, 9, 0), end: new Date(2025, 0, 6, 9, 30), color: "gray" },
  { id: "11", title: "Content planning", start: new Date(2025, 0, 6, 11, 0), end: new Date(2025, 0, 6, 12, 0), color: "pink" },
  { id: "12", title: "One-on-one", start: new Date(2025, 0, 7, 10, 0), end: new Date(2025, 0, 7, 11, 0), color: "orange" },
  { id: "13", title: "Catch up", start: new Date(2025, 0, 7, 14, 30), end: new Date(2025, 0, 7, 15, 0), color: "gray" },
  { id: "14", title: "Deep work", start: new Date(2025, 0, 8, 9, 0), end: new Date(2025, 0, 8, 12, 0), color: "blue" },
  { id: "15", title: "Design sync", start: new Date(2025, 0, 8, 10, 30), end: new Date(2025, 0, 8, 11, 30), color: "purple" },
  { id: "16", title: "SEO planning", start: new Date(2025, 0, 8, 13, 30), end: new Date(2025, 0, 8, 14, 30), color: "pink" },
  { id: "17", title: "Lunch meeting", start: new Date(2025, 0, 9, 12, 0), end: new Date(2025, 0, 9, 13, 0), color: "green" },
  { id: "18", title: "Olivia x Riley", start: new Date(2025, 0, 9, 10, 0), end: new Date(2025, 0, 9, 10, 30), color: "gray" },
  { id: "19", title: "Product design", start: new Date(2025, 0, 9, 13, 30), end: new Date(2025, 0, 9, 14, 30), color: "purple" },
  { id: "20", title: "Friday standup", start: new Date(2025, 0, 10, 9, 0), end: new Date(2025, 0, 10, 9, 30), color: "gray" },
  { id: "21", title: "House inspection", start: new Date(2025, 0, 11, 11, 0), end: new Date(2025, 0, 11, 12, 0), color: "green" },
  { id: "22", title: "Ava's engagement", start: new Date(2025, 0, 12, 13, 0), end: new Date(2025, 0, 12, 15, 0), color: "orange" },

  // Week 3
  { id: "23", title: "Monday standup", start: new Date(2025, 0, 13, 9, 0), end: new Date(2025, 0, 13, 9, 30), color: "gray" },
  { id: "24", title: "Team lunch", start: new Date(2025, 0, 13, 12, 15), end: new Date(2025, 0, 13, 13, 15), color: "pink" },
  { id: "25", title: "Product planning", start: new Date(2025, 0, 15, 9, 30), end: new Date(2025, 0, 15, 10, 30), color: "purple" },
  { id: "26", title: "Amélie's farewell", start: new Date(2025, 0, 16, 10, 0), end: new Date(2025, 0, 16, 11, 0), color: "green" },
  { id: "27", title: "All-hands", start: new Date(2025, 0, 16, 16, 0), end: new Date(2025, 0, 16, 17, 0), color: "gray" },
  { id: "28", title: "Friday standup", start: new Date(2025, 0, 17, 9, 0), end: new Date(2025, 0, 17, 9, 30), color: "gray" },
  { id: "29", title: "Coffee w/ Sarah", start: new Date(2025, 0, 17, 9, 30), end: new Date(2025, 0, 17, 10, 0), color: "gray" },
  { id: "30", title: "Design feedback", start: new Date(2025, 0, 17, 14, 30), end: new Date(2025, 0, 17, 15, 30), color: "purple" },
  { id: "31", title: "Half marathon", start: new Date(2025, 0, 18, 7, 0), end: new Date(2025, 0, 18, 10, 0), color: "green" },

  // Week 4
  { id: "32", title: "Monday standup", start: new Date(2025, 0, 20, 9, 0), end: new Date(2025, 0, 20, 9, 30), color: "gray" },
  { id: "33", title: "Deep work", start: new Date(2025, 0, 20, 9, 15), end: new Date(2025, 0, 20, 12, 0), color: "blue" },
  { id: "34", title: "Quarterly review", start: new Date(2025, 0, 21, 11, 30), end: new Date(2025, 0, 21, 12, 30), color: "purple" },
  { id: "35", title: "Lunch with team", start: new Date(2025, 0, 21, 13, 0), end: new Date(2025, 0, 21, 14, 0), color: "gray" },
  { id: "36", title: "Dinner with clients", start: new Date(2025, 0, 21, 19, 0), end: new Date(2025, 0, 21, 21, 0), color: "orange" },
  { id: "37", title: "Deep work", start: new Date(2025, 0, 22, 9, 0), end: new Date(2025, 0, 22, 12, 0), color: "blue" },
  { id: "38", title: "Design sync", start: new Date(2025, 0, 22, 14, 30), end: new Date(2025, 0, 22, 15, 30), color: "purple" },
  { id: "39", title: "Amélie coaching", start: new Date(2025, 0, 23, 10, 0), end: new Date(2025, 0, 23, 11, 0), color: "green" },
  { id: "40", title: "Friday standup", start: new Date(2025, 0, 24, 9, 0), end: new Date(2025, 0, 24, 9, 30), color: "gray" },
  { id: "41", title: "Accountant", start: new Date(2025, 0, 24, 13, 45), end: new Date(2025, 0, 24, 14, 45), color: "red" },
  { id: "42", title: "Marketing review", start: new Date(2025, 0, 24, 14, 30), end: new Date(2025, 0, 24, 15, 30), color: "pink" },

  // Week 5
  { id: "43", title: "Monday standup", start: new Date(2025, 0, 27, 9, 0), end: new Date(2025, 0, 27, 9, 30), color: "gray" },
  { id: "44", title: "Content planning", start: new Date(2025, 0, 28, 11, 0), end: new Date(2025, 0, 28, 12, 0), color: "pink" },
  { id: "45", title: "Lunch with mentor", start: new Date(2025, 0, 28, 12, 45), end: new Date(2025, 0, 28, 13, 45), color: "gray" },
  { id: "46", title: "Product planning", start: new Date(2025, 0, 29, 9, 30), end: new Date(2025, 0, 29, 10, 30), color: "purple" },
  { id: "47", title: "All-hands", start: new Date(2025, 0, 30, 16, 0), end: new Date(2025, 0, 30, 17, 0), color: "gray" },
  { id: "48", title: "Team dinner", start: new Date(2025, 0, 30, 17, 30), end: new Date(2025, 0, 30, 19, 30), color: "orange" },
  { id: "49", title: "Friday standup", start: new Date(2025, 0, 31, 9, 0), end: new Date(2025, 0, 31, 9, 30), color: "gray" },

  // February overflow
  { id: "50", title: "Drive to Sydney", start: new Date(2025, 1, 2, 8, 0), end: new Date(2025, 1, 2, 12, 0), color: "green" },
];

export default function ClassesPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);

  const handleCreateClass = () => {
    // TODO: Open create class modal
    console.log("Create class clicked");
    alert("Create class modal - Em breve!");
  };

  const handleEventClick = (event: CalendarEvent) => {
    console.log("Event clicked:", event);
    alert(`${event.title}\n${event.start.toLocaleString()}`);
  };

  const handleSlotClick = (slotInfo: SlotInfo) => {
    console.log("Slot clicked:", slotInfo);
    const title = prompt("Nome da aula:");
    if (title) {
      const newEvent: CalendarEvent = {
        id: String(Date.now()),
        title,
        start: slotInfo.start,
        end: slotInfo.end,
        color: "purple",
      };
      setEvents((prev) => [...prev, newEvent]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-semibold text-gray-900">Classes</h1>
      </div>

      {/* Calendar - Full Height */}
      <div className="flex-1 min-h-0">
        <BigCalendar
          events={events}
          onCreateClass={handleCreateClass}
          onEventClick={handleEventClick}
          onSlotClick={handleSlotClick}
        />
      </div>
    </div>
  );
}
