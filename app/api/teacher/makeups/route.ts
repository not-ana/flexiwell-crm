import { NextResponse } from "next/server";

// Mock data for makeup requests
const mockMakeupRequests = [
  {
    id: "1",
    studentName: "Camille Stone",
    studentInitials: "CS",
    originalClass: "Morning Yoga",
    originalDate: "Dec 20",
    status: "pending" as const,
  },
  {
    id: "2",
    studentName: "Ryan Lewis",
    studentInitials: "RL",
    originalClass: "Core Training",
    originalDate: "Dec 18",
    requestedDate: "Dec 28, 10:00 AM",
    status: "scheduled" as const,
  },
  {
    id: "3",
    studentName: "Patrick Adams",
    studentInitials: "PA",
    originalClass: "Pilates Basics",
    originalDate: "Dec 15",
    status: "pending" as const,
  },
];

export async function GET() {
  // In production, this would fetch real data from the database
  // filtered by the logged-in teacher's classes

  return NextResponse.json({ requests: mockMakeupRequests });
}
