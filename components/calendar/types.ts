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
  date: Date;
  startTime: string;
  endTime?: string;
  color: EventColor;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export const eventColorClasses: Record<EventColor, { bg: string; text: string; dot: string }> = {
  purple: { bg: "bg-primary-50", text: "text-primary-700", dot: "bg-primary-500" },
  pink: { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-500" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  green: { bg: "bg-success-50", text: "text-success-700", dot: "bg-success-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  red: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  gray: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-500" },
};
