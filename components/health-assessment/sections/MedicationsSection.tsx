"use client";

import { PlusIcon, TrashIcon } from "lucide-react";
import type { Medication } from "@/lib/db/schemas";

interface MedicationsSectionProps {
  takingMedications: boolean;
  medications: Medication[];
  onToggle: (value: boolean) => void;
  onChange: (medications: Medication[]) => void;
}

export function MedicationsSection({
  takingMedications,
  medications,
  onToggle,
  onChange,
}: MedicationsSectionProps) {
  const addMedication = () => {
    onChange([
      ...medications,
      {
        id: crypto.randomUUID(),
        name: "",
        dosage: "",
        reason: "",
      },
    ]);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeMedication = (index: number) => {
    onChange(medications.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={takingMedications}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm font-medium text-gray-700">
          I am currently taking medications
        </span>
      </label>

      {takingMedications && (
        <div className="space-y-4 pl-7">
          {medications.map((medication, index) => (
            <div key={medication.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Medication {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeMedication(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Medication name"
                  value={medication.name}
                  onChange={(e) => updateMedication(index, "name", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g., 10mg)"
                  value={medication.dosage || ""}
                  onChange={(e) => updateMedication(index, "dosage", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  placeholder="Reason"
                  value={medication.reason || ""}
                  onChange={(e) => updateMedication(index, "reason", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addMedication}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            Add medication
          </button>
        </div>
      )}
    </div>
  );
}
