"use client";

import { useState, use } from "react";
import Link from "next/link";
import { usePublicHealthAssessment } from "@/hooks/useHealthAssessment";
import { HealthAssessmentForm } from "@/components/health-assessment/HealthAssessmentForm";
import { LoadingSpinner } from "@/components/ui";
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  HeartPulseIcon,
} from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function PublicHealthAssessmentPage({ params }: PageProps) {
  const { token } = use(params);
  const {
    isValid,
    clientEmail,
    clientName,
    establishmentId,
    formConfig,
    expiresAt,
    isLoading,
    error,
    submitAssessment,
  } = usePublicHealthAssessment(token);

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedClientId, setSubmittedClientId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error || !isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Link Invalid or Expired
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "This health assessment link is no longer valid. Please contact the studio for a new link."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Thank You!
          </h1>
          <p className="text-gray-600 mb-6">
            Your health assessment has been submitted successfully. Our team will review it and get in touch with you soon.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <p className="text-sm text-gray-600">
              Want to manage your classes and bookings?
            </p>
            <Link
              href="/auth/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Create an account or sign in
            </Link>
          </div>
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Handle form submission
  const handleSubmit = async (data: Parameters<typeof submitAssessment>[0]) => {
    const result = await submitAssessment(data);
    if (result.success) {
      setSubmitSuccess(true);
      if (result.clientId) {
        setSubmittedClientId(result.clientId);
      }
    }
    return result;
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} remaining`;
    return "Less than an hour remaining";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HeartPulseIcon className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Health Assessment</h1>
          <p className="text-gray-600 mt-2">
            Please complete this form to help us provide you with the best possible care.
          </p>
        </div>

        {/* Expiration notice */}
        {expiresAt && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <ClockIcon className="w-4 h-4" />
            <span>{getTimeRemaining()}</span>
          </div>
        )}

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <HealthAssessmentForm
            initialData={{
              clientName: clientName || "",
              clientEmail: clientEmail || "",
            }}
            sections={formConfig?.sections}
            liabilityWaiverText={formConfig?.liabilityWaiverText}
            termsText={formConfig?.termsText}
            onSubmit={handleSubmit}
            isPublic={true}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            By submitting this form, you agree to our{" "}
            <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
