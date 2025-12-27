"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon, UploadIcon } from "@/components/icons";
import {
  FormConfig,
  FormSection,
  FormField,
  getClientFormConfig,
} from "@/lib/formConfig";

export default function AddClientPage() {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const config = getClientFormConfig();
    setFormConfig(config);
    if (config.sections.length > 0) {
      setActiveSection(config.sections[0].id);
    }
  }, []);

  const handleInputChange = useCallback((fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleFileChange = useCallback(
    (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleInputChange(fieldId, file);
        // Create preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setLogoPreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    },
    [handleInputChange]
  );

  const handleCheckboxChange = useCallback(
    (fieldId: string, optionLabel: string, checked: boolean) => {
      setFormData((prev) => {
        const current = (prev[fieldId] as string[]) || [];
        if (checked) {
          return { ...prev, [fieldId]: [...current, optionLabel] };
        }
        return { ...prev, [fieldId]: current.filter((l) => l !== optionLabel) };
      });
    },
    []
  );

  const renderField = (field: FormField) => {
    switch (field.type) {
      case "text":
      case "email":
        return (
          <input
            type={field.type}
            value={(formData[field.id] as string) || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        );

      case "url":
        return (
          <div className="flex">
            {field.prefix && (
              <span className="inline-flex items-center px-3 py-2.5 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                {field.prefix}
              </span>
            )}
            <input
              type="text"
              value={(formData[field.id] as string) || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={`flex-1 px-3 py-2.5 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                field.prefix ? "rounded-r-lg" : "rounded-lg"
              }`}
            />
          </div>
        );

      case "textarea":
        const currentLength = ((formData[field.id] as string) || "").length;
        return (
          <div>
            <textarea
              value={(formData[field.id] as string) || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
            {field.maxLength && (
              <p className="text-xs text-gray-500 mt-1 text-right">
                {field.maxLength - currentLength} characters left
              </p>
            )}
          </div>
        );

      case "file":
        return (
          <div className="flex items-center gap-4">
            {/* Logo Preview */}
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">Logo</span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-900">
                {(formData[field.id] as File)?.name || "Untitled UI"}
              </span>
            </div>

            {/* Upload Area */}
            <label className="flex-1 flex flex-col items-center justify-center px-6 py-4 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
              <UploadIcon className="w-5 h-5 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                <span className="text-primary-600 font-medium">Click to upload</span> or drag and
                drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                SVG, PNG, JPG or GIF (max. 800x400px)
              </p>
              <input
                type="file"
                accept={field.accept}
                onChange={(e) => handleFileChange(field.id, e)}
                className="hidden"
              />
            </label>
          </div>
        );

      case "checkboxGroup":
        const selectedOptions = (formData[field.id] as string[]) || [];
        return (
          <div className="space-y-3">
            {field.options?.map((option) => (
              <label
                key={option.label}
                className="flex items-start gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option.label)}
                  onChange={(e) =>
                    handleCheckboxChange(field.id, option.label, e.target.checked)
                  }
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">{option.label}</p>
                  {option.description && (
                    <p className="text-sm text-gray-500">{option.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        );

      case "socialLink":
        return (
          <div className="flex">
            {field.prefix && (
              <span className="inline-flex items-center px-3 py-2.5 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg min-w-[140px]">
                {field.prefix}
              </span>
            )}
            <input
              type="text"
              value={(formData[field.id] as string) || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="flex-1 px-3 py-2.5 bg-white border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderSection = (section: FormSection) => {
    // Group fields - social links should be grouped together
    const groupedFields: { field: FormField; isPartOfGroup: boolean }[] = [];
    let lastWasSocial = false;

    section.fields.forEach((field) => {
      const isSocial = field.type === "socialLink";
      groupedFields.push({ field, isPartOfGroup: isSocial && lastWasSocial });
      lastWasSocial = isSocial;
    });

    return (
      <div className="space-y-8">
        {groupedFields.map(({ field, isPartOfGroup }) => {
          // Skip rendering label row for grouped social links
          if (isPartOfGroup) {
            return (
              <div key={field.id} className="grid grid-cols-[200px_1fr] gap-6">
                <div />
                <div className="w-full">{renderField(field)}</div>
              </div>
            );
          }

          return (
            <div key={field.id} className="grid grid-cols-[200px_1fr] gap-6">
              <div>
                {field.label && (
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </label>
                )}
                {field.description && (
                  <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                )}
                {field.type === "checkboxGroup" && (
                  <button
                    type="button"
                    onClick={() => {
                      alert("Example goals:\n\n• Improve flexibility and posture\n• Build core strength\n• Reduce stress and anxiety\n• Recover from injury\n• Increase overall fitness");
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 mt-2"
                  >
                    View examples
                  </button>
                )}
              </div>
              <div className="w-full">{renderField(field)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!formConfig) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const currentSection = formConfig.sections.find((s) => s.id === activeSection);

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="p-8">
        {/* Back Link */}
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to all projects
        </Link>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Add Client</h1>

        {/* Content */}
        <div className="flex gap-16">
          {/* Sidebar Navigation */}
          <nav className="w-40 flex-shrink-0">
            <ul className="space-y-1">
              {formConfig.sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? "text-primary-600 border-l-2 border-primary-600"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Form Content */}
          <div className="flex-1 max-w-3xl">
            {currentSection && (
              <>
                {/* Section Header */}
                <div className="mb-8 pb-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Company profile
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Update your company photo and details here.
                  </p>
                </div>

                {/* Form Fields */}
                {renderSection(currentSection)}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
