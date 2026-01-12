// Date Utilities - Centralized date formatting and manipulation

import { DATE_FORMAT_BR } from "./constants";

export function formatDateBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(DATE_FORMAT_BR);
}

export function formatDateTimeBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString(DATE_FORMAT_BR);
}

export function getStartOfDay(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getEndOfDay(date: Date = new Date()): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function getHoursUntil(targetDate: Date): number {
  return (targetDate.getTime() - Date.now()) / (1000 * 60 * 60);
}

export function isWithinHours(targetDate: Date, hours: number): boolean {
  return getHoursUntil(targetDate) >= hours;
}

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}
