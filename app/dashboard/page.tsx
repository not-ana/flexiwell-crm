import {
  ComingUpCard,
  CalendarCard,
  ProgressDonutCard,
  YearlyBarChart,
} from "@/components/dashboard";

// TODO: Replace with real data from API/database
const mockUpcomingClasses = [
  {
    id: "1",
    date: new Date(2024, 10, 12),
    title: "Afternoon Pilates Class",
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    instructor: "Ana",
  },
  {
    id: "2",
    date: new Date(2024, 10, 12),
    title: "Afternoon Pilates Class",
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    instructor: "Ana",
  },
  {
    id: "3",
    date: new Date(2024, 10, 12),
    title: "Afternoon Pilates Class",
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    instructor: "Ana",
  },
  {
    id: "4",
    date: new Date(2024, 10, 12),
    title: "Afternoon Pilates Class",
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    instructor: "Ana",
  },
];

const mockProgressData = {
  completed: 8,
  scheduled: 6,
  total: 20,
};

// TODO: Get user name from auth context
const userName = "Olivia";

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Class Schedule</h1>
        <p className="text-gray-600 mt-1">Welcome back, {userName}!</p>
      </div>

      {/* Dashboard Grid - Left column narrower, right column wider */}
      <div className="grid grid-cols-1 lg:grid-cols-[30%_68%] gap-[2%]">
        {/* Left Column */}
        <div className="space-y-6">
          <ComingUpCard classes={mockUpcomingClasses} />
          <ProgressDonutCard data={mockProgressData} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <CalendarCard />
          <YearlyBarChart />
        </div>
      </div>
    </div>
  );
}
