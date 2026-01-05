import { NextResponse } from "next/server";

// Mock data for teacher dashboard
const mockDashboardData = {
  stats: {
    classesCompleted: 18,
    totalClasses: 24,
    studentsServed: 142,
    avgAttendance: 92,
    rating: 4.8,
    hoursTeaching: 22,
    makeupPending: 3,
  },
  todaySchedule: [
    { id: "1", name: "Morning Yoga", time: "07:00 - 08:00", status: "completed" as const, students: 12, room: "Studio A" },
    { id: "2", name: "Pilates Basics", time: "09:00 - 10:00", status: "completed" as const, students: 8, room: "Studio B" },
    { id: "3", name: "Core Training", time: "11:00 - 12:00", status: "in-progress" as const, students: 15, room: "Studio A" },
    { id: "4", name: "Afternoon Stretch", time: "14:00 - 15:00", status: "upcoming" as const, students: 10, room: "Main Hall" },
    { id: "5", name: "Power Yoga", time: "17:00 - 18:00", status: "upcoming" as const, students: 14, room: "Studio A" },
    { id: "6", name: "Evening Relaxation", time: "19:00 - 20:00", status: "upcoming" as const, students: 6, room: "Studio B" },
  ],
  upcomingClasses: [
    { id: "1", name: "Morning Yoga", time: "Tomorrow, 07:00", duration: "1h", students: 10, maxStudents: 15, room: "Studio A" },
    { id: "2", name: "Pilates Advanced", time: "Tomorrow, 10:00", duration: "1h", students: 8, maxStudents: 10, room: "Studio B" },
    { id: "3", name: "Core Training", time: "Wed, 11:00", duration: "1h", students: 12, maxStudents: 15, room: "Studio A" },
    { id: "4", name: "Power Yoga", time: "Wed, 17:00", duration: "1.5h", students: 14, maxStudents: 20, room: "Main Hall" },
  ],
  makeupRequests: [
    { id: "1", studentName: "Camille Stone", studentInitials: "CS", originalClass: "Morning Yoga", originalDate: "Dec 20", status: "pending" as const },
    { id: "2", studentName: "Ryan Lewis", studentInitials: "RL", originalClass: "Core Training", originalDate: "Dec 18", requestedDate: "Dec 28, 10:00 AM", status: "scheduled" as const },
    { id: "3", studentName: "Patrick Adams", studentInitials: "PA", originalClass: "Pilates Basics", originalDate: "Dec 15", status: "pending" as const },
  ],
  weeklyClassData: [
    { day: "Mon", classes: 4, students: 42 },
    { day: "Tue", classes: 5, students: 58 },
    { day: "Wed", classes: 3, students: 32 },
    { day: "Thu", classes: 5, students: 54 },
    { day: "Fri", classes: 4, students: 48 },
    { day: "Sat", classes: 2, students: 24 },
    { day: "Sun", classes: 1, students: 12 },
  ],
  classTypeData: [
    { name: "Yoga", value: 35, color: "#7C3AED" },
    { name: "Pilates", value: 30, color: "#8B5CF6" },
    { name: "Core", value: 20, color: "#A78BFA" },
    { name: "Stretch", value: 15, color: "#C4B5FD" },
  ],
  studentAttendance: [
    { id: "1", name: "Lucas Brooks", initials: "LB", classesAttended: 18, totalClasses: 20, lastClass: "Today", needsMakeup: false },
    { id: "2", name: "Camille Stone", initials: "CS", classesAttended: 15, totalClasses: 20, lastClass: "Yesterday", needsMakeup: true },
    { id: "3", name: "Ryan Lewis", initials: "RL", classesAttended: 12, totalClasses: 20, lastClass: "2 days ago", needsMakeup: true },
    { id: "4", name: "Julia Martin", initials: "JM", classesAttended: 19, totalClasses: 20, lastClass: "Today", needsMakeup: false },
    { id: "5", name: "Patrick Adams", initials: "PA", classesAttended: 8, totalClasses: 20, lastClass: "1 week ago", needsMakeup: true },
  ],
};

export async function GET() {
  // In production, this would fetch real data from the database
  // filtered by the logged-in teacher's ID

  return NextResponse.json(mockDashboardData);
}
