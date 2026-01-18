"use client";

interface HealthAssessmentProgressProps {
  totalSections: number;
  completedSections: number;
}

export function HealthAssessmentProgress({
  totalSections,
  completedSections,
}: HealthAssessmentProgressProps) {
  const percentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Progress
        </span>
        <span className="text-sm text-gray-500">
          {completedSections} of {totalSections} sections completed
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{percentage}% complete</p>
    </div>
  );
}
