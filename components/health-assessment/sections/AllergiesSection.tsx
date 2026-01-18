"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";

interface AllergiesSectionProps {
  hasAllergies: boolean;
  allergies: string[];
  onToggle: (value: boolean) => void;
  onChange: (allergies: string[]) => void;
}

export function AllergiesSection({
  hasAllergies,
  allergies,
  onToggle,
  onChange,
}: AllergiesSectionProps) {
  const [inputValue, setInputValue] = useState("");

  const addAllergy = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      onChange([...allergies, trimmed]);
      setInputValue("");
    }
  };

  const removeAllergy = (index: number) => {
    onChange(allergies.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={hasAllergies}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm font-medium text-gray-700">
          I have allergies
        </span>
      </label>

      {hasAllergies && (
        <div className="space-y-3 pl-7">
          <div className="flex flex-wrap gap-2">
            {allergies.map((allergy, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
              >
                {allergy}
                <button
                  type="button"
                  onClick={() => removeAllergy(index)}
                  className="hover:text-red-900"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAllergy();
                }
              }}
              placeholder="Type an allergy and press Enter"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={addAllergy}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
