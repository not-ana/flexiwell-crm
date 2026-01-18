"use client";

import { PlusIcon, TrashIcon } from "lucide-react";
import type { CurrentCondition } from "@/lib/db/schemas";
import { bodyAreas, severityLevels } from "@/lib/health-assessment/defaultConfig";

interface CurrentConditionsSectionProps {
  hasCurrentPain: boolean;
  painDescription: string;
  conditions: CurrentCondition[];
  onToggle: (value: boolean) => void;
  onPainDescriptionChange: (value: string) => void;
  onChange: (conditions: CurrentCondition[]) => void;
}

export function CurrentConditionsSection({
  hasCurrentPain,
  painDescription,
  conditions,
  onToggle,
  onPainDescriptionChange,
  onChange,
}: CurrentConditionsSectionProps) {
  const addCondition = () => {
    onChange([
      ...conditions,
      {
        id: crypto.randomUUID(),
        area: "",
        description: "",
        severity: "mild",
        isChronicPain: false,
      },
    ]);
  };

  const updateCondition = (
    index: number,
    field: keyof CurrentCondition,
    value: string | boolean
  ) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={hasCurrentPain}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm font-medium text-gray-700">
          I currently have pain or injuries
        </span>
      </label>

      {hasCurrentPain && (
        <div className="space-y-4 pl-7">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              General description of your pain/injuries
            </label>
            <textarea
              value={painDescription}
              onChange={(e) => onPainDescriptionChange(e.target.value)}
              placeholder="Describe your current pain or injuries..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Specific conditions:</p>

            {conditions.map((condition, index) => (
              <div key={condition.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Condition {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={condition.area}
                    onChange={(e) => updateCondition(index, "area", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select body area</option>
                    {bodyAreas.map((area) => (
                      <option key={area.value} value={area.value}>
                        {area.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={condition.severity}
                    onChange={(e) =>
                      updateCondition(index, "severity", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {severityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Description of the condition"
                  value={condition.description}
                  onChange={(e) =>
                    updateCondition(index, "description", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={condition.isChronicPain}
                    onChange={(e) =>
                      updateCondition(index, "isChronicPain", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">This is chronic pain</span>
                </label>
              </div>
            ))}

            <button
              type="button"
              onClick={addCondition}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <PlusIcon className="w-4 h-4" />
              Add specific condition
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
