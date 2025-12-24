"use client";

import { useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View, SlotInfo } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Button } from "@/components/ui";
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, ChevronIcon } from "@/components/icons";

// Setup date-fns localizer
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export type EventColor =
  | "purple"
  | "pink"
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "yellow"
  | "gray";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: EventColor;
  instructor?: string;
}

interface BigCalendarProps {
  events: CalendarEvent[];
  onCreateClass?: () => void;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (slotInfo: SlotInfo) => void;
  onEventDrop?: (event: CalendarEvent, start: Date, end: Date) => void;
}

const eventColors: Record<EventColor, { bg: string; border: string; text: string }> = {
  purple: { bg: "#F4EBFF", border: "#7F56D9", text: "#6941C6" },
  pink: { bg: "#FCE7F6", border: "#EE46BC", text: "#C11574" },
  blue: { bg: "#EFF8FF", border: "#2E90FA", text: "#175CD3" },
  green: { bg: "#ECFDF3", border: "#12B76A", text: "#027A48" },
  orange: { bg: "#FFF6ED", border: "#FB6514", text: "#C4320A" },
  red: { bg: "#FEF3F2", border: "#F04438", text: "#B42318" },
  yellow: { bg: "#FEFBE8", border: "#EAAA08", text: "#A15C07" },
  gray: { bg: "#F9FAFB", border: "#667085", text: "#344054" },
};

// Custom toolbar component
interface ToolbarProps {
  date: Date;
  view: View;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  onView: (view: View) => void;
  onCreateClass?: () => void;
}

function CustomToolbar({ date, view, onNavigate, onView, onCreateClass }: ToolbarProps) {
  const today = new Date();

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      {/* Left: Date badge and title */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-14 h-14 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-xs font-medium text-gray-600 uppercase">
            {format(today, "MMM")}
          </span>
          <span className="text-xl font-bold text-gray-900">{format(today, "d")}</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {format(date, "MMMM yyyy")}
          </h2>
          <p className="text-sm text-gray-600">
            {format(new Date(date.getFullYear(), date.getMonth(), 1), "MMM d, yyyy")} –{" "}
            {format(new Date(date.getFullYear(), date.getMonth() + 1, 0), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate("PREV")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => onNavigate("NEXT")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Today button */}
        <Button variant="secondary" size="sm" onClick={() => onNavigate("TODAY")}>
          Today
        </Button>

        {/* View mode dropdown */}
        <div className="relative">
          <select
            value={view}
            onChange={(e) => onView(e.target.value as View)}
            className="appearance-none flex items-center gap-2 px-3 py-2 pr-8 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer bg-white"
          >
            <option value="month">Month view</option>
            <option value="week">Week view</option>
            <option value="day">Day view</option>
            <option value="agenda">Agenda</option>
          </select>
          <ChevronIcon className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" direction="down" />
        </div>

        {/* Create class button */}
        {onCreateClass && (
          <Button size="sm" leftIcon={<PlusIcon className="w-4 h-4" />} onClick={onCreateClass}>
            Create class
          </Button>
        )}
      </div>
    </div>
  );
}

export default function BigCalendar({
  events,
  onCreateClass,
  onEventClick,
  onSlotClick,
}: BigCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>("month");

  const handleNavigate = useCallback((action: "PREV" | "NEXT" | "TODAY") => {
    setCurrentDate((prev) => {
      if (action === "TODAY") return new Date();
      const offset = action === "PREV" ? -1 : 1;
      if (currentView === "month") {
        return new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      } else if (currentView === "week") {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + offset * 7);
        return newDate;
      } else {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + offset);
        return newDate;
      }
    });
  }, [currentView]);

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      onEventClick?.(event);
    },
    [onEventClick]
  );

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      onSlotClick?.(slotInfo);
    },
    [onSlotClick]
  );

  // Custom event styling
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const colors = eventColors[event.color] || eventColors.gray;
    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        color: colors.text,
        borderRadius: "4px",
        padding: "2px 8px",
        fontSize: "12px",
        fontWeight: 500,
        border: "none",
        boxShadow: "none",
      },
    };
  }, []);

  // Custom day cell styling
  const dayPropGetter = useCallback((date: Date) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    return {
      className: isToday ? "rbc-today-custom" : "",
    };
  }, []);

  const components = useMemo(
    () => ({
      toolbar: (props: any) => (
        <CustomToolbar
          date={props.date}
          view={props.view}
          onNavigate={handleNavigate}
          onView={setCurrentView}
          onCreateClass={onCreateClass}
        />
      ),
    }),
    [handleNavigate, onCreateClass]
  );

  return (
    <div className="bg-white h-full flex flex-col overflow-hidden">
      <Calendar
        localizer={localizer}
        events={events}
        date={currentDate}
        view={currentView}
        onNavigate={setCurrentDate}
        onView={setCurrentView}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        components={components}
        style={{ height: "100%", flex: 1 }}
        popup
        views={["month", "week", "day", "agenda"]}
      />
    </div>
  );
}
