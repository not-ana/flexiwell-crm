"use client";

export interface ProgressData {
  completed: number;
  scheduled: number;
  total: number;
}

export interface WellnessData {
  pilates: number;
  yoga: number;
  reformer: number;
  stretch: number;
  totalClasses: number;
  monthlyGoal: number;
}

interface ProgressDonutCardProps {
  data: ProgressData;
  wellnessData?: WellnessData;
}

const COLORS = {
  pilates: { bg: "bg-accent-500", light: "bg-accent-100" },
  yoga: { bg: "bg-accent-400", light: "bg-accent-100" },
  reformer: { bg: "bg-accent-300", light: "bg-accent-100" },
  stretch: { bg: "bg-accent-600", light: "bg-accent-100" },
};

const defaultWellnessData: WellnessData = {
  pilates: 6,
  yoga: 3,
  reformer: 2,
  stretch: 1,
  totalClasses: 12,
  monthlyGoal: 16,
};

export default function ProgressDonutCard({ data, wellnessData = defaultWellnessData }: ProgressDonutCardProps) {
  const classTypes = [
    { name: "Pilates", value: wellnessData.pilates, ...COLORS.pilates },
    { name: "Yoga", value: wellnessData.yoga, ...COLORS.yoga },
    { name: "Reformer", value: wellnessData.reformer, ...COLORS.reformer },
    { name: "Stretch", value: wellnessData.stretch, ...COLORS.stretch },
  ].filter(item => item.value > 0);

  const progressPercent = Math.round((wellnessData.totalClasses / wellnessData.monthlyGoal) * 100);
  const remaining = wellnessData.monthlyGoal - wellnessData.totalClasses;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Monthly Progress</h2>
          <p className="text-sm text-gray-500">Goal: {wellnessData.monthlyGoal} classes</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-gray-900">{wellnessData.totalClasses}</span>
          <span className="text-sm text-gray-500">/ {wellnessData.monthlyGoal}</span>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="mb-5">
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-sm font-medium ${progressPercent >= 100 ? "text-green-600" : "text-gray-600"}`}>
            {progressPercent}% completed
          </span>
          {progressPercent >= 100 ? (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Goal achieved!
            </span>
          ) : (
            <span className="text-sm text-gray-500">{remaining} more to go</span>
          )}
        </div>
      </div>

      {/* Class Type Breakdown */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">By class type</p>
        {classTypes.map((item) => (
          <div key={item.name} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-sm ${item.bg}`} />
            <span className="text-sm text-gray-700 w-20">{item.name}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${item.bg}`}
                style={{ width: `${(item.value / wellnessData.totalClasses) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 w-6 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
