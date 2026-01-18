"use client";

import type { FormFieldConfig } from "@/lib/db/schemas";

interface DynamicFieldProps {
  config: FormFieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  allValues?: Record<string, unknown>;
}

export function DynamicField({
  config,
  value,
  onChange,
  error,
  allValues = {},
}: DynamicFieldProps) {
  // Check conditional visibility
  if (config.conditionalOn) {
    const conditionField = config.conditionalOn.field;
    const conditionValue = config.conditionalOn.value;
    if (allValues[conditionField] !== conditionValue) {
      return null;
    }
  }

  const baseInputClasses =
    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors";
  const errorClasses = error
    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
    : "border-gray-300";

  switch (config.type) {
    case "text":
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            className={`${baseInputClasses} ${errorClasses}`}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            rows={3}
            className={`${baseInputClasses} ${errorClasses}`}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      );

    case "number":
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            value={(value as number) || ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={config.placeholder}
            className={`${baseInputClasses} ${errorClasses}`}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      );

    case "date":
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="date"
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClasses} ${errorClasses}`}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      );

    case "select":
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={(value as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClasses} ${errorClasses}`}
          >
            <option value="">Select...</option>
            {config.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      );

    case "checkbox":
      return (
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={(value as boolean) || false}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div>
            <label className="text-sm font-medium text-gray-700">
              {config.label}
              {config.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>
      );

    case "checkboxGroup":
      const selectedValues = (value as string[]) || [];
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="space-y-2">
            {config.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option.value]);
                    } else {
                      onChange(selectedValues.filter((v) => v !== option.value));
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      );

    case "tags":
      const tags = (value as string[]) || [];
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onChange(tags.filter((_, i) => i !== index))}
                  className="hover:text-primary-900"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder={config.placeholder || "Type and press Enter to add"}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const input = e.target as HTMLInputElement;
                const newTag = input.value.trim();
                if (newTag && !tags.includes(newTag)) {
                  onChange([...tags, newTag]);
                  input.value = "";
                }
              }
            }}
            className={`${baseInputClasses} ${errorClasses}`}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      );

    default:
      return null;
  }
}
