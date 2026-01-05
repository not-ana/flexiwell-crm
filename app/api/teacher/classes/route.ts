import { NextResponse } from "next/server";

// Mock data for teacher classes
const mockClasses = [
  {
    id: "1",
    title: "Morning Yoga",
    type: "Yoga",
    start: new Date(2024, 11, 26, 9, 0).toISOString(),
    end: new Date(2024, 11, 26, 10, 0).toISOString(),
    color: "green" as const,
    status: "completed" as const,
    room: "Studio A",
    unit: "FlexiWell Centro",
    capacity: 15,
    enrolled: 12,
    students: [
      { id: "s1", name: "Ana Silva", initials: "AS", attended: true },
      { id: "s2", name: "Maria Santos", initials: "MS", attended: true },
      { id: "s3", name: "João Costa", initials: "JC", attended: false },
    ],
  },
  {
    id: "2",
    title: "Pilates",
    type: "Pilates",
    start: new Date(2024, 11, 26, 14, 0).toISOString(),
    end: new Date(2024, 11, 26, 15, 0).toISOString(),
    color: "purple" as const,
    status: "completed" as const,
    room: "Studio B",
    unit: "FlexiWell Centro",
    capacity: 10,
    enrolled: 8,
    students: [
      { id: "s4", name: "Pedro Lima", initials: "PL", attended: true },
      { id: "s5", name: "Carla Reis", initials: "CR", attended: true },
    ],
  },
  {
    id: "3",
    title: "Morning Yoga",
    type: "Yoga",
    start: new Date(2024, 11, 27, 9, 0).toISOString(),
    end: new Date(2024, 11, 27, 10, 0).toISOString(),
    color: "green" as const,
    status: "in-progress" as const,
    room: "Studio A",
    unit: "FlexiWell Centro",
    capacity: 15,
    enrolled: 14,
    students: [
      { id: "s1", name: "Ana Silva", initials: "AS" },
      { id: "s2", name: "Maria Santos", initials: "MS" },
      { id: "s6", name: "Lucas Oliveira", initials: "LO" },
    ],
  },
  {
    id: "4",
    title: "Reformer Session",
    type: "Pilates",
    start: new Date(2024, 11, 28, 10, 0).toISOString(),
    end: new Date(2024, 11, 28, 11, 0).toISOString(),
    color: "blue" as const,
    status: "scheduled" as const,
    room: "Reformer Room",
    unit: "FlexiWell Jardins",
    capacity: 8,
    enrolled: 6,
    students: [
      { id: "s7", name: "Fernanda Gomes", initials: "FG" },
      { id: "s8", name: "Ricardo Alves", initials: "RA" },
    ],
  },
  {
    id: "5",
    title: "Evening Stretch",
    type: "Stretching",
    start: new Date(2024, 11, 27, 18, 0).toISOString(),
    end: new Date(2024, 11, 27, 19, 0).toISOString(),
    color: "orange" as const,
    status: "scheduled" as const,
    room: "Main Hall",
    unit: "FlexiWell Centro",
    capacity: 20,
    enrolled: 15,
    students: [
      { id: "s9", name: "Juliana Mendes", initials: "JM" },
      { id: "s10", name: "Bruno Costa", initials: "BC" },
    ],
  },
  {
    id: "6",
    title: "Power Pilates",
    type: "Pilates",
    start: new Date(2024, 11, 28, 14, 0).toISOString(),
    end: new Date(2024, 11, 28, 15, 0).toISOString(),
    color: "purple" as const,
    status: "scheduled" as const,
    room: "Studio B",
    unit: "FlexiWell Centro",
    capacity: 12,
    enrolled: 10,
    students: [],
  },
];

export async function GET() {
  // In production, this would fetch real data from the database
  // filtered by the logged-in teacher's ID and date range

  return NextResponse.json({ classes: mockClasses });
}

export async function POST(request: Request) {
  const data = await request.json();

  // In production, this would create a new class in the database
  const newClass = {
    id: `new-${Date.now()}`,
    ...data,
    status: "scheduled",
    students: [],
    enrolled: 0,
  };

  return NextResponse.json({ class: newClass }, { status: 201 });
}
