"use client";

import type { HealthAssessment } from "@/lib/db/schemas";
import {
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  FileTextIcon,
  UserIcon,
  PhoneIcon,
  HeartPulseIcon,
  PillIcon,
  AlertTriangleIcon,
  TargetIcon,
  ActivityIcon,
} from "lucide-react";
import { bodyAreas, severityLevels } from "@/lib/health-assessment/defaultConfig";

interface HealthAssessmentSummaryProps {
  assessment: HealthAssessment;
}

export function HealthAssessmentSummary({ assessment }: HealthAssessmentSummaryProps) {
  const getStatusBadge = () => {
    switch (assessment.status) {
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            <FileTextIcon className="w-3.5 h-3.5" />
            Draft
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            <ClockIcon className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
      case "reviewed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Reviewed
          </span>
        );
      case "requires_update":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <AlertCircleIcon className="w-3.5 h-3.5" />
            Update Required
          </span>
        );
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const getAreaLabel = (areaValue: string) => {
    return bodyAreas.find((a) => a.value === areaValue)?.label || areaValue;
  };

  const getSeverityLabel = (severityValue: string) => {
    return severityLevels.find((s) => s.value === severityValue)?.label || severityValue;
  };

  // Count active medical conditions
  const activeMedicalConditions = Object.entries(assessment.medicalHistory || {})
    .filter(([key, value]) => value === true && !key.includes("Details") && !key.includes("Weeks"))
    .map(([key]) => {
      const labels: Record<string, string> = {
        hasHeartCondition: "Heart condition",
        hasHighBloodPressure: "High blood pressure",
        hasLowBloodPressure: "Low blood pressure",
        hasAsthma: "Asthma",
        hasRespiratoryIssues: "Respiratory issues",
        hasArthritis: "Arthritis",
        hasOsteoporosis: "Osteoporosis",
        hasScoliosis: "Scoliosis",
        hasHernias: "Herniated disc/Hernia",
        hasEpilepsy: "Epilepsy",
        hasDiabetes: "Diabetes",
        hasThyroidIssues: "Thyroid issues",
        isPregnant: "Pregnant",
        hasSurgeryHistory: "Surgery history",
        hasOtherConditions: "Other conditions",
      };
      return labels[key] || key;
    });

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Health Assessment</h3>
          <p className="text-sm text-gray-500">
            Version {assessment.version} • Submitted {formatDate(assessment.submittedAt)}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Personal Info */}
      {(assessment.dateOfBirth || assessment.gender || assessment.height || assessment.weight) && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <UserIcon className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-900">Personal Information</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {assessment.dateOfBirth && (
              <div>
                <span className="text-gray-500">Date of Birth</span>
                <p className="font-medium">{formatDate(assessment.dateOfBirth)}</p>
              </div>
            )}
            {assessment.gender && (
              <div>
                <span className="text-gray-500">Gender</span>
                <p className="font-medium capitalize">{assessment.gender.replace(/_/g, " ")}</p>
              </div>
            )}
            {assessment.height && (
              <div>
                <span className="text-gray-500">Height</span>
                <p className="font-medium">{assessment.height} cm</p>
              </div>
            )}
            {assessment.weight && (
              <div>
                <span className="text-gray-500">Weight</span>
                <p className="font-medium">{assessment.weight} kg</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medical History */}
      {activeMedicalConditions.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <HeartPulseIcon className="w-4 h-4 text-red-600" />
            <h4 className="font-medium text-red-900">Medical Conditions</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeMedicalConditions.map((condition) => (
              <span
                key={condition}
                className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm"
              >
                {condition}
              </span>
            ))}
          </div>
          {assessment.medicalHistory?.isPregnant && assessment.medicalHistory?.pregnancyWeeks && (
            <p className="mt-2 text-sm text-red-700">
              {assessment.medicalHistory.pregnancyWeeks} weeks pregnant
            </p>
          )}
          {assessment.medicalHistory?.surgeryDetails && (
            <p className="mt-2 text-sm text-red-700">
              <strong>Surgery details:</strong> {assessment.medicalHistory.surgeryDetails}
            </p>
          )}
          {assessment.medicalHistory?.otherConditionsDetails && (
            <p className="mt-2 text-sm text-red-700">
              <strong>Other:</strong> {assessment.medicalHistory.otherConditionsDetails}
            </p>
          )}
        </div>
      )}

      {/* Current Conditions/Injuries */}
      {(assessment.hasCurrentPain || assessment.currentConditions?.length > 0) && (
        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangleIcon className="w-4 h-4 text-yellow-600" />
            <h4 className="font-medium text-yellow-900">Current Pain/Injuries</h4>
          </div>
          {assessment.painDescription && (
            <p className="text-sm text-yellow-800 mb-3">{assessment.painDescription}</p>
          )}
          {assessment.currentConditions?.length > 0 && (
            <div className="space-y-2">
              {assessment.currentConditions.map((condition) => (
                <div
                  key={condition.id}
                  className="flex items-center justify-between p-2 bg-yellow-100 rounded text-sm"
                >
                  <div>
                    <span className="font-medium">{getAreaLabel(condition.area)}</span>
                    {condition.description && (
                      <span className="text-yellow-700"> - {condition.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">{getSeverityLabel(condition.severity)}</span>
                    {condition.isChronicPain && (
                      <span className="px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">
                        Chronic
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Medications */}
      {assessment.takingMedications && assessment.medications?.length > 0 && (
        <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <PillIcon className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-purple-900">Medications</h4>
          </div>
          <div className="space-y-2">
            {assessment.medications.map((med) => (
              <div key={med.id} className="text-sm">
                <span className="font-medium text-purple-800">{med.name}</span>
                {med.dosage && <span className="text-purple-600"> ({med.dosage})</span>}
                {med.reason && <span className="text-purple-600"> - {med.reason}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allergies */}
      {assessment.hasAllergies && assessment.allergies?.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircleIcon className="w-4 h-4 text-orange-600" />
            <h4 className="font-medium text-orange-900">Allergies</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {assessment.allergies.map((allergy, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm"
              >
                {allergy}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {assessment.goals?.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TargetIcon className="w-4 h-4 text-green-600" />
            <h4 className="font-medium text-green-900">Goals</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {assessment.goals.map((goal) => (
              <span
                key={goal}
                className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm capitalize"
              >
                {goal.replace(/_/g, " ")}
              </span>
            ))}
          </div>
          {assessment.additionalGoalNotes && (
            <p className="mt-2 text-sm text-green-700">{assessment.additionalGoalNotes}</p>
          )}
        </div>
      )}

      {/* Physical Restrictions */}
      {assessment.physicalRestrictions?.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <ActivityIcon className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">Physical Restrictions</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {assessment.physicalRestrictions.map((restriction) => (
              <span
                key={restriction}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm capitalize"
              >
                {restriction.replace(/_/g, " ")}
              </span>
            ))}
          </div>
          {assessment.restrictionDetails && (
            <p className="mt-2 text-sm text-gray-600">{assessment.restrictionDetails}</p>
          )}
        </div>
      )}

      {/* Emergency Contact */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <PhoneIcon className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-blue-900">Emergency Contact</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-600">Name</span>
            <p className="font-medium text-blue-900">{assessment.emergencyContact?.name || "N/A"}</p>
          </div>
          <div>
            <span className="text-blue-600">Phone</span>
            <p className="font-medium text-blue-900">{assessment.emergencyContact?.phone || "N/A"}</p>
          </div>
          <div>
            <span className="text-blue-600">Relationship</span>
            <p className="font-medium text-blue-900 capitalize">
              {assessment.emergencyContact?.relationship || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Consent Info */}
      <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
        <p>
          <CheckCircleIcon className="w-4 h-4 inline mr-1 text-green-500" />
          Terms accepted on {formatDate(assessment.consent?.signedAt)}
        </p>
        <p>
          <CheckCircleIcon className="w-4 h-4 inline mr-1 text-green-500" />
          Liability waiver acknowledged
        </p>
      </div>

      {/* Review Notes (if any) */}
      {assessment.reviewNotes && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Review Notes</h4>
          <p className="text-sm text-gray-700">{assessment.reviewNotes}</p>
          {assessment.reviewedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Reviewed on {formatDate(assessment.reviewedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
