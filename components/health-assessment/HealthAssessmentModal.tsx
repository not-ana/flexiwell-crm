"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { HealthAssessmentSummary } from "./HealthAssessmentSummary";
import { useClientHealthAssessment, useHealthAssessmentTokens } from "@/hooks/useHealthAssessment";
import { LoadingSpinner } from "@/components/ui";
import {
  RefreshCwIcon,
  CheckCircleIcon,
  LinkIcon,
  CopyIcon,
  FileTextIcon,
  AlertCircleIcon,
  Loader2Icon,
} from "lucide-react";

interface HealthAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientEmail: string;
  establishmentId: string;
}

export function HealthAssessmentModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientEmail,
  establishmentId,
}: HealthAssessmentModalProps) {
  const {
    assessment,
    hasAssessment,
    isLoading,
    error,
    requestUpdate,
    markAsReviewed,
  } = useClientHealthAssessment(clientId);

  const { generateToken } = useHealthAssessmentTokens(establishmentId);

  const [isRequestingUpdate, setIsRequestingUpdate] = useState(false);
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRequestUpdate = async () => {
    setIsRequestingUpdate(true);
    setActionError(null);

    const result = await requestUpdate(updateMessage || undefined);

    if (!result.success) {
      setActionError(result.error || "Failed to request update");
    } else {
      setShowUpdateForm(false);
      setUpdateMessage("");
    }

    setIsRequestingUpdate(false);
  };

  const handleMarkReviewed = async () => {
    setIsMarkingReviewed(true);
    setActionError(null);

    const result = await markAsReviewed(reviewNotes || undefined);

    if (!result.success) {
      setActionError(result.error || "Failed to mark as reviewed");
    } else {
      setShowReviewForm(false);
      setReviewNotes("");
    }

    setIsMarkingReviewed(false);
  };

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    setActionError(null);

    const result = await generateToken({
      clientEmail,
      clientName,
    });

    if (!result.success) {
      setActionError(result.error || "Failed to generate link");
    } else if (result.url) {
      setGeneratedLink(result.url);
    }

    setIsGeneratingLink(false);
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-5 h-5 text-gray-500" />
          Health Assessment - {clientName}
        </div>
      </ModalHeader>

      <ModalBody>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        ) : !hasAssessment ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileTextIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Health Assessment
            </h3>
            <p className="text-gray-600 mb-6">
              This client hasn&apos;t completed their health assessment yet.
            </p>

            {!generatedLink ? (
              <button
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isGeneratingLink ? (
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
                Generate Assessment Link
              </button>
            ) : (
              <div className="max-w-md mx-auto">
                <p className="text-sm text-gray-600 mb-2">
                  Share this link with the client:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    {copied ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <CopyIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This link expires in 7 days.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action error */}
            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircleIcon className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">{actionError}</p>
              </div>
            )}

            {/* Assessment summary */}
            <HealthAssessmentSummary assessment={assessment!} />

            {/* Update request form */}
            {showUpdateForm && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                <h4 className="font-medium text-yellow-900">Request Update</h4>
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  placeholder="Optional message to the client about what needs to be updated..."
                  rows={3}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowUpdateForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestUpdate}
                    disabled={isRequestingUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {isRequestingUpdate ? (
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCwIcon className="w-4 h-4" />
                    )}
                    Send Request
                  </button>
                </div>
              </div>
            )}

            {/* Review form */}
            {showReviewForm && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                <h4 className="font-medium text-green-900">Mark as Reviewed</h4>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional notes about the review..."
                  rows={3}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMarkReviewed}
                    disabled={isMarkingReviewed}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isMarkingReviewed ? (
                      <Loader2Icon className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircleIcon className="w-4 h-4" />
                    )}
                    Confirm Review
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </ModalBody>

      {hasAssessment && assessment && (
        <ModalFooter>
          <div className="flex gap-2 justify-end">
            {assessment.status === "submitted" && !showUpdateForm && !showReviewForm && (
              <>
                <button
                  onClick={() => setShowUpdateForm(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <RefreshCwIcon className="w-4 h-4" />
                  Request Update
                </button>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Mark as Reviewed
                </button>
              </>
            )}
            {assessment.status === "reviewed" && !showUpdateForm && (
              <button
                onClick={() => setShowUpdateForm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <RefreshCwIcon className="w-4 h-4" />
                Request Update
              </button>
            )}
          </div>
        </ModalFooter>
      )}
    </Modal>
  );
}
