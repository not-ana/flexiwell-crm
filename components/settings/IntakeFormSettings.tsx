"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { showToast, Toggle } from "./shared";
import { defaultSections, defaultLiabilityWaiverText, defaultTermsText } from "@/lib/health-assessment/defaultConfig";
import type { FormSectionConfig } from "@/lib/db/schemas";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  RotateCcwIcon,
  GripVerticalIcon,
  FileTextIcon,
  PlusIcon,
  TrashIcon,
  SaveIcon,
  SmartphoneIcon,
  XIcon,
  AlertTriangleIcon,
} from "lucide-react";

// ── Phone Preview ──────────────────────────────────────────────────────

function PhoneFieldPreview({ field }: { field: FormSectionConfig["fields"][number] }) {
  switch (field.type) {
    case "text":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 flex items-center">
            <span className="text-xs text-gray-400">{field.placeholder || field.label}</span>
          </div>
        </div>
      );
    case "number":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 flex items-center">
            <span className="text-xs text-gray-400">{field.placeholder || "0"}</span>
          </div>
        </div>
      );
    case "date":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">MM / DD / YYYY</span>
            <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          </div>
        </div>
      );
    case "select":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">Select...</span>
            <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        </div>
      );
    case "textarea":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="h-14 rounded-md border border-gray-200 bg-gray-50 px-2 pt-1.5">
            <span className="text-xs text-gray-400">{field.placeholder || "Type here..."}</span>
          </div>
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-start gap-2">
          <div className="mt-0.5 w-4 h-4 rounded border border-gray-300 bg-white flex-shrink-0" />
          <span className="text-xs text-gray-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </span>
        </label>
      );
    case "checkboxGroup":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="space-y-1.5">
            {(field.options || []).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border border-gray-300 bg-white flex-shrink-0" />
                <span className="text-xs text-gray-600">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
          <div className="h-8 rounded-md border border-gray-200 bg-gray-50" />
        </div>
      );
  }
}

function IntakeFormPreview({
  sections,
  onClose,
}: {
  sections: FormSectionConfig[];
  onClose: () => void;
}) {
  const enabledSections = sections.filter((s) => s.enabled);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    enabledSections[0]?.id || null
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="relative flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-700"
        >
          <XIcon className="w-4 h-4" />
        </button>

        {/* Tablet frame — iPad landscape miniature */}
        <div className="w-[960px] max-w-[92vw] h-[min(640px,82vh)] bg-white rounded-2xl shadow-2xl border-[6px] border-gray-800 overflow-hidden flex flex-col">
          {/* Top bar */}
          <div className="h-6 bg-gray-800 flex items-center justify-center">
            <div className="w-16 h-2.5 bg-gray-700 rounded-full" />
          </div>

          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center">
                <FileTextIcon className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Health Assessment</h3>
                <p className="text-[11px] text-gray-500">
                  {enabledSections.length} sections to complete
                </p>
              </div>
            </div>
            {/* Progress */}
            <div className="flex items-center gap-1.5 w-48">
              {enabledSections.map((s, i) => (
                <div
                  key={s.id}
                  className={`h-1 flex-1 rounded-full ${
                    i === 0 ? "bg-primary-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Section nav (left) */}
            <div className="w-56 border-r border-gray-100 bg-gray-50/80 overflow-y-auto py-2">
              {enabledSections.map((section, i) => {
                const isActive = expandedSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setExpandedSection(section.id)}
                    className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition-colors ${
                      isActive
                        ? "bg-primary-50 border-r-2 border-primary-500"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                      isActive ? "bg-primary-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`text-xs truncate ${
                      isActive ? "font-semibold text-gray-900" : "text-gray-600"
                    }`}>
                      {section.title}
                      {section.required && <span className="text-red-500 ml-0.5">*</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Fields (right) */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {enabledSections
                .filter((s) => s.id === expandedSection)
                .map((section) => {
                  const visibleFields = section.fields.filter((f) => !f.conditionalOn);
                  return (
                    <div key={section.id} className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{section.title}</h4>
                        {section.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {visibleFields.map((field) => (
                          <div key={field.id} className={
                            field.type === "textarea" || field.type === "checkboxGroup"
                              ? "col-span-2"
                              : ""
                          }>
                            <PhoneFieldPreview field={field} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="px-6 py-2.5 bg-white border-t border-gray-100 flex items-center justify-between">
            <p className="text-[11px] text-gray-400">Step 1 of {enabledSections.length}</p>
            <div className="flex gap-2">
              <div className="h-8 px-4 border border-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-[11px] font-medium text-gray-600">Back</span>
              </div>
              <div className="h-8 px-5 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-[11px] font-semibold text-white">Next</span>
              </div>
            </div>
          </div>
        </div>

        {/* Label */}
        <p className="mt-3 text-sm text-white/70 text-center">
          Client view — tablet preview
        </p>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export function IntakeFormSettings() {
  const [sections, setSections] = useState<FormSectionConfig[]>(defaultSections);
  const [originalSections, setOriginalSections] = useState<FormSectionConfig[]>(defaultSections);
  const [liabilityWaiverText, setLiabilityWaiverText] = useState(defaultLiabilityWaiverText);
  const [termsText, setTermsText] = useState(defaultTermsText);
  const [originalLiabilityText, setOriginalLiabilityText] = useState(defaultLiabilityWaiverText);
  const [originalTermsText, setOriginalTermsText] = useState(defaultTermsText);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewSection, setPreviewSection] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/health-assessments/config?establishmentId=default");
        if (res.ok) {
          const data = await res.json();
          if (data.formConfig) {
            setSections(data.formConfig.sections);
            setOriginalSections(data.formConfig.sections);
            if (data.formConfig.liabilityWaiverText) {
              setLiabilityWaiverText(data.formConfig.liabilityWaiverText);
              setOriginalLiabilityText(data.formConfig.liabilityWaiverText);
            }
            if (data.formConfig.termsText) {
              setTermsText(data.formConfig.termsText);
              setOriginalTermsText(data.formConfig.termsText);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load intake form config:", error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    const changed =
      JSON.stringify(sections) !== JSON.stringify(originalSections) ||
      liabilityWaiverText !== originalLiabilityText ||
      termsText !== originalTermsText;
    setHasUnsavedChanges(changed);
  }, [sections, originalSections, liabilityWaiverText, originalLiabilityText, termsText, originalTermsText]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/health-assessments/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishmentId: "default",
          sections,
          liabilityWaiverText,
          termsText,
        }),
      });

      if (res.ok) {
        setOriginalSections(sections);
        setOriginalLiabilityText(liabilityWaiverText);
        setOriginalTermsText(termsText);
        setHasUnsavedChanges(false);
        showToast("Intake form settings saved successfully", "success");
      } else {
        showToast("Failed to save settings", "error");
      }
    } catch (error) {
      console.error("Failed to save intake form config:", error);
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setSections(defaultSections);
    setLiabilityWaiverText(defaultLiabilityWaiverText);
    setTermsText(defaultTermsText);
  };

  const handleToggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleToggleRequired = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, required: !s.required } : s))
    );
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    // Swap order values
    const tempOrder = newSections[index].order;
    newSections[index] = { ...newSections[index], order: newSections[targetIndex].order };
    newSections[targetIndex] = { ...newSections[targetIndex], order: tempOrder };

    // Swap positions in array
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSections(newSections);
  };

  const handleUpdateSectionTitle = (sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
  };

  const handleUpdateSectionDescription = (sectionId: string, description: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, description } : s))
    );
  };

  const handleAddCustomSection = () => {
    const newSection: FormSectionConfig = {
      id: `custom_${Date.now()}`,
      title: "Custom Section",
      description: "Add your custom questions here",
      enabled: true,
      required: false,
      order: sections.length + 1,
      isBuiltIn: false,
      fields: [
        {
          id: `custom_field_${Date.now()}`,
          type: "text",
          label: "Custom Question",
          required: false,
        },
      ],
    };
    setSections([...sections, newSection]);
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const enabledCount = sections.filter((s) => s.enabled).length;
  const totalFields = sections
    .filter((s) => s.enabled)
    .reduce((sum, s) => sum + s.fields.length, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Intake Form</h2>
          <p className="text-sm text-gray-600 mt-1">
            Customize the health assessment form sent to new clients. {enabledCount} sections, {totalFields} fields active.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="text-gray-600 whitespace-nowrap"
          >
            <SmartphoneIcon className="w-4 h-4 mr-1.5" />
            Preview
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowResetConfirm(true)}
            className="text-gray-600 whitespace-nowrap"
          >
            <RotateCcwIcon className="w-4 h-4 mr-1.5" />
            Reset to Default
          </Button>
          {hasUnsavedChanges && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              <SaveIcon className="w-4 h-4 mr-1.5" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          This is the default template based on what Pilates studios in the US typically ask new clients.
          Toggle sections on/off, reorder them, or edit labels to match your studio&apos;s needs.
          When you add a new client and check &quot;Send intake form&quot;, they&apos;ll receive this form via email or SMS.
        </p>
      </div>

      {/* Sections list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Form Sections</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddCustomSection}
          >
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Add Custom Section
          </Button>
        </div>

        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`border rounded-lg transition-colors ${
              section.enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
            }`}
          >
            {/* Section header */}
            <div className="flex items-center gap-3 p-4">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMoveSection(index, "up")}
                  disabled={index === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUpIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveSection(index, "down")}
                  disabled={index === sections.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
              </div>

              <GripVerticalIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                    className={`text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 p-0 ${
                      section.enabled ? "text-gray-900" : "text-gray-400"
                    }`}
                  />
                  {section.required && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Required</span>
                  )}
                  {!section.isBuiltIn && (
                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Custom</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {section.fields.length} field{section.fields.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Preview toggle */}
                <button
                  onClick={() => setPreviewSection(previewSection === section.id ? null : section.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                  title="Preview fields"
                >
                  {previewSection === section.id ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>

                {/* Delete custom section */}
                {!section.isBuiltIn && (
                  <button
                    onClick={() => handleRemoveSection(section.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 rounded"
                    title="Remove section"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}

                {/* Required toggle */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Required</span>
                  <Toggle
                    enabled={section.required}
                    onChange={() => handleToggleRequired(section.id)}
                  />
                </div>

                {/* Enabled toggle */}
                <Toggle
                  enabled={section.enabled}
                  onChange={() => handleToggleSection(section.id)}
                />
              </div>
            </div>

            {/* Section preview (fields) */}
            {previewSection === section.id && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                <input
                  type="text"
                  value={section.description || ""}
                  onChange={(e) => handleUpdateSectionDescription(section.id, e.target.value)}
                  placeholder="Section description..."
                  className="text-xs text-gray-500 bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-full mb-3"
                />
                <div className="space-y-2">
                  {section.fields.map((field) => (
                    <div key={field.id} className="flex items-center gap-3 text-sm">
                      <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded font-mono">
                        {field.type}
                      </span>
                      <span className={`${section.enabled ? "text-gray-700" : "text-gray-400"}`}>
                        {field.label}
                      </span>
                      {field.required && (
                        <span className="text-red-400 text-xs">*</span>
                      )}
                      {field.conditionalOn && (
                        <span className="text-xs text-gray-400 italic">
                          (shown when {field.conditionalOn.field} is set)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legal texts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileTextIcon className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Legal Texts</h3>
          <span className="text-xs text-gray-500">— Clients must accept these before submitting the form</span>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg bg-white p-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Liability Waiver
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Clients will see a checkbox: &quot;I acknowledge the Liability Waiver&quot; with this text expandable.
            </p>
            <textarea
              value={liabilityWaiverText}
              onChange={(e) => setLiabilityWaiverText(e.target.value)}
              rows={8}
              className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="border border-gray-200 rounded-lg bg-white p-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Terms of Service
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Clients will see a checkbox: &quot;I have read and agree to the Terms of Service&quot; with this text expandable.
            </p>
            <textarea
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              rows={6}
              className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Save bar */}
      {hasUnsavedChanges && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">You have unsaved changes</p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSections(originalSections);
                setLiabilityWaiverText(originalLiabilityText);
                setTermsText(originalTermsText);
              }}
            >
              Discard
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* Phone Preview Modal */}
      {showPreview && (
        <IntakeFormPreview
          sections={sections}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangleIcon className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Reset to default?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              This will replace all your current sections, fields, and legal texts with the original template. Any custom changes will be lost.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <button
                onClick={() => {
                  handleResetToDefault();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
