"use client";

import type { EmergencyContact } from "@/lib/db/schemas";

interface EmergencyContactSectionProps {
  contact: EmergencyContact;
  onChange: (contact: EmergencyContact) => void;
  errors?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

const relationships = [
  { value: "spouse", label: "Spouse/Partner" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "child", label: "Child" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

export function EmergencyContactSection({
  contact,
  onChange,
  errors = {},
}: EmergencyContactSectionProps) {
  const updateField = (field: keyof EmergencyContact, value: string) => {
    onChange({ ...contact, [field]: value });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Please provide an emergency contact who can be reached in case of an emergency during your session.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={contact.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Full name"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.name ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship <span className="text-red-500">*</span>
          </label>
          <select
            value={contact.relationship}
            onChange={(e) => updateField("relationship", e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.relationship ? "border-red-300" : "border-gray-300"
            }`}
          >
            <option value="">Select relationship</option>
            {relationships.map((rel) => (
              <option key={rel.value} value={rel.value}>
                {rel.label}
              </option>
            ))}
          </select>
          {errors.relationship && (
            <p className="text-sm text-red-600 mt-1">{errors.relationship}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={contact.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.phone ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
        </div>
      </div>
    </div>
  );
}
