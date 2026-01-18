"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useMyHealthAssessment } from "@/hooks/useHealthAssessment";
import { HealthAssessmentForm } from "@/components/health-assessment/HealthAssessmentForm";
import { LoadingSpinner } from "@/components/ui";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  FileTextIcon,
} from "lucide-react";

export default function HealthAssessmentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { assessment, hasAssessment, isLoading, error, saveAssessment } = useMyHealthAssessment();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800">Error</h2>
          <p className="text-red-700 mt-2">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 mt-4 text-red-600 hover:text-red-700"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Show success message after submission
  if (submitSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="p-8 bg-white border border-gray-200 rounded-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Health Assessment Submitted
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for completing your health assessment. Our team will review it shortly.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if assessment exists and its status
  const canEdit = !hasAssessment || assessment?.status === "draft" || assessment?.status === "requires_update";

  // Show read-only view if submitted/reviewed
  if (hasAssessment && !canEdit) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Health Assessment</h1>
        </div>

        {/* Status card */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg mb-6">
          <div className="flex items-start gap-4">
            {assessment?.status === "submitted" ? (
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {assessment?.status === "submitted" ? "Under Review" : "Assessment Reviewed"}
              </h2>
              <p className="text-gray-600 mt-1">
                {assessment?.status === "submitted"
                  ? "Your health assessment has been submitted and is being reviewed by our team."
                  : "Your health assessment has been reviewed. If you need to make changes, please contact the studio."}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Submitted on {assessment?.submittedAt ? new Date(assessment.submittedAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Read-only form view */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4 text-gray-600">
            <FileTextIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Submitted Information</span>
          </div>
          <HealthAssessmentForm
            initialData={assessment || undefined}
            clientInfo={
              user
                ? {
                    clientId: user.clientId || user.id,
                    clientName: user.name,
                    clientEmail: user.email,
                  }
                : undefined
            }
            onSubmit={async () => ({ success: true })}
            readOnly={true}
          />
        </div>
      </div>
    );
  }

  // Handle form submission
  const handleSubmit = async (data: Parameters<typeof saveAssessment>[0]) => {
    const result = await saveAssessment(data, false);
    if (result.success) {
      setSubmitSuccess(true);
    }
    return result;
  };

  // Handle draft save
  const handleSaveDraft = async (data: Parameters<typeof saveAssessment>[0]) => {
    return await saveAssessment(data, true);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Health Assessment</h1>
        <p className="text-gray-600 mt-1">
          Please complete this health assessment form to help us provide you with the best possible care.
        </p>
      </div>

      {/* Update request banner */}
      {assessment?.status === "requires_update" && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6 flex items-start gap-3">
          <AlertCircleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Update Requested</h3>
            <p className="text-sm text-yellow-700 mt-1">
              {assessment.updateRequestMessage || "Please review and update your health assessment."}
            </p>
          </div>
        </div>
      )}

      {/* Draft banner */}
      {assessment?.status === "draft" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6 flex items-start gap-3">
          <FileTextIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">Draft Saved</h3>
            <p className="text-sm text-blue-700 mt-1">
              You have an unsubmitted draft. Continue where you left off.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <HealthAssessmentForm
          initialData={assessment || undefined}
          clientInfo={
            user
              ? {
                  clientId: user.clientId || user.id,
                  clientName: user.name,
                  clientEmail: user.email,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
        />
      </div>
    </div>
  );
}
