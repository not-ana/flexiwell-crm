"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  HealthAssessment,
  MedicalHistory,
  CurrentCondition,
  Medication,
  EmergencyContact,
  FormSectionConfig,
} from "@/lib/db/schemas";
import { CollapsibleSection } from "./CollapsibleSection";
import { HealthAssessmentProgress } from "./HealthAssessmentProgress";
import { DynamicField } from "./DynamicField";
import { MedicationsSection } from "./sections/MedicationsSection";
import { CurrentConditionsSection } from "./sections/CurrentConditionsSection";
import { AllergiesSection } from "./sections/AllergiesSection";
import { EmergencyContactSection } from "./sections/EmergencyContactSection";
import { ConsentSection } from "./sections/ConsentSection";
import {
  defaultSections,
  defaultLiabilityWaiverText,
  defaultTermsText,
} from "@/lib/health-assessment/defaultConfig";
import { SaveIcon, SendIcon, Loader2Icon } from "lucide-react";

interface HealthAssessmentFormProps {
  initialData?: Partial<HealthAssessment>;
  clientInfo?: {
    clientId: string;
    clientName: string;
    clientEmail: string;
  };
  sections?: FormSectionConfig[];
  liabilityWaiverText?: string;
  termsText?: string;
  onSubmit: (data: Partial<HealthAssessment>) => Promise<{ success: boolean; error?: string }>;
  onSaveDraft?: (data: Partial<HealthAssessment>) => Promise<{ success: boolean; error?: string }>;
  isPublic?: boolean;
  readOnly?: boolean;
}

export function HealthAssessmentForm({
  initialData,
  clientInfo,
  sections = defaultSections,
  liabilityWaiverText = defaultLiabilityWaiverText,
  termsText = defaultTermsText,
  onSubmit,
  onSaveDraft,
  isPublic = false,
  readOnly = false,
}: HealthAssessmentFormProps) {
  // Form state
  const [formData, setFormData] = useState<Partial<HealthAssessment>>({
    clientId: clientInfo?.clientId || initialData?.clientId || "",
    clientName: clientInfo?.clientName || initialData?.clientName || "",
    clientEmail: clientInfo?.clientEmail || initialData?.clientEmail || "",
    dateOfBirth: initialData?.dateOfBirth,
    gender: initialData?.gender,
    height: initialData?.height,
    weight: initialData?.weight,
    occupation: initialData?.occupation,
    medicalHistory: initialData?.medicalHistory || {
      hasHeartCondition: false,
      hasHighBloodPressure: false,
      hasLowBloodPressure: false,
      hasAsthma: false,
      hasRespiratoryIssues: false,
      hasArthritis: false,
      hasOsteoporosis: false,
      hasScoliosis: false,
      hasHernias: false,
      hasEpilepsy: false,
      hasDiabetes: false,
      hasThyroidIssues: false,
      isPregnant: false,
      hasSurgeryHistory: false,
      hasOtherConditions: false,
    },
    currentConditions: initialData?.currentConditions || [],
    hasCurrentPain: initialData?.hasCurrentPain || false,
    painDescription: initialData?.painDescription || "",
    medications: initialData?.medications || [],
    takingMedications: initialData?.takingMedications || false,
    allergies: initialData?.allergies || [],
    hasAllergies: initialData?.hasAllergies || false,
    exerciseFrequency: initialData?.exerciseFrequency,
    previousExperience: initialData?.previousExperience || "",
    goals: initialData?.goals || [],
    additionalGoalNotes: initialData?.additionalGoalNotes || "",
    physicalRestrictions: initialData?.physicalRestrictions || [],
    restrictionDetails: initialData?.restrictionDetails || "",
    emergencyContact: initialData?.emergencyContact || {
      name: "",
      relationship: "",
      phone: "",
    },
    consent: initialData?.consent || {
      agreedToTerms: false,
      agreedToLiabilityWaiver: false,
      signedAt: new Date(),
      signedIp: "",
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Filter and sort enabled sections
  const enabledSections = useMemo(
    () => sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order),
    [sections]
  );

  // Calculate section completion
  const sectionCompletion = useMemo(() => {
    const completion: Record<string, boolean> = {};

    enabledSections.forEach((section) => {
      switch (section.id) {
        case "personal_info":
          completion[section.id] = !!(formData.dateOfBirth || formData.gender);
          break;
        case "medical_history":
          // Consider complete if any checkbox is checked or user has confirmed they reviewed it
          completion[section.id] = true;
          break;
        case "current_conditions":
          completion[section.id] = true;
          break;
        case "medications":
          completion[section.id] = !formData.takingMedications || (formData.medications?.length || 0) > 0;
          break;
        case "allergies":
          completion[section.id] = !formData.hasAllergies || (formData.allergies?.length || 0) > 0;
          break;
        case "fitness_background":
          completion[section.id] = !!formData.exerciseFrequency;
          break;
        case "goals":
          completion[section.id] = (formData.goals?.length || 0) > 0;
          break;
        case "restrictions":
          completion[section.id] = true;
          break;
        case "emergency_contact":
          const ec = formData.emergencyContact;
          completion[section.id] = !!(ec?.name && ec?.phone && ec?.relationship);
          break;
        case "consent":
          completion[section.id] = !!(
            formData.consent?.agreedToTerms && formData.consent?.agreedToLiabilityWaiver
          );
          break;
        default:
          completion[section.id] = true;
      }
    });

    return completion;
  }, [enabledSections, formData]);

  const completedCount = Object.values(sectionCompletion).filter(Boolean).length;

  // Update field helper
  const updateField = useCallback((field: string, value: unknown) => {
    setFormData((prev) => {
      // Handle nested fields like "emergencyContact.name"
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
            [child]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Update medical history
  const updateMedicalHistory = useCallback((field: keyof MedicalHistory, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory!,
        [field]: value,
      },
    }));
  }, []);

  // Validation
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Emergency contact validation
    if (!formData.emergencyContact?.name) {
      newErrors["emergencyContact.name"] = "Emergency contact name is required";
    }
    if (!formData.emergencyContact?.phone) {
      newErrors["emergencyContact.phone"] = "Emergency contact phone is required";
    }
    if (!formData.emergencyContact?.relationship) {
      newErrors["emergencyContact.relationship"] = "Relationship is required";
    }

    // Consent validation
    if (!formData.consent?.agreedToTerms) {
      newErrors["consent.terms"] = "You must agree to the terms";
    }
    if (!formData.consent?.agreedToLiabilityWaiver) {
      newErrors["consent.waiver"] = "You must acknowledge the liability waiver";
    }

    // Medications validation
    if (formData.takingMedications && (!formData.medications || formData.medications.length === 0)) {
      newErrors.medications = "Please add at least one medication or uncheck the checkbox";
    }

    // Allergies validation
    if (formData.hasAllergies && (!formData.allergies || formData.allergies.length === 0)) {
      newErrors.allergies = "Please add at least one allergy or uncheck the checkbox";
    }

    // Pregnancy weeks validation
    if (formData.medicalHistory?.isPregnant && !formData.medicalHistory?.pregnancyWeeks) {
      newErrors.pregnancyWeeks = "Please specify weeks pregnant";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = async () => {
    if (readOnly) return;

    if (!validate()) {
      setSubmitError("Please fix the errors above before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await onSubmit(formData);

    if (!result.success) {
      setSubmitError(result.error || "Failed to submit. Please try again.");
    }

    setIsSubmitting(false);
  };

  // Save draft handler
  const handleSaveDraft = async () => {
    if (readOnly || !onSaveDraft) return;

    setIsSavingDraft(true);
    setSubmitError(null);

    const result = await onSaveDraft(formData);

    if (!result.success) {
      setSubmitError(result.error || "Failed to save draft. Please try again.");
    }

    setIsSavingDraft(false);
  };

  // Render section content based on section ID
  const renderSectionContent = (section: FormSectionConfig) => {
    switch (section.id) {
      case "personal_info":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DynamicField
              config={{ id: "dateOfBirth", type: "date", label: "Date of Birth", required: false }}
              value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split("T")[0] : ""}
              onChange={(v) => updateField("dateOfBirth", v)}
            />
            <DynamicField
              config={{
                id: "gender",
                type: "select",
                label: "Gender",
                required: false,
                options: [
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                  { value: "prefer_not_to_say", label: "Prefer not to say" },
                ],
              }}
              value={formData.gender}
              onChange={(v) => updateField("gender", v)}
            />
            <DynamicField
              config={{ id: "height", type: "number", label: "Height (cm)", placeholder: "170", required: false }}
              value={formData.height}
              onChange={(v) => updateField("height", v)}
            />
            <DynamicField
              config={{ id: "weight", type: "number", label: "Weight (kg)", placeholder: "70", required: false }}
              value={formData.weight}
              onChange={(v) => updateField("weight", v)}
            />
            <div className="md:col-span-2">
              <DynamicField
                config={{ id: "occupation", type: "text", label: "Occupation", placeholder: "Your profession", required: false }}
                value={formData.occupation}
                onChange={(v) => updateField("occupation", v)}
              />
            </div>
          </div>
        );

      case "medical_history":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: "hasHeartCondition", label: "Heart condition" },
                { key: "hasHighBloodPressure", label: "High blood pressure" },
                { key: "hasLowBloodPressure", label: "Low blood pressure" },
                { key: "hasAsthma", label: "Asthma" },
                { key: "hasRespiratoryIssues", label: "Other respiratory issues" },
                { key: "hasArthritis", label: "Arthritis" },
                { key: "hasOsteoporosis", label: "Osteoporosis" },
                { key: "hasScoliosis", label: "Scoliosis" },
                { key: "hasHernias", label: "Herniated disc / Hernia" },
                { key: "hasEpilepsy", label: "Epilepsy" },
                { key: "hasDiabetes", label: "Diabetes" },
                { key: "hasThyroidIssues", label: "Thyroid issues" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.medicalHistory?.[key as keyof MedicalHistory])}
                    onChange={(e) => updateMedicalHistory(key as keyof MedicalHistory, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={readOnly}
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.medicalHistory?.isPregnant || false}
                  onChange={(e) => updateMedicalHistory("isPregnant", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  disabled={readOnly}
                />
                <span className="text-sm text-gray-700">Currently pregnant</span>
              </label>
              {formData.medicalHistory?.isPregnant && (
                <div className="ml-7">
                  <DynamicField
                    config={{ id: "pregnancyWeeks", type: "number", label: "Weeks pregnant", placeholder: "e.g., 12", required: true }}
                    value={formData.medicalHistory?.pregnancyWeeks}
                    onChange={(v) => updateMedicalHistory("pregnancyWeeks", v)}
                    error={errors.pregnancyWeeks}
                  />
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.medicalHistory?.hasSurgeryHistory || false}
                  onChange={(e) => updateMedicalHistory("hasSurgeryHistory", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  disabled={readOnly}
                />
                <span className="text-sm text-gray-700">History of surgeries</span>
              </label>
              {formData.medicalHistory?.hasSurgeryHistory && (
                <div className="ml-7">
                  <DynamicField
                    config={{ id: "surgeryDetails", type: "textarea", label: "Surgery details", placeholder: "Please describe your surgeries", required: false }}
                    value={formData.medicalHistory?.surgeryDetails}
                    onChange={(v) => updateMedicalHistory("surgeryDetails", v)}
                  />
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.medicalHistory?.hasOtherConditions || false}
                  onChange={(e) => updateMedicalHistory("hasOtherConditions", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  disabled={readOnly}
                />
                <span className="text-sm text-gray-700">Other medical conditions</span>
              </label>
              {formData.medicalHistory?.hasOtherConditions && (
                <div className="ml-7">
                  <DynamicField
                    config={{ id: "otherConditionsDetails", type: "textarea", label: "Other conditions details", placeholder: "Please describe any other conditions", required: false }}
                    value={formData.medicalHistory?.otherConditionsDetails}
                    onChange={(v) => updateMedicalHistory("otherConditionsDetails", v)}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case "current_conditions":
        return (
          <CurrentConditionsSection
            hasCurrentPain={formData.hasCurrentPain || false}
            painDescription={formData.painDescription || ""}
            conditions={formData.currentConditions || []}
            onToggle={(v) => updateField("hasCurrentPain", v)}
            onPainDescriptionChange={(v) => updateField("painDescription", v)}
            onChange={(v) => updateField("currentConditions", v)}
          />
        );

      case "medications":
        return (
          <MedicationsSection
            takingMedications={formData.takingMedications || false}
            medications={formData.medications || []}
            onToggle={(v) => updateField("takingMedications", v)}
            onChange={(v) => updateField("medications", v)}
          />
        );

      case "allergies":
        return (
          <AllergiesSection
            hasAllergies={formData.hasAllergies || false}
            allergies={formData.allergies || []}
            onToggle={(v) => updateField("hasAllergies", v)}
            onChange={(v) => updateField("allergies", v)}
          />
        );

      case "fitness_background":
        return (
          <div className="space-y-4">
            <DynamicField
              config={{
                id: "exerciseFrequency",
                type: "select",
                label: "How often do you exercise?",
                required: false,
                options: [
                  { value: "none", label: "I don't exercise regularly" },
                  { value: "1-2_week", label: "1-2 times per week" },
                  { value: "3-4_week", label: "3-4 times per week" },
                  { value: "5+_week", label: "5 or more times per week" },
                ],
              }}
              value={formData.exerciseFrequency}
              onChange={(v) => updateField("exerciseFrequency", v)}
            />
            <DynamicField
              config={{
                id: "previousExperience",
                type: "textarea",
                label: "Previous exercise experience",
                placeholder: "Describe any previous experience with Pilates, yoga, or other activities",
                required: false,
              }}
              value={formData.previousExperience}
              onChange={(v) => updateField("previousExperience", v)}
            />
          </div>
        );

      case "goals":
        return (
          <div className="space-y-4">
            <DynamicField
              config={{
                id: "goals",
                type: "checkboxGroup",
                label: "Select your goals",
                required: false,
                options: [
                  { value: "weight_loss", label: "Weight Loss" },
                  { value: "muscle_gain", label: "Build Strength / Muscle" },
                  { value: "flexibility", label: "Improve Flexibility" },
                  { value: "posture", label: "Correct Posture" },
                  { value: "rehabilitation", label: "Rehabilitation / Recovery" },
                  { value: "stress_relief", label: "Stress Relief / Relaxation" },
                  { value: "general_fitness", label: "General Fitness" },
                ],
              }}
              value={formData.goals}
              onChange={(v) => updateField("goals", v)}
            />
            <DynamicField
              config={{
                id: "additionalGoalNotes",
                type: "textarea",
                label: "Additional notes about your goals",
                placeholder: "Any specific goals or expectations?",
                required: false,
              }}
              value={formData.additionalGoalNotes}
              onChange={(v) => updateField("additionalGoalNotes", v)}
            />
          </div>
        );

      case "restrictions":
        return (
          <div className="space-y-4">
            <DynamicField
              config={{
                id: "physicalRestrictions",
                type: "checkboxGroup",
                label: "Select any restrictions that apply",
                required: false,
                options: [
                  { value: "no_heavy_lifting", label: "Cannot lift heavy weights" },
                  { value: "avoid_twisting", label: "Should avoid twisting movements" },
                  { value: "limited_range_of_motion", label: "Limited range of motion" },
                  { value: "balance_issues", label: "Balance issues" },
                  { value: "joint_problems", label: "Joint problems" },
                ],
              }}
              value={formData.physicalRestrictions}
              onChange={(v) => updateField("physicalRestrictions", v)}
            />
            <DynamicField
              config={{
                id: "restrictionDetails",
                type: "textarea",
                label: "Additional details about restrictions",
                placeholder: "Please provide more details about your physical restrictions",
                required: false,
              }}
              value={formData.restrictionDetails}
              onChange={(v) => updateField("restrictionDetails", v)}
            />
          </div>
        );

      case "emergency_contact":
        return (
          <EmergencyContactSection
            contact={formData.emergencyContact || { name: "", relationship: "", phone: "" }}
            onChange={(v) => updateField("emergencyContact", v)}
            errors={{
              name: errors["emergencyContact.name"],
              phone: errors["emergencyContact.phone"],
              relationship: errors["emergencyContact.relationship"],
            }}
          />
        );

      case "consent":
        return (
          <ConsentSection
            agreedToTerms={formData.consent?.agreedToTerms || false}
            agreedToLiabilityWaiver={formData.consent?.agreedToLiabilityWaiver || false}
            liabilityWaiverText={liabilityWaiverText}
            termsText={termsText}
            onTermsChange={(v) => updateField("consent.agreedToTerms", v)}
            onWaiverChange={(v) => updateField("consent.agreedToLiabilityWaiver", v)}
            errors={{
              terms: errors["consent.terms"],
              waiver: errors["consent.waiver"],
            }}
          />
        );

      default:
        // Render custom section fields dynamically
        return (
          <div className="space-y-4">
            {section.fields.map((field) => (
              <DynamicField
                key={field.id}
                config={field}
                value={(formData.customFields as Record<string, unknown>)?.[field.id]}
                onChange={(v) => {
                  setFormData((prev) => ({
                    ...prev,
                    customFields: {
                      ...(prev.customFields || {}),
                      [field.id]: v,
                    },
                  }));
                }}
                error={errors[field.id]}
                allValues={formData.customFields as Record<string, unknown>}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <HealthAssessmentProgress
        totalSections={enabledSections.length}
        completedSections={completedCount}
      />

      {/* Client info for public form */}
      {isPublic && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">Your Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.clientName || ""}
                onChange={(e) => updateField("clientName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.clientEmail || ""}
                onChange={(e) => updateField("clientEmail", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      )}

      {/* Form sections */}
      <div className="space-y-4">
        {enabledSections.map((section, index) => (
          <CollapsibleSection
            key={section.id}
            title={section.title}
            description={section.description}
            isRequired={section.required}
            isComplete={sectionCompletion[section.id]}
            defaultExpanded={index === 0}
          >
            {renderSectionContent(section)}
          </CollapsibleSection>
        ))}
      </div>

      {/* Error message */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Action buttons */}
      {!readOnly && (
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200">
          {onSaveDraft && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isSavingDraft ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <SaveIcon className="w-4 h-4" />
              )}
              Save Draft
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isSavingDraft}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <SendIcon className="w-4 h-4" />
            )}
            Submit Health Assessment
          </button>
        </div>
      )}
    </div>
  );
}
