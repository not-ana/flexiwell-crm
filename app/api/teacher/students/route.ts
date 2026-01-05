import { NextResponse } from "next/server";

// Mock data for teacher's students grouped by unit
const mockUnits = [
  {
    id: "1",
    name: "FlexiWell Downtown",
    address: "123 Main Street - Downtown",
    students: [
      {
        id: "1",
        name: "Olivia Rhye",
        email: "olivia@email.com",
        phone: "(555) 123-4567",
        initials: "OR",
        plan: "Monthly - 8 classes",
        classesRemaining: 5,
        classesTotal: 8,
        nextClass: "Today, 2:00 PM - Pilates",
        status: "active" as const,
        joinedDate: "Jan 2024",
        lastActive: "Just now",
      },
      {
        id: "2",
        name: "Phoenix Baker",
        email: "phoenix@email.com",
        phone: "(555) 234-5678",
        initials: "PB",
        plan: "Quarterly - 24 classes",
        classesRemaining: 18,
        classesTotal: 24,
        nextClass: "Tomorrow, 10:00 AM - Yoga",
        status: "active" as const,
        joinedDate: "Nov 2023",
        lastActive: "2 hours ago",
      },
      {
        id: "3",
        name: "Lana Steiner",
        email: "lana@email.com",
        phone: "(555) 345-6789",
        initials: "LS",
        plan: "Monthly - 8 classes",
        classesRemaining: 0,
        classesTotal: 8,
        status: "expired" as const,
        joinedDate: "Dec 2023",
        lastActive: "15 days ago",
      },
      {
        id: "4",
        name: "Demi Wilkinson",
        email: "demi@email.com",
        phone: "(555) 456-7890",
        initials: "DW",
        plan: "Monthly - 12 classes",
        classesRemaining: 12,
        classesTotal: 12,
        status: "paused" as const,
        joinedDate: "Feb 2024",
        lastActive: "7 days ago",
      },
    ],
  },
  {
    id: "2",
    name: "FlexiWell Westside",
    address: "456 Park Avenue - Westside",
    students: [
      {
        id: "5",
        name: "Candice Wu",
        email: "candice@email.com",
        phone: "(555) 567-8901",
        initials: "CW",
        plan: "Semi-annual - 48 classes",
        classesRemaining: 32,
        classesTotal: 48,
        nextClass: "Today, 4:00 PM - Functional",
        status: "active" as const,
        joinedDate: "Sep 2023",
        lastActive: "1 hour ago",
      },
      {
        id: "6",
        name: "Natali Craig",
        email: "natali@email.com",
        phone: "(555) 678-9012",
        initials: "NC",
        plan: "Monthly - 8 classes",
        classesRemaining: 3,
        classesTotal: 8,
        nextClass: "Thu, 9:00 AM - Pilates",
        status: "active" as const,
        joinedDate: "Jan 2024",
        lastActive: "3 hours ago",
      },
    ],
  },
  {
    id: "3",
    name: "FlexiWell Eastside",
    address: "789 Oak Boulevard - Eastside",
    students: [
      {
        id: "7",
        name: "Drew Cano",
        email: "drew@email.com",
        phone: "(555) 789-0123",
        initials: "DC",
        plan: "Quarterly - 24 classes",
        classesRemaining: 20,
        classesTotal: 24,
        nextClass: "Fri, 11:00 AM - Yoga",
        status: "active" as const,
        joinedDate: "Dec 2023",
        lastActive: "4 hours ago",
      },
    ],
  },
];

export async function GET() {
  // In production, this would fetch real data from the database
  // filtered by the logged-in teacher's assigned students/classes

  return NextResponse.json({ units: mockUnits });
}
