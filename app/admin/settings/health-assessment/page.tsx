"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useHealthAssessmentConfig } from "@/hooks/useHealthAssessment";
import type { FormSectionConfig, FormFieldConfig } from "@/lib/db/schemas";
import { defaultSections, defaultLiabilityWaiverText, defaultTermsText } from "@/lib/health-assessment/defaultConfig";
import { LoadingSpinner } from "@/components/ui";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import {
  ArrowLeftIcon,
  GripVerticalIcon,
  EditIcon,
  Trash2Icon,
  PlusIcon,
  EyeIcon,
  SaveIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  Loader2Icon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react";

// TODO: Get establishment ID from user context
const MOCK_ESTABLISHMENT_ID = "establishment-1";

export default function HealthAssessmentConfigPage() {
  const { formConfig, isLoading, error, saveConfig } = useHealthAssessmentConfig(MOCK_ESTABLISHMENT_ID);

  const [sections, setSections] = useState<FormSectionConfig[]>([]);
  const [liabilityWaiverText, setLiabilityWaiverText] = useState(defaultLiabilityWaiverText);
  const [termsText, setTermsText] = useState(defaultTermsText);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit section modal state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionData, setEditingSectionData] = useState<FormSectionConfig | null>(null);

  // Initialize form with config or defaults
  useEffect(() => {
    if (formConfig) {
      setSections(formConfig.sections);
      setLiabilityWaiverText(formConfig.liabilityWaiverText);
      setTermsText(formConfig.termsText);
    } else if (!isLoading) {
      // Use defaults if no config exists
      setSections(defaultSections);
      setLiabilityWaiverText(defaultLiabilityWaiverText);
      setTermsText(defaultTermsText);
    }
  }, [formConfig, isLoading]);

  // Track changes
  useEffect(() => {
    if (formConfig) {
      const sectionsChanged = JSON.stringify(sections) !== JSON.stringify(formConfig.sections);
      const waiverChanged = liabilityWaiverText !== formConfig.liabilityWaiverText;
      const termsChanged = termsText !== formConfig.termsText;
      setHasChanges(sectionsChanged || waiverChanged || termsChanged);
    } else {
      setHasChanges(true); // Always has changes if no config exists yet
    }
  }, [sections, liabilityWaiverText, termsText, formConfig]);

  // Toggle section enabled
  const toggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  // Move section up/down
  const moveSection = (sectionId: string, direction: "up" | "down") => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === sectionId);
      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newSections = [...prev];
      [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];

      // Update order values
      return newSections.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  // Open edit modal
  const openEditModal = (section: FormSectionConfig) => {
    setEditingSectionId(section.id);
    setEditingSectionData({ ...section });
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingSectionId(null);
    setEditingSectionData(null);
  };

  // Save section changes
  const saveSectionChanges = () => {
    if (!editingSectionData) return;

    setSections((prev) =>
      prev.map((s) =>
        s.id === editingSectionData.id ? editingSectionData : s
      )
    );
    closeEditModal();
  };

  // Delete custom section
  const deleteSection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section || section.isBuiltIn) return;

    if (confirm("Are you sure you want to delete this section?")) {
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    }
  };

  // Add custom section
  const addCustomSection = () => {
    const newSection: FormSectionConfig = {
      id: `custom_${Date.now()}`,
      title: "New Section",
      description: "",
      enabled: true,
      required: false,
      order: sections.length + 1,
      isBuiltIn: false,
      fields: [],
    };
    setSections((prev) => [...prev, newSection]);
    openEditModal(newSection);
  };

  // Add field to section
  const addFieldToSection = () => {
    if (!editingSectionData) return;

    const newField: FormFieldConfig = {
      id: `field_${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
    };

    setEditingSectionData({
      ...editingSectionData,
      fields: [...editingSectionData.fields, newField],
    });
  };

  // Update field in section
  const updateFieldInSection = (fieldIndex: number, updates: Partial<FormFieldConfig>) => {
    if (!editingSectionData) return;

    const newFields = [...editingSectionData.fields];
    newFields[fieldIndex] = { ...newFields[fieldIndex], ...updates };

    setEditingSectionData({
      ...editingSectionData,
      fields: newFields,
    });
  };

  // Delete field from section
  const deleteFieldFromSection = (fieldIndex: number) => {
    if (!editingSectionData) return;

    setEditingSectionData({
      ...editingSectionData,
      fields: editingSectionData.fields.filter((_, i) => i !== fieldIndex),
    });
  };

  // Save configuration
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const result = await saveConfig({
      sections,
      liabilityWaiverText,
      termsText,
    });

    if (result.success) {
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(result.error || "Failed to save configuration");
    }

    setIsSaving(false);
  };

  // Reset to defaults
  const handleReset = () => {
    if (confirm("Are you sure you want to reset to default configuration? This will discard all changes.")) {
      setSections(defaultSections);
      setLiabilityWaiverText(defaultLiabilityWaiverText);
      setTermsText(defaultTermsText);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Settings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health Assessment Configuration</h1>
            <p className="text-gray-600 mt-1">
              Customize the health assessment form for your clients.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <SaveIcon className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error messages */}
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
          <p className="text-green-700">Configuration saved successfully!</p>
        </div>
      )}
      {saveError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircleIcon className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{saveError}</p>
        </div>
      )}

      {/* Sections list */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Form Sections</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enable, disable, or reorder sections. Click edit to customize fields.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`p-4 flex items-center gap-4 ${!section.enabled ? "bg-gray-50 opacity-60" : ""}`}
            >
              {/* Drag handle */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveSection(section.id, "up")}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUpIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveSection(section.id, "down")}
                  disabled={index === sections.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={() => toggleSection(section.id)}
                  disabled={section.required}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50"></div>
              </label>

              {/* Section info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{section.title}</span>
                  {section.required && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                      Required
                    </span>
                  )}
                  {!section.isBuiltIn && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                      Custom
                    </span>
                  )}
                </div>
                {section.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {section.fields.length} field{section.fields.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(section)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <EditIcon className="w-4 h-4" />
                </button>
                {!section.isBuiltIn && (
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={addCustomSection}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            Add Custom Section
          </button>
        </div>
      </div>

      {/* Liability Waiver */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Liability Waiver Text</h2>
          <p className="text-sm text-gray-500 mt-1">
            This text will be shown to clients before they submit the form.
          </p>
        </div>
        <div className="p-4">
          <textarea
            value={liabilityWaiverText}
            onChange={(e) => setLiabilityWaiverText(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Terms Text */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Terms of Service Text</h2>
          <p className="text-sm text-gray-500 mt-1">
            Additional terms clients must agree to.
          </p>
        </div>
        <div className="p-4">
          <textarea
            value={termsText}
            onChange={(e) => setTermsText(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Edit Section Modal */}
      <Modal isOpen={!!editingSectionId} onClose={closeEditModal} size="lg">
        <ModalHeader onClose={closeEditModal}>
          Edit Section: {editingSectionData?.title}
        </ModalHeader>
        <ModalBody>
          {editingSectionData && (
            <div className="space-y-6">
              {/* Section details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={editingSectionData.title}
                    onChange={(e) =>
                      setEditingSectionData({ ...editingSectionData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={editingSectionData.description || ""}
                    onChange={(e) =>
                      setEditingSectionData({ ...editingSectionData, description: e.target.value })
                    }
                    placeholder="Brief description of this section"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Fields */}
              {!editingSectionData.isBuiltIn && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Fields</h3>
                  <div className="space-y-3">
                    {editingSectionData.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-3 bg-gray-50 rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Field {index + 1}
                          </span>
                          <button
                            onClick={() => deleteFieldFromSection(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) =>
                              updateFieldInSection(index, { label: e.target.value })
                            }
                            placeholder="Field label"
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <select
                            value={field.type}
                            onChange={(e) =>
                              updateFieldInSection(index, {
                                type: e.target.value as FormFieldConfig["type"],
                              })
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="select">Dropdown</option>
                          </select>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              updateFieldInSection(index, { required: e.target.checked })
                            }
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-600">Required field</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addFieldToSection}
                    className="mt-3 flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Field
                  </button>
                </div>
              )}

              {editingSectionData.isBuiltIn && (
                <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                  Built-in sections have fixed fields that cannot be modified. You can only change the title and description.
                </p>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <button
            onClick={closeEditModal}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={saveSectionChanges}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Save Changes
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
